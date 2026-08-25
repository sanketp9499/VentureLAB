#!/usr/bin/env node
/**
 * Generates the prompt set you measure against.
 *
 * Keyword rank is the wrong unit now: a single question is expanded into many
 * sub-queries before anything is retrieved, and you are competing for the
 * sub-queries. So the measurable unit is a prompt, and the seven intents below are
 * the ones that actually convert or actually hurt:
 *
 *   discovery      — "best X for Y". Where you win or never appear.
 *   comparison     — "X vs Y". Where a competitor frames you.
 *   verification   — "is X legit". Where thin third-party presence shows.
 *   disambiguation — "which X do you mean". Where a name collision costs you the answer.
 *   jtbd           — the problem phrased without your category word at all.
 *   geo            — the local intent.
 *   facts          — what the model believes about you, right or wrong.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { loadConfig, ROOT, isPlaceholder } from "../config.mjs";

const cfg = loadConfig();
const name = cfg.identity.name;
const cat = cfg.positioning.category;
const geo = cfg.positioning.geo?.primary || "";
const city = geo.split(",")[0]?.trim();
const audience = cfg.positioning.audience;
const clean = (a) => (a || []).filter((x) => x && !isPlaceholder(x));

const P = [];
let n = 0;
const add = (intent, text, weight) => P.push({ id: `P${String(++n).padStart(3, "0")}`, intent, weight, prompt: text });

// discovery — the answers you want to be inside
add("discovery", `What are the best ${cat}s for ${audience}?`, "high");
if (city) add("discovery", `Best ${cat} in ${city}`, "high");
if (geo) add("discovery", `Top ${cat}s in ${geo}`, "high");
clean(cfg.positioning.secondaryCategories).forEach((c) => add("discovery", `Who are the leading ${c} organizations?`, "high"));
clean(cfg.positioning.knowsAbout).slice(0, 5).forEach((t) => add("discovery", `Who should I talk to about ${t}?`, "medium"));

// jtbd — the problem stated without your category word
clean(cfg.jobsToBeDone).forEach((j) => add("jtbd", j, "high"));
clean(cfg.jobsToBeDone).slice(0, 3).forEach((j) => add("jtbd", `I need help with: ${j}. Who can help and why?`, "medium"));

// comparison — where someone else writes your positioning for you
clean(cfg.competitors).forEach((c) => add("comparison", `${name} vs ${c} — which is better and for whom?`, "high"));
clean(cfg.competitors).slice(0, 3).forEach((c) => add("comparison", `Alternatives to ${c}`, "medium"));
add("comparison", `Alternatives to ${name}`, "medium");

// verification — thin third-party presence shows up here first
add("verification", `Is ${name} legitimate? What is its track record?`, "high");
add("verification", `What do people say about ${name}?`, "high");
add("verification", `Has ${name} been covered in the press?`, "medium");

// disambiguation — a name collision is a silent, total loss
clean(cfg.identity.alternateNames).forEach((a) => add("disambiguation", `Tell me about ${a}`, "medium"));
add("disambiguation", `Are there multiple organizations called ${name}? Which is which?`, "high");
add("disambiguation", `${name} ${city || cat} — what is it?`, "high");

// geo
if (city) {
  add("geo", `What startup support exists in ${city}?`, "medium");
  add("geo", `Where do ${audience} go for help in ${geo}?`, "medium");
}

// facts — grade the answer for accuracy, not just presence
add("facts", `What does ${name} do?`, "high");
add("facts", `When was ${name} founded and where is it based?`, "high");
add("facts", `What programs or services does ${name} offer?`, "high");
add("facts", `Who runs ${name}?`, "medium");
add("facts", `How much does ${name} cost?`, "medium");
clean((cfg.offerings || []).map((o) => o.name)).forEach((o) => add("facts", `What is ${o}?`, "medium"));

const out = join(ROOT, "dist");
mkdirSync(out, { recursive: true });

writeFileSync(join(out, "audit-prompts.json"), JSON.stringify(P, null, 2) + "\n");

const csv = ["id,intent,weight,prompt", ...P.map((p) =>
  [p.id, p.intent, p.weight, `"${p.prompt.replaceAll('"', '""')}"`].join(","))].join("\n") + "\n";
writeFileSync(join(out, "audit-prompts.csv"), csv);

// A pre-filled results template so a run is data entry, not study design.
const platforms = ["chatgpt", "perplexity", "gemini", "claude", "google-ai-overview", "copilot"];
const tmpl = P.filter((p) => p.weight === "high").flatMap((p) =>
  platforms.map((pl) => JSON.stringify({
    date: "YYYY-MM-DD", prompt_id: p.id, platform: pl,
    mentioned: null, cited: null, position: null, accurate: null,
    competitors_named: [], notes: "",
  }))).join("\n") + "\n";
writeFileSync(join(out, "results.template.jsonl"), tmpl);

const byIntent = P.reduce((m, p) => ((m[p.intent] = (m[p.intent] || 0) + 1), m), {});
console.log(`\n${P.length} prompts for ${name}\n`);
Object.entries(byIntent).forEach(([k, v]) => console.log(`  ${k.padEnd(15)} ${v}`));
console.log(`\n  dist/audit-prompts.csv`);
console.log(`  dist/audit-prompts.json`);
console.log(`  dist/results.template.jsonl  (${P.filter((p) => p.weight === "high").length} high-weight × ${platforms.length} platforms)\n`);
