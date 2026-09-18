import { cx } from '../lib/cx';

interface Tick {
  value: number;
  label: string;
}

interface VerticalGaugeTrackProps {
  min: number;
  max: number;
  live: number;
  target?: number;
  ticks: Tick[];
  dualTone?: boolean;
  fill?: 'teal' | 'dual';
  className?: string;
}

export function VerticalGaugeTrack({
  min,
  max,
  live,
  target,
  ticks,
  dualTone = false,
  className,
}: VerticalGaugeTrackProps) {
  const span = max - min;
  const livePct = ((Math.min(Math.max(live, min), max) - min) / span) * 100;
  const targetPct =
    target == null ? livePct : ((Math.min(Math.max(target, min), max) - min) / span) * 100;
  const fillHeight = dualTone ? Math.max(livePct, targetPct) : livePct;

  const fillStyle = dualTone
    ? {
        height: `${fillHeight}%`,
        background: `linear-gradient(to top,
          #F37121 0%,
          #F37121 ${(livePct / fillHeight) * 100}%,
          #01646A ${(livePct / fillHeight) * 100}%,
          #11E4F3 100%)`,
      }
    : {
        height: `${fillHeight}%`,
        background: 'linear-gradient(to top, #01646A 0%, #11E4F3 100%)',
      };

  return (
    <div className={cx('relative flex h-full items-stretch', className)}>
      <div className="relative mr-2 flex w-14 flex-col justify-between py-1 text-right">
        {[...ticks].reverse().map((tick) => (
          <div key={tick.value} className="flex items-center justify-end gap-1">
            <span className="text-[11px] font-medium text-muted">{tick.label}</span>
            <span className="text-[11px] text-muted/70">—</span>
          </div>
        ))}
      </div>
      <div className="relative w-[22px] rounded-full bg-surface py-1.5 shadow-soft">
        <div className="relative mx-auto h-full w-[10px] overflow-hidden rounded-full bg-well">
          <div className="absolute bottom-0 left-0 w-full rounded-full" style={fillStyle} />
        </div>
      </div>
    </div>
  );
}

interface WideLevelTrackProps {
  percent: number;
}

export function WideLevelTrack({ percent }: WideLevelTrackProps) {
  const height = Math.min(Math.max(percent, 0), 100);
  return (
    <div className="h-full w-full rounded-[28px] bg-surface p-3 shadow-soft">
      <div className="relative h-full w-full overflow-hidden rounded-[22px] bg-well">
        <div
          className="absolute bottom-0 left-0 w-full rounded-[28px]"
          style={{
            height: `${height}%`,
            background: 'linear-gradient(to top, #01646A 0%, #11E4F3 100%)',
          }}
        />
      </div>
    </div>
  );
}
