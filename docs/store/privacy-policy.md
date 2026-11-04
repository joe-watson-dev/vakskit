# VaksKit Privacy Policy

_Last updated: November 4, 2026_

VaksKit is a Chrome extension made by VAKAKS (https://joedev.vakaks.com/). This policy explains what VaksKit does with data. In short: **VaksKit doesn't collect, store on any server, sell or share your data.** It has no server, no account, no analytics and no tracking.

## What VaksKit reads

When you click **Analyze** (or turn on **Auto-analyze**), VaksKit reads the web page in your current tab: its title, meta tags, structured data, headings, links, images, main text content and fonts. It uses this to show the SEO report, the exports, the Markdown and the fonts in the side panel.

This happens entirely in your browser. The page content is never sent to VAKAKS or to anyone else, and it's discarded when you close the side panel or analyze another page.

## Network requests

VaksKit doesn't send data to any VAKAKS server. It makes only these requests, all directly from your browser:

- **The analyzed website's public files**: `/llms.txt`, `/llms-full.txt`, `/robots.txt` and `/sitemap.xml` on the site you're analyzing, to show whether they exist. These requests are sent without your cookies.
- **Font previews**: to show the fonts a page uses, VaksKit may load those font files from the analyzed website or from Google Fonts (fonts.googleapis.com and fonts.gstatic.com). Like any web font, this request lets that server see your IP address and the font name. No other data is sent.

## What VaksKit stores

Only your preferences, stored locally on your device:

- **Settings**: main-content-only reading and auto-analyze, in Chrome's extension storage.
- **Theme**: light, dark or system.

You can clear them at any time by removing the extension.

## Permissions

- **Side panel**: shows VaksKit's interface next to the page.
- **Scripting**: reads the current page when you ask for an analysis.
- **Storage**: saves your preferences on your device.
- **Access to websites (optional)**: requested only when you first click Analyze, so VaksKit can read the pages you choose. You can revoke it at any time in `chrome://extensions`.

## Copying and downloads

When you copy or download a result, VaksKit writes it to your clipboard or saves a file on your device. Nothing is uploaded.

## Children

VaksKit isn't directed at children and doesn't knowingly collect any personal information.

## Changes

If this policy changes, the new version will be published at this address with a new date. If VaksKit ever starts collecting data, for example for future AI features, this policy will be updated before that happens.

## Contact

Questions about this policy: [your contact email], or through https://joedev.vakaks.com/.
