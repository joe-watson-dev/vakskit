import type { FontsResult } from './types';

/**
 * Runs INSIDE the page (chrome.scripting.executeScript): finds which fonts the
 * page really renders with, where each one is used, and where it comes from.
 * Self-contained: Chrome serializes this function, so no outside references.
 */
export function extractFonts(): FontsResult {
  const GENERIC = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-serif|ui-sans-serif|ui-monospace|ui-rounded|emoji|math|fangsong|-apple-system|blinkmacsystemfont)$/i;
  const unquote = (s: string) => s.trim().replace(/^["']|["']$/g, '');

  // next/font renames families ("__Inter_a1b2c3", "__Inter_Fallback_a1b2c3"): show the real name.
  const nice = (name: string) => {
    const m = name.match(/^__(.+?)(_Fallback)?_[a-f0-9]{5,}$/i);
    return m ? m[1].replace(/_/g, ' ') : name;
  };
  const isFallback = (name: string) => /_Fallback_[a-f0-9]{5,}$/i.test(name) || /\bfallback\b/i.test(name);

  // ---------- web fonts Chrome loaded ----------
  const loaded = new Map<string, { weights: Set<string>; styles: Set<string> }>();
  document.fonts.forEach((f) => {
    if (f.status !== 'loaded') return;
    const fam = unquote(f.family);
    const e = loaded.get(fam) || { weights: new Set<string>(), styles: new Set<string>() };
    e.weights.add(String(f.weight).trim().replace(/\s+/, '–'));
    e.styles.add(f.style);
    loaded.set(fam, e);
  });
  const loadedLower = new Set(Array.from(loaded.keys()).map((k) => k.toLowerCase()));

  // ---------- where the fonts come from ----------
  const google = new Map<string, string>(); // family -> stylesheet href
  document.querySelectorAll<HTMLLinkElement>('link[href*="fonts.googleapis.com"]').forEach((l) => {
    try {
      const u = new URL(l.href);
      u.searchParams.getAll('family').forEach((f) => google.set(f.split(':')[0].replace(/\+/g, ' '), l.href));
    } catch {
      /* ignore */
    }
  });
  const adobe = !!document.querySelector('link[href*="use.typekit.net"], script[src*="use.typekit.net"]');
  const files = new Map<string, Set<string>>(); // family -> font file URLs (readable stylesheets only)
  const walk = (rules: CSSRuleList, base: string) => {
    for (const r of Array.from(rules)) {
      if (r instanceof CSSFontFaceRule) {
        const fam = unquote(r.style.getPropertyValue('font-family'));
        const src = r.style.getPropertyValue('src');
        const set = files.get(fam) || new Set<string>();
        for (const m of src.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
          try {
            set.add(new URL(m[1], base).href);
          } catch {
            /* ignore */
          }
        }
        files.set(fam, set);
        if (/fonts\.gstatic\.com/.test(src)) google.set(fam, google.get(fam) || '');
      } else if ('cssRules' in r && (r as CSSGroupingRule).cssRules) {
        walk((r as CSSGroupingRule).cssRules, base);
      }
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      walk(sheet.cssRules, sheet.href || location.href);
    } catch {
      /* cross-origin stylesheet: rules not readable */
    }
  }

  // ---------- which font is actually used, per role ----------
  const resolve = (stack: string) => {
    const parts = stack.split(',').map(unquote).filter(Boolean);
    const web = parts.find((p) => loadedLower.has(p.toLowerCase()) && !isFallback(p));
    if (web) return { family: web, system: false };
    const local = parts.find((p) => !GENERIC.test(p) && !isFallback(p));
    return { family: local || parts[0] || 'system-ui', system: true };
  };

  const ROLES: [string, string, string][] = [
    ['h1', 'H1', 'h1'],
    ['h2', 'H2', 'h2'],
    ['h3', 'H3', 'h3'],
    ['h4', 'H4', 'h4'],
    ['p', 'Paragraph', 'p'],
    ['a', 'Link', 'main a, article a, p a, a'],
    ['button', 'Button', 'button, [role="button"], a[class*="btn" i], a[class*="button" i]'],
    ['nav', 'Navigation', 'nav a, header a'],
    ['li', 'List', 'li'],
    ['input', 'Form field', 'input, textarea, select, label'],
    ['code', 'Code', 'code, pre, kbd'],
  ];

  const visible = (el: Element) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
  };

  const roles: FontsResult['roles'] = [];
  for (const [id, label, sel] of ROLES) {
    const tally = new Map<string, { n: number; sample: string; cs: CSSStyleDeclaration; family: string; system: boolean }>();
    let seen = 0;
    for (const el of Array.from(document.querySelectorAll(sel))) {
      if (seen >= 40) break;
      const text = (el.textContent || (el as HTMLInputElement).placeholder || '').replace(/\s+/g, ' ').trim();
      if (!text || !visible(el)) continue;
      seen++;
      const cs = getComputedStyle(el);
      const { family, system } = resolve(cs.fontFamily);
      const key = [family, cs.fontWeight, cs.fontSize, cs.fontStyle].join('|');
      const t = tally.get(key) || { n: 0, sample: text.slice(0, 48), cs, family, system };
      t.n += Math.min(text.length, 200);
      tally.set(key, t);
    }
    const best = Array.from(tally.values()).sort((a, b) => b.n - a.n)[0];
    if (!best) continue;
    const cs = best.cs;
    roles.push({
      id,
      label,
      family: best.family,
      system: best.system,
      stack: cs.fontFamily,
      size: cs.fontSize,
      weight: cs.fontWeight,
      style: cs.fontStyle,
      lineHeight: cs.lineHeight,
      letterSpacing: cs.letterSpacing,
      transform: cs.textTransform,
      sample: best.sample,
    });
  }

  // ---------- families, ordered by how much they are used ----------
  const fams = new Map<string, FontsResult['families'][number]>();
  for (const r of roles) {
    const name = nice(r.family);
    const f =
      fams.get(name) ||
      ({
        family: name,
        cssName: r.family,
        source: 'system',
        weights: [],
        roles: [],
        files: [],
        googleHref: undefined,
      } as FontsResult['families'][number]);
    if (!f.roles.includes(r.label)) f.roles.push(r.label);
    if (!f.weights.includes(r.weight)) f.weights.push(r.weight);
    fams.set(name, f);
  }
  for (const f of fams.values()) {
    const l = loaded.get(f.cssName);
    if (l) l.weights.forEach((w) => !f.weights.includes(w) && f.weights.push(w));
    f.weights.sort((a, b) => parseInt(a) - parseInt(b));
    const gHref = google.get(f.family) ?? google.get(f.cssName);
    f.files = Array.from(files.get(f.cssName) || []).slice(0, 6);
    if (gHref !== undefined) {
      f.source = 'google';
      f.googleHref = gHref || undefined;
    } else if (/^__.+_[a-f0-9]{5,}$/i.test(f.cssName) || f.files.some((u) => /\/_next\/static\//.test(u))) f.source = 'next-font';
    else if (loadedLower.has(f.cssName.toLowerCase())) f.source = adobe && !f.files.length ? 'adobe' : 'self-hosted';
    else f.source = 'system';
  }

  return { families: Array.from(fams.values()), roles };
}
