import { Moon, Sun } from 'lucide-react';
import { cx } from '../lib/cx';
import { useApp } from '../store';

export function ThemeToggle({ compact = false, size = 'md' }: { compact?: boolean; size?: 'sm' | 'md' }) {
  const { theme, toggleTheme } = useApp();
  const isDark = theme === 'dark';
  const box = size === 'sm' ? 'h-10 w-10' : 'h-12 w-12';

  if (compact) {
    return (
      <button
        type="button"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={toggleTheme}
        className={`relative flex ${box} shrink-0 items-center justify-center rounded-full bg-surface shadow-soft`}
      >
        {isDark ? (
          <Sun className="h-5 w-5 text-brand" strokeWidth={1.75} />
        ) : (
          <Moon className="h-5 w-5 text-brand" strokeWidth={1.75} />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex w-full items-center justify-between rounded-2xl bg-surface px-5 py-4 text-left shadow-soft"
    >
      <span className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface shadow-soft">
          {isDark ? (
            <Moon className="h-5 w-5 text-brand" strokeWidth={1.75} />
          ) : (
            <Sun className="h-5 w-5 text-brand" strokeWidth={1.75} />
          )}
        </span>
        <span>
          <span className="block text-[15px] font-semibold text-ink">Appearance</span>
          <span className="block text-[13px] text-muted">{isDark ? 'Dark mode' : 'Light mode'}</span>
        </span>
      </span>
      <span
        className={cx(
          'relative h-7 w-12 rounded-full transition-colors',
          isDark ? 'bg-brand' : 'bg-well',
        )}
      >
        <span
          className={cx(
            'absolute top-0.5 h-6 w-6 rounded-full bg-surface shadow-soft transition-transform',
            isDark ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </span>
    </button>
  );
}
