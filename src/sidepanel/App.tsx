import { useCallback, useEffect, useRef, useState } from 'react';
import {
  analyzeTab,
  fetchSiteFiles,
  getTargetTab,
  hasSiteAccess,
  isAnalyzable,
  requestSiteAccess,
  type SiteFile,
} from '@/lib/chrome';
import { buildMarkdown } from '@/lib/markdown';
import { cleanUrl } from '@/lib/url';
import { cx } from '@/lib/cx';
import { useTheme } from '@/lib/theme';
import type { Seo } from '@/lib/types';
import { Button, Empty, ICON } from '@/components/ui';
import { ThemeToggle } from '@/components/theme-toggle';
import { Code, FileText, Home, Refresh, Search } from '@/components/icons';
import { HomeTab } from './HomeTab';
import { SeoTab } from './SeoTab';
import { MarkdownTab } from './MarkdownTab';
import { ConvertTab } from './ConvertTab';

export type Tab = 'home' | 'seo' | 'markdown' | 'convert';
type Result = { seo: Seo; markdown: string; tabId: number };

const TABS: { id: Tab; label: string; hint: string; icon: JSX.Element }[] = [
  { id: 'home', label: 'Home', hint: 'Overview of this page', icon: <Home className={ICON} /> },
  { id: 'seo', label: 'SEO', hint: 'SEO report and export', icon: <Search className={ICON} /> },
  { id: 'markdown', label: 'Markdown', hint: 'Page → Markdown', icon: <FileText className={ICON} /> },
  { id: 'convert', label: 'MD → HTML', hint: 'Markdown → HTML converter', icon: <Code className={ICON} /> },
];

const SAMPLE = '# Hello, from Markdown!\n\nWrite **Markdown** here and see the HTML.\n\n- Lists\n- `code`\n- [Links](https://example.com)\n';

