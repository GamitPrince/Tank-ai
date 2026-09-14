"use client";

import { useEffect, useRef } from 'react';
import { useLiveReadings } from '@/lib/useLiveReadings';
import { useStaggerEntrance, useFadeIn, animate } from '@/lib/animations';
import { Activity, Radio } from 'lucide-react';
import styles from './page.module.css';

function AnimatedValue({ value, unit, decimals = 2 }: { value: number; unit: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(value);

  useEffect(() => {
    if (!ref.current) return;
    if (prevValue.current === value) {
      ref.current.textContent = value.toFixed(decimals);
      return;
    }

    const obj = { val: prevValue.current };
    animate(obj, {
      val: value,
      duration: 600,
      ease: 'outExpo',
      onUpdate: () => {
        if (ref.current) {
          ref.current.textContent = obj.val.toFixed(decimals);
        }
      },
      onComplete: () => {
        prevValue.current = value;
      },
    });
  }, [value, decimals]);

  return (
    <div className={styles.sensorValue}>
      <span ref={ref}>{value.toFixed(decimals)}</span>
      <span className={styles.sensorUnit}>{unit}</span>
    </div>
  );
}

export default function LivePage() {
  const { devices, isConnected, isLoading, error, lastFetchTime, timestamp } = useLiveReadings();
  const headerRef = useFadeIn('down');

  if (isLoading) {
    return <div className={styles.loading}>Connecting to sensors...</div>;
  }

  const deviceEntries = Object.values(devices);

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }} ref={headerRef}>
        <Activity size={28} color="var(--primary)" />
        <h1 style={{ margin: 0 }}>Live Sensor Readings</h1>
      </div>

      <div className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <div className={`${styles.statusDot} ${isConnected ? styles.connected : styles.disconnected}`} />
          <span>{isConnected ? 'Connected — Polling every 1s' : 'Disconnected'}</span>
        </div>
        <div className={styles.latency}>
          {lastFetchTime !== null && <span>Latency: {lastFetchTime}ms</span>}
          {timestamp && <span style={{ marginLeft: '1rem' }}>Last: {new Date(timestamp).toLocaleTimeString()}</span>}
        </div>
      </div>

      {error && (
        <div className={styles.errorBox}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {deviceEntries.length === 0 && !error && (
        <div className={styles.loading}>No devices found in database. Waiting for sensor data...</div>
      )}

      {deviceEntries.map(device => (
        <DeviceSection key={device.device_id} device={device} />
      ))}
    </div>
  );
}

function DeviceSection({ device }: { device: ReturnType<typeof useLiveReadings>['devices'][string] }) {
  const sensorEntries = Object.values(device.sensors);
  const lastUpdated = new Date(device.last_updated);
  const ageMs = Date.now() - lastUpdated.getTime();
  const isStale = ageMs > 10000;
  const gridRef = useStaggerEntrance(':scope > div', [device.device_id]);

  return (
    <div className={styles.deviceSection}>
      <div className={styles.deviceHeader}>
        <h2>
          <Radio size={20} color={isStale ? 'var(--status-warning)' : 'var(--status-normal)'} />
          {device.device_name}
        </h2>
        <span className={styles.deviceMeta}>
          {device.location} · Updated {isStale ? `${Math.round(ageMs / 1000)}s ago` : 'just now'}
        </span>
      </div>

      <div className={styles.sensorGrid} ref={gridRef}>
        {sensorEntries.map(sensor => {
          const sensorAge = Date.now() - new Date(sensor.time).getTime();
          const sensorStale = sensorAge > 10000;

          return (
            <div
              key={sensor.sensor_id}
              className={`${styles.sensorCard} ${sensorStale ? styles.stale : ''} ${sensor.quality !== 'GOOD' ? styles.bad : ''}`}
            >
              <div className={styles.sensorName}>
                <span>{sensor.description}</span>
                <span className={`${styles.quality} ${sensor.quality === 'GOOD' ? styles.good : styles.bad}`}>
                  {sensor.quality}
                </span>
              </div>
              <AnimatedValue
                value={sensor.value}
                unit={sensor.unit}
                decimals={sensor.unit === 'counts' ? 0 : 2}
              />
              <div className={styles.sensorTime}>
                {new Date(sensor.time).toLocaleTimeString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
