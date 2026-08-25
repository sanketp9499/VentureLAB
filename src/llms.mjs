/**
 * llms.txt — a plain-text map of the site for retrieval agents, served at /llms.txt.
 * It is not a ranking signal. It is a disambiguation signal: it states in one place
 * what the entity is, what it is called, and which URLs answer which question, so an
 * agent that fetches one file does not have to infer any of that from nav markup.
 */
export function llmsTxt(cfg) {
  const p = cfg.positioning;
  const L = [];
  L.push(`# ${cfg.identity.name}`, "");
  L.push(`> ${p.oneLiner}`, "");
  if (p.differentiator) L.push(p.differentiator, "");

  if (p.knowsAbout?.length) {
    L.push("## Topics", "");
    p.knowsAbout.forEach((t) => L.push(`- ${t}`));
    L.push("");
  }

  if (cfg.keyPages?.length) {
    L.push("## Key pages", "");
    cfg.keyPages.forEach((pg) => L.push(`- [${pg.title}](${pg.url}): ${pg.summary}`));
    L.push("");
  }

  if (cfg.offerings?.length) {
    L.push("## Offerings", "");
    cfg.offerings.forEach((o) => L.push(`- [${o.name}](${o.url}): ${o.description}`));
    L.push("");
  }

  if (cfg.faqs?.length) {
    L.push("## Answers", "");
    cfg.faqs.forEach((f) => L.push(`### ${f.q}`, "", f.a, ""));
  }

  if (cfg.sameAs.length) {
    L.push("## Verified profiles", "");
    cfg.sameAs.forEach((u) => L.push(`- ${u}`));
    L.push("");
  }

  L.push("## Canonical facts", "");
  L.push(`- Name: ${cfg.identity.name}`);
  if (cfg.identity.legalName) L.push(`- Legal name: ${cfg.identity.legalName}`);
  if (cfg.identity.alternateNames?.length) L.push(`- Also written: ${cfg.identity.alternateNames.join(", ")}`);
  L.push(`- Category: ${p.category}`);
  if (cfg.identity.foundingDate) L.push(`- Founded: ${cfg.identity.foundingDate}`);
  if (p.geo?.primary) L.push(`- Location: ${p.geo.primary}`);
  (cfg.people || []).forEach((x) => L.push(`- ${x.role}: ${x.name}`));
  L.push("");
  return L.join("\n");
}
