# VentureLAB

Work on [venturelab.ca](https://www.venturelab.ca/) by **Sanket Pawar**, prepared for the Web & Portfolio Specialist role at ventureLAB.

| File | What it is |
|---|---|
| **`proposal.html`** | **The proposal.** What I would do at ventureLAB, in one document: the site, organic reach across three markets, and the order I would do the work in. |
| **`start-here.html`** | **Read this first.** Plain language, no jargon, five minutes. For anyone, technical or not. |
| **`fix-kit.html`** | **The actual fixes**, written out and ready to copy. Six of eight need no developer. |
| `index.html` | A concept redesign of the site. Eleven pages, one file, including a team page built from the real roster, an interactive events calendar, and a Start-Up Visa page. |
| `audit.html` | Ten verified findings on the live site's AI-era discoverability. |
| `reach.html` | A ten-organisation competitive comparison on machine-readable identity and reach. |
| `compare.html` | What the redesign changed, measured against the live site and the same ten peers, including where it is worse. |
| `category.html` | Why ventureLAB is invisible for generic category searches across all three markets, local, national and global, and the seven moves that change it. |
| `proof.html` | A working crawl, detect, score and prioritise pipeline, with real output across twenty directories. |
| `tools/` | The scanner itself. `python tools/scan.py`, no API key needed. Twenty directories, each tagged `local`, `national` or `global`. |

A separate branch, `claude/ai-entity-optimization-wwpvnp`, holds a toolkit for the machine-readable side: schema generation, `llms.txt`, crawler reference, and a tracked audit prompt set.

---

## Three markets, not one

ventureLAB targets the GTA, Canada, and the world. The tagline is "Born Global" and Canada Catalyst exists to bring international founders in, so every directory in `tools/config.json` carries a `segment` field and the scanner reports each market separately.

```
by market:
  local      listed 2/7  (29%)   top-ten on 1
  national   listed 2/4  (50%)   top-ten on 1
  global     listed 1/5  (20%)   top-ten on 1
```

Two findings came out of that split, and they are the reason to read `category.html` before anything else:

1. **ventureLAB already wins the worldwide hardware question.** Asked for the best hardware accelerators in the world, against HAX, Y Combinator and Silicon Catalyst, the answer names ventureLAB third. It is on one of the five global hardware lists those answers are built from, and inside the fold on that one. The list that ranks first for the query does not mention it.

2. **ventureLAB is a designated Start-Up Visa organisation with priority processing, and no AI answer knows.** The federal listing calls it **ventureLAB Innovation Centre**, a string that appears nowhere on venturelab.ca, nowhere on LinkedIn, and nowhere in the site's markup, so the credential does not attach to the entity. That is finding F10 in the audit and item five in the fix kit, and it is a one-line change to the structured data.

---

## Completely offline

**Download the file and open it. That is the whole process.** No build step, no install, no server, no internet connection.

Every font, photograph, logo and award badge is embedded directly in the HTML as a data URI. Verified by loading all eight routes, scrolling each to the bottom to force every lazy image, and measuring: **zero network requests**. No `fetch`, no XHR, no `@import`, no external stylesheet, no CDN.

The only external URLs anywhere are the five social links in the footer, which are places to go rather than things to load.

This means it works from a USB stick, from an email attachment, on a plane, and inside a corporate network that blocks unknown hosts. That last one matters more than it sounds for something you send to an organisation before a meeting.

---

## The redesign

Eleven routes under a hash router: home, Programs, Innovation Space, Portfolio, a company profile, Partners, Answers, About, Our Team, Events and Start-Up Visa. The navigation mirrors ventureLAB's own information architecture, with About, Opportunities and Resources as dropdowns, and it deep-links into a page with a second hash segment, for example `#/programs/canada-catalyst`.

The team page is built from the 109 people published on venturelab.ca/our-team, grouped as the live site groups them. The events calendar is built from the events ventureLAB has published, and it emits `Event` markup: the live site presents its calendar as an embedded Google Calendar, which no search or answer engine can read.

**Everything in it is ventureLAB's own.** Photography, partner logos, portfolio company logos, award badges, figures, program names, membership prices and copy were all taken from venturelab.ca in August 2026. Nothing about the organisation is invented. Where the live site published two different figures for the same thing, the newer one was used, and those conflicts are listed in the audit.

### Design

- **Type**: Newsreader (editorial serif) for display, Montserrat (ventureLAB's own face) for interface and data. Both inlined as base64 woff2.
- **Colour**: ventureLAB's palette with the hierarchy inverted: `#333232` leads as text ink, `#092044` is typographic rather than environmental, `#F19A37` is a precise accent. Warm paper `#F7F5F1` is the ground. Note that raw `#F19A37` is only 2.2:1 on white, so orange *text* uses a derived `#A8600C`; the brand orange stays a fill.
- **Structure**: hairline-ruled editorial spreads with a sticky label rail. No card shadows, no rounded corners.
- **Motion**: masked line reveals, a scroll-progress hairline, an animated horizontal timeline, animated sector bars, and a pinned horizontal photo rail. All of it respects `prefers-reduced-motion`.

### Verified

- Zero network requests on every route
- No horizontal overflow at 1440px, 1024px or 390px
- Contrast checked across the palette; all text pairs pass 4.5:1
- Skip link, visible focus rings, `aria-pressed` filters, `role="status"` on live counts
- `Organization` JSON-LD in the head, carrying `legalName`, `alternateName` and the federal Start-Up Visa listing as `subjectOf`, which is the single largest gap the audit identifies on the live site
- `FAQPage` JSON-LD generated from the same array that renders the Answers page, so the two cannot drift apart

---

## Rights

The photography, logos and award artwork belong to ventureLAB and its partners. They are included because this is a proposal *for* ventureLAB, presented to ventureLAB. This repository is currently public, so that material is publicly visible. If ventureLAB would rather the concept work not be visible before a decision, switch the repo to private in Settings.

---

## Notes

`index.html` is around 4.5MB, because self-contained and small are the same trade in opposite directions and portability won. In production these would be real asset requests served by Webflow's CDN, not data URIs.

Earlier design directions are not tracked here, but they are in the history of commit `975130f` if you want to open them side by side.
