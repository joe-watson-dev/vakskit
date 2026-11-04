import DOMPurify from 'dompurify';
import { marked } from 'marked';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import type { PageResult } from './types';
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
 * Image CDNs and frameworks that proxy the real image through a URL parameter
 * (Next.js /_next/image, Vercel /_vercel/image, Nuxt /_ipx… ). Unwrap them so
 * the Markdown points at the actual image.
 */
function unwrapImageProxies(md: string, pageUrl: string) {
  return md.replace(/\bhttps?:\/\/[^\s)"']*\/_(?:next|vercel)\/image\/?\?[^\s)"']*/g, (proxied) => {
    try {
      const inner = new URL(proxied).searchParams.get('url');
      return inner ? new URL(inner, pageUrl).href : proxied;
    } catch {
      return proxied;
    }
  });
}

/**
 * Carousels and marquees repeat their items so the loop scrolls smoothly.
 * Remove a run of 3+ blocks that immediately repeats itself.
 */
function dropRepeatedRuns(md: string) {
  const blocks = md.split(/\n{2,}/);
  if (blocks.length > 3000) return md;
  for (let i = 0; i < blocks.length; i++) {
    const maxK = Math.min(200, Math.floor((blocks.length - i) / 2));
    for (let k = maxK; k >= 3; k--) {
      let same = true;
      for (let j = 0; j < k && same; j++) same = blocks[i + j] === blocks[i + k + j];
      if (same) {
        blocks.splice(i + k, k);
        k = Math.min(200, Math.floor((blocks.length - i) / 2)) + 1; // check again for a third copy
      }
    }
  }
  return blocks.join('\n\n');
}

/** Tidy converter output: list spacing, blank lines, headings split by <br>. */
function tidy(md: string) {
  return (
    md
      .replace(/^(\s*)([-*+]|\d+\.)\s{2,}/gm, '$1$2 ') // "-   item" -> "- item"
      // "## Don't let your dream\ntrip slip away." (a <br> inside a heading) -> one line
      .replace(/^(#{1,6} [^\n]*?)(?: {2}|\\)?\n(?=[^\n#>\-*\d|`![\s])([^\n]+)/gm, (m, head: string, rest: string) =>
        rest.length < 80 && !/[.!?:]$/.test(head.trim()) ? `${head.trimEnd()} ${rest.trim()}` : m
      )
      // "now.Pay over time" in headings: a <br> or block span lost its space
      .replace(/^#{1,6} .*$/gm, (h) => h.replace(/([a-z0-9][.!?])([A-Z])/g, '$1 $2'))
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

const yamlLine = (key: string, value: string | number | undefined | null) =>
  value === undefined || value === null || value === '' ? null : `${key}: ${typeof value === 'number' ? value : yaml(String(value))}`;

/**
 * Build the Markdown document. Uses Defuddle's Markdown when the page gave it
 * (main content found, headings, code blocks, footnotes standardized), and
 * falls back to Turndown on the HTML snapshot otherwise. Page info goes in
 * YAML front-matter (static-site generators, CMSs and LLM pipelines read it).
 */
export function buildMarkdown(page: PageResult) {
  const { seo } = page;
  const raw = page.markdown?.trim() ? page.markdown : turndown.turndown(page.html);
  const body = tidy(dropRepeatedRuns(unwrapImageProxies(raw, seo.url)));
  const front = [
    '---',
    yamlLine('title', seo.title || seo.url),
    yamlLine('description', seo.description),
    yamlLine('author', page.meta?.author),
    yamlLine('published', page.meta?.published),
    yamlLine('site', page.meta?.site),
    yamlLine('image', page.meta?.image && unwrapImageProxies(page.meta.image, seo.url)),
    yamlLine('source', cleanUrl(seo.url)),
    yamlLine('lang', seo.lang),
    '---',
    '',
  ].filter((l): l is string => l !== null);
  // Defuddle turns the H1 into an H2, or drops it when it looks like the title.
  // Give the document one H1: the page's own main heading, else its title.
  const h1 = page.meta?.h1;
  let doc = body;
  const demoted = h1 ? doc.indexOf(`## ${h1}\n`) : -1;
  if (!/^# /m.test(doc) && demoted !== -1) doc = doc.slice(0, demoted) + doc.slice(demoted + 1); // "## Title" -> "# Title"
  const heading = /^# /m.test(doc) ? '' : `# ${h1 || seo.title || seo.url}\n\n`;
  return front.join('\n') + '\n' + heading + doc + '\n';
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
