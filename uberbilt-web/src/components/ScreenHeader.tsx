import { Bell, ChevronLeft, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { IconButton } from './IconButton';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

interface ScreenHeaderProps {
  title?: string;
  variant?: 'inner' | 'dashboard';
  backTo?: string;
}

function AlertsButton() {
  const navigate = useNavigate();
  const { notifications } = useApp();
  const unread = notifications.length > 0;

  return (
    <IconButton size="sm" ariaLabel="Alerts" onClick={() => navigate('/notifications')}>
      <Bell className="h-5 w-5 text-brand" strokeWidth={1.75} />
      {unread && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />}
    </IconButton>
  );
}

export function ScreenHeader({ title, variant = 'inner', backTo }: ScreenHeaderProps) {
  const navigate = useNavigate();

  if (variant === 'dashboard') {
    return (
      <header className="mb-5 grid grid-cols-[40px_1fr_auto] items-center gap-2 lg:hidden">
        {backTo ? (
          <IconButton size="sm" ariaLabel="Back" onClick={() => navigate(backTo)}>
            <ChevronLeft className="h-5 w-5 text-brand" strokeWidth={2} />
          </IconButton>
        ) : (
          <span />
        )}
        <div className="flex justify-center">
          <Logo variant="brand" size="md" />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle compact size="sm" />
          <AlertsButton />
        </div>
      </header>
    );
  }

  return (
    <header className="relative mb-6 grid grid-cols-[40px_1fr_40px] items-center lg:hidden">
      <IconButton size="sm" ariaLabel="Back" onClick={() => navigate(-1)}>
        <ChevronLeft className="h-5 w-5 text-brand" strokeWidth={2} />
      </IconButton>
      {title ? (
        <h1 className="text-center text-[17px] font-semibold text-muted">{title}</h1>
      ) : (
        <span />
      )}
      <IconButton size="sm" ariaLabel="Settings" onClick={() => navigate('/settings')}>
        <Settings className="h-5 w-5 text-brand" strokeWidth={1.75} />
      </IconButton>
    </header>
  );
}
