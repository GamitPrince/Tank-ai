import { Bell, ChevronLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePageMeta } from '../lib/usePageMeta';
import { useApp } from '../store';
import { IconButton } from './IconButton';
import { ThemeToggle } from './ThemeToggle';

export function DesktopTopBar() {
  const { title, subtitle } = usePageMeta();
  const { notifications } = useApp();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const showBack = pathname !== '/industries';

  return (
    <header className="mb-8 hidden items-center justify-between lg:flex">
      <div className="flex items-center gap-3">
        {showBack && (
          <IconButton
            ariaLabel="Back"
            onClick={() => {
              if (pathname === '/dashboard') navigate('/industries');
              else navigate(-1);
            }}
          >
            <ChevronLeft className="h-6 w-6 text-brand" strokeWidth={2} />
          </IconButton>
        )}
        <div>
          <h1 className="text-[22px] font-bold text-ink">{title}</h1>
          {subtitle ? <p className="text-[13px] text-muted">{subtitle}</p> : null}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle compact />
        <IconButton ariaLabel="Notifications" onClick={() => navigate('/notifications')}>
          <Bell className="h-[22px] w-[22px] text-brand" strokeWidth={1.75} />
          {notifications.length > 0 && (
            <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-danger" />
          )}
        </IconButton>
      </div>
    </header>
  );
}
