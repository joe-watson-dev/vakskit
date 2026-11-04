import { useMemo, type ReactNode } from 'react';
import { audit, toJSON } from '@/lib/exporters';
import { slugFromUrl } from '@/lib/files';
import { cleanUrl } from '@/lib/url';
import { cx } from '@/lib/cx';
import type { SiteFile } from '@/lib/chrome';
import type { Seo } from '@/lib/types';
import { CopyButton, DownloadButton, Empty, SectionTitle } from '@/components/ui';
import { Code, FileText, Search, Sparkles } from '@/components/icons';
import type { Tab } from './App';

function FeatureCard({ icon, title, text, status, onClick }: { icon: ReactNode; title: string; text: string; status?: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className='group flex w-full items-start gap-tight rounded-lg border border-border bg-card p-[0.85em] text-left transition hover:border-ring hover:shadow-xs'
    >
      <span className='mt-0.5 rounded-md bg-accent p-[0.4em] text-accent-foreground'>{icon}</span>
      <span className='min-w-0 flex-1'>
        <span className='flex items-center justify-between gap-2'>
          <span className='text-sm font-semibold text-foreground'>{title}</span>
          <span className='text-muted-foreground/50 transition group-hover:translate-x-0.5 group-hover:text-accent-foreground'>→</span>
        </span>
        <span className='mt-0.5 block text-xs text-muted-foreground'>{text}</span>
        {status && <span className='mt-1.5 block text-2xs'>{status}</span>}
      </span>
    </button>
  );
}

const ICON_LG = 'h-[1.25em] w-[1.25em]';

/** Start screen: what's on this page, and a door to every feature. */
export function HomeTab({
  seo,
  markdown,
  siteFiles,
  emptyMessage,
  onGo,
}: {
  seo: Seo | null;
  markdown: string | null;
  siteFiles: SiteFile[] | null;
  emptyMessage: ReactNode;
  onGo: (tab: Tab, section?: string) => void;
}) {
  const issues = useMemo(() => (seo ? audit(seo) : []), [seo]);
  const errors = issues.filter((i) => i.level === 'error').length;
  const warns = issues.filter((i) => i.level === 'warn').length;
  const llms = siteFiles?.find((f) => f.name === 'llms.txt');
  const words = markdown ? markdown.split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className='space-y-stack'>
      {seo ? (
        <section className='space-y-tight'>
          <SectionTitle>This page</SectionTitle>
          <div className='rounded-lg border border-border bg-card p-[0.85em]'>
            <div className='line-clamp-2 text-sm font-semibold text-foreground'>{seo.title || 'Untitled page'}</div>
            <div className='mt-0.5 truncate text-2xs text-muted-foreground'>{cleanUrl(seo.url)}</div>
            <div className='mt-tight flex flex-wrap gap-1.5 text-2xs'>
              <span className={cx('rounded-full px-2 py-0.5', errors ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300')}>
                {errors} error{errors === 1 ? '' : 's'}
              </span>
              <span className={cx('rounded-full px-2 py-0.5', warns ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300')}>
                {warns} warning{warns === 1 ? '' : 's'}
              </span>
              <span className='rounded-full bg-muted px-2 py-0.5 text-muted-foreground'>{seo.stats.wordCount.toLocaleString()} words</span>
              <span className='rounded-full bg-muted px-2 py-0.5 text-muted-foreground'>{seo.lang || 'no lang'}</span>
            </div>
          </div>
          {markdown && (
            <div className='flex flex-wrap gap-1.5'>
              <CopyButton text={markdown} label='Copy Markdown' />
              <CopyButton text={toJSON(seo)} label='Copy SEO JSON' />
              <DownloadButton text={markdown} filename={`${slugFromUrl(seo.url)}.md`} type='text/markdown' label='Download .md' />
            </div>
          )}
        </section>
      ) : emptyMessage ? (
        <Empty>{emptyMessage}</Empty>
      ) : null}

      <section className='space-y-tight'>
        <SectionTitle>Features</SectionTitle>
        <div className='grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-tight'>
          <FeatureCard
            icon={<Search className={ICON_LG} />}
            title='SEO report'
            text='Search preview, checks, meta, headings. Export as JSON, TypeScript, HTML tags or Markdown.'
            status={seo && <span className='text-muted-foreground'>{issues.length} check{issues.length === 1 ? '' : 's'} to review</span>}
            onClick={() => onGo('seo')}
          />
          <FeatureCard
            icon={<FileText className={ICON_LG} />}
            title='Page → Markdown'
            text='The page as clean Markdown. Preview, copy, download or open full width.'
            status={markdown && <span className='text-muted-foreground'>{words.toLocaleString()} words ready</span>}
            onClick={() => onGo('markdown')}
          />
          <FeatureCard
            icon={<Code className={ICON_LG} />}
            title='Markdown → HTML'
            text='Write or paste Markdown, get clean HTML. Preview, copy or download a full page.'
            onClick={() => onGo('convert')}
          />
          <FeatureCard
            icon={<Sparkles className={ICON_LG} />}
            title='AI & crawler files'
            text='llms.txt, llms-full.txt, robots.txt and sitemap.xml for this site.'
            status={
              seo &&
              (!siteFiles ? (
                <span className='text-muted-foreground'>Checking…</span>
              ) : llms?.found ? (
                <span className='text-emerald-700 dark:text-emerald-400'>llms.txt found</span>
              ) : (
                <span className='text-amber-700 dark:text-amber-300'>No llms.txt</span>
              ))
            }
            onClick={() => onGo('seo', 'seo-files')}
          />
        </div>
      </section>
    </div>
  );
}
