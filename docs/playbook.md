# AI entity optimization — the playbook

**The lever is entity resolution, not content.** An answer engine has to decide that the
organization on your homepage, the company page on LinkedIn, the profile on Crunchbase and
the name in a news article are one thing before it can say anything confident about you. If
that resolution fails you get hedged, generic, or wrong answers no amount of publishing
fixes. If it succeeds, ordinary content starts getting cited.

That is the whole difference from SEO. SEO optimized a page for a query. This makes an
entity legible to a retrieval system, so that any of the many sub-queries a question fans
out into can land on something that is unambiguously about you.

---

## The five mechanics that actually move

### 1. One canonical sentence, byte-identical everywhere

Not "consistent messaging" in the brand sense — literally the same string. Website
description, LinkedIn tagline, Crunchbase short description, schema `description`, meta
description, the opening line of every profile.

Two differently-worded self-descriptions read as weak evidence for two entities. The same
sentence appearing across a dozen independent domains reads as a corroborated fact. That
is the entire trick, and almost nobody does it because marketing instinct says vary the copy
per channel.

Generated for you at `dist/profile-copy.md`, pre-trimmed to each platform's character limit.

### 2. `sameAs` is the actual entity-resolution edge set

`schema.org/sameAs` on your Organization node is not decorative markup. It is the explicit
statement "these URLs are me," and it is how a knowledge-graph builder links your scattered
profiles into one node instead of several. Three external profiles is the practical floor.

Reciprocity matters: link back to your site from each of those profiles. A one-way claim is
weaker than a two-way one.

Wikidata is the single highest-leverage entry if you qualify, because it is consumed
directly by multiple knowledge graphs. Only create an item if the entity meets notability
rules — a deleted item is worse than no item.

### 3. Write for the chunk, not the page

Retrieval operates on passages. A chunk arrives at the model with none of the surrounding
page: no `<h1>`, no nav, no earlier paragraph establishing who "we" are.

So:

- Every section opens by naming the entity. Never "We help…", never "It provides…".
- The first sentence answers the question outright. Qualify in the second.
- Each section stands alone in roughly 150–300 words.
- No cross-references that break out of context ("as mentioned above", "see below").

The validator flags pronoun-led copy for exactly this reason.

### 4. Specificity is what makes you quotable

A model repeating a claim inherits its risk. Vague superlatives are risky to repeat and get
dropped; a dated, attributable number is safe and gets quoted.

"Canada's first and only hardware and semiconductor incubator, 95 startups and $82M raised
as of February 2025" survives retrieval. "A leading innovation hub" does not.

Always attach the `asOf` date. Undated numbers get quoted back years later as current.

**Publish your pricing.** "Contact us" is unquotable. A model asked what something costs
will cite whoever published a number.

### 5. Third-party corroboration outweighs your own site

Your own domain is self-report data. It establishes what you claim, not what is true. The
overwhelming majority of what gets said about a brand in AI answers is sourced from
somewhere other than that brand's own site.

Priority order for most B2B organizations: independent press → the community platform your
audience actually uses → structured directories (Crunchbase, industry registries) →
review platforms → your own domain.

---

## The failure that costs the most, and is invisible

**Crawler access.** A default "block AI bots" toggle at the CDN removes you from AI answers
outright, regardless of how good everything above is.

Retrieval crawlers and training crawlers are separate decisions:

- Blocking **retrieval** (`OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`,
  `ChatGPT-User`) removes you from answers today.
- Blocking **training** (`GPTBot`, `ClaudeBot`, `CCBot`) only affects future model weights
  and costs nothing today.

Most organizations that intend the second accidentally do both. See
`dist/crawler-reference.md` and test with the `curl -A` commands in it. A bot challenge or a
JS-only shell means the crawler sees nothing whatever robots.txt permits — server-render
anything you want quoted.

---

## Measure prompts, not keywords

Rank position is the wrong unit. Take the 20–50 prompts in `dist/audit-prompts.csv`, run
them across ChatGPT, Perplexity, Gemini, Claude, Google AI Overviews and Copilot monthly,
and grade three separate things:

| | meaning | what fixes it |
|---|---|---|
| **mention** | you appear in the answer text | retrievability: third-party pages |
| **citation** | a source about you is linked | current, datable, quotable pages |
| **accuracy** | the answer is correct | entity consistency |

A confident wrong answer costs more than absence, and you only find it by grading accuracy
separately. Absence on the `disambiguation` prompts means a name collision is eating your
answers — fix that before anything else.

---

## What this does not do

- **LinkedIn and social search are separate ranking systems.** They rank on engagement,
  keyword density in headline and About, and network proximity. Related discipline, different
  mechanics — do not expect the AI work to move them.
- **Timelines split.** Live-retrieval surfaces (Perplexity, ChatGPT search, AI Overviews) can
  pick up a new page within days to weeks. Answers coming from model weights move on the
  order of model releases, and reward consistency maintained over quarters.
- **None of this manufactures notability.** It makes existing substance legible. If there is
  nothing third parties would independently say about the entity, the ceiling is low and the
  fix is not technical.
