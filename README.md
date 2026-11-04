<div align="center">

<img src="public/icons/icon128.png" alt="VaksKit logo" width="96" height="96" />

# VaksKit

**Understand any web page: SEO, content and fonts, from Chrome's side panel.**

[![Chrome MV3](https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
[![Version](https://img.shields.io/badge/version-0.1.0-6a4cf5)](public/manifest.json)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![pnpm](https://img.shields.io/badge/pnpm-required-F69220?logo=pnpm&logoColor=white)](https://pnpm.io)

[Features](#features) · [Getting started](#getting-started) · [How it works](#how-it-works) · [Project structure](#project-structure) · [Contributing](#contributing)

</div>

---

VaksKit lives in Chrome's side panel, reads the page you're on, and gives you results you can copy straight into a project: SEO as JSON or TypeScript, the page as clean Markdown, the fonts and how to use them.

> Made by [VAKAKS](https://joedev.vakaks.com/)

<a id="features"></a>

## ✨ Features

| Feature | What you get |
| --- | --- |
| 📊 **SEO report** | A 0–100 score, a Google-style result preview, checks (title and description length, H1, canonical, Open Graph, image alt text…), a headings outline, link and image stats |
| 📦 **Export SEO** | The page's SEO as **JSON**, **TypeScript**, ready-to-paste **HTML `<head>` tags**, or a **Markdown report**. Framework-agnostic: works in any project |
| 🤖 **AI & crawler files** | Detects `/llms.txt`, `/llms-full.txt`, `/robots.txt` and `/sitemap.xml`, with view, copy and download |
| 📝 **Page → Markdown** | The page's main content as clean GitHub-flavored Markdown with YAML front matter. Raw or preview, copy or download `.md` |
| 🔤 **Fonts & type scale** | Which fonts the page really renders with, where each is used (H1, paragraph, buttons…), where they come from (Google Fonts, Adobe, Next.js, self-hosted, system) and copy-ready CSS to use them |
| 🌐 **Markdown → HTML** | Paste Markdown, preview it, copy the HTML or download a standalone `.html` file |

Also: light, dark and system themes; auto-analyze when you change tabs; and a scan overlay on the page while it's being read.

<a id="getting-started"></a>

## 🚀 Getting started

**Requirements:** Node 20+, [pnpm](https://pnpm.io/) (this repo uses pnpm, not npm), and Chrome 116+.

```bash
git clone https://github.com/joe-watson-dev/vakskit.git
cd vakskit
pnpm install
pnpm build
```

Load the extension:

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and choose the `dist/` folder.
3. Pin VaksKit and click its icon to open the side panel, then **Analyze**. Chrome asks once for permission to read pages.

### 🔁 Development loop

```bash
pnpm dev
```

This rebuilds `dist/` on every change. Then click the reload icon on the VaksKit card in `chrome://extensions` and reopen the side panel. There's no hot reload: Chrome extensions need that reload.

To debug, right-click inside the side panel → **Inspect** (panel UI). For the service worker, use the **service worker** link on the extension card.

## 📜 Scripts

| Script | What it does |
| --- | --- |
| `pnpm build` | Type-check (`tsc`) and build the extension into `dist/` |
| `pnpm dev` | Rebuild `dist/` on every file change |
| `pnpm lint` | ESLint (no warnings allowed) |
| `pnpm zip` | Build and pack `vakskit.zip` for the Chrome Web Store |
| `pnpm icons` | Regenerate `public/icons/*.png` from `scripts/make-icons.mjs` |

<a id="how-it-works"></a>

## ⚙️ How it works

```
toolbar icon ─► background.ts opens the side panel
                       │
side panel (React) ────┤  chrome.scripting.executeScript
                       ▼
              the inspected page
              ├─ vendor/defuddle.js   finds the main content
              ├─ extractPage()        meta tags, JSON-LD, headings, links, images, cleaned HTML
              ├─ extractFonts()       fonts in use, per role, and where they come from
              └─ showScanOverlay()    the visual scan while reading
                       │  returns plain data
                       ▼
side panel ─ markdown.ts   HTML → Markdown (turndown + GFM), Markdown → HTML (marked + DOMPurify)
             exporters.ts  SEO → JSON / TypeScript / HTML tags / Markdown report
             score.ts      checks → score
             fonts.ts      fonts → import snippets and CSS
```

> [!IMPORTANT]
> Things to know before changing the code:

- **Injected functions must be self-contained.** `extractPage`, `extractFonts` and `showScanOverlay` run inside the page. Chrome serializes them with `toString()`, so they can't import anything or use variables from outside the function.
- **Site access is optional.** `<all_urls>` is an optional host permission, requested on the first Analyze click (it needs a user gesture), not at install.
- **Page content is untrusted.** Previews render in a sandboxed iframe (no scripts, links open in a new tab). Markdown is HTML-escaped before it's highlighted. For fonts, only Google Fonts URLs rebuilt from the family name are loaded, never a stylesheet URL taken from the page.
- **Defuddle** is copied as-is from `node_modules/defuddle/dist/index.full.js` to `dist/vendor/defuddle.js` by a small Vite plugin (`vite.config.ts`).
- **Settings** (`mainOnly`, `auto`) are kept in `chrome.storage.local`. The theme is kept in `localStorage` under `vakskit-theme`, and `public/theme-init.js` applies it before first paint to avoid a flash.

<a id="project-structure"></a>

## 🗂️ Project structure

```
public/
  manifest.json        MV3 manifest (side panel, scripting, storage)
  theme-init.js        applies the theme before React loads
  icons/               toolbar and store icons
sidepanel.html         side panel entry
src/
  background.ts        service worker: opens the panel on icon click
  index.css            design tokens (light and dark) and every component style
  sidepanel/
    App.tsx            screens, analyze flow, header, menu, toast, credit
    Home.tsx           site line, score and Markdown tiles, feature rows
    SeoScreen.tsx      SEO report
    ExportScreen.tsx   JSON / TypeScript / HTML tags / Report
    MarkdownScreen.tsx page as Markdown (raw / preview)
    FontsScreen.tsx    fonts and type scale
    ConvertScreen.tsx  Markdown → HTML
    Menu.tsx           ··· menu (theme, settings, clear)
  components/          icons, site favicon
  lib/
    chrome.ts          tab lookup, permissions, analyzeTab()
    extract.ts         runs in the page: SEO + cleaned HTML
    fonts-extract.ts   runs in the page: fonts per role
    overlay.ts         runs in the page: scan animation
    markdown.ts        page → Markdown, Markdown → HTML, preview documents
    mdsource.ts        raw Markdown highlighting (escaped)
    exporters.ts       JSON / TS / HTML / report output
    fonts.ts           font snippets and CSS
    score.ts           SEO score
    theme.ts           theme hook
    url.ts             tracking-parameter cleanup, host names
    files.ts           copy and download helpers
    types.ts           shared types
docs/
  ROADMAP.md           what's next
  ui-prototype.html    the approved UI mockup
```

## 🎨 Design

The UI follows `docs/ui-prototype.html`. Please keep to it:

- **Violet primary** (`#6a4cf5`) on a soft violet-to-white gradient. Dark mode is near-black and neutral (no navy).
- **White floating cards** with light, soft shadows and no outlines. Avoid boxed, bordered layouts.
- **Compact controls** sized for a side panel. Plus Jakarta Sans for the UI, JetBrains Mono for code (both bundled locally via `@fontsource`).
- **File-type tags** have their own accents: `.json` amber, `.ts` blue, `.md` teal, `.html` orange, `.css` pink. Keep them readable (WCAG AA) in both themes.

All tokens and component styles live in `src/index.css` (plain CSS classes; Tailwind 4 is set up through `@tailwindcss/vite`).

## 🧰 Stack

React 18 · TypeScript · Vite 5 · Chrome Manifest V3 · Defuddle · turndown (+ GFM) · marked · DOMPurify · Tailwind CSS 4

<a id="contributing"></a>

## 🤝 Contributing

1. Branch from `main`.
2. Run `pnpm lint` and `pnpm build` before you push, and test the change by loading `dist/` in Chrome.
3. Open a pull request with a short description and a screenshot for UI changes.

See [docs/ROADMAP.md](docs/ROADMAP.md) for planned features.

---

<div align="center">

Made with care by <a href="https://joedev.vakaks.com/"><b>VAKAKS</b></a>

</div>
