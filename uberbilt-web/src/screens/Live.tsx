import { Activity, AlertCircle, Radio, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ScreenHeader } from '../components/ScreenHeader';
import { useLiveReadings, type DeviceData, type SensorReading } from '../lib/useLiveReadings';
import { cx } from '../lib/cx';

export function Live() {
  const { devices, isConnected, isLoading, error, lastFetchTime, timestamp } = useLiveReadings();
  const deviceEntries = Object.values(devices);

  return (
    <>
      <ScreenHeader title="Live" />
      <div className="flex flex-col gap-5">
        <section className="flex flex-col gap-3 rounded-2xl bg-surface px-5 py-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-brand" strokeWidth={1.8} />
            <div>
              <p className="text-[15px] font-semibold text-ink">Live Sensor Readings</p>
              <p className="text-[13px] text-muted">
                {isLoading
                  ? 'Connecting to sensors...'
                  : isConnected
                    ? 'Connected — polling every 1.5s'
                    : 'Disconnected'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[12px] text-muted">
            <span className={cx('h-2.5 w-2.5 rounded-full', isConnected ? 'bg-success' : 'bg-danger')} />
            {lastFetchTime != null && <span>Latency {lastFetchTime}ms</span>}
            {timestamp && <span>Last {new Date(timestamp).toLocaleTimeString()}</span>}
          </div>
        </section>

        {error && (
          <section className="flex items-center gap-3 rounded-2xl bg-surface px-5 py-4 text-[13px] text-danger shadow-soft">
            <AlertCircle className="h-5 w-5 shrink-0" strokeWidth={1.8} />
            <span>{error}</span>
          </section>
        )}

        {isLoading && (
          <section className="flex items-center gap-3 rounded-2xl bg-surface px-5 py-8 text-muted shadow-soft">
            <RefreshCw className="h-5 w-5 animate-spin text-brand" strokeWidth={1.8} />
            Connecting to database and reading telemetry...
          </section>
        )}

        {!isLoading && deviceEntries.length === 0 && (
          <section className="rounded-2xl bg-surface px-5 py-8 text-[14px] text-muted shadow-soft">
            No devices found in the database. Waiting for sensor data from the collector.
          </section>
        )}

        {deviceEntries.map((device) => (
          <DeviceSection key={device.device_id} device={device} />
        ))}
      </div>
    </>
  );
}

function DeviceSection({ device }: { device: DeviceData }) {
  const sensors = Object.values(device.sensors || {});
  const ageMs = Date.now() - new Date(device.last_updated).getTime();
  const isStale = ageMs > 10000;

  return (
    <section className="rounded-2xl bg-surface px-5 py-5 shadow-soft">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[16px] font-extrabold text-ink">
            <Radio className={cx('h-4 w-4', isStale ? 'text-danger' : 'text-success')} strokeWidth={2} />
            {device.device_name}
          </h2>
          <p className="mt-1 text-[13px] text-muted">
            {device.location} · {isStale ? `Updated ${Math.round(ageMs / 1000)}s ago` : 'Updated just now'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sensors.map((sensor) => (
          <SensorCard key={sensor.sensor_id} sensor={sensor} />
        ))}
      </div>

      <HistorySparkline deviceId={device.device_id} />
    </section>
  );
}

function SensorCard({ sensor }: { sensor: SensorReading }) {
  const stale = Date.now() - new Date(sensor.time).getTime() > 10000;
  const decimals = sensor.unit === 'counts' ? 0 : 2;
  const value = Number.isFinite(sensor.value) ? sensor.value.toFixed(decimals) : '—';

  return (
    <article className={cx('rounded-2xl bg-canvas px-4 py-4', stale && 'opacity-70')}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-semibold text-ink">{sensor.description}</p>
        <span
          className={cx(
            'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
            sensor.quality === 'GOOD' ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger',
          )}
        >
          {sensor.quality}
        </span>
      </div>
      <p className="mt-3 text-[28px] font-extrabold leading-none text-brand">
        {value} <span className="text-[13px] font-medium text-muted">{sensor.unit}</span>
      </p>
      <p className="mt-2 text-[12px] text-muted">{new Date(sensor.time).toLocaleTimeString()}</p>
    </article>
  );
}

function HistorySparkline({ deviceId }: { deviceId: string }) {
  const [points, setPoints] = useState<number[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/readings/history?device_id=${encodeURIComponent(deviceId)}&limit=40`, {
          cache: 'no-store',
        });
        const json = await res.json();
        if (!mounted || !json.success || !Array.isArray(json.history)) return;
        const values = json.history
          .map((row: Record<string, unknown>) => {
            const numeric = Object.entries(row)
              .filter(([key, value]) => key !== 'time' && typeof value === 'number')
              .map(([, value]) => value as number);
            return numeric[0];
          })
          .filter((value: number | undefined): value is number => typeof value === 'number');
        setPoints(values);
      } catch {
        /* ignore */
      }
    };
    void load();
    const timer = setInterval(() => void load(), 4000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [deviceId]);

  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const path = points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * 100;
      const y = 100 - ((value - min) / span) * 100;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <div className="mt-5">
      <p className="mb-2 text-[13px] font-semibold text-muted">Recent trend</p>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-24 w-full overflow-visible">
        <path d={path} fill="none" stroke="currentColor" strokeWidth="2" className="text-brand" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
