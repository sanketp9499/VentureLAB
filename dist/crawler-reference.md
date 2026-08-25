# AI crawler access — ventureLAB

Retrieval crawlers decide whether you can appear in an answer being generated right now.
Training crawlers only affect future model weights. A single "block AI bots" toggle at the
CDN blocks both, and is the most common reason a brand with good content is absent from
AI answers. Verify these user-agent strings against each vendor's published docs — they change.

| user-agent | vendor | purpose | current policy | note |
|---|---|---|---|---|
| `OAI-SearchBot` | OpenAI | retrieval | allowed | Indexes for ChatGPT search results/citations. |
| `ChatGPT-User` | OpenAI | retrieval | allowed | Fetches a page because a user's question needs it. |
| `GPTBot` | OpenAI | training | allowed | Model training corpus. |
| `Claude-User` | Anthropic | retrieval | allowed | User-initiated fetch during a conversation. |
| `Claude-SearchBot` | Anthropic | retrieval | allowed | Search indexing to support answers. |
| `ClaudeBot` | Anthropic | training | allowed | Crawler for model development. |
| `PerplexityBot` | Perplexity | retrieval | allowed | Builds the index Perplexity cites from. |
| `Perplexity-User` | Perplexity | retrieval | allowed | User-initiated fetch. |
| `Google-Extended` | Google | both | allowed | Not a crawler — a token that controls Gemini grounding and training use. |
| `Googlebot` | Google | index | allowed | Underpins AI Overviews. Blocking it removes you from both. |
| `Bingbot` | Microsoft | index | allowed | Backs Copilot and several third-party assistants. |
| `Applebot-Extended` | Apple | training | allowed | Opt-out token for Apple Intelligence training. |
| `meta-externalagent` | Meta | both | allowed | Meta AI crawling. |
| `Amazonbot` | Amazon | both | allowed | Alexa / Rufus answers. |
| `DuckAssistBot` | DuckDuckGo | retrieval | allowed | DuckAssist answers. |
| `CCBot` | Common Crawl | training | allowed | Feeds many downstream training sets. |
| `Bytespider` | ByteDance | training | allowed | Aggressive crawler; rate-limit rather than block if unsure. |
| `cohere-ai` | Cohere | both | allowed |  |
| `YouBot` | You.com | retrieval | allowed |  |

## Check what is actually happening

```bash
curl -sI -A "PerplexityBot" https://www.venturelab.ca/ | head -1
curl -sI -A "OAI-SearchBot" https://www.venturelab.ca/ | head -1
curl -sI -A "ClaudeBot"     https://www.venturelab.ca/ | head -1
```

A 403, a challenge page, or a JS-only shell here means the crawler sees nothing, whatever
robots.txt says. Server-render anything you want quoted.
