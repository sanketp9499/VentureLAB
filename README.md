# VentureLAB

A concept redesign of [venturelab.ca](https://www.venturelab.ca/) by **Sanket Pawar**, built for the Web & Portfolio Specialist role at ventureLAB.

`index.html` is the site. Twelve pages in one file, no build step, no dependencies, no network requests.

---

## Editing the design

Open `index.html` and search for `DESIGN CONTROLS`. It is a documented block near the top of the first `<style>` tag and it drives everything visual on the site:

```css
--paper   page ground, and the navigation bar
--white   the alternating light bands
--ink     body text, and the darkest neutral
--deep    display type, the footer, filled buttons
--signal  ventureLAB orange. Fills and rules only
--signal-t the orange used for TEXT, which passes contrast where --signal does not
--rule    hairlines
--quiet   secondary text
--gut     page gutter
--max     maximum content width
--nav-h   height of the navigation bar
```

Change a value, save, reload. To preview locally, run `python -m http.server 8791` in this folder and open `http://127.0.0.1:8791`. Opening the file directly works too, since it needs no server.

Type sizes are the three rules directly below that block, `.t1` `.t2` `.t3`, with body size set in `html{}`. Copy lives in the arrays at the bottom of the file: `PROGRAMS`, `ANSWERS`, `EVENTS`, `TEAM`, `HTL` for the timeline, `TIERS` for membership.

---

## Completely offline

**Download the file and open it. That is the whole process.** No build step, no install, no server, no internet connection.

Every font, photograph, logo and award badge is embedded directly in the HTML as a data URI. Verified by loading every route, scrolling each to the bottom to force every lazy image, and measuring: **zero network requests**. No `fetch`, no XHR, no `@import`, no external stylesheet, no CDN.

The only external URLs anywhere are the social links in the footer, which are places to go rather than things to load.

This means it works from a USB stick, from an email attachment, on a plane, and inside a corporate network that blocks unknown hosts. That last one matters more than it sounds for something you send to an organisation before a meeting.

---

## The redesign

Twelve routes under a hash router: home, Programs, Innovation Space, Portfolio, a company profile, Partners, Answers, About, Our Team, Events, Start-Up Visa and Join. The navigation mirrors ventureLAB's own information architecture, with About, Opportunities and Resources as dropdowns, and it deep-links into a page with a second hash segment, for example `#/programs/canada-catalyst`.

The team page is built from the 109 people published on venturelab.ca/our-team, grouped as the live site groups them, with 36 headshots and the 25 personal LinkedIn links ventureLAB publishes on its own person pages. Nobody without a published link gets one. The events calendar is built from the events ventureLAB has published, and it emits `Event` markup: the live site presents its calendar as an embedded Google Calendar, which no search or answer engine can read.

**Everything in it is ventureLAB's own.** Photography, partner logos, portfolio company logos, award badges, figures, program names, membership prices and copy were all taken from venturelab.ca in August 2026. Nothing about the organisation is invented. Where the live site published two different figures for the same thing, the newer one was used.

### Design

- **Type**: Newsreader (editorial serif) for display, Montserrat (ventureLAB's own face) for interface and data. Both inlined as base64 woff2.
- **Colour**: ventureLAB's palette with the hierarchy inverted: `#333232` leads as text ink, `#092044` is typographic rather than environmental and holds the footer, `#F19A37` is a precise accent. The navigation bar sits on the paper ground `#F7F5F1`. ventureLAB only publish a reversed wordmark, so the light-ground cut in this file is their asset with the white half recoloured to ink and the orange untouched. Note that raw `#F19A37` is only 2.2:1 on white, so orange *text* uses a derived `#A8600C`; the brand orange stays a fill.
- **Structure**: hairline-ruled editorial spreads with a sticky label rail. No card shadows, no rounded corners.
- **Motion**: masked line reveals, a scroll-progress hairline, a scroll-driven timeline, animated sector bars, and a pinned horizontal photo rail. All of it respects `prefers-reduced-motion`.

### Verified

- Zero network requests on every route
- No horizontal overflow at 1440px, 1024px or 390px
- Contrast checked across the palette; all text pairs pass 4.5:1
- Skip link, visible focus rings, `aria-pressed` filters, `role="status"` on live counts
- `Organization` JSON-LD in the head, carrying `legalName`, `alternateName` and the federal Start-Up Visa listing as `subjectOf`
- `FAQPage` JSON-LD generated from the same array that renders the Answers page, so the two cannot drift apart

---

## tools/

A directory visibility scanner. `python tools/scan.py`, Python with requests and lxml, no account and no API key. It crawls twenty directories, each tagged `local`, `national` or `global` in `tools/config.json`, finds where ventureLAB sits against its peers, scores by how often that directory is actually cited, and writes a dated JSON file so two runs can be compared.

---

## Rights

The photography, logos and award artwork belong to ventureLAB and its partners. They are included because this is a proposal *for* ventureLAB, presented to ventureLAB. This repository is currently public, so that material is publicly visible. If ventureLAB would rather the concept work not be visible before a decision, switch the repo to private in Settings.

---

## Notes

`index.html` is around 5MB, because self-contained and small are the same trade in opposite directions and portability won. In production these would be real asset requests served by Webflow's CDN, not data URIs.

Earlier design directions are not tracked here, but they are in the history of commit `975130f` if you want to open them side by side.
