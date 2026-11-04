# PageKit: SEO & Markdown for any page

A Chrome extension (Manifest V3, side panel) for developers and content people:

- **SEO**: analyze the current page and get its SEO in a form you can drop into any project: **JSON**, **TypeScript**, **HTML `<head>` tags**, or a **Markdown report**. Includes a Google-style result preview, quick checks (title/description length, H1, canonical, Open Graph, alt text…), headings outline, and link/image stats.
- **AI & crawler files**: checks the site for `/llms.txt`, `/llms-full.txt`, `/robots.txt` and `/sitemap.xml`, with view, copy and download.
- **Page → Markdown**: turns the page (or just its main content) into clean GitHub-flavored Markdown with YAML front-matter. Preview, raw view, copy, download `.md`.
- **Markdown → HTML**: write or paste Markdown, preview the result, copy the HTML or download a standalone `.html` file.

The side panel stays open while you browse. With **Auto-analyze** on, every tab or page you open is analyzed on its own.

- **Home** tab: summary of the current page, quick Copy / Download actions, and a card for every feature.
- **Full view**: the ⤢ button opens PageKit full width in its own tab, bound to that page; the ↗ buttons open a single preview or file in a new tab.
- **Light / Dark / System** theme (System by default), from the sun/moon button.

## Install (development)

```bash
pnpm install
pnpm build
```

Then open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked** and pick the `dist/` folder. Click the PageKit icon to open the side panel, then **Analyze**. Chrome asks once for permission to read pages.

`pnpm dev` rebuilds `dist/` on every change; press the reload icon on the extension card to pick it up.

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm build` | Type-check and build the extension into `dist/` |
| `pnpm dev` | Rebuild on file changes |
| `pnpm zip` | Build and pack `pagekit.zip` for the Chrome Web Store |
| `pnpm icons` | Regenerate `public/icons/*.png` |
| `pnpm lint` | ESLint |

## How it works

```
sidepanel.html ─ React app (src/sidepanel)
  │  chrome.scripting.executeScript(extractPage)
  ▼
page ─ src/lib/extract.ts reads meta tags, JSON-LD, headings, links
       and returns a cleaned HTML snapshot
  │
  ▼
side panel ─ turndown (HTML → Markdown), marked + DOMPurify (Markdown → HTML),
             src/lib/exporters.ts (JSON / TS / HTML / Markdown report)
```

- `extractPage` runs inside the page. Chrome serializes it, so it must stay self-contained (no imports).
- Site access is an **optional** permission requested on the first click, not at install time.
- Previews render in a sandboxed iframe: no scripts run, and links open in a new tab.

## Styling

Tailwind 4, configured in CSS only (`src/index.css`, no `tailwind.config.js`):

- **Colors** are shadcn-style semantic tokens (`bg-background`, `text-muted-foreground`, `border-border`, `bg-primary`…). `.dark` on `<html>` swaps them. `src/lib/theme.ts` manages the choice and `public/theme-init.js` applies it before first paint.
- **Sizes are fluid**: `text-2xs` … `text-lg` and the spacing names `tight`, `pad`, `stack` are `clamp()` values, so the UI scales with the panel width.

## Stack

React 18, TypeScript, Vite, Tailwind CSS 4, turndown (+ GFM plugin), marked, DOMPurify, react-syntax-highlighter.

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md).
