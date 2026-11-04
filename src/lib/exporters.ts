import type { Issue, Seo } from './types';

// Turn the raw SEO object into code people can paste into a project.

type Json = string | number | boolean | null | undefined | Json[] | { [k: string]: Json };

const all = (v: string | string[] | undefined): string[] => (v === undefined ? [] : ([] as string[]).concat(v));

/** Drop null / '' / empty arrays / empty objects, recursively. */
export function clean<T>(value: T): T | undefined {
  if (Array.isArray(value)) {
    const arr = value.map(clean).filter((v) => v !== undefined);
    return (arr.length ? arr : undefined) as T | undefined;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const c = clean(v);
      if (c !== undefined) out[k] = c;
    }
    return (Object.keys(out).length ? out : undefined) as T | undefined;
  }
  if (value === null || value === '') return undefined;
  return value;
}

/** Object literal printer: bare keys when valid identifiers, single-quoted strings. */
function toTs(value: unknown, indent = 0): string {
  const pad = '  '.repeat(indent);
  const padIn = '  '.repeat(indent + 1);
  if (Array.isArray(value)) {
    if (!value.length) return '[]';
    return `[\n${value.map((v) => padIn + toTs(v, indent + 1)).join(',\n')},\n${pad}]`;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (!entries.length) return '{}';
    const body = entries
      .map(([k, v]) => `${padIn}${/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${toTs(v, indent + 1)}`)
      .join(',\n');
    return `{\n${body},\n${pad}}`;
  }
  if (typeof value === 'string') return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
  return JSON.stringify(value) ?? 'undefined';
}

/** The SEO fields a project actually needs (no page stats). */
export function seoPayload(seo: Seo) {
  return (
    clean({
      title: seo.title,
      description: seo.description,
      keywords: seo.keywords,
      author: seo.author,
      robots: seo.robots,
      canonical: seo.canonical,
      lang: seo.lang,
      themeColor: seo.themeColor,
      openGraph: seo.openGraph,
      twitter: seo.twitter,
      hreflang: seo.hreflang,
      icons: seo.icons,
      jsonLd: seo.jsonLd as Json[],
    }) ?? {}
  );
}

export const toJSON = (seo: Seo) => JSON.stringify(seoPayload(seo), null, 2) + '\n';

export const toTypeScript = (seo: Seo) =>
  [`// SEO extracted from ${seo.url}`, `export const seo = ${toTs(seoPayload(seo))} as const;`, '', 'export type Seo = typeof seo;', ''].join(
    '\n'
  );

