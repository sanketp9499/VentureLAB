/**
 * Two different decisions, routinely confused into one:
 *
 *   RETRIEVAL bots fetch a page to answer a question being asked right now.
 *     Block one and you are removed from that surface's answers, immediately.
 *   TRAINING bots collect corpora for future model weights.
 *     Block one and nothing changes today; you affect a model years out.
 *
 * A default CDN "block AI bots" toggle blocks both. That single switch is the most
 * common reason a brand with good content is absent from AI answers. Check it first.
 *
 * User-agent strings change. Verify against each vendor's published docs before
 * treating this table as current.
 */
export const CRAWLERS = [
  { ua: "OAI-SearchBot",   vendor: "OpenAI",     purpose: "retrieval",  note: "Indexes for ChatGPT search results/citations." },
  { ua: "ChatGPT-User",    vendor: "OpenAI",     purpose: "retrieval",  note: "Fetches a page because a user's question needs it." },
  { ua: "GPTBot",          vendor: "OpenAI",     purpose: "training",   note: "Model training corpus." },
  { ua: "Claude-User",     vendor: "Anthropic",  purpose: "retrieval",  note: "User-initiated fetch during a conversation." },
  { ua: "Claude-SearchBot",vendor: "Anthropic",  purpose: "retrieval",  note: "Search indexing to support answers." },
  { ua: "ClaudeBot",       vendor: "Anthropic",  purpose: "training",   note: "Crawler for model development." },
  { ua: "PerplexityBot",   vendor: "Perplexity", purpose: "retrieval",  note: "Builds the index Perplexity cites from." },
  { ua: "Perplexity-User", vendor: "Perplexity", purpose: "retrieval",  note: "User-initiated fetch." },
  { ua: "Google-Extended", vendor: "Google",     purpose: "both",       note: "Not a crawler — a token that controls Gemini grounding and training use." },
  { ua: "Googlebot",       vendor: "Google",     purpose: "index",      note: "Underpins AI Overviews. Blocking it removes you from both." },
  { ua: "Bingbot",         vendor: "Microsoft",  purpose: "index",      note: "Backs Copilot and several third-party assistants." },
  { ua: "Applebot-Extended", vendor: "Apple",    purpose: "training",   note: "Opt-out token for Apple Intelligence training." },
  { ua: "meta-externalagent", vendor: "Meta",    purpose: "both",       note: "Meta AI crawling." },
  { ua: "Amazonbot",       vendor: "Amazon",     purpose: "both",       note: "Alexa / Rufus answers." },
  { ua: "DuckAssistBot",   vendor: "DuckDuckGo", purpose: "retrieval",  note: "DuckAssist answers." },
  { ua: "CCBot",           vendor: "Common Crawl", purpose: "training", note: "Feeds many downstream training sets." },
  { ua: "Bytespider",      vendor: "ByteDance",  purpose: "training",   note: "Aggressive crawler; rate-limit rather than block if unsure." },
  { ua: "cohere-ai",       vendor: "Cohere",     purpose: "both",       note: "" },
  { ua: "YouBot",          vendor: "You.com",    purpose: "retrieval",  note: "" },
];

export function robotsTxt(cfg) {
  const pol = cfg.crawlerPolicy || {};
  const allow = (c) =>
    c.purpose === "index" ? pol.allowSearchIndex !== false
    : c.purpose === "training" ? pol.allowTraining !== false
    : c.purpose === "retrieval" ? pol.allowRetrieval !== false
    : pol.allowTraining !== false && pol.allowRetrieval !== false;

  const L = [
    `# robots.txt for ${cfg.identity.name}`,
    `# Generated from entity.config.json — edit crawlerPolicy there, not here.`,
    `# retrieval = affects whether you appear in answers today.`,
    `# training  = affects future model weights only.`,
    "",
  ];
  for (const c of CRAWLERS) {
    L.push(`# ${c.vendor} · ${c.purpose}${c.note ? " · " + c.note : ""}`);
    L.push(`User-agent: ${c.ua}`);
    L.push(allow(c) ? "Allow: /" : "Disallow: /");
    L.push("");
  }
  L.push("User-agent: *", "Allow: /", "");
  L.push(`Sitemap: ${cfg.site}/sitemap.xml`);
  L.push(`# Entity map for agents: ${cfg.site}/llms.txt`);
  return L.join("\n") + "\n";
}
