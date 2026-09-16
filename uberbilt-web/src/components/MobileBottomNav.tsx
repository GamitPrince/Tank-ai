import { NavLink, useLocation } from 'react-router-dom';
import { appNavItems, isNavActive } from '../lib/nav';
import { cx } from '../lib/cx';
import { useApp } from '../store';

export function MobileBottomNav() {
  const { plantSelected } = useApp();
  const { pathname } = useLocation();
  const items = appNavItems.filter((item) => item.to !== '/industries' && item.to !== '/notifications');

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface px-1 pt-2 lg:hidden"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto grid max-w-[430px] grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(pathname, item.to);
          const to = item.to === '/dashboard' && !plantSelected ? '/industries' : item.to;
          return (
            <NavLink
              key={item.to}
              to={to}
              className={cx(
                'flex flex-col items-center gap-1 rounded-xl py-1 text-[10px] font-semibold',
                active ? 'text-brand' : 'text-muted',
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.1 : 1.8} />
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
