import { LogOut } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cx } from '../lib/cx';
import { appNavItems, isNavActive } from '../lib/nav';
import { useApp } from '../store';
import { Logo } from './Logo';

interface DesktopSidebarProps {
  onClose?: () => void;
}

export function DesktopSidebar({ onClose }: DesktopSidebarProps) {
  const { tanks, notifications, userName, branches, branchId, plantSelected, currentUser, logout } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const branch = branches.find((item) => item.id === branchId);
  const unread = notifications.length;

  return (
    <aside className="sticky top-0 z-0 hidden h-dvh w-[260px] shrink-0 flex-col border-r border-line bg-surface px-5 py-6 lg:flex">
      <div className="px-1">
        <Logo variant="brand" size="md" />
      </div>

      <nav className="mt-8 flex flex-col gap-1">
        {appNavItems.map((link) => {
          const Icon = link.icon;
          const active = isNavActive(location.pathname, link.to);
          const to = link.to === '/dashboard' && !plantSelected ? '/industries' : link.to;
          return (
            <NavLink
              key={link.to}
              to={to}
              onClick={onClose}
              className={cx(
                'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[14px] font-semibold transition-colors',
                active ? 'bg-canvas text-brand' : 'text-muted hover:bg-canvas hover:text-ink',
              )}
            >
              <span className="relative">
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                {link.to === '/notifications' && unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-danger" />
                )}
              </span>
              {link.label}
            </NavLink>
          );
        })}
      </nav>

      {plantSelected && tanks.length > 0 && (
        <>
      <p className="mb-2 mt-8 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted/80">
        Tanks
      </p>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {tanks.map((tank) => {
          const href = `/tanks/${tank.id}`;
          const active = location.pathname.startsWith(href);
          const dot =
            tank.alertLevel === 'critical' || tank.alertLevel === 'warning'
              ? 'bg-danger'
              : tank.connectivity === 'online'
                ? 'bg-success'
                : tank.connectivity === 'connecting'
                  ? 'bg-brand'
                  : 'bg-muted/50';
          return (
            <NavLink
              key={tank.id}
              to={href}
              onClick={onClose}
              className={cx(
                'flex items-center gap-3 rounded-2xl px-3 py-2 text-[13px] transition-colors',
                active ? 'bg-canvas text-ink' : 'text-muted hover:bg-canvas hover:text-ink',
              )}
            >
              <span
                className={cx('h-2 w-2 shrink-0 rounded-full', dot)}
                title={tank.alertLevel !== 'none' ? tank.alertLevel : tank.connectivity}
              />
              <span className="min-w-0">
                <span className={cx('block font-bold', tank.alertLevel === 'critical' ? 'text-danger' : 'text-brand')}>
                  TANK {tank.index}
                </span>
                <span className="block truncate text-[12px]">{tank.productName}</span>
              </span>
            </NavLink>
          );
        })}
      </div>
        </>
      )}

      {!plantSelected && <div className="min-h-0 flex-1" />}

      <div className="mt-4 rounded-2xl bg-canvas px-3 py-3">
        <p className="truncate text-[13px] font-semibold text-ink">{userName || currentUser?.name || 'Operator'}</p>
        <p className="truncate text-[12px] capitalize text-muted">
          {currentUser?.role ?? 'operator'}
          {branch?.name && plantSelected ? ` · ${branch.name}` : ''}
        </p>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="mt-3 flex items-center gap-2 text-[12px] font-semibold text-muted hover:text-brand"
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
