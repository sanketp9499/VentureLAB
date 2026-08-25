/**
 * Emits one JSON-LD @graph, not a pile of disconnected blocks.
 *
 * The point of the graph form is @id. Stable @id URIs plus sameAs are what let a
 * knowledge-graph builder decide that the Organization on your homepage, the
 * company on LinkedIn and the profile on Crunchbase are ONE node. Disconnected
 * snippets with no @id produce three weakly-linked nodes and a model that hedges.
 */

const ID = {
  org: (site) => `${site}/#organization`,
  website: (site) => `${site}/#website`,
  person: (site, name) => `${site}/#person-${slug(name)}`,
  offer: (site, name) => `${site}/#offering-${slug(name)}`,
  faq: (site) => `${site}/#faq`,
};

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) =>
  v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)));

export function organization(cfg) {
  const { identity: id, positioning: p } = cfg;
  return clean({
    "@type": id.type || "Organization",
    "@id": ID.org(cfg.site),
    name: id.name,
    alternateName: id.alternateNames,
    legalName: id.legalName,
    url: cfg.site,
    logo: id.logo,
    email: id.email,
    foundingDate: id.foundingDate,
    // The canonical sentence, byte-identical to every bio elsewhere.
    description: p.oneLiner,
    slogan: p.differentiator,
    // knowsAbout is the single most under-used property for topical association.
    knowsAbout: p.knowsAbout,
    areaServed: p.geo?.servesGlobally ? "Worldwide" : p.geo?.primary,
    address: p.geo?.primary ? { "@type": "PostalAddress", addressLocality: p.geo.primary } : undefined,
    sameAs: cfg.sameAs,
    founder: (cfg.people || []).map((x) => ({ "@id": ID.person(cfg.site, x.name) })),
    award: (cfg.proof?.awards || []).map((a) => (typeof a === "string" ? a : a.title)),
    subjectOf: (cfg.proof?.pressMentions || [])
      .filter((m) => m.url?.startsWith("http"))
      .map((m) => clean({ "@type": "NewsArticle", headline: m.title, url: m.url, datePublished: m.date,
        publisher: m.publisher ? { "@type": "Organization", name: m.publisher } : undefined })),
  });
}

export function website(cfg) {
  return clean({
    "@type": "WebSite",
    "@id": ID.website(cfg.site),
    url: cfg.site,
    name: cfg.identity.name,
    description: cfg.positioning.oneLiner,
    publisher: { "@id": ID.org(cfg.site) },
    inLanguage: "en",
  });
}

export function people(cfg) {
  return (cfg.people || []).map((x) => clean({
    "@type": "Person",
    "@id": ID.person(cfg.site, x.name),
    name: x.name,
    jobTitle: x.role,
    description: x.bio,
    worksFor: { "@id": ID.org(cfg.site) },
    sameAs: (x.sameAs || []).filter((u) => u?.startsWith("http")),
  }));
}

export function offerings(cfg) {
  return (cfg.offerings || []).map((o) => clean({
    "@type": o.type === "Product" ? "Product" : o.type === "SoftwareApplication" ? "SoftwareApplication" : "Service",
    "@id": ID.offer(cfg.site, o.name),
    name: o.name,
    description: o.description,
    url: o.url,
    provider: { "@id": ID.org(cfg.site) },
    audience: o.audience ? { "@type": "Audience", audienceType: o.audience } : undefined,
    offers: o.pricingModel ? { "@type": "Offer", description: o.pricingModel } : undefined,
  }));
}

export function faqPage(cfg) {
  const faqs = (cfg.faqs || []).filter((f) => f.q && f.a);
  if (!faqs.length) return null;
  return {
    "@type": "FAQPage",
    "@id": ID.faq(cfg.site),
    about: { "@id": ID.org(cfg.site) },
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function graph(cfg) {
  const nodes = [organization(cfg), website(cfg), ...people(cfg), ...offerings(cfg), faqPage(cfg)].filter(Boolean);
  return { "@context": "https://schema.org", "@graph": nodes };
}

export const scriptTag = (cfg) =>
  `<script type="application/ld+json">\n${JSON.stringify(graph(cfg), null, 2)}\n</script>`;
