import { Activity, Bell, Factory, LayoutGrid, Settings, Zap, type LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const appNavItems: NavItem[] = [
  { to: '/industries', label: 'Industries', icon: Factory },
  { to: '/dashboard', label: 'Tanks', icon: LayoutGrid },
  { to: '/live', label: 'Live', icon: Activity },
  { to: '/energy', label: 'Energy', icon: Zap },
  { to: '/notifications', label: 'Alerts', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function isNavActive(pathname: string, to: string) {
  if (to === '/dashboard') return pathname === '/dashboard' || pathname.startsWith('/tanks/');
  return pathname === to;
}
