interface CircularGaugeDialProps {
  value: number;
  max?: number;
  label: string;
  powerOn: boolean | null;
  onTogglePower: () => void;
}

export function CircularGaugeDial({
  value,
  max = 100,
  label,
  powerOn,
  onTogglePower,
}: CircularGaugeDialProps) {
  const size = 236;
  const stroke = 18;
  const radius = (size - stroke) / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const trackFraction = 0.75;
  const trackLength = circumference * trackFraction;
  const progress = Math.min(Math.max(value / max, 0), 1);
  const progressLength = trackLength * progress;
  const center = size / 2;
  const canToggle = powerOn !== null;

  return (
    <div className="relative mx-auto flex w-[236px] items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-sm">
        <defs>
          <linearGradient id="heaterArc" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C66E16" />
            <stop offset="55%" stopColor="#F37121" />
            <stop offset="100%" stopColor="#FF8526" />
          </linearGradient>
        </defs>
        <circle
          cx={center}
          cy={center}
          r={radius + 18}
          fill="var(--dial-plate)"
        />
        <circle cx={center} cy={center} r={radius - 16} fill="var(--dial-face)" />
        <g transform={`rotate(135 ${center} ${center})`}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--dial-track)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${trackLength} ${circumference}`}
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="url(#heaterArc)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${progressLength} ${circumference}`}
          />
        </g>
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-8">
        <p className="text-[42px] font-extrabold leading-none text-brand">{value}°</p>
        <p className="mt-2 max-w-[90px] text-center text-[13px] leading-tight text-muted">{label}</p>
      </div>
      <button
        type="button"
        aria-label={powerOn ? 'Turn heater off' : 'Turn heater on'}
        onClick={onTogglePower}
        disabled={!canToggle}
        className="absolute bottom-1 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-surface shadow-soft disabled:opacity-50"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 2v10"
            stroke={powerOn ? '#F37121' : 'var(--color-muted)'}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M7.05 5.64a8 8 0 1 0 9.9 0"
            stroke={powerOn ? '#F37121' : 'var(--color-muted)'}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
