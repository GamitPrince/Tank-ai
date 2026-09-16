import { useCallback, useRef, type PointerEvent } from 'react';

interface VerticalSliderTrackProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  ticks: { value: number; label: string }[];
}

export function VerticalSliderTrack({ min, max, value, onChange, ticks }: VerticalSliderTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const span = max - min;
  const pct = ((value - min) / span) * 100;

  const valueFromClientY = useCallback(
    (clientY: number) => {
      const el = trackRef.current;
      if (!el) return value;
      const rect = el.getBoundingClientRect();
      const ratio = 1 - (clientY - rect.top) / rect.height;
      const next = min + Math.min(1, Math.max(0, ratio)) * span;
      return Math.round(next);
    },
    [min, span, value],
  );

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    onChange(valueFromClientY(event.clientY));
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    onChange(valueFromClientY(event.clientY));
  };

  return (
    <div className="relative flex h-full items-stretch">
      <div className="relative mr-1 flex w-[58px] flex-col justify-between py-4 text-right">
        {[...ticks].reverse().map((tick) => (
          <div key={tick.value} className="flex items-center justify-end gap-1">
            <span className="text-[11px] font-medium text-muted">{tick.label}</span>
            <span className="text-[11px] text-muted/70">—</span>
          </div>
        ))}
      </div>
      <div
        ref={trackRef}
        className="relative w-11 cursor-ns-resize touch-none rounded-full bg-surface p-[6px] shadow-soft"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
      >
        <div className="relative h-full w-full overflow-hidden rounded-full bg-well">
          <div
            className="absolute bottom-0 left-0 w-full rounded-full"
            style={{
              height: `${pct}%`,
              background: 'linear-gradient(to top, #01646A 0%, #11E4F3 100%)',
            }}
          />
        </div>
        <div
          className="pointer-events-none absolute left-1/2 h-9 w-9 -translate-x-1/2 rounded-full bg-handle shadow-soft"
          style={{ bottom: `calc(${pct}% - 18px)` }}
        />
      </div>
    </div>
  );
}
