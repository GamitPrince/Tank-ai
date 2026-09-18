import { Zap } from 'lucide-react';
import { Navigate, useParams } from 'react-router-dom';
import { CircularGaugeDial } from '../components/CircularGaugeDial';
import { ScreenHeader } from '../components/ScreenHeader';
import { StatCard } from '../components/StatCard';
import { useApp } from '../store';

export function Heater() {
  const { tankId } = useParams();
  const { getTank, extras, toggleHeater } = useApp();
  const tank = tankId ? getTank(tankId) : undefined;

  if (!tank) return <Navigate to="/dashboard" replace />;

  const extra = extras[tank.id];
  const heaterTemp = extra?.heaterTemperatureC ?? 0;
  const energy = extra?.energyKwh ?? 0;
  const delta = extra?.energyDeltaPct ?? 0;
  const less = delta < 0;

  return (
    <>
      <ScreenHeader title="Heater" />
      <div className="flex flex-col gap-5 md:grid md:grid-cols-[240px_1fr] md:items-start md:gap-8 lg:max-w-4xl lg:grid-cols-[280px_1fr]">
        <CircularGaugeDial
          value={heaterTemp}
          label="Heater Temperature"
          powerOn={tank.heaterOn}
          onTogglePower={() => toggleHeater(tank.id)}
        />
        <div className="flex flex-col gap-5">
          <StatCard className="relative">
            <p className="text-[13px] text-muted">{extra?.energyDate ?? '—'}</p>
            <p className="mt-1 text-[15px] font-semibold text-ink">Energy Usage</p>
            <p className="mt-2 text-[28px] font-extrabold leading-none text-brand">
              {energy.toFixed(1)} <span className="text-[13px] font-medium text-muted">KW/h</span>
            </p>
            <p className="mt-2 text-[12px] text-muted">
              {Math.abs(delta)}% {less ? 'less' : 'more'} than yesterday
            </p>
            <span className="absolute right-5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-canvas shadow-soft">
              <Zap className="h-5 w-5 text-brand" strokeWidth={1.8} />
            </span>
          </StatCard>
          <StatCard className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand shadow-soft">
              <Zap className="h-6 w-6 text-white" strokeWidth={2} />
            </span>
            <div>
              <p className="text-[26px] font-extrabold leading-none text-brand">
                {energy.toFixed(1)} <span className="text-[13px] font-medium text-muted">KW/h</span>
              </p>
              <p className="mt-1 text-[13px] text-muted">Energy Usage this day</p>
            </div>
          </StatCard>
          <StatCard>
            <p className="text-[13px] text-muted">Efficiency</p>
            <p className="mt-2 text-[28px] font-extrabold text-brand">{extra?.efficiencyScore ?? 0}%</p>
            <p className="mt-3 text-[13px] text-muted">
              Hold at {extra?.holdingTempRecommendation ?? '—'}°C · Save {extra?.estimatedSavingsPct ?? 0}%
            </p>
          </StatCard>
        </div>
      </div>
    </>
  );
}
