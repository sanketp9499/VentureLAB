# Entity optimization toolkit

**Make an organization resolvable and citable by AI answer engines.** This repo turns one
config file into the assets that do that — JSON-LD entity graph, `llms.txt`, AI-crawler
`robots.txt`, per-platform profile copy — plus a linter that catches the failures that make
models hedge, and a measurement harness that tracks whether any of it worked.

Configured here for **ventureLAB** (Markham, Ontario). Repoint `entity.config.json` at any
organization.

## Why this is not SEO

SEO optimized a page for a query. This makes an *entity* legible.

An answer engine must first decide that your homepage, your LinkedIn page, your Crunchbase
profile and your name in a news article are one thing. Until that resolves, you get hedged,
generic or wrong answers that no amount of publishing fixes. Once it does, ordinary content
starts getting cited. Everything here serves that one goal.

Full reasoning: [`docs/playbook.md`](docs/playbook.md).
ventureLAB-specific findings: [`docs/findings-venturelab.md`](docs/findings-venturelab.md).

## Use

```bash
npm run build      # generate all assets into dist/
npm run validate   # lint entity consistency (non-zero exit on errors)
npm run prompts    # generate the prompt set to measure against
npm run report     # score a completed measurement pass
```

No dependencies. Node 18+.

## What gets generated

| file | where it goes |
|---|---|
| `dist/schema.jsonld` / `schema.html` | inline in `<head>` on every page |
| `dist/llms.txt` | served at `/llms.txt` |
| `dist/robots.txt` | served at `/robots.txt` |
| `dist/meta.html` | `<head>` title, description, Open Graph |
| `dist/profile-copy.md` | paste into LinkedIn, Crunchbase, X, YouTube, directories |
| `dist/crawler-reference.md` | which AI crawlers you allow, and how to test it |
| `dist/audit-prompts.csv` | the prompts you measure monthly |
| `dist/visibility-report.md` | mention / citation / accuracy, by platform and intent |

## The four things that matter

1. **One canonical sentence, byte-identical everywhere.** Not "consistent messaging" —
   literally the same string on the site, LinkedIn, Crunchbase and in schema. Differently
   worded self-descriptions read as weak evidence for several entities; the same sentence
   across independent domains reads as corroborated fact.

2. **`sameAs` is the entity-resolution edge set.** It is the explicit machine-readable claim
   "these URLs are me," and it is what fuses scattered profiles into one knowledge-graph node.
   Three profiles is the floor. Link back from each.

3. **Write for the chunk.** Retrieval works on passages that arrive with no page context.
   Every section names the entity in its first sentence and answers outright — never "We
   help…", never "It provides…". The validator flags pronoun-led copy for this reason.

4. **Check crawler access before anything else.** A single CDN "block AI bots" toggle removes
   you from AI answers outright. Retrieval crawlers (`OAI-SearchBot`, `PerplexityBot`,
   `Claude-SearchBot`) cost you today; training crawlers (`GPTBot`, `ClaudeBot`, `CCBot`) only
   affect future model weights. Most organizations blocking the second are accidentally
   blocking the first.

## Measuring

Rank position is the wrong unit — a question fans out into many sub-queries before anything
is retrieved, so the unit is a prompt. `npm run prompts` generates them across seven intents
(discovery, jobs-to-be-done, comparison, verification, disambiguation, geo, facts).

Run them across ChatGPT, Perplexity, Gemini, Claude, AI Overviews and Copilot. Grade three
things separately, because they have different causes and different fixes:

- **mention** — you appear in the answer → fixed by retrievability
- **citation** — a source about you is linked → fixed by current, quotable third-party pages
- **accuracy** — the answer is right → fixed by entity consistency

A confident wrong answer costs more than absence, and you only find it by grading accuracy
on its own. Copy `dist/results.template.jsonl` to `audit/results.jsonl`, fill it in, and run
`npm run report`.

## Honest limits

- LinkedIn and social search are separate ranking systems (engagement, headline keywords,
  network proximity). This work will not move them.
- Live-retrieval surfaces pick up new sources in days to weeks; weight-based answers move
  over model releases and reward consistency held for quarters.
- None of this manufactures notability. It makes existing substance legible. If nothing
  third parties would independently say about the entity exists, the ceiling is low and the
  fix is not technical.
