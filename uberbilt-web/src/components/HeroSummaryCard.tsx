import { Flame } from 'lucide-react';
import type { Tank, TankExtras } from '../types';
import { cx } from '../lib/cx';
import { InlineStatRow } from './InlineStatRow';

interface HeroSummaryCardProps {
  tank: Tank;
  extras?: TankExtras;
}

export function HeroSummaryCard({ tank, extras }: HeroSummaryCardProps) {
  const heaterUnknown = tank.heaterOn === null;
  const levelLabel =
    extras?.volumeM3 != null ? `${extras.volumeM3.toFixed(1)} m³` : extras?.levelMeters != null ? `${extras.levelMeters} m` : '—';

  return (
    <section className="rounded-2xl bg-surface px-5 py-5 shadow-soft lg:px-8 lg:py-7">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[22px] font-extrabold tracking-wide text-brand lg:text-[28px]">TANK {tank.index}</h2>
          <p className="mt-1 max-w-[200px] text-[13px] leading-snug text-muted lg:max-w-none lg:text-[15px]">
            Running {tank.productName}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[32px] font-extrabold leading-none text-brand lg:text-[44px]">
            {tank.temperatureC ?? '—'}°
          </p>
          <p className="mt-1 text-[12px] text-muted">Temperature</p>
        </div>
      </div>

      <div className="mt-6">
        <InlineStatRow
          items={[
            {
              label: 'Heating',
              value: (
                <span
                  className={cx(
                    'flex items-center justify-center gap-1',
                    heaterUnknown ? 'text-muted' : tank.heaterOn ? 'text-brand' : 'text-muted/60',
                  )}
                >
                  <Flame className="h-4 w-4" strokeWidth={2} />
                  {heaterUnknown ? '—' : tank.heaterOn ? 'On' : 'Off'}
                </span>
              ),
            },
            {
              label: 'Level',
              value: levelLabel,
            },
            {
              label: 'Pressure',
              value: tank.pressureHpa != null ? `${tank.pressureHpa} hpa` : '—',
            },
          ]}
        />
      </div>
    </section>
  );
}
