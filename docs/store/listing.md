# Chrome Web Store listing: VaksKit

Copy each block into the matching field of the Developer Dashboard.

---

## Store listing tab

### Name (from the manifest)

```
VaksKit
```

### Summary (from the manifest, 132 characters max)

```
Your toolkit for understanding any web page: SEO, content, fonts and more.
```

### Description

```
VaksKit is a side-panel toolkit for developers, designers, marketers and content writers. Open it on any website and see the page the way search engines and AI tools read it, then copy the results straight into your own project.

SEO REPORT
• A 0–100 health score with clear, actionable checks: title and description length, H1, canonical URL, Open Graph and Twitter cards, image alt text, structured data
• A Google-style search result preview
• Headings outline, link and image statistics

EXPORT SEO TO YOUR PROJECT
• JSON: drop the page's SEO into any config, CMS or script
• TypeScript: a typed SEO object, ready to import
• HTML <head> tags: title, meta, Open Graph and Twitter tags in one copy
• Markdown report: share an audit with your team or client
Framework-agnostic: works with any stack.

PAGE → MARKDOWN
• Turns the main content of any page into clean, GitHub-flavored Markdown with front matter (title, description, source, language)
• Skips menus, headers, footers and ads
• Raw view or rendered preview, copy or download as .md
• Ideal for documentation, notes, knowledge bases and AI prompts

FONTS & TYPE SCALE
• See which fonts the page really renders with, and where each one is used: headings, paragraphs, links, buttons, code
• Where each font comes from: Google Fonts, Adobe Fonts, Next.js, self-hosted or system
• Copy-ready CSS: how to load each font and the page's full type scale

AI & CRAWLER FILES
• Checks the site for llms.txt, llms-full.txt, robots.txt and sitemap.xml
• View, copy or download each one

MARKDOWN → HTML
• Paste Markdown, preview the result, copy clean HTML or download a standalone .html file

DESIGNED TO STAY OUT OF YOUR WAY
• Lives in Chrome's side panel and follows you from tab to tab
• Optional auto-analyze when you switch pages
• Light, dark and system themes

PRIVATE BY DESIGN
• Everything runs in your browser. VaksKit has no server, no account, no tracking and no analytics.
• Access to websites is only requested when you first click Analyze.

Made by VAKAKS: https://joedev.vakaks.com/
```

### Category

```
Developer Tools
```

### Language

```
English
```

### Graphic assets

| Asset | Size | File |
| --- | --- | --- |
| Store icon | 128×128 PNG | `public/icons/icon128.png` |
| Screenshots (5) | 1280×800 JPEG | `docs/store/images/1-…` to `5-…` (upload in that order) |
| Small promo tile | 440×280 JPEG | `docs/store/images/promo-tile-440x280.jpg` |
| Marquee promo tile (optional) | 1400×560 | optional |
| Promo video (optional) | YouTube link | upload `vakskit-tablet-1920x1440.mp4` to YouTube |

### Additional fields

| Field | Value |
| --- | --- |
| Official URL | none (needs a site verified in Google Search Console), leave empty |
| Homepage URL | `https://joedev.vakaks.com/` |
| Support URL | `https://github.com/joe-watson-dev/vakskit/issues` (only if the repo is public), otherwise your contact page |
| Mature content | No |

---

## Privacy practices tab

### Single purpose description

```
VaksKit analyzes the web page the user is viewing and turns it into reusable results: an SEO report and SEO exports (JSON, TypeScript, HTML tags), the page's content as Markdown, and the fonts the page uses. It also converts Markdown to HTML.
```

### Permission justifications

**sidePanel**
```
VaksKit's entire interface is displayed in Chrome's side panel, so it stays open next to the page the user is analyzing.
```

**scripting**
```
When the user clicks Analyze (or turns on auto-analyze), VaksKit runs a script in the current tab to read the page's metadata, headings, links, images, main content and fonts. The result is shown only in the side panel; nothing is sent anywhere.
```

**storage**
```
Saves the user's preferences (main-content-only reading and auto-analyze) locally on the device.
```

**Host permission (optional, all sites)**
```
Users analyze whatever website they choose, so VaksKit needs to be able to read any page. This permission is optional: it is requested only when the user first clicks Analyze, and can be revoked at any time. It is also used to read the analyzed site's public llms.txt, robots.txt and sitemap.xml files.
```

### Remote code

```
No, I am not using remote code.
```
(All JavaScript, including the Defuddle content-extraction library, is bundled in the package.)

### Data usage

Leave every data type **unchecked**. VaksKit doesn't collect or transmit user data. It reads the page you're on and shows the results in the panel, on your device only.

Tick all three certifications:
- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

### Privacy policy URL

Served by Vercel from the `site/` folder (`site/privacy/index.html`):

```
https://<your-vercel-domain>/privacy
```

---

## Distribution tab

| Field | Value |
| --- | --- |
| Payments | Free of charge |
| Visibility | Public (or Unlisted for a first test) |
| Regions | All regions |

---

## Test instructions tab (for the reviewer)

```
No account or login is needed.
1. Open any website (for example https://developer.chrome.com).
2. Click the VaksKit icon in the toolbar to open the side panel.
3. Click "Analyze this page" and allow site access when Chrome asks.
4. Explore the SEO report, "Export SEO" (JSON / TypeScript / HTML tags), "Page as Markdown" and "Fonts & type scale".
5. "Markdown → HTML" works without analyzing a page.
```
