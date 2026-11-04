import type { PageResult } from './types';

/**
 * Runs INSIDE the inspected page via chrome.scripting.executeScript.
 * Chrome serializes this function with toString(), so it must be fully
 * self-contained: no imports, no references to outer variables.
 *
 * It returns SEO data plus a cleaned HTML snapshot; the side panel turns
 * that HTML into Markdown (so no library has to be injected into the page).
 */
export function extractPage(options: { mainOnly: boolean }): PageResult {
  const doc = document;
  const abs = (url: string | null | undefined): string | null => {
    if (!url) return null;
    try {
      return new URL(url, doc.baseURI).href;
    } catch {
      return url;
    }
  };
  const text = (el: Element | null | undefined) => (el?.textContent || '').replace(/\s+/g, ' ').trim();
  const metaBy = (attr: string, key: string) =>
    doc.querySelector(`meta[${attr}="${CSS.escape(key)}" i]`)?.getAttribute('content')?.trim() || null;
  const linkRel = (rel: string) => doc.querySelector(`link[rel~="${rel}" i]`)?.getAttribute('href') || null;

  const groupMeta = (prefix: string) => {
    const out: Record<string, string | string[]> = {};
    doc.querySelectorAll('meta[property], meta[name]').forEach((m) => {
      const key = (m.getAttribute('property') || m.getAttribute('name') || '').trim();
      if (!key.toLowerCase().startsWith(prefix)) return;
      const content = m.getAttribute('content')?.trim();
      if (!content) return;
      const prev = out[key];
      out[key] = prev === undefined ? content : ([] as string[]).concat(prev, content);
    });
    return out;
  };

  const jsonLd: unknown[] = [];
  doc.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
    try {
      jsonLd.push(JSON.parse(s.textContent || ''));
    } catch {
      jsonLd.push({ _invalid: true, raw: (s.textContent || '').trim().slice(0, 2000) });
    }
  });

  const headings = Array.from(doc.querySelectorAll('h1,h2,h3,h4,h5,h6'))
    .map((h) => ({ level: Number(h.tagName[1]), text: text(h) }))
    .filter((h) => h.text);

  let internal = 0;
  let external = 0;
  let nofollow = 0;
  doc.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (!href || href.startsWith('#')) return;
    try {
      const u = new URL(href, doc.baseURI);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return;
      if (u.hostname === location.hostname) internal++;
      else external++;
      if (/\bnofollow\b/i.test(a.rel)) nofollow++;
    } catch {
      /* ignore bad hrefs */
    }
  });

  const imgs = Array.from(doc.images);
  const imagesMissingAlt = imgs
    .filter((i) => !i.hasAttribute('alt'))
    .map((i) => abs(i.currentSrc || i.src))
    .filter((s): s is string => !!s);

  const hreflang = Array.from(doc.querySelectorAll('link[rel="alternate"][hreflang]')).map((l) => ({
    hreflang: l.getAttribute('hreflang') || '',
    href: abs(l.getAttribute('href')) || '',
  }));

  const icons = Array.from(
    doc.querySelectorAll('link[rel~="icon" i], link[rel="apple-touch-icon" i], link[rel="mask-icon" i]')
  ).map((l) => ({
    rel: l.getAttribute('rel') || '',
    href: abs(l.getAttribute('href')) || '',
    sizes: l.getAttribute('sizes') || undefined,
    type: l.getAttribute('type') || undefined,
  }));

  const bodyText = text(doc.body);

  // ---------- HTML snapshot for Markdown ----------
  let root: Element = doc.body;
  if (options.mainOnly) {
    root = doc.querySelector('main, [role="main"]') || doc.querySelector('article') || doc.body;
  }
  const clone = root.cloneNode(true) as Element;

  // Inline tags that the page lays out as blocks (flex/grid items, inline-block
  // badges, display:block spans…) look separate on screen but would be glued
  // together in Markdown ("ReactNext.jsTypeScript"). The clone has the same
  // element order as the original, so read the real layout and add a space.
  const originals = root.querySelectorAll('*');
  const copies = clone.querySelectorAll('*');
  if (originals.length === copies.length && originals.length < 20000) {
    const inlineTags = /^(SPAN|A|STRONG|B|EM|I|CODE|SMALL|LABEL|IMG|ABBR|MARK|TIME|SUP|SUB|S|U|KBD|CITE|Q)$/;
    originals.forEach((el, i) => {
      if (!inlineTags.test(el.tagName)) return;
      const display = getComputedStyle(el).display;
      if (display !== 'inline' && display !== 'contents' && display !== 'none') copies[i].after(' ');
    });
  }

  clone
    .querySelectorAll(
      'script, style, noscript, template, iframe, svg, canvas, form, button, input, select, textarea, dialog, [hidden], [aria-hidden="true"]' +
        (options.mainOnly ? ', nav, header, footer, aside' : '')
    )
    .forEach((el) => el.remove());
  // Absolute URLs, so the Markdown works outside the site.
  clone.querySelectorAll('a[href]').forEach((a) => a.setAttribute('href', abs(a.getAttribute('href')) || ''));
  clone.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') || img.getAttribute('data-src');
    if (src) img.setAttribute('src', abs(src) || src);
    img.removeAttribute('srcset');
  });

  return {
    seo: {
      url: location.href,
      title: doc.title?.trim() || null,
      description: metaBy('name', 'description'),
      keywords: metaBy('name', 'keywords'),
      author: metaBy('name', 'author'),
      robots: metaBy('name', 'robots'),
      canonical: abs(linkRel('canonical')),
      lang: doc.documentElement.getAttribute('lang') || null,
      charset: doc.characterSet || null,
      viewport: metaBy('name', 'viewport'),
      themeColor: metaBy('name', 'theme-color'),
      generator: metaBy('name', 'generator'),
      openGraph: groupMeta('og:'),
      twitter: groupMeta('twitter:'),
      hreflang,
      icons,
      manifest: abs(linkRel('manifest')),
      jsonLd,
      headings,
      stats: {
        wordCount: bodyText ? bodyText.split(' ').length : 0,
        h1Count: headings.filter((h) => h.level === 1).length,
        images: imgs.length,
        imagesMissingAlt: imagesMissingAlt.length,
        internalLinks: internal,
        externalLinks: external,
        nofollowLinks: nofollow,
      },
      imagesMissingAlt: imagesMissingAlt.slice(0, 50),
    },
    html: clone.innerHTML,
  };
}
