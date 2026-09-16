import { Droplet, Flame, Gauge, Thermometer, Activity } from 'lucide-react';
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
          <NavTile icon={Activity} label="Consumption" onClick={() => navigate(`${base}/consumption`)} />
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
          <section className="rounded-2xl bg-surface px-5 py-4 shadow-soft">
            <p className="text-[13px] font-semibold text-muted mb-3">Equipment Status</p>
            <div className="flex flex-col gap-2">
              <EquipmentRow label="Inlet Valve" on={extra?.equipment.inletValve || false} />
              <EquipmentRow label="Outlet Valve" on={extra?.equipment.outletValve || false} />
              <EquipmentRow label="Inlet Pump" on={extra?.equipment.inletPump || false} />
              <EquipmentRow label="Outlet Pump" on={extra?.equipment.outletPump || false} />
              <EquipmentRow label="Circulation Pump" on={extra?.equipment.circulationPumpStatus || false} />
            </div>
          </section>
          
          <section className="rounded-2xl bg-surface px-5 py-4 shadow-soft">
            <p className="text-[13px] font-semibold text-muted mb-3">Sensor Health & Maintenance</p>
            <div className="flex flex-col gap-3">
              {extra?.sensorHealth.map((score, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-[14px] font-medium text-ink">{score.name}</span>
                  <span className={`text-[13px] font-bold ${score.score < 70 ? 'text-danger' : score.score < 90 ? 'text-brand' : 'text-success'}`}>
                    {score.score}%
                  </span>
                </div>
              ))}
              {(extra?.predictiveAlerts?.length ?? 0) > 0 && (
                <div className="mt-2 pt-2 border-t border-line">
                  {extra?.predictiveAlerts.map((alert, i) => (
                    <p key={i} className="text-[13px] text-brand/80">
                      • {alert}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
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

function EquipmentRow({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[14px] font-medium text-ink">{label}</span>
      <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${on ? 'bg-success/15 text-success' : 'bg-muted/15 text-muted'}`}>
        {on ? 'ON' : 'OFF'}
      </span>
    </div>
  );
}
