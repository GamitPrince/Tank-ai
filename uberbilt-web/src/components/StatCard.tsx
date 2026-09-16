import type { ReactNode } from 'react';
import { cx } from '../lib/cx';

interface StatCardProps {
  children: ReactNode;
  className?: string;
}

export function StatCard({ children, className }: StatCardProps) {
  return (
    <section className={cx('rounded-2xl bg-surface p-5 shadow-soft', className)}>{children}</section>
  );
}
