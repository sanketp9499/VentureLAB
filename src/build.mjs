#!/usr/bin/env node
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { loadConfig, ROOT } from "./config.mjs";
import { graph, scriptTag } from "./schema.mjs";
import { llmsTxt } from "./llms.mjs";
import { robotsTxt, CRAWLERS } from "./crawlers.mjs";
import { bios, longForm } from "./text.mjs";

const cfg = loadConfig();
const out = join(ROOT, "dist");
mkdirSync(out, { recursive: true });

const write = (name, body) => {
  writeFileSync(join(out, name), body);
  console.log(`  dist/${name.padEnd(22)} ${String(body.length).padStart(6)} bytes`);
};

console.log(`Building entity assets for ${cfg.identity.name}\n`);

write("schema.jsonld", JSON.stringify(graph(cfg), null, 2) + "\n");
write("schema.html", scriptTag(cfg) + "\n");
write("llms.txt", llmsTxt(cfg));
write("robots.txt", robotsTxt(cfg));

// Meta tags: title/description/OG/Twitter all carry the same canonical sentence.
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const desc = bios(cfg).find((b) => b.key === "meta_description").value;
write("meta.html", [
  `<title>${esc(cfg.identity.name)} — ${esc(cfg.positioning.category)}</title>`,
  `<meta name="description" content="${esc(desc)}">`,
  `<link rel="canonical" href="${cfg.site}/">`,
  `<meta property="og:type" content="website">`,
  `<meta property="og:site_name" content="${esc(cfg.identity.name)}">`,
  `<meta property="og:title" content="${esc(cfg.identity.name)} — ${esc(cfg.positioning.category)}">`,
  `<meta property="og:description" content="${esc(desc)}">`,
  `<meta property="og:url" content="${cfg.site}/">`,
  `<meta property="og:image" content="${cfg.identity.logo}">`,
  `<meta name="twitter:card" content="summary_large_image">`,
].join("\n") + "\n");

// Copy-paste block for every profile surface, pre-trimmed to each limit.
const b = bios(cfg);
write("profile-copy.md", [
  `# Profile copy — ${cfg.identity.name}`,
  "",
  "Paste verbatim. Do not reword per platform: byte-identical copy across sources is",
  "what makes an entity resolvable instead of merely present.",
  "",
  "## Canonical sentence (leads every surface)",
  "",
  "> " + cfg.positioning.oneLiner,
  "",
  "## Long form",
  "",
  longForm(cfg),
  "",
  "## Per-surface",
  "",
  ...b.flatMap((s) => [`### ${s.label} (${s.used}/${s.limit})`, "", s.value, ""]),
  "## sameAs URLs — list these on every profile that allows links",
  "",
  ...cfg.sameAs.map((u) => `- ${u}`),
  "",
].join("\n"));

// Crawler reference, generated so it cannot drift from the robots.txt above.
const pol = cfg.crawlerPolicy || {};
const state = (c) =>
  c.purpose === "index" ? (pol.allowSearchIndex !== false ? "allowed" : "BLOCKED")
  : c.purpose === "training" ? (pol.allowTraining !== false ? "allowed" : "blocked")
  : (pol.allowRetrieval !== false ? "allowed" : "BLOCKED");
write("crawler-reference.md", [
  `# AI crawler access — ${cfg.identity.name}`,
  ``,
  `Retrieval crawlers decide whether you can appear in an answer being generated right now.`,
  `Training crawlers only affect future model weights. A single "block AI bots" toggle at the`,
  `CDN blocks both, and is the most common reason a brand with good content is absent from`,
  `AI answers. Verify these user-agent strings against each vendor's published docs — they change.`,
  ``,
  `| user-agent | vendor | purpose | current policy | note |`,
  `|---|---|---|---|---|`,
  ...CRAWLERS.map((c) => `| \`${c.ua}\` | ${c.vendor} | ${c.purpose} | ${state(c)} | ${c.note} |`),
  ``,
  `## Check what is actually happening`,
  ``,
  "```bash",
  `curl -sI -A "PerplexityBot" ${cfg.site}/ | head -1`,
  `curl -sI -A "OAI-SearchBot" ${cfg.site}/ | head -1`,
  `curl -sI -A "ClaudeBot"     ${cfg.site}/ | head -1`,
  "```",
  ``,
  `A 403, a challenge page, or a JS-only shell here means the crawler sees nothing, whatever`,
  `robots.txt says. Server-render anything you want quoted.`,
  ``,
].join("\n"));

console.log(`\nDone. Serve llms.txt and robots.txt from your web root; inline schema.html in <head>.`);
