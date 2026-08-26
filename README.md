# VentureLAB

Work on [venturelab.ca](https://www.venturelab.ca/) by **Sanket Pawar**, prepared for the Web & Portfolio Specialist role at ventureLAB.

| File | What it is |
|---|---|
| `index.html` | A concept redesign of the site. Eight pages, one file. |
| `audit.html` | Nine verified findings on the live site's AI-era discoverability. |
| `reach.html` | A ten-organisation competitive comparison on machine-readable identity and reach. |

A separate branch, `claude/ai-entity-optimization-wwpvnp`, holds a toolkit for the machine-readable side: schema generation, `llms.txt`, crawler reference, and a tracked audit prompt set.

---

## Completely offline

**Download the file and open it. That is the whole process.** No build step, no install, no server, no internet connection.

Every font, photograph, logo and award badge is embedded directly in the HTML as a data URI. Verified by loading all eight routes, scrolling each to the bottom to force every lazy image, and measuring: **zero network requests**. No `fetch`, no XHR, no `@import`, no external stylesheet, no CDN.

The only external URLs anywhere are the five social links in the footer, which are places to go rather than things to load.

This means it works from a USB stick, from an email attachment, on a plane, and inside a corporate network that blocks unknown hosts. That last one matters more than it sounds for something you send to an organisation before a meeting.

---

## The redesign

Eight routes under a hash router: Overview, Programs, The Space, Portfolio, a company profile, Partners, Answers, About.

**Everything in it is ventureLAB's own.** Photography, partner logos, portfolio company logos, award badges, figures, program names, membership prices and copy were all taken from venturelab.ca in August 2026. Nothing about the organisation is invented. Where the live site published two different figures for the same thing, the newer one was used, and those conflicts are listed in the audit.

### Design

- **Type** — Newsreader (editorial serif) for display, Montserrat (ventureLAB's own face) for interface and data. Both inlined as base64 woff2.
- **Colour** — ventureLAB's palette with the hierarchy inverted: `#333232` leads as text ink, `#092044` is typographic rather than environmental, `#F19A37` is a precise accent. Warm paper `#F7F5F1` is the ground. Note that raw `#F19A37` is only 2.2:1 on white, so orange *text* uses a derived `#A8600C`; the brand orange stays a fill.
- **Structure** — hairline-ruled editorial spreads with a sticky label rail. No card shadows, no rounded corners.
- **Motion** — masked line reveals, a scroll-progress hairline, an animated horizontal timeline, animated sector bars, and a pinned horizontal photo rail. All of it respects `prefers-reduced-motion`.

### Verified

- Zero network requests on every route
- No horizontal overflow at 1440px, 1024px or 390px
- Contrast checked across the palette; all text pairs pass 4.5:1
- Skip link, visible focus rings, `aria-pressed` filters, `role="status"` on live counts
- `Organization` JSON-LD in the head, which is the single largest gap the audit identifies on the live site

---

## Rights

The photography, logos and award artwork belong to ventureLAB and its partners. They are included because this is a proposal *for* ventureLAB, presented to ventureLAB. This repository is currently public, so that material is publicly visible. If ventureLAB would rather the concept work not be visible before a decision, switch the repo to private in Settings.

---

## Notes

`index.html` is around 4.5MB, because self-contained and small are the same trade in opposite directions and portability won. In production these would be real asset requests served by Webflow's CDN, not data URIs.

Earlier design directions are not tracked here, but they are in the history of commit `975130f` if you want to open them side by side.