export default function App() {
  const theme = useTheme();
  const [tab, setTab] = useState<Tab>('home');
  const [result, setResult] = useState<Result | null>(null);
  const [siteFiles, setSiteFiles] = useState<SiteFile[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mainOnly, setMainOnly] = useState(true);
  const [auto, setAuto] = useState(true);
  const [access, setAccess] = useState<boolean | null>(null);
  const [converterMd, setConverterMd] = useState(SAMPLE);
  const [scrolled, setScrolled] = useState(0);
  const settings = useRef({ mainOnly, auto });
  settings.current = { mainOnly, auto };
  const runId = useRef(0);

  const analyze = useCallback(async () => {
    const id = ++runId.current;
    setError(null);
    const target = await getTargetTab();
    if (!target?.id || !isAnalyzable(target.url)) {
      setResult(null);
      setSiteFiles(null);
      setError(
        target
          ? 'This page can’t be read. Browser pages (like chrome://) and the Chrome Web Store are off-limits to extensions. Open a regular website and try again.'
          : 'No page to read.'
      );
      return;
    }
    setLoading(true);
    try {
      const page = await analyzeTab(target.id, settings.current.mainOnly);
      const { seo } = page;
      if (id !== runId.current) return; // a newer analysis started
      setResult({ seo, markdown: buildMarkdown(page), tabId: target.id });
      setSiteFiles(null);
      fetchSiteFiles(seo.url).then((files) => id === runId.current && setSiteFiles(files));
    } catch (e) {
      if (id === runId.current) setError(`Couldn’t read this page: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      if (id === runId.current) setLoading(false);
    }
  }, []);

  // Load saved settings and permission state; analyze straight away when allowed.
  useEffect(() => {
    chrome.storage.local.get({ mainOnly: true, auto: true }).then((s) => {
      setMainOnly(s.mainOnly as boolean);
      setAuto(s.auto as boolean);
      settings.current = { mainOnly: s.mainOnly as boolean, auto: s.auto as boolean };
      hasSiteAccess().then((ok) => {
        setAccess(ok);
        if (ok) analyze();
      });
    });
  }, [analyze]);

  useEffect(() => {
    chrome.storage.local.set({ mainOnly, auto });
  }, [mainOnly, auto]);

  // Re-analyze when the page changes: a tab switch or a page load in the active tab.
  useEffect(() => {
    if (!access) return;
    const onActivated = () => settings.current.auto && analyze();
    const onUpdated = (_tabId: number, info: { status?: string }, t: chrome.tabs.Tab) => {
      if (!settings.current.auto || info.status !== 'complete') return;
      if (t.active) analyze();
    };
    chrome.tabs.onActivated.addListener(onActivated);
    chrome.tabs.onUpdated.addListener(onUpdated);
    return () => {
      chrome.tabs.onActivated.removeListener(onActivated);
      chrome.tabs.onUpdated.removeListener(onUpdated);
    };
  }, [access, analyze]);

  // Re-build Markdown when "Main content only" changes.
  const firstMainOnly = useRef(true);
  useEffect(() => {
    if (firstMainOnly.current) {
      firstMainOnly.current = false;
      return;
    }
    if (access) analyze();
  }, [mainOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (next: Tab, section?: string) => {
    setTab(next);
    requestAnimationFrame(() => {
      if (section) document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else window.scrollTo({ top: 0 });
    });
  };

  const onAnalyzeClick = async () => {
    // Ask for site access from the click itself (Chrome requires a user gesture).
    const ok = await requestSiteAccess();
    setAccess(ok);
    if (ok) analyze();
    else setError('PageKit needs permission to read pages. Click Analyze and choose Allow.');
  };

  const compact = scrolled > 24;
  const emptyMessage = error ? null : loading ? (
    'Reading the page…'
  ) : !access ? (
    <>
      Click <b className='text-foreground'>Analyze</b> to read this page.
      <br />
      Chrome asks once for permission to read pages.
    </>
  ) : (
    'Nothing analyzed yet. Click Analyze.'
  );

  return (
    <div className='flex min-h-screen flex-col bg-background text-foreground'>
      {/* Sticky header: tabs stay reachable while scrolling; extra rows fold away. */}
      <header className={cx('sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-md transition-shadow', compact && 'shadow-xs')}>
        <div className='space-y-tight px-pad py-tight'>
          <div className='flex items-center justify-between gap-tight'>
            <button className='flex min-w-0 items-center gap-2 rounded-md text-left' onClick={() => go('home')} title='Go to Home'>
              <img src='/icons/icon32.png' alt='' className='h-[1.75em] w-[1.75em] shrink-0' />
              <span className='min-w-0'>
                <span className='block text-sm font-semibold leading-tight'>PageKit</span>
                {!compact && (
                  <span className='block truncate text-2xs text-muted-foreground'>
                    {result ? cleanUrl(result.seo.url) : 'SEO & Markdown for any page'}
                  </span>
                )}
              </span>
            </button>
            <div className='flex shrink-0 items-center gap-1.5'>
              <ThemeToggle choice={theme.choice} resolved={theme.resolved} onChange={theme.setTheme} />
              <Button variant='primary' onClick={onAnalyzeClick} disabled={loading}>
                <Refresh className={cx(ICON, loading && 'animate-spin')} />
                {result ? 'Re-analyze' : 'Analyze'}
              </Button>
            </div>
          </div>

          <nav className='grid grid-cols-4 gap-1 rounded-lg bg-muted p-0.5' aria-label='Features'>
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => go(t.id)}
                aria-current={tab === t.id ? 'page' : undefined}
                title={t.hint}
                className={cx(
                  'flex min-w-0 items-center justify-center gap-[0.35em] whitespace-nowrap rounded-md px-1 py-[0.55em] text-xs font-medium leading-none transition',
                  tab === t.id ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {/* Icons give way to the labels on narrow panels. */}
                <span className='max-[440px]:hidden'>{t.icon}</span>
                <span className='truncate'>{t.label}</span>
              </button>
            ))}
          </nav>

          {!compact && (
            <div className='flex flex-wrap gap-x-4 gap-y-1 text-2xs text-muted-foreground'>
              <label className='flex items-center gap-1.5' title='Skip menus, header, footer and sidebars when building Markdown'>
                <input type='checkbox' checked={mainOnly} onChange={(e) => setMainOnly(e.target.checked)} /> Main content only
              </label>
              <label className='flex items-center gap-1.5' title='Analyze again when you switch tabs or a page loads'>
                <input type='checkbox' checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Auto-analyze
              </label>
            </div>
          )}
        </div>
      </header>

      <main className='w-full flex-1 px-pad pb-20 pt-stack'>
        {error && (
          <div role='alert' className='mb-stack rounded-md border border-rose-200 bg-rose-50 px-[0.7em] py-[0.5em] text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300'>
            {error}
          </div>
        )}


        {tab === 'home' ? (
          <HomeTab seo={result?.seo ?? null} markdown={result?.markdown ?? null} siteFiles={siteFiles} emptyMessage={emptyMessage} onGo={go} />
        ) : tab === 'convert' ? (
          <ConvertTab value={converterMd} onChange={setConverterMd} />
        ) : !result ? (
          emptyMessage && <Empty>{emptyMessage}</Empty>
        ) : tab === 'seo' ? (
          <SeoTab seo={result.seo} siteFiles={siteFiles} />
        ) : (
          <MarkdownTab
            markdown={result.markdown}
            url={result.seo.url}
            title={result.seo.title || 'Page'}
            onSendToConverter={() => {
              setConverterMd(result.markdown);
              go('convert');
            }}
          />
        )}
      </main>

      {scrolled > 400 && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className='fixed bottom-pad right-pad z-20 rounded-full bg-foreground/85 px-[0.9em] py-[0.55em] text-2xs font-medium text-background shadow-lg hover:bg-foreground'
          aria-label='Back to top'
        >
          ↑ Top
        </button>
      )}
    </div>
  );
}