/** Human-readable SEO report in Markdown (docs, tickets, notes, AI prompts). */
export function toMarkdownReport(seo: Seo) {
  const cell = (v: string | null | undefined) => (v ? v.replace(/\|/g, '\\|').replace(/\n/g, ' ') : '_missing_');
  const lines = [
    `# SEO report: ${seo.title || seo.url}`,
    '',
    `Source: <${seo.url}>`,
    '',
    '## Meta',
    '',
    '| Field | Value |',
    '| --- | --- |',
    `| Title (${seo.title?.length ?? 0} chars) | ${cell(seo.title)} |`,
    `| Description (${seo.description?.length ?? 0} chars) | ${cell(seo.description)} |`,
    `| Canonical | ${cell(seo.canonical)} |`,
    `| Robots | ${cell(seo.robots)} |`,
    `| Language | ${cell(seo.lang)} |`,
    `| Keywords | ${cell(seo.keywords)} |`,
    `| Author | ${cell(seo.author)} |`,
  ];
  const group = (title: string, g: Record<string, string | string[]>) => {
    const entries = Object.entries(g);
    if (!entries.length) return;
    lines.push('', `## ${title}`, '', '| Tag | Content |', '| --- | --- |');
    entries.forEach(([k, v]) => all(v).forEach((c) => lines.push(`| \`${k}\` | ${cell(c)} |`)));
  };
  group('Open Graph', seo.openGraph);
  group('Twitter', seo.twitter);
  const issues = audit(seo);
  if (issues.length) {
    lines.push('', '## Checks', '');
    issues.forEach((i) => lines.push(`- **${i.level}**: ${i.msg}`));
  }
  if (seo.headings.length) {
    lines.push('', '## Headings', '');
    seo.headings.slice(0, 100).forEach((h) => lines.push(`${'  '.repeat(h.level - 1)}- H${h.level}: ${h.text}`));
  }
  const s = seo.stats;
  lines.push(
    '',
    '## Stats',
    '',
    `- Words: ${s.wordCount}`,
    `- Images: ${s.images} (${s.imagesMissingAlt} without alt)`,
    `- Links: ${s.internalLinks} internal, ${s.externalLinks} external, ${s.nofollowLinks} nofollow`
  );
  if (seo.jsonLd.length) lines.push('', '## JSON-LD', '', '```json', JSON.stringify(seo.jsonLd, null, 2), '```');
  return lines.join('\n') + '\n';
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** Plain <head> tags, for static sites or any framework. */
export function toHtmlTags(seo: Seo) {
  const out: string[] = [];
  const meta = (name: string, content: string | null | undefined) =>
    content && out.push(`<meta name="${esc(name)}" content="${esc(content)}" />`);
  if (seo.title) out.push(`<title>${esc(seo.title)}</title>`);
  meta('description', seo.description);
  meta('keywords', seo.keywords);
  meta('author', seo.author);
  meta('robots', seo.robots);
  meta('theme-color', seo.themeColor);
  if (seo.canonical) out.push(`<link rel="canonical" href="${esc(seo.canonical)}" />`);
  seo.hreflang.forEach((h) => out.push(`<link rel="alternate" hreflang="${esc(h.hreflang)}" href="${esc(h.href)}" />`));
  Object.entries(seo.openGraph).forEach(([k, v]) =>
    all(v).forEach((c) => out.push(`<meta property="${esc(k)}" content="${esc(c)}" />`))
  );
  Object.entries(seo.twitter).forEach(([k, v]) => all(v).forEach((c) => meta(k, c)));
  seo.icons.forEach((i) =>
    out.push(
      `<link rel="${esc(i.rel)}" href="${esc(i.href)}"${i.sizes ? ` sizes="${esc(i.sizes)}"` : ''}${i.type ? ` type="${esc(i.type)}"` : ''} />`
    )
  );
  seo.jsonLd.forEach((j) =>
    out.push(`<script type="application/ld+json">\n${JSON.stringify(j, null, 2).replace(/</g, '\\u003c')}\n</script>`)
  );
  return out.join('\n') + '\n';
}

/** Quick health checks. */
export function audit(seo: Seo): Issue[] {
  const issues: Issue[] = [];
  const add = (level: Issue['level'], msg: string) => issues.push({ level, msg });
  const tl = seo.title?.length ?? 0;
  const dl = seo.description?.length ?? 0;
  if (!tl) add('error', 'Missing <title>');
  else if (tl < 30 || tl > 60) add('warn', `Title is ${tl} characters (aim for 30–60)`);
  if (!dl) add('error', 'Missing meta description');
  else if (dl < 70 || dl > 160) add('warn', `Description is ${dl} characters (aim for 70–160)`);
  if (!seo.canonical) add('warn', 'No canonical URL');
  if (seo.stats.h1Count === 0) add('error', 'No <h1> on the page');
  if (seo.stats.h1Count > 1) add('warn', `${seo.stats.h1Count} <h1> tags (one is usually best)`);
  if (!seo.lang) add('warn', 'No lang attribute on <html>');
  if (!Object.keys(seo.openGraph).length) add('warn', 'No Open Graph tags');
  else if (!seo.openGraph['og:image']) add('warn', 'No og:image');
  if (!Object.keys(seo.twitter).length) add('info', 'No Twitter card tags');
  if (seo.stats.imagesMissingAlt) add('warn', `${seo.stats.imagesMissingAlt} image(s) without alt text`);
  if (/noindex/i.test(seo.robots ?? '')) add('warn', 'Page is set to noindex');
  if (!seo.jsonLd.length) add('info', 'No JSON-LD structured data');
  return issues;
}
