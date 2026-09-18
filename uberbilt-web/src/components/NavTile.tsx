import type { LucideIcon } from 'lucide-react';

interface NavTileProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

export function NavTile({ icon: Icon, label, onClick }: NavTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[132px] flex-col items-center justify-center gap-3 rounded-2xl bg-surface shadow-soft md:min-h-[148px] lg:min-h-[160px]"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface shadow-soft">
        <Icon className="h-5 w-5 text-brand" strokeWidth={1.75} />
      </span>
      <span className="text-[14px] font-medium text-muted">{label}</span>
    </button>
  );
}
