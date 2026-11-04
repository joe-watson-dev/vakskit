# Roadmap

## Done: v0.1, the page toolkit (runs fully in the browser)

- SEO extraction and checks, export as JSON / TypeScript / HTML tags / Markdown report
- llms.txt, llms-full.txt, robots.txt, sitemap.xml detection
- Page → Markdown (preview, raw, copy, download)
- Markdown → HTML (preview, HTML, copy, download)

## Next: v0.2, small wins (still no backend)

- **Generate llms.txt** for the current site from its sitemap and page titles/descriptions. Many sites don't have one yet.
- **Multi-page crawl**: read `sitemap.xml`, analyze N pages, export one JSON/CSV of every page's SEO, flag duplicate titles and descriptions.
- **Batch Markdown export**: same crawl, download a `.zip` of Markdown files (docs migration, LLM knowledge bases).
- **Copy for AI**: one button that copies page Markdown + SEO report as a ready-made prompt.

## Phase 2: competitor research & content advice

The goal: "Here is my site. Who ranks for what I sell, what do they do better, and what should I publish to get organic visibility?"

### User flow

1. **Profile my site**: the user analyzes their own site in VaksKit (already possible). From the pages we pull the product, audience and topic keywords.
2. **Find competitors**: search the web for those keywords and collect the domains that rank organically (ads excluded) again and again.
3. **Compare**: run the same SEO extraction on the competitors' top pages, side by side: titles, descriptions, headings, word count, structured data, llms.txt, and the topics they cover that we don't.
4. **Advise**: an AI step turns the comparison into a short, prioritized plan:
   - On-page fixes for the user's own pages (titles, descriptions, headings, schema)
   - **Content gaps**: topics competitors rank for and the user doesn't have
   - **Article ideas**: title, target keyword, search intent, outline, internal links
5. **Export** the plan as Markdown / JSON, same as the rest of VaksKit.

### Why it needs a small backend

The extension can read pages, but two parts can't safely live inside it:

| Need | Options | Why not in the extension |
| --- | --- | --- |
| Web search results (who ranks) | Brave Search API, Google Programmable Search, SerpAPI / DataForSEO | API keys would be visible to anyone who installs it |
| Advice and article plans | Claude API | Same: secret key, plus cost and rate control |
| Accounts, saved projects, limits | Supabase / any DB + auth | Paid usage needs users |

Suggested shape: one small API (e.g. a serverless function) with `POST /competitors`, `POST /compare` and `POST /advice`. The extension sends extracted page data; the server calls search + AI and returns structured JSON, which the panel renders and exports.

### Keeping it "organic"

- Only use organic results (skip ads), and weight domains that show up across several keywords.
- Base the advice on what is actually on the pages we extracted, not on guesses.
- Follow Google's guidance (helpful, people-first content; Search Essentials) and say so in the output.

### Open questions

- Free tier vs paid (search APIs and AI calls cost money per request)?
- Which search provider? Price, quotas and terms differ a lot.
- Languages and countries: search results depend on locale.
