import type { ReactNode } from 'react';
import { cx } from '../lib/cx';

interface IconButtonProps {
  children: ReactNode;
  onClick?: () => void;
  ariaLabel: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function IconButton({ children, onClick, ariaLabel, className, size = 'md' }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={cx(
        'relative flex shrink-0 items-center justify-center rounded-full bg-surface shadow-soft',
        size === 'sm' ? 'h-10 w-10' : 'h-12 w-12',
        className,
      )}
    >
      {children}
    </button>
  );
}
