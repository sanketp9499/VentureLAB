#!/usr/bin/env python3
"""
Directory visibility scanner.

Answers one question, repeatably: when a retrieval system summarises the
directory pages it actually cites, does ventureLAB make the cut?

    crawl -> extract ordered entities -> locate the entity -> score -> rank the work

Run:
    python tools/scan.py                 # http fetcher, no keys needed
    python tools/scan.py --fetcher firecrawl   # for JS-rendered pages
    python tools/scan.py --fetcher apify

Writes results/scan-<date>.json and prints a prioritised action list.
"""

import argparse, json, os, re, sys, time
from datetime import date

import requests
from lxml import html as lxml_html

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/122.0 Safari/537.36")
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)


# ── fetchers ──────────────────────────────────────────────────────────
# Plain HTTP handles most directory pages. The paid crawlers exist for the
# ones that render their list client-side, where requests returns an empty
# shell. Same interface, so the rest of the pipeline does not care which ran.

def fetch_http(url, timeout=75):
    r = requests.get(url, headers={"User-Agent": UA}, timeout=timeout)
    r.raise_for_status()
    return r.text


def fetch_firecrawl(url, timeout=60):
    key = os.environ.get("FIRECRAWL_API_KEY")
    if not key:
        raise RuntimeError("FIRECRAWL_API_KEY not set")
    r = requests.post(
        "https://api.firecrawl.dev/v1/scrape",
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        json={"url": url, "formats": ["html"], "onlyMainContent": False},
        timeout=timeout)
    r.raise_for_status()
    return r.json().get("data", {}).get("html", "")


def fetch_apify(url, timeout=120):
    key = os.environ.get("APIFY_TOKEN")
    if not key:
        raise RuntimeError("APIFY_TOKEN not set")
    # actor input is a typed schema, not a loose dict; startUrls wants objects
    r = requests.post(
        f"https://api.apify.com/v2/acts/apify~website-content-crawler/run-sync-get-dataset-items?token={key}",
        json={"startUrls": [{"url": url}], "maxCrawlPages": 1, "crawlerType": "playwright:chrome"},
        timeout=timeout)
    r.raise_for_status()
    items = r.json()
    return items[0].get("html", "") if items else ""


FETCHERS = {"http": fetch_http, "firecrawl": fetch_firecrawl, "apify": fetch_apify}


# ── extraction ────────────────────────────────────────────────────────

def visible_text(raw_html):
    """Strip script/style/nav chrome and return the readable text."""
    try:
        tree = lxml_html.fromstring(raw_html)
    except Exception:
        return re.sub(r"<[^>]+>", " ", raw_html)
    for bad in tree.xpath("//script|//style|//noscript|//svg"):
        bad.getparent().remove(bad)
    # join text nodes with a space: table cells otherwise concatenate, so a
    # listing reads "ventureLAB201120" and the name loses its right boundary
    text = " ".join(t for t in tree.itertext())
    return re.sub(r"[ \t\r\f\v]+", " ", text)


def find_first(text, needles):
    """Character offset of the earliest case-insensitive whole-ish match."""
    low = text.lower()
    best = None
    for n in needles:
        # trailing boundary rejects letters only. Digits are legitimate
        # neighbours in these tables (a name followed by its founding year).
        pat = re.compile(r"(?<![a-z0-9])" + re.escape(n.lower()) + r"(?![a-z])")
        m = pat.search(low)
        if m and (best is None or m.start() < best):
            best = m.start()
    return best


def ordered_entities(text, entity_aliases, competitors):
    """
    Directory pages list organisations in display order, so document order is
    a fair proxy for list position. Returns [(name, offset)] sorted by offset.
    """
    found = []
    off = find_first(text, entity_aliases)
    if off is not None:
        found.append(("__ENTITY__", off))
    for c in competitors:
        o = find_first(text, [c])
        if o is not None:
            found.append((c, o))
    found.sort(key=lambda t: t[1])
    return found


# ── scoring ───────────────────────────────────────────────────────────

