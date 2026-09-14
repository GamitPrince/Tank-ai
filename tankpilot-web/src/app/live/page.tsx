"use client";

import { useEffect, useRef } from 'react';
import { useLiveReadings } from '@/lib/useLiveReadings';
import { useStaggerEntrance, useFadeIn, animate } from '@/lib/animations';
import LiveSensorChart from '@/components/ui/LiveSensorChart';
import { Activity, Radio, RefreshCw, AlertCircle } from 'lucide-react';
import styles from './page.module.css';

function AnimatedValue({ value, unit, decimals = 2 }: { value: number; unit: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(value);

  useEffect(() => {
    if (!ref.current) return;
    const num = typeof value === 'number' && !isNaN(value) ? value : 0;
    const prev = typeof prevValue.current === 'number' && !isNaN(prevValue.current) ? prevValue.current : num;

    if (prev === num) {
      ref.current.textContent = num.toFixed(decimals);
      return;
    }

    const obj = { val: prev };
    try {
      animate(obj, {
        val: num,
        duration: 600,
        ease: 'outExpo',
        onUpdate: () => {
          if (ref.current) {
            ref.current.textContent = obj.val.toFixed(decimals);
          }
        },
        onComplete: () => {
          prevValue.current = num;
        },
      });
    } catch {
      if (ref.current) {
        ref.current.textContent = num.toFixed(decimals);
      }
    }
  }, [value, decimals]);

  const displayVal = typeof value === 'number' && !isNaN(value) ? value.toFixed(decimals) : '--';

  return (
    <div className={styles.sensorValue}>
      <span ref={ref}>{displayVal}</span>
      <span className={styles.sensorUnit}>{unit}</span>
    </div>
  );
}

export default function LivePage() {
  const { devices, isConnected, isLoading, error, lastFetchTime, timestamp } = useLiveReadings();
  const headerRef = useFadeIn('down');

  const deviceEntries = Object.values(devices);

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }} ref={headerRef}>
        <Activity size={28} color="var(--primary)" />
        <h1 style={{ margin: 0 }}>Live Sensor Readings</h1>
      </div>

      {/* Connection status bar */}
      <div className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <div className={`${styles.statusDot} ${isConnected ? styles.connected : styles.disconnected}`} />
          <span>
            {isLoading
              ? 'Connecting to sensors...'
              : isConnected
              ? 'Connected — Polling every 1.5s'
              : 'Disconnected'}
          </span>
        </div>
        <div className={styles.latency}>
          {lastFetchTime !== null && <span>Latency: {lastFetchTime}ms</span>}
          {timestamp && <span style={{ marginLeft: '1rem' }}>Last: {new Date(timestamp).toLocaleTimeString()}</span>}
        </div>
      </div>

      {error && (
        <div className={styles.errorBox}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span><strong>Notice:</strong> {error}</span>
          </div>
        </div>
      )}

      {isLoading && (
        <div className={styles.loading}>
          <RefreshCw size={24} style={{ animation: 'spin 1.5s linear infinite', marginRight: '0.75rem' }} />
          <span>Connecting to database and reading telemetry...</span>
        </div>
      )}

      {!isLoading && deviceEntries.length === 0 && !error && (
        <div className={styles.loading}>No devices found in database. Waiting for sensor data...</div>
      )}

      {!isLoading && deviceEntries.map(device => (
        <DeviceSection key={device.device_id} device={device} />
      ))}
    </div>
  );
}

function DeviceSection({ device }: { device: ReturnType<typeof useLiveReadings>['devices'][string] }) {
  const sensorEntries = Object.values(device.sensors || {});
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

      {/* Real-time Telemetry Trend Graph */}
      <LiveSensorChart
        deviceId={device.device_id}
        deviceName={device.device_name}
        liveSensors={device.sensors}
      />
    </div>
  );
}
