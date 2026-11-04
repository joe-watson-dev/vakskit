import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { copyText, downloadText, slugFromUrl } from '@/lib/files';
import { markdownToHtml, previewDocument } from '@/lib/markdown';
import { markdownSourceHtml, markdownStats } from '@/lib/mdsource';
import { Check, Copy, Download, Eye, EyeOff } from '@/components/icons';
import { SiteIcon } from '@/components/SiteIcon';
import { hostOf } from '@/lib/url';
import { ScreenHeader, type Result } from './App';

type Props = { result: Result; notify: (m: string) => void; onBack: () => void; menu: ReactNode };

/** Sandboxed rendered preview: no scripts run; links open in a new tab. `html` is already sanitized. */
export function Preview({ html, title }: { html: string; title: string }) {
  return <iframe className='preview' title='Preview' sandbox='allow-popups allow-popups-to-escape-sandbox' srcDoc={previewDocument(html, title)} />;
}

/** Copy icon that turns into a green check for a moment. */
export function CopyIcon({ text, label, notify, msg }: { text: string; label: string; notify: (m: string) => void; msg: string }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = window.setTimeout(() => setDone(false), 1400);
    return () => window.clearTimeout(t);
  }, [done]);
  return (
    <button
      className={`ibtn${done ? ' copied' : ''}`}
      title={label}
      aria-label={label}
      onClick={async () => {
        await copyText(text);
        setDone(true);
        notify(msg);
      }}
    >
      {done ? <Check /> : <Copy />}
    </button>
  );
}

export function MarkdownScreen({ result, notify, onBack, menu }: Props) {
  const { seo, markdown } = result;
  const [preview, setPreview] = useState(false);
  const [swap, setSwap] = useState(0);
  const stats = useMemo(() => markdownStats(markdown), [markdown]);
  const source = useMemo(() => markdownSourceHtml(markdown), [markdown]);
  const html = useMemo(() => (preview ? markdownToHtml(markdown) : ''), [markdown, preview]);
  const title = seo.title || hostOf(seo.url);
  const file = `${slugFromUrl(seo.url)}.md`;

  const toggle = () => {
    setPreview((p) => !p);
    setSwap((n) => n + 1);
  };

  // P toggles the preview (not while typing anywhere).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'p' || e.metaKey || e.ctrlKey || (e.target as HTMLElement).matches('input, textarea')) return;
      toggle();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <ScreenHeader
        title='Markdown'
        onBack={onBack}
        menu={menu}
        actions={
          <>
            <button
              key={swap}
              className={`ibtn eye${preview ? ' on' : ''}`}
              aria-pressed={preview}
              aria-label={preview ? 'Show Markdown' : 'Show preview'}
              title={preview ? 'Show Markdown (P)' : 'Show preview (P)'}
              onClick={toggle}
            >
              {preview ? <Eye /> : <EyeOff />}
            </button>
            <CopyIcon text={markdown} label='Copy Markdown' notify={notify} msg={`Markdown copied · ${stats.words.toLocaleString()} words`} />
            <button
              className='ibtn'
              title={`Download ${file}`}
              aria-label='Download .md'
              onClick={() => {
                downloadText(markdown, file, 'text/markdown');
                notify(`Saved ${file}`);
              }}
            >
              <Download />
            </button>
          </>
        }
      />
      <div className='body'>
        <div className='doc-head'>
          <div className='src-line'>
            <SiteIcon seo={seo} mini />
            <span>{hostOf(seo.url) + new URL(seo.url).pathname}</span>
          </div>
          <h2>{title}</h2>
          <div className='stats'>
            <span>
              <b>{stats.words.toLocaleString()}</b>words
            </span>
            <span>
              <b>{stats.sections}</b>sections
            </span>
            <span>
              <b>{stats.images}</b>images
            </span>
            <span>
              <b>{stats.minutes}</b>min read
            </span>
          </div>
        </div>
        <div key={swap} className={`unveil${swap ? ' swap' : ''}`}>
          {preview ? <Preview html={html} title={title} /> : <pre className='md' dangerouslySetInnerHTML={{ __html: source }} />}
        </div>
      </div>
    </>
  );
}
