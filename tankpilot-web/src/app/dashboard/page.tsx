"use client";

import { useAppStore } from '@/lib/store';
import { useStaggerEntrance, useFadeIn } from '@/lib/animations';
import { Tank, Plant, Industry } from '@/lib/types';
import Link from 'next/link';
import { Factory, MapPin, AlertTriangle, ChevronRight } from 'lucide-react';
import styles from './page.module.css';

export default function Dashboard() {
  const { industries, plants, tanks, isSimulating, toggleSimulation } = useAppStore();
  const headerRef = useFadeIn('down');

  return (
    <div className={styles.dashboard}>
      <div className={styles.header} ref={headerRef}>
        <h1>Industries</h1>
        <div className={styles.controls}>
          <button
            className={`${styles.simToggle} ${isSimulating ? styles.active : ''}`}
            onClick={toggleSimulation}
          >
            {isSimulating ? 'Stop Simulation' : 'Start Simulation'}
          </button>
        </div>
      </div>

      <div className={styles.industryList}>
        {industries.map((industry) => {
          const industryPlants = plants.filter(p => industry.plantIds.includes(p.id));
          const industryTanks = tanks.filter(t => industryPlants.some(p => p.tankIds.includes(t.id)));
          const totalAlarms = industryTanks.reduce((sum, t) => sum + t.alarms.length, 0);
          const criticalCount = industryTanks.reduce((sum, t) => sum + t.alarms.filter(a => a.severity === 'critical').length, 0);

          return (
            <IndustryCard
              key={industry.id}
              industry={industry}
              industryPlants={industryPlants}
              industryTanks={industryTanks}
              totalAlarms={totalAlarms}
              criticalCount={criticalCount}
              allTanks={tanks}
            />
          );
        })}
      </div>
    </div>
  );
}

interface IndustryCardProps {
  industry: Industry;
  industryPlants: Plant[];
  industryTanks: Tank[];
  totalAlarms: number;
  criticalCount: number;
  allTanks: Tank[];
}

function IndustryCard({ industry, industryPlants, industryTanks, totalAlarms, criticalCount, allTanks }: IndustryCardProps) {
  const gridRef = useStaggerEntrance(':scope > a', [industry.id]);

  return (
    <div className={styles.industryCard}>
      <div className={styles.industryHeader}>
        <div className={styles.industryTitle}>
          <Factory size={24} color="var(--primary)" />
          <div>
            <h2>{industry.name}</h2>
            <span className={styles.subtitle}>
              {industryPlants.length} plant{industryPlants.length !== 1 ? 's' : ''} · {industryTanks.length} tank{industryTanks.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        {totalAlarms > 0 && (
          <div className={`${styles.alarmBadge} ${criticalCount > 0 ? styles.critical : styles.warning}`}>
            <AlertTriangle size={14} />
            <span>{totalAlarms}</span>
          </div>
        )}
      </div>

      <div className={styles.plantGrid} ref={gridRef}>
        {industryPlants.map((plant) => {
          const plantTanks = allTanks.filter(t => plant.tankIds.includes(t.id));
          const plantAlarms = plantTanks.reduce((sum: number, t: Tank) => sum + t.alarms.length, 0);
          const plantCritical = plantTanks.reduce((sum: number, t: Tank) => sum + t.alarms.filter(a => a.severity === 'critical').length, 0);

          let statusClass = 'normal';
          if (plantCritical > 0) statusClass = 'critical';
          else if (plantAlarms > 0) statusClass = 'warning';

          return (
            <Link href={`/plants/${plant.id}`} key={plant.id} className={styles.plantCard}>
              <div className={styles.plantTop}>
                <div>
                  <h3>{plant.name}</h3>
                  <div className={styles.location}>
                    <MapPin size={14} />
                    <span>{plant.location}</span>
                  </div>
                </div>
                <div className={`${styles.statusDot} ${styles[statusClass]}`} />
              </div>

              <div className={styles.plantStats}>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{plantTanks.length}</span>
                  <span className={styles.statLabel}>Tanks</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{plantAlarms}</span>
                  <span className={styles.statLabel}>Alarms</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>
                    {plantTanks.length > 0 ? Math.round(plantTanks.reduce((s: number, t: Tank) => s + t.energy.efficiencyScore, 0) / plantTanks.length) : 0}%
                  </span>
                  <span className={styles.statLabel}>Efficiency</span>
                </div>
              </div>

              <div className={styles.plantFooter}>
                <span>View Tanks</span>
                <ChevronRight size={16} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
