import { useLocation } from 'react-router-dom';
import { useApp } from '../store';

export function usePageMeta() {
  const { pathname } = useLocation();
  const { getTank, branches, branchId } = useApp();
  const tankId = pathname.match(/^\/tanks\/([^/]+)/)?.[1];
  const tank = tankId ? getTank(tankId) : undefined;
  const tankLabel = tank ? `TANK ${tank.index}` : undefined;
  const plant = branches.find((item) => item.id === branchId);

  if (pathname === '/industries') return { title: 'Industries', subtitle: 'Select a plant' };
  if (pathname === '/dashboard') {
    return { title: plant?.name ?? 'Tanks', subtitle: plant?.location ?? 'Selected plant' };
  }
  if (pathname === '/notifications') return { title: 'Notification', subtitle: undefined };
  if (pathname === '/settings') return { title: 'Settings', subtitle: undefined };
  if (pathname === '/live') return { title: 'Live Sensors', subtitle: 'TimescaleDB telemetry' };
  if (pathname === '/energy') return { title: 'Energy', subtitle: 'Site efficiency' };
  if (pathname.endsWith('/heater')) return { title: 'Heater', subtitle: tankLabel };
  if (pathname.endsWith('/temperature/edit')) return { title: 'Target Temperature', subtitle: tankLabel };
  if (pathname.endsWith('/temperature')) return { title: 'Temperature', subtitle: tankLabel };
  if (pathname.endsWith('/level')) return { title: 'Level', subtitle: tankLabel };
  if (pathname.endsWith('/pressure')) return { title: 'Pressure', subtitle: tankLabel };
  if (tank) return { title: tankLabel ?? 'Tank', subtitle: `Running ${tank.productName}` };
  return { title: 'UBERBILT', subtitle: undefined };
}
