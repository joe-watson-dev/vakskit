import { useMemo, useState } from 'react';
import { markdownToHtml, previewDocument } from '@/lib/markdown';
import { slugFromUrl } from '@/lib/files';
import { Button, CodeView, CopyButton, DownloadButton, HtmlPreview, ICON, OpenTabButton, Segmented, Toolbar } from '@/components/ui';
import { Sparkles } from '@/components/icons';

type View = 'preview' | 'raw';

/** Page -> Markdown: preview it, read the raw text, copy, download or open full width. */
export function MarkdownTab({ markdown, url, title, onSendToConverter }: { markdown: string; url: string; title: string; onSendToConverter: () => void }) {
  const [view, setView] = useState<View>('preview');
  const html = useMemo(() => markdownToHtml(markdown), [markdown]);
  const words = useMemo(() => markdown.split(/\s+/).filter(Boolean).length, [markdown]);

  return (
    <div className='space-y-tight'>
      <Toolbar
        left={
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: 'preview', label: 'Preview' },
              { value: 'raw', label: 'Markdown' },
            ]}
          />
        }
      >
        <CopyButton text={markdown} />
        <DownloadButton text={markdown} filename={`${slugFromUrl(url)}.md`} type='text/markdown' />
        <OpenTabButton text={view === 'preview' ? previewDocument(html, title) : markdown} type={view === 'preview' ? 'text/html' : 'text/plain'} />
      </Toolbar>
      <div className='flex flex-wrap items-center justify-between gap-tight text-2xs text-muted-foreground'>
        <span>
          {words.toLocaleString()} words · {markdown.length.toLocaleString()} chars
        </span>
        <Button onClick={onSendToConverter} title='Open this Markdown in the Markdown → HTML tab'>
          <Sparkles className={ICON} /> Edit / convert
        </Button>
      </div>
      {view === 'preview' ? (
        <HtmlPreview html={html} className='h-[clamp(22rem,70vh,70rem)]' />
      ) : (
        <CodeView code={markdown} language='markdown' className='h-[clamp(22rem,70vh,70rem)]' />
      )}
    </div>
  );
}
