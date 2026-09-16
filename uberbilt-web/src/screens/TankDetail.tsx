import { Droplet, Flame, Gauge, Thermometer } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { HeroSummaryCard } from '../components/HeroSummaryCard';
import { NavTile } from '../components/NavTile';
import { NetworkCard } from '../components/NetworkCard';
import { ScreenHeader } from '../components/ScreenHeader';
import { useApp } from '../store';

export function TankDetail() {
  const { tankId } = useParams();
  const { getTank, extras } = useApp();
  const navigate = useNavigate();
  const tank = tankId ? getTank(tankId) : undefined;

  if (!tank) return <Navigate to="/dashboard" replace />;

  const extra = extras[tank.id];
  const base = `/tanks/${tank.id}`;

  return (
    <>
      <ScreenHeader />
      <div className="flex flex-col gap-5 lg:gap-6">
        <HeroSummaryCard tank={tank} extras={extra} />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <NavTile icon={Flame} label="Heater" onClick={() => navigate(`${base}/heater`)} />
          <NavTile icon={Thermometer} label="Temperature" onClick={() => navigate(`${base}/temperature`)} />
          <NavTile icon={Droplet} label="Level" onClick={() => navigate(`${base}/level`)} />
          <NavTile icon={Gauge} label="Pressure" onClick={() => navigate(`${base}/pressure`)} />
        </div>
        {extra && (
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <MiniStat label="Radar" value={`${extra.radarPct.toFixed(1)}%`} />
            <MiniStat label="Health" value={`${extra.healthScore}%`} />
            <MiniStat label="Mass" value={`${extra.massTonnes.toFixed(1)} t`} />
            <MiniStat label="Trend" value={extra.trend} />
          </section>
        )}
        {extra?.advisories.length ? (
          <section className="rounded-2xl bg-surface px-5 py-4 shadow-soft">
            <p className="text-[13px] font-semibold text-muted">Advisories</p>
            <ul className="mt-2 space-y-2">
              {extra.advisories.map((message) => (
                <li key={message} className="text-[14px] text-ink">
                  {message}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <NetworkCard connectivity={tank.connectivity} />
      </div>
    </>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface px-4 py-4 shadow-soft">
      <p className="text-[12px] text-muted">{label}</p>
      <p className="mt-1 text-[16px] font-extrabold capitalize text-brand">{value}</p>
    </div>
  );
}
