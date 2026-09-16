import { TriangleAlert, Wifi } from 'lucide-react';
import type { MouseEvent } from 'react';
import type { NotificationItem } from '../types';

interface NotificationCardProps {
  item: NotificationItem;
  onOpen?: () => void;
  onAcknowledge?: () => void;
}

export function NotificationCard({ item, onOpen, onAcknowledge }: NotificationCardProps) {
  const Icon = item.type === 'warning' ? TriangleAlert : Wifi;

  const acknowledge = (event: MouseEvent) => {
    event.stopPropagation();
    onAcknowledge?.();
  };

  return (
    <article
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (!onOpen) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
      className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-surface px-5 py-4 shadow-soft"
    >
      <div className="min-w-0">
        <p className="text-[15px] font-extrabold tracking-wide text-ink">
          {item.tankLabel}{' '}
          <span className="font-medium capitalize text-muted">{item.title}</span>
        </p>
        <p className="mt-1 text-[13px] text-muted">{item.message}</p>
        {onAcknowledge ? (
          <button
            type="button"
            onClick={acknowledge}
            className="mt-3 text-[12px] font-semibold text-brand hover:underline"
          >
            Acknowledge
          </button>
        ) : null}
      </div>
      <Icon className="h-9 w-9 shrink-0 text-danger" strokeWidth={1.8} />
    </article>
  );
}
