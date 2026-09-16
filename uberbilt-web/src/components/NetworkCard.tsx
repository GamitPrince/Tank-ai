import { Wifi } from 'lucide-react';
import type { Connectivity } from '../types';
import { cx } from '../lib/cx';

export function NetworkCard({ connectivity }: { connectivity: Connectivity }) {
  const isOnline = connectivity === 'online';
  const isConnecting = connectivity === 'connecting';
  const label = isOnline ? 'Online' : isConnecting ? 'Connecting' : 'Offline';
  const status = isOnline ? 'Connected' : isConnecting ? 'Connecting' : 'Disconnected';

  return (
    <section className="flex items-center justify-between rounded-2xl bg-surface px-5 py-4 shadow-soft">
      <p className="text-[14px] text-muted">Network connection</p>
      <div className="text-right">
        <p className="text-[13px] font-semibold text-ink">{status}</p>
        <p
          className={cx(
            'mt-0.5 flex items-center justify-end gap-1 text-[12px] font-semibold',
            isOnline ? 'text-success' : isConnecting ? 'text-brand' : 'text-danger',
          )}
        >
          <Wifi className="h-3.5 w-3.5" strokeWidth={2.2} />
          {label}
        </p>
      </div>
    </section>
  );
}
