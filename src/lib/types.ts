export type MetaGroup = Record<string, string | string[]>;

export type Seo = {
  url: string;
  title: string | null;
  description: string | null;
  keywords: string | null;
  author: string | null;
  robots: string | null;
  canonical: string | null;
  lang: string | null;
  charset: string | null;
  viewport: string | null;
  themeColor: string | null;
  generator: string | null;
  openGraph: MetaGroup;
  twitter: MetaGroup;
  hreflang: { hreflang: string; href: string }[];
  icons: { rel: string; href: string; sizes?: string; type?: string }[];
  manifest: string | null;
  jsonLd: unknown[];
  headings: { level: number; text: string }[];
  stats: {
    wordCount: number;
    h1Count: number;
    images: number;
    imagesMissingAlt: number;
    internalLinks: number;
    externalLinks: number;
    nofollowLinks: number;
  };
  imagesMissingAlt: string[];
};

/** Article details found by Defuddle (all optional). */
export type ArticleMeta = { author?: string; published?: string; site?: string; image?: string; wordCount?: number; h1?: string };

/**
 * `markdown` comes from Defuddle when it succeeds; `html` is the cleaned
 * snapshot used as a fallback (converted with Turndown in the side panel).
 */
export type FontSource = 'google' | 'adobe' | 'next-font' | 'self-hosted' | 'system';

export type FontsResult = {
  /** One entry per typeface, most used first. */
  families: {
    family: string; // display name ("Inter")
    cssName: string; // name in the page's CSS ("__Inter_a1b2c3")
    source: FontSource;
    weights: string[];
    roles: string[]; // "H1", "Paragraph"…
    files: string[]; // font file URLs when the stylesheet is readable
    googleHref?: string;
  }[];
  /** The style each kind of text actually gets. */
  roles: {
    id: string;
    label: string;
    family: string;
    system: boolean;
    stack: string;
    size: string;
    weight: string;
    style: string;
    lineHeight: string;
    letterSpacing: string;
    transform: string;
    sample: string;
  }[];
};

export type PageResult = { seo: Seo; html: string; markdown?: string; meta?: ArticleMeta; markdownError?: string; fonts?: FontsResult };

export type Issue = { level: 'error' | 'warn' | 'info'; msg: string };
