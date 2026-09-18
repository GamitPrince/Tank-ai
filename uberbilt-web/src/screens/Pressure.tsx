import { Gauge } from 'lucide-react';
import { Navigate, useParams } from 'react-router-dom';
import { CapsuleGauge } from '../components/CapsuleGauge';
import { ScreenHeader } from '../components/ScreenHeader';
import { ValuePairCard } from '../components/ValuePairCard';
import { useApp } from '../store';

const ticks = [0, 400, 800, 1200, 1600, 2000].map((value) => ({
  value,
  label: `${value}`,
}));

export function Pressure() {
  const { tankId } = useParams();
  const { getTank } = useApp();
  const tank = tankId ? getTank(tankId) : undefined;

  if (!tank) return <Navigate to="/dashboard" replace />;

  const live = tank.pressureHpa ?? 0;

  return (
    <>
      <ScreenHeader title="Pressure" />
      <div className="flex min-h-[560px] flex-1 flex-col md:max-w-3xl lg:max-w-4xl">
        <div className="flex flex-1 gap-2 md:gap-8 lg:gap-10">
          <div className="w-[42%] pt-10 md:w-[30%] lg:w-[28%] lg:pt-6">
            <h2 className="text-[22px] font-extrabold tracking-wide text-brand">TANK {tank.index}</h2>
            <p className="mt-1 max-w-[120px] text-[13px] leading-snug text-muted">
              Running {tank.productName}
            </p>
          </div>
          <div className="flex flex-1 flex-col">
            <div className="mb-2 flex justify-end pr-2">
              <Gauge className="h-6 w-6 text-brand" strokeWidth={1.8} />
            </div>
            <div className="h-[min(430px,70vh)] md:h-[480px] lg:h-[520px]">
              <CapsuleGauge min={0} max={2000} live={live} ticks={ticks} />
            </div>
          </div>
        </div>
        <ValuePairCard
          className="mt-6"
          leftLabel={'Live\nPressure'}
          leftValue={`${live} hpa`}
          rightLabel={'Scale'}
          rightValue="2000"
        />
      </div>
    </>
  );
}
