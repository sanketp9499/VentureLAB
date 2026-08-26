# VentureLAB

Work on [venturelab.ca](https://www.venturelab.ca/) by **Sanket Pawar**, prepared for the Web & Portfolio Specialist role at ventureLAB.

Two strands live in this repo:

- **This branch** — a concept redesign of the site, plus the two documents that argue for it.
- **`claude/ai-entity-optimization-wwpvnp`** — a separate toolkit for the machine-readable side: schema generation, `llms.txt`, crawler reference, and a tracked audit prompt set.

---

## The redesign

| File | What it is |
|---|---|
| `index.html` | The redesign. Eight pages, single self-contained file. |
| `audit.html` | Nine verified findings on the live site's AI-era discoverability. |
| `reach.html` | A ten-organisation competitive comparison on machine-readable identity and reach. |

Each opens directly in a browser. No build step, no dependencies, no network calls.

Eight routes under a hash router: Overview, Programs, The Space, Portfolio, a company profile, Partners, Answers, About.

**Everything in it is ventureLAB's own.** Photography, partner logos, portfolio company logos, award badges, figures, program names, membership prices and copy were all taken from venturelab.ca in August 2026. Nothing about the organisation is invented. Where the live site published two different figures for the same thing, the newer one was used, and those conflicts are listed in the audit.

### Design

- **Type** — Newsreader (editorial serif) for display, Montserrat (ventureLAB's own face) for interface and data. Both inlined as base64 woff2.
- **Colour** — ventureLAB's palette with the hierarchy inverted: `#333232` leads as text ink, `#092044` is typographic rather than environmental, `#F19A37` is a precise accent. Warm paper `#F7F5F1` is the ground. Note that raw `#F19A37` is only 2.2:1 on white, so orange *text* uses a derived `#A8600C`; the brand orange stays a fill.
- **Structure** — hairline-ruled editorial spreads with a sticky label rail. No card shadows, no rounded corners.
- **Motion** — masked line reveals, a scroll-progress hairline, an animated horizontal timeline, animated sector bars, and a pinned horizontal photo rail. All of it respects `prefers-reduced-motion`.

### Verified

- No horizontal overflow on any route at 1440px, 1024px or 390px
- Contrast checked across the palette; all text pairs pass 4.5:1
- Skip link, visible focus rings, `aria-pressed` filters, `role="status"` on live counts
- `Organization` JSON-LD in the head, which is the single largest gap the audit identifies on the live site

---

## Rights

The photography, logos and award artwork belong to ventureLAB and its partners. They are included because this is a proposal *for* ventureLAB, presented to ventureLAB. This repository is currently public, so anyone can see that material. If ventureLAB would rather the concept work not be visible before a decision, switch the repo to private in Settings.

---

## Version history

Earlier directions are kept as files rather than only as commits, so they can be opened side by side:

- `index-v1-backup.html` — first pass, index tables, no imagery
- `index-v2-bold.html` — heavy condensed display type on a navy ground
- `index-v3-static.html` — the same, before the motion layer
- `index-v6-navy.html` — the navy-and-cards system, before the editorial rebuild

The current `index.html` replaced that world rather than refining it, which was the point: the earlier versions read as ventureLAB's existing site with more on it.

## A note on file size

`index.html` is around 4.5MB because every font, photograph and logo is embedded as a data URI so the file is portable and works offline. That is the right trade for a deliverable someone opens from an email. It is the wrong trade for production, where these would be real asset requests served by Webflow's CDN.
