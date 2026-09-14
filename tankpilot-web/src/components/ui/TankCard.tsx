import Link from 'next/link';
import { Tank } from '@/lib/types';
import styles from './TankCard.module.css';
import { AlertTriangle } from 'lucide-react';

export default function TankCard({ tank }: { tank: Tank }) {
  // Determine overall status
  let statusClass = 'normal';
  if (tank.alarms.some(a => a.severity === 'critical')) statusClass = 'critical';
  else if (tank.alarms.some(a => a.severity === 'warning')) statusClass = 'warning';
  
  const topAlarm = tank.alarms.length > 0 ? tank.alarms[0] : null;

  return (
    <Link href={`/tanks/${tank.id}`} className={styles.tankCard}>
      <div className={styles.header}>
        <h3>{tank.name}</h3>
        <div className={`${styles.statusIndicator} ${styles[statusClass]}`} title={`Status: ${statusClass}`} />
      </div>
      
      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.label}>Level</span>
          <span className={styles.value}>{tank.level.radar_pct}%</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.label}>Temperature</span>
          <span className={styles.value}>{tank.temperature.zones[0]?.value ?? '--'}°C</span>
        </div>
      </div>
      
      {topAlarm && (
        <div className={`${styles.alarm} ${styles[topAlarm.severity]}`}>
          <AlertTriangle size={16} />
          <span>{topAlarm.message}</span>
        </div>
      )}
    </Link>
  );
}
