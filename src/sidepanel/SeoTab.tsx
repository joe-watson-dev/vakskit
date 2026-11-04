import { useMemo, useState, type ReactNode } from 'react';
import { audit, toHtmlTags, toJSON, toMarkdownReport, toTypeScript } from '@/lib/exporters';
import { slugFromUrl } from '@/lib/files';
import { cleanUrl } from '@/lib/url';
import { cx } from '@/lib/cx';
import type { SiteFile } from '@/lib/chrome';
import type { Seo } from '@/lib/types';
import { CodeView, CopyButton, DownloadButton, OpenTabButton, SectionTitle, Segmented, Toolbar } from '@/components/ui';

type Format = 'json' | 'ts' | 'html' | 'md';

// Framework-agnostic on purpose: data (JSON / TS), tags (HTML), or a readable report (Markdown).
const FORMATS: Record<Format, { label: string; ext: string; lang: 'json' | 'typescript' | 'html' | 'markdown'; mime: string; build: (s: Seo) => string }> = {
  json: { label: 'JSON', ext: 'seo.json', lang: 'json', mime: 'application/json', build: toJSON },
  ts: { label: 'TS', ext: 'seo.ts', lang: 'typescript', mime: 'text/plain', build: toTypeScript },
  html: { label: 'HTML', ext: 'head.html', lang: 'html', mime: 'text/html', build: toHtmlTags },
  md: { label: 'Markdown', ext: 'seo.md', lang: 'markdown', mime: 'text/markdown', build: toMarkdownReport },
};

const LEVEL_STYLE = {
  error: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900',
  warn: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900',
  info: 'bg-muted text-muted-foreground border-border',
};

// Words, not only colors, so severity is clear to everyone.
const LEVEL_LABEL = { error: 'Fix', warn: 'Improve', info: 'Tip' };

const SECTIONS = [
  { id: 'seo-preview', label: 'Preview' },
  { id: 'seo-checks', label: 'Checks' },
  { id: 'seo-meta', label: 'Meta' },
  { id: 'seo-export', label: 'Export' },
  { id: 'seo-headings', label: 'Headings' },
  { id: 'seo-files', label: 'llms.txt & files' },
];

function Section({ id, title, children, right }: { id: string; title: string; children: ReactNode; right?: ReactNode }) {
  // scroll-mt keeps the section title clear of the sticky header when jumped to.
  return (
    <section id={id} className='scroll-mt-28 space-y-tight'>
      <SectionTitle right={right}>{title}</SectionTitle>
      {children}
    </section>
  );
}

