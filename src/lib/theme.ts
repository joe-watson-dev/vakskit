import { useEffect, useState } from 'react';

export type ThemeChoice = 'system' | 'light' | 'dark';

// Same key as public/theme-init.js, which applies the theme before first paint.
const KEY = 'vakskit-theme';
const media = window.matchMedia('(prefers-color-scheme: dark)');

const read = (): ThemeChoice => {
  const v = localStorage.getItem(KEY);
  return v === 'light' || v === 'dark' ? v : 'system';
};

const resolve = (choice: ThemeChoice) => (choice === 'system' ? (media.matches ? 'dark' : 'light') : choice);

function apply(choice: ThemeChoice) {
  document.documentElement.classList.toggle('dark', resolve(choice) === 'dark');
}

/**
 * Light / dark / system theme, shadcn-style: a `.dark` class on <html>.
 * The choice is shared by the side panel and full-view tabs (same origin).
 */
export function useTheme() {
  const [choice, setChoice] = useState<ThemeChoice>(read);
  const [resolved, setResolved] = useState<'light' | 'dark'>(() => resolve(read()));

  useEffect(() => {
    apply(choice);
    setResolved(resolve(choice));
    const onSystem = () => {
      apply(choice);
      setResolved(resolve(choice));
    };
    const onStorage = (e: StorageEvent) => e.key === KEY && setChoice(read());
    media.addEventListener('change', onSystem);
    window.addEventListener('storage', onStorage);
    return () => {
      media.removeEventListener('change', onSystem);
      window.removeEventListener('storage', onStorage);
    };
  }, [choice]);

  const set = (next: ThemeChoice) => {
    if (next === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, next);
    apply(next); // synchronously, so components that read currentTheme() in this render are right
    setChoice(next);
  };

  return { choice, resolved, setTheme: set };
}

/** Theme currently applied to the page (read at render time). */
export const currentTheme = (): 'light' | 'dark' => (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
