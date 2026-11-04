import DOMPurify from 'dompurify';
import { marked } from 'marked';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import type { Seo } from './types';
import { cleanUrl } from './url';
import { currentTheme } from './theme';

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '_',
});
turndown.use(gfm);
turndown.remove(['script', 'style']);

const yaml = (s: string) => JSON.stringify(s); // JSON strings are valid YAML scalars

/**
 * Page HTML snapshot -> Markdown. Page info goes in YAML front-matter
 * (read by static-site generators, CMSs and LLM pipelines) so the body
 * keeps the page's own heading structure.
 */
export function htmlToMarkdown(html: string, seo: Seo) {
  const body = turndown
    .turndown(html)
    .replace(/^(\s*)([-*+]|\d+\.)\s{2,}/gm, '$1$2 ') // "-   item" -> "- item"
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  const front = ['---', `title: ${yaml(seo.title || seo.url)}`];
  if (seo.description) front.push(`description: ${yaml(seo.description)}`);
  front.push(`source: ${yaml(cleanUrl(seo.url))}`);
  if (seo.lang) front.push(`lang: ${yaml(seo.lang)}`);
  front.push('---', '');
  // No <h1> in the extracted content: add the title so the document has one.
  const heading = /^# /m.test(body) ? '' : `# ${seo.title || seo.url}\n\n`;
  return front.join('\n') + '\n' + heading + body + '\n';
}

/** Markdown -> HTML (GitHub flavored), sanitized. Front-matter is skipped. */
export function markdownToHtml(md: string) {
  const content = md.replace(/^---\n[\s\S]*?\n---\n/, '');
  const raw = marked.parse(content, { gfm: true, async: false }) as string;
  return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
}

/**
 * Wrap a fragment in a full standalone HTML document.
 * theme 'auto' (downloads) follows the reader's system setting;
 * 'light' / 'dark' (in-app previews) match PageKit's current theme.
 */
export function htmlDocument(body: string, title = 'Document', theme: 'auto' | 'light' | 'dark' = 'auto') {
  const dark = `--fg:#e6edf3;--bg:#0d1117;--muted:#9198a1;--line:#3d444d;--code:#151b23;--link:#4493f8;color-scheme:dark;`;
  return `<!doctype html>
<html lang="en"${theme === 'auto' ? '' : ` class="${theme}"`}>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title.replace(/</g, '&lt;')}</title>
<style>
  :root { --fg:#1f2328; --bg:#ffffff; --muted:#59636e; --line:#d0d7de; --code:#f6f8fa; --link:#0969da; color-scheme: light; }
  @media (prefers-color-scheme: dark) { :root:not(.light) { ${dark} } }
  :root.dark { ${dark} }
  body { max-width: 760px; margin: 1.5rem auto; padding: 0 1rem; font: clamp(14px, 13px + 0.4vw, 17px)/1.65 system-ui, sans-serif; color: var(--fg); background: var(--bg); }
  h1 { font-size: 1.7em; line-height: 1.25; } h2 { font-size: 1.35em; } h3 { font-size: 1.15em; }
  a { color: var(--link); }
  img { max-width: 100%; height: auto; }
  pre { background: var(--code); padding: 1rem; border-radius: 8px; overflow: auto; }
  code { font-family: ui-monospace, Menlo, monospace; font-size: .9em; }
  :not(pre) > code { background: var(--code); padding: .1em .35em; border-radius: 4px; }
  table { border-collapse: collapse; display: block; overflow-x: auto; } th, td { border: 1px solid var(--line); padding: .4rem .7rem; }
  blockquote { margin: 0; padding-left: 1rem; border-left: 4px solid var(--line); color: var(--muted); }
  hr { border: 0; border-top: 1px solid var(--line); }
</style>
</head>
<body>
${body}
</body>
</html>
`;
}

/** Preview version: matches PageKit's theme, and links open in a new tab. */
export const previewDocument = (html: string, title = 'Preview') =>
  htmlDocument(html, title, currentTheme()).replace('<head>', '<head><base target="_blank" />');
