import { Pencil, Thermometer } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { CapsuleGauge } from '../components/CapsuleGauge';
import { ScreenHeader } from '../components/ScreenHeader';
import { useApp } from '../store';

const ticks = [0, 50, 100, 150, 200, 250, 300].map((value) => ({
  value,
  label: `${value}°c`,
}));

export function Temperature() {
  const { tankId } = useParams();
  const { getTank, extras } = useApp();
  const navigate = useNavigate();
  const tank = tankId ? getTank(tankId) : undefined;

  if (!tank) return <Navigate to="/dashboard" replace />;

  const extra = extras[tank.id];
  const live = tank.temperatureC ?? 0;
  const target = tank.targetTemperatureC ?? 0;

  return (
    <>
      <ScreenHeader title="Temperature" />
      <div className="flex min-h-[560px] flex-1 flex-col md:max-w-3xl lg:max-w-4xl">
        <div className="flex flex-1 gap-2 md:gap-8 lg:gap-10">
          <div className="w-[38%] pt-4 md:w-[30%] lg:w-[28%] lg:pt-6">
            <h2 className="text-[22px] font-extrabold tracking-wide text-brand">TANK {tank.index}</h2>
            <p className="mt-1 max-w-[120px] text-[13px] leading-snug text-muted">
              Running {tank.productName}
            </p>
          </div>
          <div className="flex flex-1 flex-col">
            <div className="mb-2 flex justify-end pr-3">
              <Thermometer className="h-6 w-6 text-brand" strokeWidth={1.8} />
            </div>
            <div className="h-[min(430px,70vh)] md:h-[480px] lg:h-[520px]">
              <CapsuleGauge min={0} max={300} live={live} target={target} ticks={ticks} dualTone />
            </div>
          </div>
        </div>
        {extra?.zones.length ? (
          <section className="mt-4 grid grid-cols-3 gap-3">
            {extra.zones.map((zone) => (
              <div key={zone.name} className="rounded-2xl bg-surface px-4 py-3 shadow-soft">
                <p className="text-[12px] text-muted">{zone.name}</p>
                <p className="mt-1 text-[18px] font-extrabold text-brand">{Math.round(zone.value)}°c</p>
              </div>
            ))}
          </section>
        ) : null}
        <section className="mt-6 flex items-end justify-between rounded-2xl bg-surface px-5 py-4 shadow-soft">
          <div className="flex items-start gap-2">
            <span className="mt-1 h-8 w-1.5 rounded-full bg-brand" />
            <div>
              <p className="text-[13px] leading-tight text-muted">
                Live
                <br />
                Temperature
              </p>
              <p className="mt-2 text-[26px] font-extrabold leading-none text-brand">{live}°c</p>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex items-start gap-2">
              <span className="mt-1 h-8 w-1.5 rounded-full bg-accent-light" />
              <div className="text-left">
                <p className="text-[13px] leading-tight text-muted">
                  Target
                  <br />
                  Temperature
                </p>
                <p className="mt-2 text-[26px] font-extrabold leading-none text-brand">{target}°c</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Edit target temperature"
              onClick={() => navigate(`/tanks/${tank.id}/temperature/edit`)}
              className="mb-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-[#1AD3E0] text-white shadow-soft"
            >
              <Pencil className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
