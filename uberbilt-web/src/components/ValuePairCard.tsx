import type { ReactNode } from 'react';
import { cx } from '../lib/cx';

interface ValuePairCardProps {
  leftLabel: string;
  leftValue: ReactNode;
  rightLabel: string;
  rightValue: ReactNode;
  rightAction?: ReactNode;
  className?: string;
}

export function ValuePairCard({
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  rightAction,
  className,
}: ValuePairCardProps) {
  return (
    <section className={cx('rounded-2xl bg-surface px-5 py-4 shadow-soft', className)}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="whitespace-pre-line text-[13px] leading-tight text-muted">{leftLabel}</p>
          <p className="mt-2 text-[28px] font-extrabold leading-none text-brand">{leftValue}</p>
        </div>
        <div className="text-right">
          <p className="text-[13px] leading-tight text-muted">{rightLabel}</p>
          <div className="mt-2 flex items-center justify-end gap-2">
            <p className="text-[28px] font-extrabold leading-none text-brand">{rightValue}</p>
            {rightAction}
          </div>
        </div>
      </div>
    </section>
  );
}
