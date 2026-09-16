import { Navigate, useNavigate } from 'react-router-dom';
import { ScreenHeader } from '../components/ScreenHeader';
import { TankCard } from '../components/TankCard';
import { useApp } from '../store';

export function Dashboard() {
  const { tanks, branches, branchId, plantSelected, isSimulating } = useApp();
  const navigate = useNavigate();
  const plant = branches.find((branch) => branch.id === branchId);

  if (!plantSelected || !branchId) {
    return <Navigate to="/industries" replace />;
  }
  const online = tanks.filter((tank) => tank.connectivity === 'online').length;
  const alerts = tanks.filter((tank) => tank.alertLevel !== 'none').length;
  const offline = tanks.filter((tank) => tank.connectivity === 'offline' || tank.connectivity === 'connecting').length;

  return (
    <>
      <ScreenHeader variant="dashboard" backTo="/industries" />
      {plant && (
        <button type="button" onClick={() => navigate('/industries')} className="mb-4 text-left">
          <p className="text-[13px] text-muted">
            {plant.name}
            {plant.location ? ` · ${plant.location}` : ''}
            {isSimulating ? ' · Simulation running' : ''}
          </p>
          <p className="mt-0.5 text-[12px] font-semibold text-brand lg:hidden">Change plant</p>
        </button>
      )}
      <div className="mb-5 hidden grid-cols-2 gap-3 sm:grid sm:mb-6 md:grid-cols-4">
        <SummaryChip label="Tanks" value={String(tanks.length)} />
        <SummaryChip label="Online" value={String(online)} tone="success" />
        <SummaryChip label="Offline" value={String(offline)} tone="brand" />
        <SummaryChip label="Alerts" value={String(alerts)} tone="danger" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
        {tanks.map((tank) => (
          <TankCard key={tank.id} tank={tank} onClick={() => navigate(`/tanks/${tank.id}`)} />
        ))}
      </div>
    </>
  );
}

function SummaryChip({
  label,
  value,
  tone = 'ink',
}: {
  label: string;
  value: string;
  tone?: 'ink' | 'success' | 'brand' | 'danger';
}) {
  const valueClass =
    tone === 'success'
      ? 'text-success'
      : tone === 'brand'
        ? 'text-brand'
        : tone === 'danger'
          ? 'text-danger'
          : 'text-ink';

  return (
    <div className="rounded-2xl bg-surface px-5 py-4 shadow-soft">
      <p className="text-[13px] text-muted">{label}</p>
      <p className={`mt-1 text-[28px] font-extrabold leading-none ${valueClass}`}>{value}</p>
    </div>
  );
}
