import { useMemo, useState } from 'react';
import { htmlDocument, markdownToHtml, previewDocument } from '@/lib/markdown';
import { CodeView, CopyButton, DownloadButton, HtmlPreview, OpenTabButton, Segmented, Toolbar } from '@/components/ui';

type View = 'preview' | 'html';

/** Markdown -> HTML: write or paste Markdown, preview it, copy, download or open full width. */
export function ConvertTab({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [view, setView] = useState<View>('preview');
  const [fullDoc, setFullDoc] = useState(false);
  const fragment = useMemo(() => markdownToHtml(value), [value]);
  const title = value.match(/^#\s+(.+)$/m)?.[1] ?? 'Document';
  const output = fullDoc ? htmlDocument(fragment, title) : fragment;

  return (
    <div className='space-y-tight'>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder='Write or paste Markdown here…'
        spellCheck={false}
        className='h-[clamp(10rem,30vh,24rem)] w-full resize-y rounded-lg border border-border bg-card p-[0.85em] font-mono text-xs leading-relaxed outline-hidden placeholder:text-muted-foreground/70 focus:border-ring'
      />
      <Toolbar
        left={
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: 'preview', label: 'Preview' },
              { value: 'html', label: 'HTML' },
            ]}
          />
        }
      >
        <CopyButton text={output} label='Copy HTML' />
        <DownloadButton text={htmlDocument(fragment, title)} filename='document.html' type='text/html' />
        <OpenTabButton text={view === 'preview' ? previewDocument(fragment, title) : output} type={view === 'preview' ? 'text/html' : 'text/plain'} />
      </Toolbar>
      {view === 'html' && (
        <label className='flex items-center gap-1.5 text-2xs text-muted-foreground'>
          <input type='checkbox' checked={fullDoc} onChange={(e) => setFullDoc(e.target.checked)} />
          Full HTML document (with &lt;head&gt; and basic styles)
        </label>
      )}
      {view === 'preview' ? (
        <HtmlPreview html={fragment} className='h-[clamp(18rem,50vh,60rem)]' />
      ) : (
        <CodeView code={output} language='html' className='h-[clamp(18rem,50vh,60rem)]' />
      )}
    </div>
  );
}
