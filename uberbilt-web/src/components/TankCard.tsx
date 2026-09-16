import { Flame, Thermometer, TriangleAlert, Wifi } from 'lucide-react';
import { cx } from '../lib/cx';
import type { Tank } from '../types';

interface TankCardProps {
  tank: Tank;
  onClick: () => void;
}

export function TankCard({ tank, onClick }: TankCardProps) {
  const isCritical = tank.alertLevel === 'critical';
  const isConnecting = tank.connectivity === 'connecting';
  const showWarningBadge = tank.alertLevel === 'warning';
  const showOnline = tank.connectivity === 'online' && tank.alertLevel === 'none';
  const showOffline = tank.connectivity === 'offline' && !isCritical;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'flex min-h-[158px] flex-col rounded-2xl p-4 text-left shadow-soft md:min-h-[176px] lg:min-h-[188px] lg:p-5',
        isCritical ? 'bg-well' : 'bg-surface',
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <h2
          className={cx(
            'text-[15px] font-extrabold tracking-wide',
            isCritical ? 'text-danger' : 'text-brand',
          )}
        >
          TANK {tank.index}
        </h2>
        {showOnline && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-success">
            Online
            <Wifi className="h-3.5 w-3.5" strokeWidth={2.2} />
          </span>
        )}
        {showOffline && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-brand">
            Offline
            <Wifi className="h-3.5 w-3.5" strokeWidth={2.2} />
          </span>
        )}
        {showWarningBadge && (
          <TriangleAlert className="h-5 w-5 text-danger" strokeWidth={2.2} />
        )}
      </div>

      <p className="mt-1 text-[13px] text-muted">{tank.productName}</p>

      {isConnecting && (
        <div className="mt-auto flex justify-center pb-2 pt-6">
          <Wifi className="h-10 w-10 text-danger" strokeWidth={1.8} />
        </div>
      )}

      {isCritical && (
        <div className="mt-auto flex justify-center pb-1 pt-6">
          <TriangleAlert className="h-11 w-11 text-danger" strokeWidth={2} />
        </div>
      )}

      {!isConnecting && !isCritical && (
        <div className="mt-auto flex items-center justify-between pt-6 text-[13px] font-semibold">
          <span className="flex items-center gap-1 text-brand">
            <Thermometer className="h-4 w-4" strokeWidth={2} />
            {tank.temperatureC ?? '—'}°c
          </span>
          <span
            className={cx(
              'flex items-center gap-1',
              tank.heaterOn ? 'text-brand' : 'text-muted/55',
            )}
          >
            <Flame className="h-4 w-4" strokeWidth={2} />
            {tank.heaterOn ? 'On' : 'Off'}
          </span>
        </div>
      )}
    </button>
  );
}
