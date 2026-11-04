import type { FontsResult } from './types';

type Family = FontsResult['families'][number];
type Role = FontsResult['roles'][number];

export const SOURCE_LABEL: Record<Family['source'], string> = {
  google: 'Google Fonts',
  adobe: 'Adobe Fonts',
  'next-font': 'Self-hosted (Next.js)',
  'self-hosted': 'Self-hosted',
  system: 'System font',
};

const SELECTOR: Record<string, string> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  p: 'p',
  a: 'a',
  button: 'button',
  nav: 'nav a',
  li: 'li',
  input: 'input, textarea, select',
  code: 'code, pre',
};

const genericOf = (stack: string) =>
  stack.match(/\b(serif|sans-serif|monospace|system-ui|cursive)\b(?![\w-])/i)?.[1] ?? (/(mono|code)/i.test(stack) ? 'monospace' : 'sans-serif');

/** "font-family" value to use in your own CSS. */
export const familyCss = (f: Family | Role, stack = 'stack' in f ? f.stack : '') => {
  const name = 'cssName' in f ? f.family : f.family.replace(/^__(.+?)_[a-f0-9]{5,}$/i, '$1').replace(/_/g, ' ');
  return `'${name}', ${genericOf(stack)}`;
};

const isGoogleFontsUrl = (href: string) => {
  try {
    const u = new URL(href);
    return u.protocol === 'https:' && u.hostname === 'fonts.googleapis.com';
  } catch {
    return false;
  }
};

/** Google Fonts URL built only from the family name and weights (never a URL taken from the page). */
export function buildGoogleHref(f: Family) {
  const range = f.weights.find((w) => w.includes('–'));
  const weights = range ? range.replace('–', '..') : f.weights.length ? f.weights.join(';') : '400';
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f.family).replace(/%20/g, '+')}:wght@${weights}&display=swap`;
}

/** For snippets: the page's own Google Fonts link when it is a real one, else a rebuilt one. */
export function googleHref(f: Family) {
  return f.googleHref && isGoogleFontsUrl(f.googleHref) ? f.googleHref : buildGoogleHref(f);
}

/** How to load the font in another project. */
export function importSnippet(f: Family) {
  if (f.source === 'next-font') {
    const id = f.family.replace(/[^A-Za-z0-9]+/g, '_');
    return `<!-- Most Next.js fonts come from Google Fonts. In any project: -->\n<link href="${googleHref(f)}" rel="stylesheet" />\n\n// In a Next.js project:\n// import { ${id} } from 'next/font/google';\n// const font = ${id}({ subsets: ['latin'] });`;
  }
  if (f.source === 'google') {
    return `<!-- in <head> -->\n<link rel="preconnect" href="https://fonts.googleapis.com" />\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n<link href="${googleHref(f)}" rel="stylesheet" />`;
  }
  if (f.files.length) {
    const woff2 = f.files.filter((u) => /\.woff2(\?|$)/.test(u));
    const list = (woff2.length ? woff2 : f.files).slice(0, 4);
    return list
      .map((url) => `@font-face {\n  font-family: '${f.family}';\n  src: url('${url}') format('${/\.woff2/.test(url) ? 'woff2' : /\.woff(\?|$)/.test(url) ? 'woff' : 'truetype'}');\n  font-display: swap;\n}`)
      .join('\n\n');
  }
  if (f.source === 'adobe') return `/* Loaded from Adobe Fonts (use.typekit.net): add the font to your own Adobe Fonts web project, then use its embed code. */`;
  return `/* ${f.family} is installed on the visitor's device: no file to load. */`;
}

const ratio = (lineHeight: string, size: string) => {
  const lh = parseFloat(lineHeight);
  const fs = parseFloat(size);
  if (!lh || !fs || !/px$/.test(lineHeight)) return lineHeight === 'normal' ? undefined : lineHeight;
  return String(Math.round((lh / fs) * 100) / 100);
};

const em = (spacing: string, size: string) => {
  const ls = parseFloat(spacing);
  const fs = parseFloat(size);
  if (!ls || spacing === 'normal' || !fs) return undefined;
  return `${Math.round((ls / fs) * 1000) / 1000}em`;
};

/** CSS rule reproducing what a role looks like on the page. */
export function roleCss(r: Role) {
  const decl = [
    `font-family: ${familyCss(r)};`,
    `font-size: ${r.size};`,
    `font-weight: ${r.weight};`,
    r.style !== 'normal' ? `font-style: ${r.style};` : null,
    ratio(r.lineHeight, r.size) ? `line-height: ${ratio(r.lineHeight, r.size)};` : null,
    em(r.letterSpacing, r.size) ? `letter-spacing: ${em(r.letterSpacing, r.size)};` : null,
    r.transform !== 'none' ? `text-transform: ${r.transform};` : null,
  ].filter(Boolean);
  return `${SELECTOR[r.id] ?? r.id} {\n  ${decl.join('\n  ')}\n}`;
}

/** Everything: how to load each font, then one rule per role. */
export function fullCss(fonts: FontsResult) {
  const loads = fonts.families.filter((f) => f.source !== 'system').map((f) => `/* ${f.family} · ${SOURCE_LABEL[f.source]} */\n${importSnippet(f)}`);
  return [...loads, '/* Type scale */', ...fonts.roles.map(roleCss)].join('\n\n') + '\n';
}

export const lineHeightLabel = (r: Role) => ratio(r.lineHeight, r.size) ?? 'normal';
