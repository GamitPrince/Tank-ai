import { useState } from 'react';
import { Thermometer } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { PillButton } from '../components/PillButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { VerticalSliderTrack } from '../components/VerticalSliderTrack';
import { useApp } from '../store';

const ticks = [0, 50, 100, 150, 200, 250, 300].map((value) => ({
  value,
  label: `${value}°c`,
}));

export function EditTargetTemperature() {
  const { tankId } = useParams();
  const { getTank, setTargetTemperature } = useApp();
  const navigate = useNavigate();
  const tank = tankId ? getTank(tankId) : undefined;
  const [draft, setDraft] = useState(tank?.targetTemperatureC ?? 0);

  if (!tank) return <Navigate to="/dashboard" replace />;

  const live = tank.temperatureC ?? 0;
  const target = tank.targetTemperatureC ?? 0;

  const apply = () => {
    setTargetTemperature(tank.id, draft);
    navigate(`/tanks/${tank.id}/temperature`);
  };

  return (
    <>
      <ScreenHeader title="Target Temperature" />
      <div className="flex min-h-[620px] flex-1 flex-col md:max-w-3xl lg:max-w-4xl">
        <div className="flex min-h-0 flex-1 gap-3 md:gap-8 lg:gap-10">
          <div className="flex w-[48%] flex-col gap-4 md:w-[280px] lg:w-[320px]">
            <div>
              <h2 className="text-[22px] font-extrabold tracking-wide text-brand">TANK {tank.index}</h2>
              <p className="mt-1 max-w-[140px] text-[13px] leading-snug text-muted">
                Running {tank.productName}
              </p>
            </div>
            <section className="rounded-2xl bg-surface px-4 py-5 shadow-soft">
              <p className="text-[14px] leading-snug text-muted">Live Temperature</p>
              <p className="mt-2 text-[28px] font-extrabold text-brand">{live}°c</p>
              <p className="mt-5 text-[14px] leading-snug text-muted">Target Temperature</p>
              <p className="mt-2 text-[28px] font-extrabold text-brand">{target}°c</p>
            </section>
            <section className="rounded-2xl bg-surface px-4 py-5 shadow-soft">
              <p className="text-[14px] leading-snug text-muted">Change Temperature</p>
              <div className="mt-4 rounded-2xl bg-well px-3 py-4 text-center shadow-inset">
                <p className="text-[28px] font-extrabold text-brand">{draft}°c</p>
              </div>
            </section>
          </div>
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="mb-2 flex justify-end pr-2">
              <Thermometer className="h-6 w-6 text-brand" strokeWidth={1.8} />
            </div>
            <div className="h-[min(460px,70vh)] md:h-[500px] lg:h-[520px]">
              <VerticalSliderTrack min={0} max={300} value={draft} onChange={setDraft} ticks={ticks} />
            </div>
          </div>
        </div>
        <div className="flex justify-center pt-8">
          <PillButton onClick={apply}>Apply</PillButton>
        </div>
      </div>
    </>
  );
}
