import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import typescript from 'react-syntax-highlighter/dist/esm/languages/hljs/typescript';
import xml from 'react-syntax-highlighter/dist/esm/languages/hljs/xml';
import markdown from 'react-syntax-highlighter/dist/esm/languages/hljs/markdown';
import { atomOneDark, github } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { cx } from '@/lib/cx';
import { copyText, downloadText, openInTab } from '@/lib/files';
import { previewDocument } from '@/lib/markdown';
import { currentTheme } from '@/lib/theme';
import { Check, Copy, Download, ExternalLink } from './icons';

SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('html', xml);
SyntaxHighlighter.registerLanguage('markdown', markdown);

/** Icon size follows the text size of its button. */
export const ICON = 'h-[1.1em] w-[1.1em] shrink-0';

export function Button({ className, variant = 'ghost', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' }) {
  return (
    <button
      {...props}
      className={cx(
        // nowrap + shrink-0: a button never breaks its label over two lines.
        'inline-flex shrink-0 items-center justify-center gap-[0.4em] whitespace-nowrap rounded-md px-[0.8em] py-[0.5em] text-xs font-medium leading-none transition disabled:opacity-50',
        variant === 'primary'
          ? 'bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover'
          : 'border border-border bg-card text-card-foreground hover:bg-muted',
        className
      )}
    />
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className='inline-flex rounded-md bg-muted p-0.5 text-xs' role='group'>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cx(
            'whitespace-nowrap rounded-sm px-[0.8em] py-[0.4em] font-medium leading-none transition',
            value === o.value ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      onClick={async () => {
        await copyText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? <Check className={cx(ICON, 'text-emerald-600 dark:text-emerald-400')} /> : <Copy className={ICON} />}
      {done ? 'Copied' : label}
    </Button>
  );
}

export function DownloadButton({ text, filename, type, label = 'Download' }: { text: string; filename: string; type?: string; label?: string }) {
  return (
    <Button onClick={() => downloadText(text, filename, type)} title={`Download ${filename}`}>
      <Download className={ICON} /> {label}
    </Button>
  );
}

/** Opens the content in its own browser tab, at full width. */
export function OpenTabButton({ text, type, title = 'Open full view in a new tab' }: { text: string; type?: string; title?: string }) {
  return (
    <Button onClick={() => openInTab(text, type)} title={title} aria-label={title}>
      <ExternalLink className={ICON} />
    </Button>
  );
}

export function Toolbar({ left, children }: { left?: ReactNode; children?: ReactNode }) {
  return (
    <div className='flex flex-wrap items-center justify-between gap-tight'>
      <div className='flex items-center gap-tight'>{left}</div>
      <div className='flex flex-wrap items-center gap-1.5'>{children}</div>
    </div>
  );
}

type Lang = 'json' | 'typescript' | 'html' | 'markdown';

/** Highlighted code. Very long text falls back to a plain <pre> to stay fast. */
export function CodeView({ code, language, className }: { code: string; language: Lang; className?: string }) {
  const box = cx('overflow-auto rounded-lg border border-border bg-card text-xs leading-relaxed', className);
  if (code.length > 60_000) {
    return <pre className={cx(box, 'whitespace-pre-wrap break-words p-[0.85em] font-mono')}>{code}</pre>;
  }
  return (
    <div className={box}>
      <SyntaxHighlighter
        language={language}
        style={currentTheme() === 'dark' ? atomOneDark : github}
        wrapLongLines
        customStyle={{ margin: 0, padding: '0.85em', background: 'transparent', fontSize: 'var(--fs-xs)' }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}


/**
 * Rendered preview inside a sandboxed iframe: no scripts run, and links
 * open in a new tab. `html` must already be sanitized.
 */
export function HtmlPreview({ html, className }: { html: string; className?: string }) {
  return (
    <iframe
      title='Preview'
      sandbox='allow-popups allow-popups-to-escape-sandbox'
      srcDoc={previewDocument(html)}
      className={cx('w-full rounded-lg border border-border bg-card', className)}
    />
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className='rounded-lg border border-dashed border-input p-pad text-center text-xs text-muted-foreground'>{children}</div>;
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className='flex items-center justify-between gap-tight'>
      <h2 className='text-2xs font-semibold uppercase tracking-wide text-muted-foreground'>{children}</h2>
      {right}
    </div>
  );
}
