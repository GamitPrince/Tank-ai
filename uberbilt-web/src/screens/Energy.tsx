import { Leaf, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ScreenHeader } from '../components/ScreenHeader';
import { useApp } from '../store';

export function Energy() {
  const { tanks, extras } = useApp();
  const navigate = useNavigate();
  const scores = tanks.map((tank) => extras[tank.id]?.efficiencyScore ?? 0);
  const avg = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;

  return (
    <>
      <ScreenHeader title="Energy" />
      <div className="flex flex-col gap-5">
        <section className="flex items-center justify-between rounded-2xl bg-surface px-5 py-5 shadow-soft">
          <div>
            <p className="flex items-center gap-2 text-[15px] font-semibold text-ink">
              <Leaf className="h-5 w-5 text-brand" strokeWidth={1.8} />
              Site Efficiency Score
            </p>
            <p className="mt-1 text-[13px] text-muted">Based on heater usage vs ambient heat loss.</p>
          </div>
          <p className="text-[36px] font-extrabold text-brand">{avg}%</p>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {tanks.map((tank) => {
            const extra = extras[tank.id];
            return (
              <button
                key={tank.id}
                type="button"
                onClick={() => navigate(`/tanks/${tank.id}/heater`)}
                className="rounded-2xl bg-surface px-5 py-5 text-left shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-bold tracking-wide text-brand">TANK {tank.index}</p>
                    <p className="mt-1 text-[15px] font-semibold text-ink">{tank.productName}</p>
                  </div>
                  <span className="rounded-full bg-canvas px-3 py-1 text-[13px] font-bold text-brand">
                    {extra?.efficiencyScore ?? 0}%
                  </span>
                </div>
                <div className="mt-4 space-y-2 text-[13px]">
                  <div className="flex justify-between text-muted">
                    <span>Holding recommendation</span>
                    <strong className="text-ink">{extra?.holdingTempRecommendation ?? '—'}°C</strong>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Estimated savings</span>
                    <strong className="text-success">{extra?.estimatedSavingsPct ?? 0}%</strong>
                  </div>
                  <div className="flex items-center justify-between text-muted">
                    <span className="flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-brand" strokeWidth={2} />
                      Energy usage
                    </span>
                    <strong className="text-ink">{(extra?.energyKwh ?? 0).toFixed(1)} kWh</strong>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
