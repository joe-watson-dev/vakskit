import { useEffect, useRef, useState } from 'react';
import { cx } from '@/lib/cx';
import type { ThemeChoice } from '@/lib/theme';
import { Check, Monitor, Moon, Sun } from './icons';
import { Button, ICON } from './ui';

const OPTIONS: { value: ThemeChoice; label: string; Icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
];

/** Theme menu: Light / Dark / System (default). */
export function ThemeToggle({ choice, resolved, onChange }: { choice: ThemeChoice; resolved: 'light' | 'dark'; onChange: (t: ThemeChoice) => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const CurrentIcon = resolved === 'dark' ? Moon : Sun;

  return (
    <div ref={root} className='relative'>
      <Button onClick={() => setOpen(!open)} title='Theme' aria-label='Change theme' aria-haspopup='menu' aria-expanded={open}>
        <CurrentIcon className={ICON} />
      </Button>
      {open && (
        <div role='menu' className='absolute right-0 top-full z-30 mt-1 min-w-[9em] rounded-lg border border-border bg-card p-1 text-xs shadow-lg'>
          {OPTIONS.map(({ value, label, Icon }) => (
            <button
              key={value}
              role='menuitemradio'
              aria-checked={choice === value}
              autoFocus={choice === value}
              onClick={() => {
                onChange(value);
                setOpen(false);
              }}
              className={cx(
                'flex w-full items-center gap-2 rounded-md px-[0.6em] py-[0.5em] text-left hover:bg-muted',
                choice === value ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              <Icon className={ICON} />
              <span className='flex-1'>{label}</span>
              {choice === value && <Check className={cx(ICON, 'text-primary')} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
