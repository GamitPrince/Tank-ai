import { Navigate, useParams } from 'react-router-dom';
import { ScreenHeader } from '../components/ScreenHeader';
import { WideLevelTrack } from '../components/VerticalGaugeTrack';
import { useApp } from '../store';
import type { LevelZone } from '../types';

const zones: { zone: LevelZone; level: number; name: string }[] = [
  { zone: 'high-high', level: 4, name: 'High-High' },
  { zone: 'high', level: 3, name: 'High' },
  { zone: 'safe', level: 2, name: 'Safe' },
  { zone: 'low', level: 1, name: 'Low' },
];

export function Level() {
  const { tankId } = useParams();
  const { getTank, extras } = useApp();
  const tank = tankId ? getTank(tankId) : undefined;

  if (!tank) return <Navigate to="/dashboard" replace />;

  const extra = extras[tank.id];
  const percent = tank.levelPercent ?? 0;
  const zone = tank.levelZone ?? 'low';
  const current = zones.find((item) => item.zone === zone) ?? zones[3];

  return (
    <>
      <ScreenHeader title="Level" />
      <div className="flex flex-col md:max-w-3xl">
        <div className="flex h-[min(500px,70vh)] gap-3 md:h-[540px] md:gap-5 lg:h-[560px] lg:gap-6">
          <div className="flex w-[34%] flex-col justify-between py-6 text-right">
            {zones.map((item) => (
              <div key={item.zone}>
                <p className="text-[13px] font-medium leading-tight text-muted">Level {item.level}</p>
                <p className="text-[13px] font-medium leading-tight text-muted">{item.name}</p>
              </div>
            ))}
          </div>
          <div className="w-[22px] py-4">
            <div className="relative h-full rounded-full bg-surface p-[5px] shadow-soft">
              <div className="relative h-full overflow-hidden rounded-full bg-well">
                <div
                  className="absolute bottom-0 left-0 w-full rounded-full"
                  style={{
                    height: `${percent}%`,
                    background: 'linear-gradient(to top, #01646A 0%, #11E4F3 100%)',
                  }}
                />
              </div>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <WideLevelTrack percent={percent} />
          </div>
        </div>
        <section className="mt-6 flex items-center justify-between rounded-2xl bg-surface px-5 py-5 shadow-soft">
          <p className="text-[16px] font-semibold text-ink">Current Level</p>
          <div className="text-right">
            <p className="text-[16px] font-bold text-ink">Level {current.level}</p>
            <p className="text-[13px] text-muted">{current.name} Level</p>
          </div>
        </section>
        {extra && (
          <section className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <MiniStat label="Radar" value={`${extra.radarPct.toFixed(1)}%`} />
            <MiniStat label="Pressure" value={`${extra.pressurePct.toFixed(1)}%`} />
            <MiniStat label="Volume" value={`${extra.volumeM3.toFixed(1)} m³`} />
            <MiniStat
              label="Rate"
              value={
                extra.fillingRate > 0
                  ? `+${extra.fillingRate.toFixed(1)}`
                  : extra.emptyingRate < 0
                    ? extra.emptyingRate.toFixed(1)
                    : '0'
              }
            />
          </section>
        )}
      </div>
    </>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface px-4 py-4 shadow-soft">
      <p className="text-[12px] text-muted">{label}</p>
      <p className="mt-1 text-[15px] font-extrabold text-brand">{value}</p>
    </div>
  );
}
