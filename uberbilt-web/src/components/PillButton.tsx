import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../lib/cx';

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function PillButton({ children, className, ...props }: PillButtonProps) {
  return (
    <button
      type="button"
      className={cx(
        'mx-auto min-w-[148px] rounded-full bg-surface px-10 py-3.5 text-[15px] font-bold text-brand shadow-soft',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
