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

export type PageResult = { seo: Seo; html: string };

export type Issue = { level: 'error' | 'warn' | 'info'; msg: string };
