import { cx } from '../lib/cx';

export interface GaugeTick {
  value: number;
  label: string;
}

interface CapsuleGaugeProps {
  min: number;
  max: number;
  live: number;
  target?: number;
  ticks: GaugeTick[];
  dualTone?: boolean;
  className?: string;
}

export function CapsuleGauge({
  min,
  max,
  live,
  target,
  ticks,
  dualTone = false,
  className,
}: CapsuleGaugeProps) {
  const span = max - min;
  const livePct = ((clamp(live, min, max) - min) / span) * 100;
  const topValue = dualTone ? (target ?? live) : live;
  const fillPct = ((clamp(topValue, min, max) - min) / span) * 100;
  const orangeShare = fillPct === 0 ? 0 : (livePct / fillPct) * 100;

  const fillStyle = dualTone
    ? {
        height: `${fillPct}%`,
        background: `linear-gradient(to top, #F37121 0%, #F37121 ${orangeShare}%, #01646A ${orangeShare}%, #11E4F3 100%)`,
      }
    : {
        height: `${fillPct}%`,
        background: 'linear-gradient(to top, #01646A 0%, #11E4F3 100%)',
      };

  return (
    <div className={cx('flex h-full items-stretch gap-1', className)}>
      <div className="flex w-[58px] flex-col justify-between py-3 text-right">
        {[...ticks].reverse().map((tick) => (
          <div key={tick.value} className="flex items-center justify-end gap-1">
            <span className="text-[11px] font-medium text-muted">{tick.label}</span>
            <span className="text-muted/60">—</span>
          </div>
        ))}
      </div>
      <div className="relative h-full w-11 rounded-full bg-surface p-[6px] shadow-soft">
        <div className="relative h-full w-full overflow-hidden rounded-full bg-well">
          <div className="absolute bottom-0 left-0 w-full rounded-full" style={fillStyle} />
        </div>
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