def score_one(rank, total, cfg):
    fold = cfg["scoring"]["top_fold"]
    w = cfg["scoring"]["weights"]
    if rank is None:
        return w["absent"], "absent"
    if rank <= fold:
        return w["in_fold"], "in fold"
    # below the fold: worse the further down, but never worse than absent
    depth = min(1.0, (rank - fold) / max(1, total - fold))
    return w["below_fold"] * (0.6 + 0.4 * depth), "below fold"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--fetcher", default="http", choices=list(FETCHERS))
    ap.add_argument("--config", default=os.path.join(HERE, "config.json"))
    ap.add_argument("--delay", type=float, default=1.0)
    args = ap.parse_args()

    cfg = json.load(open(args.config, encoding="utf-8"))
    ent = cfg["entity"]
    fetch = FETCHERS[args.fetcher]

    rows, errors = [], []
    for d in cfg["directories"]:
        try:
            raw = fetch(d["url"])
            text = visible_text(raw)
            if len(text.strip()) < 400:
                raise RuntimeError(f"only {len(text.strip())} chars of text "
                                   f"(likely client-rendered; try --fetcher firecrawl)")
            order = ordered_entities(text, ent["aliases"], cfg["competitors"])
            names = [n for n, _ in order]
            rank = names.index("__ENTITY__") + 1 if "__ENTITY__" in names else None
            total = len(names)
            # A directory page that mentions none of 29 known organisations is
            # not a page we are missing from, it is a page we could not read.
            # Reporting that as "absent" would be a false negative.
            if total == 0:
                rows.append(dict(id=d["id"], url=d["url"], note=d.get("note", ""), segment=d.get("segment", "-"),
                                 cited=d.get("cited", 1), rank=None, listed_total=0,
                                 state="needs render", ahead=[], score=0.0))
                print(f"  {d['id']:<15} {'needs render':<11} "
                      f"{'0 of ' + str(len(cfg['competitors'])) + ' known':<16} "
                      f"re-run with --fetcher firecrawl")
                time.sleep(args.delay)
                continue
            ahead = [n for n in names[: (rank - 1) if rank else total] if n != "__ENTITY__"]
            pts, state = score_one(rank, total, cfg)
            pts *= (1 + 0.25 * (d.get("cited", 1) - 1))     # weight by how often cited
            rows.append(dict(id=d["id"], url=d["url"], note=d.get("note", ""), segment=d.get("segment", "-"),
                             cited=d.get("cited", 1), rank=rank, listed_total=total,
                             state=state, ahead=ahead, score=round(pts, 2)))
            print(f"  {d['id']:<15} {state:<11} "
                  f"{'rank ' + str(rank) + '/' + str(total) if rank else 'not listed':<16} "
                  f"score {pts:.2f}")
        except Exception as e:
            errors.append(dict(id=d["id"], url=d["url"], error=str(e)[:160]))
            print(f"  {d['id']:<15} ERROR       {str(e)[:70]}")
        time.sleep(args.delay)

    rows.sort(key=lambda r: -r["score"])

    readable = [r for r in rows if r["state"] != "needs render"]
    unreadable = [r for r in rows if r["state"] == "needs render"]
    listed = [r for r in readable if r["rank"]]
    in_fold = [r for r in listed if r["state"] == "in fold"]
    # who beats us most often, across every directory where we are both present
    beaten = {}
    for r in rows:
        for c in r["ahead"]:
            beaten[c] = beaten.get(c, 0) + 1

    seg = {}
    for r in rows:
        g = seg.setdefault(r.get("segment", "-"), dict(total=0, listed=0, in_fold=0, unread=0))
        g["total"] += 1
        if r["state"] == "needs render":
            g["unread"] += 1
        elif r["rank"]:
            g["listed"] += 1
            if r["state"] == "in fold":
                g["in_fold"] += 1

    out = dict(
        generated=str(date.today()), entity=ent["name"], fetcher=args.fetcher,
        summary=dict(
            directories_scanned=len(rows), errors=len(errors),
            readable=len(readable), needs_render=len(unreadable),
            listed=len(listed), absent=len(readable) - len(listed),
            in_top_fold=len(in_fold),
            share_of_voice=round(100 * len(listed) / max(1, len(readable)), 1),
            outranked_by=sorted(beaten.items(), key=lambda t: -t[1])[:10]),
        by_segment=seg, results=rows, errors=errors)

    rdir = os.path.join(ROOT, "tools", "results")
    os.makedirs(rdir, exist_ok=True)
    path = os.path.join(rdir, f"scan-{date.today()}.json")
    json.dump(out, open(path, "w", encoding="utf-8"), indent=2)

    s = out["summary"]
    print("\n" + "=" * 62)
    print(f"  {ent['name']}  ·  {s['directories_scanned']} directories  ·  {args.fetcher} fetcher")
    print("=" * 62)
    print(f"  listed            {s['listed']}/{s['readable']}   ({s['share_of_voice']}% presence, readable pages only)")
    if s['needs_render']:
        print(f"  needs render      {s['needs_render']}   client-side lists; plain HTTP cannot see them")
    print(f"  in the top {cfg['scoring']['top_fold']:<2}     {s['in_top_fold']}   <- the only ones a summary quotes")
    print(f"  absent            {s['absent']}")
    if s["outranked_by"]:
        print("\n  most often ahead of us:")
        for name, n in s["outranked_by"][:6]:
            print(f"    {name:<32} ahead on {n} lists")
    print("\n  by market:")
    for name in ("local", "national", "global"):
        g = seg.get(name)
        if not g:
            continue
        rn = g["total"] - g["unread"]
        pct = round(100 * g["listed"] / max(1, rn))
        print(f"    {name:<10} listed {g['listed']}/{rn}  ({pct}%)   top-ten on {g['in_fold']}")
    print("\n  fix in this order:")
    for r in rows[:6]:
        where = "not listed" if not r["rank"] else f"rank {r['rank']}/{r['listed_total']}"
        print(f"    {r['score']:>5.2f}  {r['id']:<15} {where:<16} {r['note']}")
    print(f"\n  written to {os.path.relpath(path, ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
