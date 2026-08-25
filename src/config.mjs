import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export function loadConfig(path = join(ROOT, "entity.config.json")) {
  const cfg = JSON.parse(readFileSync(path, "utf8"));
  return withDerived(cfg);
}

/** Fill {Name} style tokens and expose a few shorthands used everywhere. */
function withDerived(cfg) {
  const name = cfg.identity.name;
  const expand = (s) =>
    typeof s === "string"
      ? s
          .replaceAll("{Name}", name)
          .replaceAll("{category}", cfg.positioning.category)
          .replaceAll("{audience}", cfg.positioning.audience)
          .replaceAll("{outcome}", cfg.positioning.outcome)
      : s;

  const walk = (v) =>
    Array.isArray(v) ? v.map(walk)
    : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]))
    : expand(v);

  const out = walk(cfg);
  out.site = String(out.identity.url).replace(/\/$/, "");
  out.sameAs = Object.values(out.profiles || {}).filter((u) => typeof u === "string" && u.startsWith("http"));
  return out;
}

export const isPlaceholder = (v) => typeof v === "string" && /(^|\s)TODO[:\s]|TODO-your-domain|\/TODO\b|TODO$/.test(v);

/** Depth-first list of [dottedPath, value] for every string leaf. */
export function leaves(obj, prefix = "") {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    if (k === "$comment") continue;
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") out.push(...leaves(v, p));
    else if (typeof v === "string") out.push([p, v]);
  }
  return out;
}
