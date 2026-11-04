import { useMemo, useState, type ReactNode } from 'react';
import { audit, toHtmlTags, toJSON, toMarkdownReport, toTypeScript } from '@/lib/exporters';
import { downloadText, slugFromUrl } from '@/lib/files';
import { seoScore, toImprove } from '@/lib/score';
import { cleanUrl } from '@/lib/url';
import type { SiteFile } from '@/lib/chrome';
import type { Seo } from '@/lib/types';
import { Download } from '@/components/icons';
import { hostOf } from '@/lib/url';
import { ScreenHeader } from './App';
import { CopyIcon } from './MarkdownScreen';

type Props = { seo: Seo; siteFiles: SiteFile[] | null; notify: (m: string) => void; onBack: () => void; menu: ReactNode };
type Format = 'json' | 'ts' | 'html' | 'md';

const FORMATS: Record<Format, { label: string; ext: string; mime: string; build: (s: Seo) => string }> = {
  json: { label: 'JSON', ext: 'seo.json', mime: 'application/json', build: toJSON },
  ts: { label: 'TypeScript', ext: 'seo.ts', mime: 'text/plain', build: toTypeScript },
  html: { label: 'HTML tags', ext: 'head.html', mime: 'text/html', build: toHtmlTags },
  md: { label: 'Report', ext: 'seo.md', mime: 'text/markdown', build: toMarkdownReport },
};
const LEVEL = { error: ['red', 'Fix'], warn: ['amber', 'Improve'], info: ['grey', 'Tip'] } as const;

/** Google shows about 120 characters of the description on phones: mark the rest. */
function Cut({ text, at = 120 }: { text: string; at?: number }) {
  if (text.length <= at) return <>{text}</>;
  const i = text.lastIndexOf(' ', at);
  return (
    <>
      {text.slice(0, i)}
      <span className='cut'>{text.slice(i)}</span>
    </>
  );
}

export function SeoScreen({ seo, siteFiles, notify, onBack, menu }: Props) {
  const [format, setFormat] = useState<Format>('json');
  const [openFile, setOpenFile] = useState<string | null>(null);
  const issues = useMemo(() => audit(seo), [seo]);
  const f = FORMATS[format];
  const code = useMemo(() => f.build(seo), [f, seo]);
  const score = seoScore(issues);
  const improve = toImprove(issues);
  const file = siteFiles?.find((s) => s.name === openFile);

  return (
    <>
      <ScreenHeader title='SEO report' onBack={onBack} menu={menu} />
      <div className='body'>
        <div className='tiles' style={{ gridTemplateColumns: '1fr' }}>
          <div className='tile primary' style={{ minHeight: 0 }}>
            <span>
              <span className='score'>
                {score}
                <span>/100</span>
              </span>
              <b>{improve === 0 ? 'Ready for search' : `${improve} thing${improve === 1 ? '' : 's'} to improve`}</b>
              <small>{issues.length === 0 ? 'Every check passed.' : `${issues.length} note${issues.length === 1 ? '' : 's'} below`}</small>
            </span>
          </div>
        </div>

        {issues.length > 0 && (
          <div className='checks'>
            {issues.map((i) => (
              <div key={i.msg} className='card check'>
                <b>{i.msg}</b>
                <span className={`tag ${LEVEL[i.level][0]}`}>{LEVEL[i.level][1]}</span>
              </div>
            ))}
          </div>
        )}

        <div className='label'>
          <h2>Google preview</h2>
          <span>on phones</span>
        </div>
        <div className='card serp'>
          <span className='u'>{cleanUrl(seo.canonical || seo.url)}</span>
          <span className='t'>{seo.title || 'Untitled page'}</span>
          <span className='d'>{seo.description ? <Cut text={seo.description} /> : 'No description: Google will pick text from the page.'}</span>
        </div>

        <div className='label'>
          <h2>Meta</h2>
        </div>
        <dl className='card kv'>
          <div>
            <dt>Title</dt>
            <dd>
              {seo.title || '—'}
              {seo.title && <small>{seo.title.length}/60</small>}
            </dd>
          </div>
          <div>
            <dt>Description</dt>
            <dd>
              {seo.description || '—'}
              {seo.description && <small>{seo.description.length}/160</small>}
            </dd>
          </div>
          <div>
            <dt>Canonical</dt>
            <dd>{seo.canonical || '—'}</dd>
          </div>
          <div>
            <dt>Robots</dt>
            <dd>{seo.robots || 'not set (indexable)'}</dd>
          </div>
          <div>
            <dt>Language</dt>
            <dd>{seo.lang || '—'}</dd>
          </div>
        </dl>

        <div className='label'>
          <h2>Export</h2>
          <div className='head-actions'>
            <CopyIcon text={code} label={`Copy ${f.label}`} notify={notify} msg={`Copied ${f.label}`} />
            <button
              className='ibtn'
              aria-label={`Download ${f.ext}`}
              title={`Download ${f.ext}`}
              onClick={() => {
                downloadText(code, `${slugFromUrl(seo.url)}.${f.ext}`, f.mime);
                notify(`Saved ${slugFromUrl(seo.url)}.${f.ext}`);
              }}
            >
              <Download />
            </button>
          </div>
        </div>
        <div className='card'>
          <div className='formats' role='group' aria-label='Format'>
            {(Object.keys(FORMATS) as Format[]).map((k) => (
              <button key={k} aria-pressed={format === k} onClick={() => setFormat(k)}>
                {FORMATS[k].label}
              </button>
            ))}
          </div>
          <pre className='code'>{code}</pre>
        </div>

        <div className='label'>
          <h2>Headings</h2>
          <span>{seo.headings.length}</span>
        </div>
        <div className='card outline'>
          {seo.headings.length ? (
            seo.headings.slice(0, 80).map((h, i) => (
              <div key={i} style={{ paddingLeft: `${(h.level - 1) * 0.9}em` }}>
                <code>H{h.level}</code>
                <span>{h.text}</span>
              </div>
            ))
          ) : (
            <span>No headings found.</span>
          )}
        </div>

        <div className='label'>
          <h2>AI &amp; crawler files</h2>
          <span>{hostOf(seo.url)}</span>
        </div>
        <div className='card files'>
          {!siteFiles ? (
            <div>Checking…</div>
          ) : (
            siteFiles.map((s) => (
              <div key={s.name}>
                <code>/{s.name}</code>
                {s.found ? (
                  <button onClick={() => setOpenFile(openFile === s.name ? null : s.name)}>{openFile === s.name ? 'Hide' : 'View'}</button>
                ) : (
                  <span className='tag amber'>Missing</span>
                )}
              </div>
            ))
          )}
        </div>
        {file && (
          <div className='card'>
            <div className='label' style={{ marginTop: 0, marginBottom: 6 }}>
              <span>{file.url}</span>
              <CopyIcon text={file.content} label={`Copy ${file.name}`} notify={notify} msg={`Copied ${file.name}`} />
            </div>
            <pre className='code'>{file.content}</pre>
          </div>
        )}
      </div>
    </>
  );
}
