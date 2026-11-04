import { useMemo, type ReactNode } from 'react';
import { toHtmlTags, toJSON, toMarkdownReport, toTypeScript } from '@/lib/exporters';
import { downloadText, slugFromUrl } from '@/lib/files';
import { markdownSourceHtml } from '@/lib/mdsource';
import { hostOf } from '@/lib/url';
import type { Seo } from '@/lib/types';
import { Download } from '@/components/icons';
import { SiteIcon } from '@/components/SiteIcon';
import { ScreenHeader } from './App';
import { CopyIcon } from './MarkdownScreen';

export type ExportFormat = 'json' | 'ts' | 'html' | 'md';

const FORMATS: Record<ExportFormat, { label: string; ext: string; mime: string; build: (s: Seo) => string; hint: string }> = {
  json: { label: 'JSON', ext: 'seo.json', mime: 'application/json', build: toJSON, hint: 'Import it anywhere: config files, CMS, scripts.' },
  ts: { label: 'TypeScript', ext: 'seo.ts', mime: 'text/plain', build: toTypeScript, hint: 'A typed seo object, ready to import in your project.' },
  html: { label: 'HTML tags', ext: 'head.html', mime: 'text/html', build: toHtmlTags, hint: 'Paste these tags inside <head>.' },
  md: { label: 'Report', ext: 'seo.md', mime: 'text/markdown', build: toMarkdownReport, hint: 'A readable report for docs, tickets or AI prompts.' },
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Light syntax colouring for JSON / TypeScript / HTML. Text is escaped first. */
function paint(code: string, format: ExportFormat) {
  if (format === 'md') return markdownSourceHtml(code);
  const h = esc(code);
  if (format === 'html') return h.replace(/(&lt;\/?[a-z0-9]+)/g, '<span class="mk">$1</span>').replace(/(&quot;|")([^"]*?)(")/g, '<span class="str">"$2"</span>');
  return h
    .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')(\s*:)?/g, (_m, s: string, colon?: string) => (colon ? `<span class="key">${s}</span>${colon}` : `<span class="str">${s}</span>`))
    .replace(/^(\s+)([A-Za-z_$][\w$]*)(:)/gm, '$1<span class="key">$2</span>$3')
    .replace(/\b(export|const|as|type|typeof)\b/g, '<span class="kw">$1</span>');
}

type Props = {
  seo: Seo;
  format: ExportFormat;
  onFormat: (f: ExportFormat) => void;
  notify: (m: string) => void;
  onBack: () => void;
  menu: ReactNode;
};

/** See the page's SEO in the format you need, then copy or download it. */
export function ExportScreen({ seo, format, onFormat, notify, onBack, menu }: Props) {
  const f = FORMATS[format];
  const code = useMemo(() => f.build(seo), [f, seo]);
  const html = useMemo(() => paint(code, format), [code, format]);
  const file = `${slugFromUrl(seo.url)}.${f.ext}`;

  return (
    <>
      <ScreenHeader
        title={`SEO as ${f.label}`}
        onBack={onBack}
        menu={menu}
        actions={
          <>
            <CopyIcon text={code} label={`Copy ${f.label}`} notify={notify} msg={`Copied SEO as ${f.label}`} />
            <button
              className='ibtn'
              title={`Download ${file}`}
              aria-label={`Download ${f.ext}`}
              onClick={() => {
                downloadText(code, file, f.mime);
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
          <h2>{seo.title || hostOf(seo.url)}</h2>
          <p className='hint'>{f.hint}</p>
        </div>
        <div className='formats' role='group' aria-label='Format'>
          {(Object.keys(FORMATS) as ExportFormat[]).map((k) => (
            <button key={k} aria-pressed={format === k} onClick={() => onFormat(k)}>
              {FORMATS[k].label}
            </button>
          ))}
        </div>
        <pre className='md code-view' dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </>
  );
}
