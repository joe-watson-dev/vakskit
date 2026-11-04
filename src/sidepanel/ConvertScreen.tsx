import { useMemo, useState, type ReactNode } from 'react';
import { downloadText } from '@/lib/files';
import { htmlDocument, markdownToHtml } from '@/lib/markdown';
import { Download, Eye, EyeOff } from '@/components/icons';
import { ScreenHeader } from './App';
import { CopyIcon, Preview } from './MarkdownScreen';

type Props = { value: string; onChange: (v: string) => void; notify: (m: string) => void; onBack: () => void; menu: ReactNode };

/** Markdown → HTML: write or paste, see the result, copy or download it. */
export function ConvertScreen({ value, onChange, notify, onBack, menu }: Props) {
  const [preview, setPreview] = useState(true);
  const [swap, setSwap] = useState(0);
  const html = useMemo(() => markdownToHtml(value), [value]);
  const title = value.match(/^#\s+(.+)$/m)?.[1] ?? 'Document';

  return (
    <>
      <ScreenHeader
        title='Markdown → HTML'
        onBack={onBack}
        menu={menu}
        actions={
          <>
            <button
              key={swap}
              className={`ibtn eye${preview ? ' on' : ''}`}
              aria-pressed={preview}
              aria-label={preview ? 'Show HTML code' : 'Show preview'}
              title={preview ? 'Show HTML code' : 'Show preview'}
              onClick={() => {
                setPreview((p) => !p);
                setSwap((n) => n + 1);
              }}
            >
              {preview ? <Eye /> : <EyeOff />}
            </button>
            <CopyIcon text={html} label='Copy HTML' notify={notify} msg='HTML copied' />
            <button
              className='ibtn'
              title='Download document.html'
              aria-label='Download .html'
              onClick={() => {
                downloadText(htmlDocument(html, title), 'document.html', 'text/html');
                notify('Saved document.html');
              }}
            >
              <Download />
            </button>
          </>
        }
      />
      <div className='body'>
        <textarea className='write' value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} aria-label='Markdown' placeholder='Write or paste Markdown…' />
        <div key={swap} className={`unveil${swap ? ' swap' : ''}`}>
          {preview ? (
            <Preview html={html} title={title} />
          ) : (
            <pre className='md'>{html.trim()}</pre>
          )}
        </div>
      </div>
    </>
  );
}
