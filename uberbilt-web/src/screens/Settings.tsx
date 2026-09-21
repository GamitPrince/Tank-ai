import { useNavigate } from 'react-router-dom';
import { ScreenHeader } from '../components/ScreenHeader';
import { ThemeToggle } from '../components/ThemeToggle';
import { useApp } from '../store';
import { GoogleIcon } from '../components/GoogleIcon';
import { ShieldCheck } from 'lucide-react';

export function Settings() {
  const {
    currentUser,
    userName,
    isSimulating,
    toggleSimulation,
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
          <dl className="mt-4 grid grid-cols-[110px_1fr] gap-x-3 gap-y-2.5 text-[13px]">
            <dt className="text-muted">Name</dt>
            <dd className="font-semibold text-ink">{userName || currentUser?.name || '—'}</dd>
            <dt className="text-muted">Email</dt>
            <dd className="font-mono text-[12px] text-ink">{currentUser?.email || '—'}</dd>
            <dt className="text-muted">Role</dt>
            <dd className="capitalize text-ink flex items-center gap-1.5">
              <span>{currentUser?.role ?? 'operator'}</span>
              {currentUser?.isFixedAdmin ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold text-brand">
                  <ShieldCheck className="h-3 w-3" />
                  Fixed Admin (Locked)
                </span>
              ) : currentUser?.role === 'admin' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold text-brand">
                  <ShieldCheck className="h-3 w-3" />
                  Administrator
                </span>
              ) : null}
            </dd>
            <dt className="text-muted">Authentication</dt>
            <dd className="text-ink flex items-center gap-1.5">
              {currentUser?.authProvider === 'google' ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-brand">
                  <GoogleIcon className="h-3.5 w-3.5" />
                  Google OAuth 2.0
                </span>
              ) : (
                <span className="text-muted">Local Credentials</span>
              )}
            </dd>
            <dt className="text-muted">Security Tier</dt>
            <dd className="text-ink text-[12px]">
              {currentUser?.isFixedAdmin
                ? 'Immutable System Admin Policy'
                : 'Standard Operator Tier'}
            </dd>
            <dt className="text-muted">Client Secret</dt>
            <dd className="text-ink font-mono text-[11px] text-muted">
              GOCSPX-f0RVRg...NGbj
            </dd>
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
