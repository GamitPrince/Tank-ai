import { AlertTriangle, ChevronRight, Factory, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ScreenHeader } from '../components/ScreenHeader';
import { useApp } from '../store';
import { cx } from '../lib/cx';

export function Industries() {
  const { accessibleIndustries, accessiblePlants, pilotTanks, selectPlant, isSimulating } = useApp();
  const navigate = useNavigate();

  const openPlant = (plantId: string) => {
    selectPlant(plantId);
    navigate('/dashboard');
  };

  return (
    <>
      <ScreenHeader variant="dashboard" />
      <div className="mb-5 lg:hidden">
        <h1 className="text-[22px] font-extrabold text-brand">Industries</h1>
        <p className="mt-1 text-[13px] text-muted">Select a plant to view its tanks</p>
      </div>

      {isSimulating && (
        <p className="mb-4 text-[13px] font-semibold text-brand">Simulation running</p>
      )}

      <div className="flex flex-col gap-6">
        {accessibleIndustries.map((industry) => {
          const industryPlants = accessiblePlants.filter((plant) => industry.plantIds.includes(plant.id));
          const industryTanks = pilotTanks.filter((tank) =>
            industryPlants.some((plant) => plant.tankIds.includes(tank.id)),
          );
          const alarms = industryTanks.reduce((sum, tank) => sum + tank.alarms.filter((a) => !a.acknowledged).length, 0);
          const critical = industryTanks.reduce(
            (sum, tank) => sum + tank.alarms.filter((a) => !a.acknowledged && a.severity === 'critical').length,
            0,
          );

          return (
            <section key={industry.id} className="rounded-2xl bg-surface px-5 py-5 shadow-soft lg:px-6 lg:py-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-canvas shadow-soft">
                    <Factory className="h-5 w-5 text-brand" strokeWidth={1.8} />
                  </span>
                  <div>
                    <h2 className="text-[17px] font-extrabold text-ink">{industry.name}</h2>
                    <p className="mt-1 text-[13px] text-muted">
                      {industryPlants.length} plant{industryPlants.length === 1 ? '' : 's'} · {industryTanks.length}{' '}
                      tank{industryTanks.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
                {alarms > 0 && (
                  <span
                    className={cx(
                      'flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold',
                      critical > 0 ? 'bg-danger/15 text-danger' : 'bg-brand/10 text-brand',
                    )}
                  >
                    <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.2} />
                    {alarms}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {industryPlants.map((plant) => {
                  const plantTanks = pilotTanks.filter((tank) => plant.tankIds.includes(tank.id));
                  const plantAlarms = plantTanks.reduce(
                    (sum, tank) => sum + tank.alarms.filter((a) => !a.acknowledged).length,
                    0,
                  );
                  const plantCritical = plantTanks.reduce(
                    (sum, tank) =>
                      sum + tank.alarms.filter((a) => !a.acknowledged && a.severity === 'critical').length,
                    0,
                  );
                  const efficiency =
                    plantTanks.length > 0
                      ? Math.round(
                          plantTanks.reduce((sum, tank) => sum + tank.energy.efficiencyScore, 0) / plantTanks.length,
                        )
                      : 0;

                  return (
                    <button
                      key={plant.id}
                      type="button"
                      onClick={() => openPlant(plant.id)}
                      className="rounded-2xl bg-canvas px-4 py-4 text-left shadow-soft"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[15px] font-extrabold text-brand">{plant.name}</p>
                          <p className="mt-1 flex items-center gap-1 text-[13px] text-muted">
                            <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
                            {plant.location}
                          </p>
                        </div>
                        <span
                          className={cx(
                            'mt-1 h-2.5 w-2.5 shrink-0 rounded-full',
                            plantCritical > 0 ? 'bg-danger' : plantAlarms > 0 ? 'bg-brand' : 'bg-success',
                          )}
                        />
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <MiniStat label="Tanks" value={String(plantTanks.length)} />
                        <MiniStat label="Alarms" value={String(plantAlarms)} danger={plantAlarms > 0} />
                        <MiniStat label="Efficiency" value={`${efficiency}%`} />
                      </div>
                      <p className="mt-4 flex items-center justify-end gap-1 text-[13px] font-semibold text-brand">
                        View tanks
                        <ChevronRight className="h-4 w-4" strokeWidth={2} />
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

function MiniStat({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div>
      <p className={cx('text-[16px] font-extrabold', danger ? 'text-danger' : 'text-ink')}>{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}
