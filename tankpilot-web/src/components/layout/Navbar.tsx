import Link from 'next/link';
import { LayoutDashboard, Bell, Settings, Zap, Activity } from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.brand}>
        <h2>TankPilot</h2>
      </div>
      <div className={styles.navLinks}>
        <Link href="/dashboard" className={styles.navItem}>
          <LayoutDashboard size={24} />
          <span>Dashboard</span>
        </Link>
        <Link href="/live" className={styles.navItem}>
          <Activity size={24} />
          <span>Live</span>
        </Link>
        <Link href="/alarms" className={styles.navItem}>
          <Bell size={24} />
          <span>Alarms</span>
        </Link>
        <Link href="/energy" className={styles.navItem}>
          <Zap size={24} />
          <span>Energy</span>
        </Link>
        <Link href="/settings" className={styles.navItem}>
          <Settings size={24} />
          <span>Settings</span>
        </Link>
      </div>
    </nav>
  );
}
