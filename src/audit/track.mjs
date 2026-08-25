#!/usr/bin/env node
/**
 * Turns a filled results.jsonl into a visibility report.
 *
 * Three numbers matter and they are not the same number:
 *   mention rate  — you appear in the answer text.
 *   citation rate — a link to a source about you is attached. This is the one that
 *                   moves, because it is driven by retrievable third-party pages.
 *   accuracy      — the answer is correct. A confident wrong answer costs more than
 *                   absence, and only shows up if you grade it.
 *
 * Usage: node src/audit/track.mjs audit/results.jsonl
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { loadConfig, ROOT } from "../config.mjs";

const file = process.argv[2] || join(ROOT, "audit", "results.jsonl");
const cfg = loadConfig();

let rows;
try {
  rows = readFileSync(file, "utf8").split("\n").filter((l) => l.trim())
    .map((l, i) => { try { return JSON.parse(l); } catch { throw new Error(`line ${i + 1} is not valid JSON`); } })
    .filter((r) => r.mentioned !== null && r.mentioned !== undefined);
} catch (e) {
  console.error(`\nCould not read ${file}: ${e.message}`);
  console.error(`\nRun \`npm run prompts\` first, copy dist/results.template.jsonl to audit/results.jsonl,`);
  console.error(`run the prompts across each platform, and fill in mentioned/cited/accurate.\n`);
  process.exit(1);
}
if (!rows.length) { console.error("\nNo graded rows yet — every 'mentioned' is still null.\n"); process.exit(1); }

const prompts = JSON.parse(readFileSync(join(ROOT, "dist", "audit-prompts.json"), "utf8"));
const intentOf = Object.fromEntries(prompts.map((p) => [p.id, p.intent]));
const textOf = Object.fromEntries(prompts.map((p) => [p.id, p.prompt]));

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const tally = (rs) => ({
  n: rs.length,
  mention: pct(rs.filter((r) => r.mentioned).length, rs.length),
  cite: pct(rs.filter((r) => r.cited).length, rs.length),
  accurate: pct(rs.filter((r) => r.accurate).length, rs.filter((r) => r.mentioned).length),
});

const groupBy = (rs, f) => rs.reduce((m, r) => ((m[f(r)] ||= []).push(r), m), {});
const dates = [...new Set(rows.map((r) => r.date))].sort();
const latest = dates.at(-1);
const now = rows.filter((r) => r.date === latest);

const overall = tally(now);
const byPlatform = Object.entries(groupBy(now, (r) => r.platform)).map(([k, v]) => [k, tally(v)]);
const byIntent = Object.entries(groupBy(now, (r) => intentOf[r.prompt_id] || "unknown")).map(([k, v]) => [k, tally(v)]);

// Share of voice: how often a competitor is named in an answer to a prompt about your space.
const rival = {};
now.forEach((r) => (r.competitors_named || []).forEach((c) => (rival[c] = (rival[c] || 0) + 1)));
const sov = Object.entries(rival).sort((a, b) => b[1] - a[1]);

const missed = now.filter((r) => !r.mentioned)
  .sort((a, b) => a.prompt_id.localeCompare(b.prompt_id));
const wrong = now.filter((r) => r.mentioned && r.accurate === false);

const row = (label, t) => `| ${label} | ${t.n} | ${t.mention}% | ${t.cite}% | ${t.accurate}% |`;
const head = "| | n | mention | citation | accuracy |\n|---|---:|---:|---:|---:|";

const md = [
  `# AI visibility — ${cfg.identity.name}`,
  ``,
  `Run of ${latest}. ${now.length} graded observations across ${new Set(now.map((r) => r.platform)).size} platforms.`,
  ``,
  `**Mention ${overall.mention}% · citation ${overall.cite}% · accuracy ${overall.accurate}%**`,
  ``,
  `## By platform`, ``, head, ...byPlatform.sort((a, b) => b[1].mention - a[1].mention).map(([k, t]) => row(k, t)), ``,
  `## By intent`, ``, head, ...byIntent.sort((a, b) => a[1].mention - b[1].mention).map(([k, t]) => row(k, t)), ``,
  ...(sov.length ? [`## Who else gets named`, ``, ...sov.map(([c, n]) => `- ${c} — ${n} answer(s)`), ``] : []),
  ...(wrong.length ? [
    `## Wrong answers (fix these before chasing coverage)`, ``,
    ...wrong.map((r) => `- **${r.platform}** · ${textOf[r.prompt_id] || r.prompt_id}${r.notes ? ` — ${r.notes}` : ""}`), ``,
  ] : []),
  ...(missed.length ? [
    `## Absent`, ``,
    ...missed.slice(0, 40).map((r) => `- ${r.platform} · ${textOf[r.prompt_id] || r.prompt_id}`),
    missed.length > 40 ? `- …and ${missed.length - 40} more` : "", ``,
  ] : []),
];

if (dates.length > 1) {
  md.push(`## Trend`, ``, `| date | mention | citation | accuracy |`, `|---|---:|---:|---:|`);
  dates.forEach((d) => { const t = tally(rows.filter((r) => r.date === d)); md.push(`| ${d} | ${t.mention}% | ${t.cite}% | ${t.accurate}% |`); });
  md.push(``);
}

md.push(
  `## Reading this`, ``,
  `- Low mention, low citation → you are not retrievable. Third-party pages, not more of your own.`,
  `- High mention, low citation → the model knows you but has nothing current to point at. Publish datable, quotable pages.`,
  `- High mention, low accuracy → your facts conflict across sources. Fix entity consistency before anything else.`,
  `- Absent on \`disambiguation\` → a name collision is eating your answers.`,
  ``);

mkdirSync(join(ROOT, "dist"), { recursive: true });
const outFile = join(ROOT, "dist", "visibility-report.md");
writeFileSync(outFile, md.join("\n"));
console.log(`\nmention ${overall.mention}% · citation ${overall.cite}% · accuracy ${overall.accurate}%   (${latest})`);
console.log(`\n  dist/visibility-report.md\n`);
