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

  // ---------- Markdown with Defuddle (vendor/defuddle.js is injected first) ----------
  // Runs here, in the live page, so it can use real layout and styles to tell
  // content from clutter. Falls back to the HTML snapshot if it isn't available.
  let markdown: string | undefined;
  let meta: PageResult['meta'];
  let markdownError: string | undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lib = (globalThis as any).Defuddle;
    const Defuddle = lib?.default ?? lib;
    if (typeof Defuddle === 'function') {
      // Work on a copy of the page. Drop only what is really hidden (display:none,
      // visibility:hidden) using the live layout. Defuddle's own check also drops
      // opacity:0, which removes every "fade in on scroll" section of modern sites.
      const copy = doc.cloneNode(true) as Document;
      const liveEls = doc.querySelectorAll('*');
      const copyEls = copy.querySelectorAll('*');
      if (liveEls.length === copyEls.length) {
        const hidden: Element[] = [];
        const inlineTags = /^(SPAN|A|STRONG|B|EM|I|CODE|SMALL|LABEL|ABBR|MARK|TIME|SUP|SUB|S|U|KBD|CITE|Q)$/;
        liveEls.forEach((el, i) => {
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden') hidden.push(copyEls[i]);
          // Inline tags laid out as blocks (flex items, badges) look separate on screen: keep a space.
          else if (inlineTags.test(el.tagName) && cs.display !== 'inline' && cs.display !== 'contents') copyEls[i].after(' ');
        });
        hidden.forEach((el) => el.remove());
      }
      // A <br> inside a heading is a visual break, not a new line: keep the words apart.
      copy.querySelectorAll('h1 br, h2 br, h3 br, h4 br, h5 br, h6 br').forEach((br) => br.replaceWith(' '));
      const r = new Defuddle(copy, {
        url: location.href,
        markdown: true,
        useAsync: false, // never call third-party services
        removeHiddenElements: false, // done above, without the opacity rule
        // Landing pages: <main> holds every section, so use it (Defuddle still cleans inside).
        // No <main>: let Defuddle find the article itself. Main content off: the whole body.
        contentSelector: !options.mainOnly ? 'body' : copy.querySelector('main') ? 'main' : copy.querySelector('[role="main"]') ? '[role="main"]' : undefined,
      }).parse();
      markdown = r.content;
      meta = {
        author: r.author || undefined,
        published: r.published || undefined,
        site: r.site || undefined,
        image: r.image || undefined,
        wordCount: r.wordCount,
        h1: ((doc.querySelector('h1') as HTMLElement | null)?.innerText || '').replace(/\s+/g, ' ').trim() || undefined,
      };
    } else {
      markdownError = 'Defuddle not loaded';
    }
  } catch (e) {
    markdownError = String(e);
  }

  return {
    markdown,
    meta,
    markdownError,
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
