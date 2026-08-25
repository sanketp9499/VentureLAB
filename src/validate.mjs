#!/usr/bin/env node
/**
 * Entity consistency linter.
 *
 * Every check here maps to a specific failure mode in retrieval-based answering,
 * not to a style preference. Failures are things that measurably make a model
 * hedge, mis-attribute, or skip you.
 */
import { loadConfig, isPlaceholder, leaves } from "./config.mjs";
import { bios } from "./text.mjs";
import { graph } from "./schema.mjs";

const cfg = loadConfig();
const issues = [];
const add = (level, check, msg, why) => issues.push({ level, check, msg, why });

// 1. Unfilled template values. A placeholder shipped to production is a wrong fact.
const todos = leaves(cfg).filter(([, v]) => isPlaceholder(v));
if (todos.length) {
  add("error", "placeholders", `${todos.length} field(s) still contain TODO values`,
    "Placeholder text gets crawled, quoted and cached like any other claim.");
  todos.slice(0, 12).forEach(([p]) => add("detail", "placeholders", `  ${p}`, ""));
  if (todos.length > 12) add("detail", "placeholders", `  …and ${todos.length - 12} more`, "");
}

// 2. The canonical sentence must actually be usable as a lead everywhere.
const one = cfg.positioning.oneLiner || "";
if (!one.includes(cfg.identity.name))
  add("error", "canonical", "oneLiner does not contain the entity name",
    "A retrieved chunk arrives with no page context. If the sentence says 'We help…', the model cannot tell who 'we' is.");
if (one.length > 160)
  add("warn", "canonical", `oneLiner is ${one.length} chars; short-bio surfaces cap at 150–160`,
    "Above the cap it gets truncated differently on each platform, which breaks byte-identical consistency.");
if (/^(We|It|Our|The company)\b/i.test(one))
  add("error", "canonical", "oneLiner opens with a pronoun",
    "Anaphora does not survive chunking. Lead with the entity name.");

// 3. Answer-first FAQs.
(cfg.faqs || []).forEach((f, i) => {
  const first = String(f.a).split(/(?<=\.)\s/)[0] || "";
  if (!String(f.a).includes(cfg.identity.name))
    add("warn", "faq", `faq[${i}] answer never names the entity`,
      "The passage may be retrieved alone; without the name it cannot be attributed to you.");
  if (/^(Yes|No|Well|So|Basically|At [A-Z])/.test(first) === false && first.length > 320)
    add("warn", "faq", `faq[${i}] first sentence is ${first.length} chars`,
      "Retrieval scores the opening. Answer in the first sentence, qualify in the second.");
  if (/contact us|get in touch|reach out/i.test(f.a) && /cost|price|pricing/i.test(f.q))
    add("warn", "faq", `faq[${i}] answers a pricing question with a call to action`,
      "Unquotable. A model asked 'how much does X cost' will cite a competitor who published a number.");
});

// 4. sameAs hygiene — this is the entity-resolution edge set.
const seen = new Set();
cfg.sameAs.forEach((u) => {
  if (!/^https:\/\//.test(u)) add("error", "sameAs", `${u} is not https`, "Mixed-scheme URLs are treated as distinct nodes.");
  const norm = u.replace(/\/$/, "").toLowerCase();
  if (seen.has(norm)) add("warn", "sameAs", `duplicate profile: ${u}`, "");
  seen.add(norm);
});
if (cfg.sameAs.length < 3)
  add("error", "sameAs", `only ${cfg.sameAs.length} external profile(s) declared`,
    "Entity resolution needs corroborating nodes. Three is the practical floor; LinkedIn, Crunchbase and one review or community profile is the usual minimum set.");
if (!cfg.profiles?.wikidata)
  add("info", "sameAs", "no Wikidata item",
    "Wikidata is the highest-leverage single entry: it is directly consumed by knowledge graphs. Only create one if the entity meets notability rules — a rejected item is worse than none.");

// 5. Proof density.
const metrics = (cfg.proof?.metrics || []).filter((m) => !isPlaceholder(m.value));
if (!metrics.length)
  add("warn", "proof", "no concrete metrics",
    "Specific, checkable numbers are quoted far more readily than adjectives, because a vague claim is a liability to repeat.");
if (!(cfg.proof?.pressMentions || []).some((m) => m.url?.startsWith("http") && !isPlaceholder(m.url)))
  add("warn", "proof", "no third-party mention recorded",
    "Self-published claims are discounted as unverifiable. Independent corroboration is the bulk of what gets cited about a brand.");

// 6. Bio fit.
bios(cfg).forEach((b) => {
  if (b.used > b.limit) add("error", "bios", `${b.label} overflows (${b.used}/${b.limit})`, "");
  if (!b.value.startsWith(cfg.identity.name))
    add("info", "bios", `${b.label} does not open with the entity name`, "");
});

// 7. Crawler policy — the silent killer.
if (cfg.crawlerPolicy?.allowRetrieval === false)
  add("error", "crawlers", "retrieval crawlers are blocked",
    "This removes you from AI answers on those surfaces immediately. Blocking training is a separate, far less costly choice.");

// 8. Fan-out surface area.
if ((cfg.jobsToBeDone || []).filter((j) => !isPlaceholder(j)).length < 2)
  add("warn", "fanout", "fewer than 2 jobs-to-be-done recorded",
    "A question is expanded into many sub-queries before retrieval. You are competing for the sub-queries, not the head term.");
if ((cfg.positioning.knowsAbout || []).filter((k) => !isPlaceholder(k)).length < 3)
  add("warn", "fanout", "fewer than 3 knowsAbout topics", "Topical association is what places you in 'best X for Y' answers.");

// 9. Schema sanity.
const g = graph(cfg);
const ids = g["@graph"].map((n) => n["@id"]);
if (new Set(ids).size !== ids.length) add("error", "schema", "duplicate @id in graph", "Breaks node identity.");

const rank = { error: 0, warn: 1, info: 2, detail: 3 };
const icon = { error: "✗", warn: "!", info: "·", detail: " " };

// Group by check so detail lines stay under their parent, then order groups by severity.
const groups = new Map();
for (const i of issues) {
  if (!groups.has(i.check)) groups.set(i.check, []);
  groups.get(i.check).push(i);
}
const ordered = [...groups.values()]
  .sort((a, b) => Math.min(...a.map((i) => rank[i.level])) - Math.min(...b.map((i) => rank[i.level])))
  .flat();
issues.length = 0;
issues.push(...ordered);

console.log(`\nEntity consistency report — ${cfg.identity.name}\n`);
if (!issues.length) console.log("  ✓ clean\n");
let lastCheck = "";
for (const i of issues) {
  if (i.check !== lastCheck && i.level !== "detail") { console.log(""); lastCheck = i.check; }
  console.log(`  ${icon[i.level]} ${i.msg}`);
  if (i.why) console.log(`      ↳ ${i.why}`);
}
const errors = issues.filter((i) => i.level === "error").length;
const warns = issues.filter((i) => i.level === "warn").length;
console.log(`\n  ${errors} error(s), ${warns} warning(s)\n`);
process.exit(errors ? 1 : 0);
