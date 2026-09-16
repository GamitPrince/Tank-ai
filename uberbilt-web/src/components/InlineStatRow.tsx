import type { ReactNode } from 'react';

interface InlineStat {
  label: string;
  value: ReactNode;
}

export function InlineStatRow({ items }: { items: InlineStat[] }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      {items.map((item) => (
        <div key={item.label}>
          <div className="text-[13px] font-semibold text-ink">{item.value}</div>
          <p className="mt-1 text-[12px] text-muted">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
