import { useEffect, useRef } from 'react';
import type { ThemeChoice } from '@/lib/theme';

type Props = {
  onClose: () => void;
  theme: ThemeChoice;
  onTheme: (t: ThemeChoice) => void;
  mainOnly: boolean;
  onMainOnly: (v: boolean) => void;
  auto: boolean;
  onAuto: (v: boolean) => void;
};

/** The ··· menu: theme and the two reading settings. */
export function Menu({ onClose, theme, onTheme, mainOnly, onMainOnly, auto, onAuto }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.parentElement?.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [onClose]);

  return (
    <div className='menu' ref={ref} role='menu'>
      <div className='mlabel'>Theme</div>
      <div className='seg' role='group' aria-label='Theme'>
        {(['light', 'dark', 'system'] as ThemeChoice[]).map((t) => (
          <button key={t} aria-pressed={theme === t} onClick={() => onTheme(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className='mlabel'>Reading</div>
      <button className='opt' role='menuitemcheckbox' aria-checked={mainOnly} onClick={() => onMainOnly(!mainOnly)}>
        <span>
          Main content only
          <small>Skip menus, header and footer</small>
        </span>
        <span className={`toggle${mainOnly ? ' on' : ''}`} />
      </button>
      <button className='opt' role='menuitemcheckbox' aria-checked={auto} onClick={() => onAuto(!auto)}>
        <span>
          Auto-analyze
          <small>When you switch tabs or a page loads</small>
        </span>
        <span className={`toggle${auto ? ' on' : ''}`} />
      </button>
    </div>
  );
}
