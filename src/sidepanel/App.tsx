import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { analyzeTab, fetchSiteFiles, getTargetTab, hasSiteAccess, isAnalyzable, requestSiteAccess, showScan, type SiteFile } from '@/lib/chrome';
import { buildMarkdown } from '@/lib/markdown';
import { useTheme } from '@/lib/theme';
import type { Seo } from '@/lib/types';
import { Back, Logo, Moon, More, Sun } from '@/components/icons';
import { Menu } from './Menu';
import { Home } from './Home';
import { SeoScreen } from './SeoScreen';
import { MarkdownScreen } from './MarkdownScreen';
import { ConvertScreen } from './ConvertScreen';
import { ExportScreen, type ExportFormat } from './ExportScreen';

export type Screen = 'home' | 'seo' | 'markdown' | 'convert' | 'export';
export type Result = { seo: Seo; markdown: string; tabId: number };

const STEPS = ['Reading meta tags…', 'Reading headings…', 'Checking images…', 'Converting to Markdown…', 'Looking for llms.txt…'];
const SAMPLE = '# Hello from VaksKit\n\nWrite **Markdown** here and get clean HTML.\n\n- Lists\n- `code`\n- [Links](https://example.com)\n';

/** Header for detail screens: back, title, the screen's own icon actions, then ···. */
export function ScreenHeader({ title, onBack, actions, menu }: { title: string; onBack: () => void; actions?: ReactNode; menu: ReactNode }) {
  return (
    <header className='head'>
      <button className='brand' onClick={onBack} aria-label={`Back to Home from ${title}`}>
        <span className='back-btn'>
          <Back className='size-4' />
        </span>
        {title}
      </button>
      <div className='head-actions'>
        {actions}
        {menu}
      </div>
    </header>
  );
}

export default function App() {
  const theme = useTheme();
  const [screen, setScreen] = useState<Screen>('home');
  const [result, setResult] = useState<Result | null>(null);
  const [siteFiles, setSiteFiles] = useState<SiteFile[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mainOnly, setMainOnly] = useState(true);
  const [auto, setAuto] = useState(true);
  const [access, setAccess] = useState<boolean | null>(null);
  const [converterMd, setConverterMd] = useState(SAMPLE);
  const [menuOpen, setMenuOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [toast, setToast] = useState<string | null>(null);
  const settings = useRef({ mainOnly, auto });
  settings.current = { mainOnly, auto };
  const runId = useRef(0);
  const toastTimer = useRef<number>();

  const notify = useCallback((msg: string) => {
    window.clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = window.setTimeout(() => setToast(null), 1700);
  }, []);

  const analyze = useCallback(async (opts?: { scan?: boolean }) => {
    const id = ++runId.current;
    setError(null);
    const target = await getTargetTab();
    if (!target?.id || !isAnalyzable(target.url)) {
      setResult(null);
      setSiteFiles(null);
      setError('This page can’t be read. Browser pages (like chrome://) and the Chrome Web Store are off-limits to extensions. Open a website and try again.');
      return;
    }
    if (opts?.scan) showScan(target.id);
    setLoading(true);
    setStep(0);
    try {
      const page = await analyzeTab(target.id, settings.current.mainOnly);
      if (id !== runId.current) return; // a newer analysis started
      setResult({ seo: page.seo, markdown: buildMarkdown(page), tabId: target.id });
      setSiteFiles(null);
      fetchSiteFiles(page.seo.url).then((files) => id === runId.current && setSiteFiles(files));
    } catch (e) {
      if (id === runId.current) setError(`Couldn’t read this page: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      if (id === runId.current) setLoading(false);
    }
  }, []);

  // Step-by-step status while reading (informative only).
  useEffect(() => {
    if (!loading) return;
    const t = window.setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 420);
    return () => window.clearInterval(t);
  }, [loading]);

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
      if (settings.current.auto && info.status === 'complete' && t.active) analyze();
    };
    chrome.tabs.onActivated.addListener(onActivated);
    chrome.tabs.onUpdated.addListener(onUpdated);
    return () => {
      chrome.tabs.onActivated.removeListener(onActivated);
      chrome.tabs.onUpdated.removeListener(onUpdated);
    };
  }, [access, analyze]);

  // Re-build the Markdown when "Main content only" changes.
  const firstMainOnly = useRef(true);
  useEffect(() => {
    if (firstMainOnly.current) {
      firstMainOnly.current = false;
      return;
    }
    if (access) analyze();
  }, [mainOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  const onAnalyzeClick = async () => {
    // Ask for site access from the click itself (Chrome requires a user gesture).
    const ok = await requestSiteAccess();
    setAccess(ok);
    if (ok) analyze({ scan: true });
    else setError('VaksKit needs permission to read pages. Click Analyze and choose Allow.');
  };

  const go = (next: Screen, format?: ExportFormat) => {
    setMenuOpen(false);
    if (format) setExportFormat(format);
    setScreen(next);
  };
  const home = () => go('home');

  const menu = (
    <div className='head-actions'>
      <button className='ibtn' aria-label='More options' aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
        <More />
      </button>
      {menuOpen && (
        <Menu
          onClose={() => setMenuOpen(false)}
          theme={theme.choice}
          onTheme={theme.setTheme}
          mainOnly={mainOnly}
          onMainOnly={setMainOnly}
          auto={auto}
          onAuto={setAuto}
        />
      )}
    </div>
  );

  const needsPage = (screen === 'seo' || screen === 'markdown' || screen === 'export') && !result;

  return (
    <div className={`vk${loading ? ' busy' : ''}`}>
      {screen === 'home' && (
        <>
          <header className='head'>
            <div className='brand'>
              <Logo />
              VaksKit
            </div>
            <div className='head-actions'>
              <button
                className='ibtn'
                aria-label={`Switch to ${theme.resolved === 'dark' ? 'light' : 'dark'} mode`}
                title='Theme'
                onClick={() => theme.setTheme(theme.resolved === 'dark' ? 'light' : 'dark')}
              >
                {theme.resolved === 'dark' ? <Moon /> : <Sun />}
              </button>
              {menu}
            </div>
          </header>
          <Home
            result={result}
            loading={loading}
            step={STEPS[step]}
            progress={(step + 1) / STEPS.length}
            error={error}
            access={access}
            onAnalyze={onAnalyzeClick}
            onGo={go}
          />
          <footer className='credit'>
            Made by{' '}
            <a href='https://joedev.vakaks.com/' target='_blank' rel='noopener noreferrer' title='Joe Watson DEV'>
              VAKAKS
            </a>
          </footer>
        </>
      )}
      {screen === 'seo' && result && <SeoScreen seo={result.seo} siteFiles={siteFiles} notify={notify} onBack={home} menu={menu} />}
      {screen === 'markdown' && result && <MarkdownScreen result={result} notify={notify} onBack={home} menu={menu} />}
      {screen === 'export' && result && (
        <ExportScreen seo={result.seo} format={exportFormat} onFormat={setExportFormat} notify={notify} onBack={home} menu={menu} />
      )}
      {screen === 'convert' && <ConvertScreen value={converterMd} onChange={setConverterMd} notify={notify} onBack={home} menu={menu} />}
      {needsPage && (
        <>
          <ScreenHeader title={screen === 'markdown' ? 'Markdown' : 'SEO report'} onBack={home} menu={menu} />
          <div className='body'>
            <div className='empty'>
              <p>Analyze a page first.</p>
              <button className='btn primary' onClick={home}>
                Back to Home
              </button>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div className='toast' role='status'>
          {toast}
        </div>
      )}
    </div>
  );
}
