import { useNavigate } from 'react-router-dom';
import { ScreenHeader } from '../components/ScreenHeader';
import { ThemeToggle } from '../components/ThemeToggle';
import { mockUsers } from '../lib/pilotStore';
import { useApp } from '../store';

export function Settings() {
  const {
    currentUser,
    userName,
    branches,
    branchId,
    setBranchId,
    isSimulating,
    toggleSimulation,
    switchUser,
    logout,
  } = useApp();
  const navigate = useNavigate();

  return (
    <>
      <ScreenHeader title="Settings" />
      <div className="flex w-full flex-col gap-4 md:max-w-xl">
        <ThemeToggle />

        <section className="rounded-2xl bg-surface px-6 py-6 shadow-soft">
          <p className="text-[15px] font-semibold text-ink">Account Profile</p>
          <dl className="mt-4 grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 text-[13px]">
            <dt className="text-muted">Name</dt>
            <dd className="font-semibold text-ink">{userName || currentUser?.name || '—'}</dd>
            <dt className="text-muted">Role</dt>
            <dd className="capitalize text-ink">{currentUser?.role ?? 'operator'}</dd>
            <dt className="text-muted">Access</dt>
            <dd className="text-ink">{currentUser?.industryAccess.join(', ') || '—'}</dd>
          </dl>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="mt-5 rounded-full border border-danger/40 px-4 py-2 text-[13px] font-semibold text-danger"
          >
            Log Out
          </button>
        </section>

        <section className="rounded-2xl bg-surface px-6 py-6 shadow-soft">
          <p className="text-[15px] font-semibold text-ink">Plant</p>
          <p className="mt-1 text-[13px] text-muted">Or browse all plants from Industries.</p>
          <button
            type="button"
            onClick={() => navigate('/industries')}
            className="mt-3 text-[13px] font-semibold text-brand"
          >
            View industries
          </button>
          <select
            className="mt-4 w-full rounded-2xl bg-canvas px-4 py-3 text-[14px] text-ink outline-none"
            value={branchId}
            onChange={(event) => {
              setBranchId(event.target.value);
              navigate('/dashboard');
            }}
          >
            <option value="" disabled>
              Select a plant
            </option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
                {branch.location ? ` — ${branch.location}` : ''}
              </option>
            ))}
          </select>
        </section>

        <section className="rounded-2xl bg-surface px-6 py-6 shadow-soft">
          <p className="text-[15px] font-semibold text-ink">Switch User</p>
          <p className="mt-1 text-[13px] text-muted">TankPilot demo accounts stay available from this UI.</p>
          <div className="mt-4 flex flex-col gap-2">
            {mockUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => switchUser(user.id)}
                className={`rounded-2xl px-4 py-3 text-left text-[14px] font-semibold ${
                  currentUser?.id === user.id ? 'bg-canvas text-brand' : 'bg-canvas text-ink'
                }`}
              >
                {user.name}
                <span className="ml-2 text-[12px] font-medium capitalize text-muted">{user.role}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-surface px-6 py-6 shadow-soft">
          <p className="text-[15px] font-semibold text-ink">Developer Tools</p>
          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[14px] font-semibold text-ink">Real-time Simulation</p>
              <p className="mt-1 text-[13px] text-muted">Simulates live tank telemetry changing over time.</p>
            </div>
            <button
              type="button"
              onClick={toggleSimulation}
              className={`rounded-full px-4 py-2 text-[13px] font-semibold ${
                isSimulating ? 'bg-brand text-white' : 'bg-canvas text-ink'
              }`}
            >
              {isSimulating ? 'Stop' : 'Start'}
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
