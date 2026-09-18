import { type ReactNode } from 'react';
import { DesktopSidebar } from './DesktopSidebar';
import { DesktopTopBar } from './DesktopTopBar';
import { MobileBottomNav } from './MobileBottomNav';
import { useApp } from '../store';
import { useLocation } from 'react-router-dom';

export function AppShell({ children }: { children: ReactNode }) {
  const { authenticated } = useApp();
  const { pathname } = useLocation();
  const showChrome = authenticated || pathname === '/live';

  if (!showChrome) {
    return (
      <div className="flex min-h-dvh items-stretch justify-center bg-canvas px-5 py-6 sm:items-center sm:px-8">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-canvas lg:flex">
      <DesktopSidebar />
      <div className="mx-auto flex min-h-dvh w-full flex-1 flex-col px-5 pb-24 pt-6 sm:px-6 md:px-8 lg:px-10 lg:pb-10 lg:pt-8">
        <div className="mx-auto flex w-full min-h-0 flex-1 flex-col xl:max-w-[1200px]">
          <DesktopTopBar />
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
}