function Row({ label, value, max }: { label: string; value: string | null; max?: number }) {
  const [open, setOpen] = useState(false);
  const len = value?.length ?? 0;
  const long = len > 180;
  return (
    <div className='grid grid-cols-[minmax(5.5em,22%)_1fr] gap-tight border-b border-border/60 py-[0.5em] text-xs last:border-0'>
      <span className='text-muted-foreground'>{label}</span>
      <span className={cx('min-w-0 break-words', value ? 'text-foreground' : 'italic text-muted-foreground/70')}>
        <span className={cx(long && !open && 'line-clamp-3')}>{value || 'missing'}</span>
        {max && value ? <span className={cx('ml-1.5 text-2xs', len > max ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground/70')}>{len}/{max}</span> : null}
        {long && (
          <button className='ml-1.5 text-2xs font-medium text-accent-foreground hover:underline' onClick={() => setOpen(!open)}>
            {open ? 'Show less' : 'Show all'}
          </button>
        )}
      </span>
    </div>
  );
}

export function SeoTab({ seo, siteFiles }: { seo: Seo; siteFiles: SiteFile[] | null }) {
  const [format, setFormat] = useState<Format>('json');
  const [openFile, setOpenFile] = useState<string | null>(null);
  const issues = useMemo(() => audit(seo), [seo]);
  const f = FORMATS[format];
  const code = useMemo(() => f.build(seo), [f, seo]);
  const ogImage = ([] as string[]).concat(seo.openGraph['og:image'] ?? [])[0];
  const file = siteFiles?.find((s) => s.name === openFile);

  return (
    <div className='space-y-stack'>
      {/* Jump links: the SEO report is long, so let people skip to a section. */}
      <nav className='flex flex-wrap gap-1.5' aria-label='SEO sections'>
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className='rounded-full border border-border bg-card px-[0.75em] py-[0.3em] text-2xs font-medium text-muted-foreground hover:border-ring hover:text-accent-foreground'
          >
            {s.label}
          </a>
        ))}
      </nav>

      <Section id='seo-preview' title='Search result preview'>
        <div className='rounded-lg border border-border bg-card p-[0.85em]'>
          <div className='truncate text-2xs text-muted-foreground'>{cleanUrl(seo.canonical || seo.url)}</div>
          <div className='mt-0.5 line-clamp-2 text-base leading-snug text-link'>{seo.title || 'Untitled page'}</div>
          <div className='mt-1 line-clamp-3 text-xs text-muted-foreground'>{seo.description || 'No meta description. Google will pick text from the page.'}</div>
        </div>
        {ogImage && (
          <img
            key={ogImage}
            src={ogImage}
            alt='Social share image (og:image)'
            onError={(e) => (e.currentTarget.style.display = 'none')}
            className='aspect-[1200/630] w-full rounded-lg border border-border object-cover'
          />
        )}
      </Section>

      <Section id='seo-checks' title={`Checks · ${issues.length}`}>
        {issues.length === 0 ? (
          <p className='text-xs text-emerald-700 dark:text-emerald-400'>Everything we check looks good.</p>
        ) : (
          <ul className='space-y-1'>
            {issues.map((i) => (
              <li key={i.msg} className={cx('flex items-baseline gap-2 rounded-md border px-[0.6em] py-[0.4em] text-xs', LEVEL_STYLE[i.level])}>
                <span className='w-[5.6em] shrink-0 text-2xs font-semibold uppercase tracking-wide opacity-80'>{LEVEL_LABEL[i.level]}</span>
                <span>{i.msg}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section id='seo-meta' title='Meta'>
        <div className='rounded-lg border border-border bg-card px-[0.85em]'>
          <Row label='Title' value={seo.title} max={60} />
          <Row label='Description' value={seo.description} max={160} />
          <Row label='Canonical' value={seo.canonical} />
          <Row label='Robots' value={seo.robots} />
          <Row label='Language' value={seo.lang} />
          <Row label='Keywords' value={seo.keywords} />
        </div>
        <div className='grid grid-cols-[repeat(auto-fill,minmax(6.5em,1fr))] gap-1.5 text-center'>
          {[
            ['Words', seo.stats.wordCount],
            ['H1', seo.stats.h1Count],
            ['Images', seo.stats.images],
            ['No alt', seo.stats.imagesMissingAlt],
            ['Internal', seo.stats.internalLinks],
            ['External', seo.stats.externalLinks],
          ].map(([k, v]) => (
            <div key={k} className='rounded-md border border-border bg-card py-[0.45em]'>
              <div className='text-sm font-semibold text-foreground'>{v.toLocaleString()}</div>
              <div className='text-2xs text-muted-foreground'>{k}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section id='seo-export' title='Export'>
        <Toolbar
          left={
            <Segmented
              value={format}
              onChange={setFormat}
              options={(Object.keys(FORMATS) as Format[]).map((k) => ({ value: k, label: FORMATS[k].label }))}
            />
          }
        >
          <CopyButton text={code} />
          <DownloadButton text={code} filename={`${slugFromUrl(seo.url)}.${f.ext}`} type={f.mime} />
          <OpenTabButton text={code} />
        </Toolbar>
        <CodeView code={code} language={f.lang} className='max-h-[clamp(16rem,55vh,40rem)]' />
      </Section>

      <Section id='seo-headings' title={`Headings · ${seo.headings.length}`}>
        {seo.headings.length ? (
          <ul className='max-h-[clamp(10rem,40vh,30rem)] space-y-0.5 overflow-auto rounded-lg border border-border bg-card p-[0.6em] text-xs'>
            {seo.headings.slice(0, 300).map((h, i) => (
              <li key={i} style={{ paddingLeft: `${(h.level - 1) * 0.8}em` }} className='truncate'>
                <span className='mr-1.5 font-mono text-2xs text-accent-foreground'>H{h.level}</span>
                {h.text}
              </li>
            ))}
          </ul>
        ) : (
          <p className='text-xs text-muted-foreground'>No headings found.</p>
        )}
      </Section>

      <Section id='seo-files' title='Site files · AI & crawlers'>
        {!siteFiles ? (
          <p className='text-xs text-muted-foreground'>Checking…</p>
        ) : (
          <div className='space-y-1.5'>
            {siteFiles.map((s) => (
              <div key={s.name} className='flex items-center justify-between rounded-md border border-border bg-card px-[0.6em] py-[0.45em] text-xs'>
                <span className='flex items-center gap-2'>
                  <span className={cx('h-2 w-2 rounded-full', s.found ? 'bg-emerald-500' : 'bg-muted-foreground/40')} />
                  <span className='font-mono'>/{s.name}</span>
                </span>
                {s.found ? (
                  <button className='font-medium text-accent-foreground hover:underline' onClick={() => setOpenFile(openFile === s.name ? null : s.name)}>
                    {openFile === s.name ? 'Hide' : 'View'}
                  </button>
                ) : (
                  <span className='text-muted-foreground/70'>not found</span>
                )}
              </div>
            ))}
            {file && (
              <div className='space-y-1.5 pt-1'>
                <Toolbar left={<span className='truncate font-mono text-2xs text-muted-foreground'>{file.url}</span>}>
                  <CopyButton text={file.content} />
                  <DownloadButton text={file.content} filename={`${slugFromUrl(file.url.replace(/\/[^/]+$/, ''))}-${file.name}`} />
                  <OpenTabButton text={file.content} />
                </Toolbar>
                <CodeView code={file.content} language={file.name.endsWith('.xml') ? 'html' : 'markdown'} className='max-h-[clamp(14rem,50vh,36rem)]' />
              </div>
            )}
            {siteFiles.length > 0 && !siteFiles[0].found && (
              <p className='text-2xs text-muted-foreground'>
                No <span className='font-mono'>llms.txt</span>: AI assistants have no curated summary of this site.
              </p>
            )}
          </div>
        )}
      </Section>
    </div>
  );
}
