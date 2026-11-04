import { useMemo } from 'react';
import { audit } from '@/lib/exporters';
import { markdownStats } from '@/lib/mdsource';
import { seoScore, toImprove } from '@/lib/score';
import { Braces, Chevron, Code, Doc, Download, Gauge, Refresh } from '@/components/icons';
import { SiteIcon } from '@/components/SiteIcon';
import { hostOf } from '@/lib/url';
import type { Result, Screen } from './App';
import type { ExportFormat } from './ExportScreen';

type Props = {
  result: Result | null;
  loading: boolean;
  step: string;
  progress: number;
  error: string | null;
  access: boolean | null;
  onAnalyze: () => void;
  onGo: (s: Screen, format?: ExportFormat) => void;
};

export function Home({ result, loading, step, progress, error, access, onAnalyze, onGo }: Props) {
  const issues = useMemo(() => (result ? audit(result.seo) : []), [result]);
  const stats = useMemo(() => (result ? markdownStats(result.markdown) : null), [result]);
  const score = seoScore(issues);
  const improve = toImprove(issues);

  // Nothing read yet: explain and offer the one action.
  if (!result) {
    return (
      <div className='body'>
        {error && <div className='notice'>{error}</div>}
        <div className='empty'>
          <h2>{loading ? 'Reading the page…' : 'See any page the way search engines read it'}</h2>
          <p>
            {loading
              ? step
              : access
                ? 'Analyze this page to get its SEO as JSON or TypeScript, and the page as clean Markdown.'
                : 'Click Analyze. Chrome asks once for permission to read pages. Nothing leaves your browser.'}
          </p>
          {!loading && (
            <button className='btn primary' onClick={onAnalyze}>
              <Refresh /> Analyze this page
            </button>
          )}
        </div>
        <ProjectRows disabled onGo={onGo} />
      </div>
    );
  }

  const { seo } = result;

  return (
    <div className='body'>
      {error && <div className='notice'>{error}</div>}
      <div className='site'>
        <SiteIcon seo={seo} />
        <div className='txt'>
          <b>{hostOf(seo.url)}</b>
          <small>
            <i />
            {loading ? step : 'Analyzed just now'}
          </small>
        </div>
        <button className='ibtn' aria-label='Analyze again' title='Analyze again' onClick={onAnalyze} disabled={loading}>
          <Refresh />
        </button>
        {loading && <span className='bar' style={{ width: `${Math.round(progress * 100)}%` }} />}
      </div>

      <div className='tiles'>
        <button className='tile primary' onClick={() => onGo('seo')}>
          <span className='ic'>
            <Gauge />
          </span>
          <span>
            <span className='score'>
              {score}
              <span>/100</span>
            </span>
            <b>SEO report</b>
            <small>{improve === 0 ? 'Looks good' : `${improve} thing${improve === 1 ? '' : 's'} to improve`}</small>
          </span>
        </button>
        <button className='tile soft' onClick={() => onGo('markdown')}>
          <span className='ic'>
            <Doc />
          </span>
          <span>
            <b>Markdown</b>
            <small>{stats ? `${stats.words.toLocaleString()} words · open to copy` : '—'}</small>
          </span>
        </button>
      </div>

      <ProjectRows onGo={onGo} words={stats?.words} />
    </div>
  );
}

/** Each row opens a screen where you see the output, then copy or download it. */
function ProjectRows({ onGo, disabled, words }: { onGo: (s: Screen, format?: ExportFormat) => void; disabled?: boolean; words?: number }) {
  return (
    <>
      <div className='label'>
        <h2>Use in your project</h2>
      </div>
      <div className='rows'>
        <button className='row' onClick={() => onGo('export', 'json')} disabled={disabled}>
          <span className='ri'>
            <Braces />
          </span>
          <span className='grow'>
            SEO as JSON<small>View, copy or download · title, meta, Open Graph</small>
          </span>
          <span className='tag json'>.json</span>
          <Chevron className='chev' />
        </button>
        <button className='row' onClick={() => onGo('export', 'ts')} disabled={disabled}>
          <span className='ri'>
            <Braces />
          </span>
          <span className='grow'>
            SEO as TypeScript<small>View, copy or download · typed, ready to import</small>
          </span>
          <span className='tag ts'>.ts</span>
          <Chevron className='chev' />
        </button>
        <button className='row' onClick={() => onGo('markdown')} disabled={disabled}>
          <span className='ri'>
            <Download />
          </span>
          <span className='grow'>
            Page as Markdown<small>{words ? `View, copy or download · ${words.toLocaleString()} words` : 'View, copy or download'}</small>
          </span>
          <span className='tag md'>.md</span>
          <Chevron className='chev' />
        </button>
        <button className='row' onClick={() => onGo('convert')}>
          <span className='ri'>
            <Code />
          </span>
          <span className='grow'>
            Markdown → HTML<small>Paste Markdown, get clean HTML</small>
          </span>
          <span className='tag html'>.html</span>
          <Chevron className='chev' />
        </button>
      </div>
    </>
  );
}
