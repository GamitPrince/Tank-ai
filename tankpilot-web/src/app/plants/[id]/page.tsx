"use client";

import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { useStaggerEntrance, useFadeIn } from '@/lib/animations';
import TankCard from '@/components/ui/TankCard';
import { ArrowLeft, MapPin } from 'lucide-react';
import styles from './page.module.css';

export default function PlantDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { plants, tanks } = useAppStore();
  const headerRef = useFadeIn('down');
  const gridRef = useStaggerEntrance(':scope > a', [id]);

  const plant = plants.find(p => p.id === id);
  if (!plant) {
    return <div>Plant not found</div>;
  }

  const plantTanks = tanks.filter(t => plant.tankIds.includes(t.id));
  const totalAlarms = plantTanks.reduce((sum, t) => sum + t.alarms.length, 0);
  const avgEfficiency = plantTanks.length > 0
    ? Math.round(plantTanks.reduce((s, t) => s + t.energy.efficiencyScore, 0) / plantTanks.length)
    : 0;

  return (
    <div className={styles.container}>
      <div className={styles.header} ref={headerRef}>
        <div>
          <div className={styles.titleArea}>
            <button onClick={() => router.push('/dashboard')}>
              <ArrowLeft size={24} color="var(--foreground)" />
            </button>
            <h1>{plant.name}</h1>
          </div>
          <div className={styles.location}>
            <MapPin size={16} />
            <span>{plant.location}</span>
          </div>
        </div>
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <span className={styles.val}>{plantTanks.length}</span>
          <span className={styles.lbl}>Tanks</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.val} style={{ color: totalAlarms > 0 ? 'var(--status-critical)' : 'var(--status-normal)' }}>
            {totalAlarms}
          </span>
          <span className={styles.lbl}>Active Alarms</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.val} style={{ color: 'var(--status-ai)' }}>{avgEfficiency}%</span>
          <span className={styles.lbl}>Avg Efficiency</span>
        </div>
      </div>

      <h2>Tanks</h2>
      <div className={styles.grid} ref={gridRef}>
        {plantTanks.map(tank => (
          <TankCard key={tank.id} tank={tank} />
        ))}
      </div>
    </div>
  );
}
