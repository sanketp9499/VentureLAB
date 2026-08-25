/** Platform surfaces with hard character limits. Same first sentence everywhere. */
export const SURFACES = [
  { key: "x_bio",             label: "X / Twitter bio",              limit: 160 },
  { key: "github_bio",        label: "GitHub org bio",               limit: 160 },
  { key: "instagram_bio",     label: "Instagram bio",                limit: 150 },
  { key: "linkedin_tagline",  label: "LinkedIn company tagline",     limit: 120 },
  { key: "linkedin_about",    label: "LinkedIn About",               limit: 2000 },
  { key: "crunchbase_short",  label: "Crunchbase short description", limit: 280 },
  { key: "crunchbase_full",   label: "Crunchbase full description",  limit: 1500 },
  { key: "youtube_about",     label: "YouTube channel description",  limit: 1000 },
  { key: "meta_description",  label: "HTML meta description",        limit: 155 },
  { key: "app_store_subtitle",label: "Directory / listing subtitle",  limit: 100 },
];

const sentences = (s) => String(s).split(/(?<=\.)\s+/).filter(Boolean);

/** Trim to a limit on a sentence boundary where possible, never mid-word. */
export function fit(text, limit) {
  const t = String(text).trim();
  if (t.length <= limit) return t;
  let out = "";
  for (const s of sentences(t)) {
    if ((out + " " + s).trim().length > limit) break;
    out = (out + " " + s).trim();
  }
  if (out) return out;
  return t.slice(0, limit - 1).replace(/\s+\S*$/, "") + "…";
}

/**
 * Long form = canonical sentence, then differentiator, then proof, then audience.
 * The canonical sentence leads on every surface: a retriever that grabs only the
 * opening of any one profile still gets the same claim about the same entity.
 */
export function longForm(cfg) {
  const p = cfg.positioning;
  const metrics = (cfg.proof?.metrics || [])
    .filter((m) => m.value && m.label)
    .map((m) => `${m.value} ${m.label}`)
    .join(", ");
  return [
    p.oneLiner,
    p.differentiator,
    metrics ? `As of ${cfg.proof.metrics[0].asOf || "today"}: ${metrics}.` : "",
    p.audience ? `Built for ${p.audience}.` : "",
    p.geo?.primary ? `Based in ${p.geo.primary}${p.geo.servesGlobally ? ", working globally" : ""}.` : "",
  ].filter(Boolean).join(" ");
}

export function bios(cfg) {
  const long = longForm(cfg);
  const short = cfg.positioning.oneLiner;
  return SURFACES.map((s) => {
    const source = s.limit >= 280 ? long : short;
    const value = fit(source, s.limit);
    return { ...s, value, used: value.length };
  });
}
