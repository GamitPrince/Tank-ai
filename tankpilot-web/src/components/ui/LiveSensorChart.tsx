"use client";

import { useEffect, useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { SensorReading } from '@/lib/useLiveReadings';
import { TrendingUp, Activity } from 'lucide-react';
import styles from './LiveSensorChart.module.css';

interface ChartPoint {
  time: string;
  timeLabel: string;
  timestamp: number;
  [key: string]: number | string;
}

interface LiveSensorChartProps {
  deviceId: string;
  deviceName: string;
  liveSensors: Record<string, SensorReading>;
}

type MetricType = 'level' | 'current_ma' | 'voltage' | 'adc_raw';

const METRIC_CONFIG: Record<
  MetricType,
  {
    label: string;
    unit: string;
    color: string;
    stroke: string;
    gradientId: string;
    domain: [number, number];
    highAlarm?: number;
    lowAlarm?: number;
  }
> = {
  level: {
    label: 'Tank Level',
    unit: '%',
    color: '#3b82f6',
    stroke: '#60a5fa',
    gradientId: 'gradientLevel',
    domain: [0, 100],
    highAlarm: 90,
    lowAlarm: 10,
  },
  current_ma: {
    label: 'Loop Current',
    unit: 'mA',
    color: '#10b981',
    stroke: '#34d399',
    gradientId: 'gradientCurrent',
    domain: [0, 24],
    highAlarm: 20,
    lowAlarm: 4,
  },
  voltage: {
    label: 'ADC Voltage',
    unit: 'V',
    color: '#f59e0b',
    stroke: '#fbbf24',
    gradientId: 'gradientVoltage',
    domain: [0, 3.5],
  },
  adc_raw: {
    label: 'Raw ADC Count',
    unit: 'counts',
    color: '#8b5cf6',
    stroke: '#a78bfa',
    gradientId: 'gradientAdc',
    domain: [0, 4095],
  },
};

export default function LiveSensorChart({
  deviceId,
  deviceName,
  liveSensors,
}: LiveSensorChartProps) {
  const [activeMetric, setActiveMetric] = useState<MetricType>('level');
  const [dataPoints, setDataPoints] = useState<ChartPoint[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. Initial fetch of historical readings from TimescaleDB
  useEffect(() => {
    let mounted = true;
    async function fetchHistory() {
      try {
        const res = await fetch(`/api/readings/history?device_id=${encodeURIComponent(deviceId)}&limit=30`);
        const json = await res.json();
        if (!mounted || !json.success || !Array.isArray(json.history)) return;

        const formatted: ChartPoint[] = json.history.map((item: Record<string, unknown>) => {
          const t = new Date(String(item.time));
          return {
            time: String(item.time),
            timeLabel: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            timestamp: t.getTime(),
            level: Number(item.level ?? 0),
            current_ma: Number(item.current_ma ?? 0),
            voltage: Number(item.voltage ?? 0),
            adc_raw: Number(item.adc_raw ?? 0),
          };
        });

        setDataPoints(formatted);
      } catch (err) {
        console.error('Failed to load initial history for chart:', err);
      }
    }

    fetchHistory();
    return () => {
      mounted = false;
    };
  }, [deviceId]);

  // 2. Append new live telemetry point as it arrives from polling
  useEffect(() => {
    if (!liveSensors || Object.keys(liveSensors).length === 0) return;

    // Find the latest timestamp among live sensors
    const timestamps = Object.values(liveSensors)
      .map(s => new Date(s.time).getTime())
      .filter(t => !isNaN(t));

    if (timestamps.length === 0) return;
    const latestTime = Math.max(...timestamps);

    setDataPoints(prev => {
      // Check if we already have this exact timestamp
      const lastPoint = prev[prev.length - 1];
      if (lastPoint && lastPoint.timestamp >= latestTime) {
        return prev;
      }

      const d = new Date(latestTime);
      const newPoint: ChartPoint = {
        time: d.toISOString(),
        timeLabel: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        timestamp: latestTime,
        level: Number(liveSensors.level?.value ?? (lastPoint ? lastPoint.level : 0)),
        current_ma: Number(liveSensors.current_ma?.value ?? (lastPoint ? lastPoint.current_ma : 0)),
        voltage: Number(liveSensors.voltage?.value ?? (lastPoint ? lastPoint.voltage : 0)),
        adc_raw: Number(liveSensors.adc_raw?.value ?? (lastPoint ? lastPoint.adc_raw : 0)),
      };

      // Keep last 40 data points in rolling window
      const updated = [...prev, newPoint];
      return updated.length > 40 ? updated.slice(-40) : updated;
    });
  }, [liveSensors]);

  const config = METRIC_CONFIG[activeMetric];

  // Calculate stats over visible data
  const stats = useMemo(() => {
    if (dataPoints.length === 0) {
      return { current: 0, min: 0, max: 0, avg: 0 };
    }
    const values = dataPoints
      .map(p => Number(p[activeMetric]))
      .filter(v => typeof v === 'number' && !isNaN(v));

    if (values.length === 0) {
      return { current: 0, min: 0, max: 0, avg: 0 };
    }

    const current = values[values.length - 1];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    return { current, min, max, avg };
  }, [dataPoints, activeMetric]);

  const decimals = activeMetric === 'adc_raw' ? 0 : 2;

  return (
    <div className={styles.chartCard}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <TrendingUp size={22} color={config.color} />
          <h3>{deviceName} — Real-Time Telemetry Trend</h3>
          <div className={styles.liveBadge}>
            <span className={styles.liveDot} />
            <span>LIVE</span>
          </div>
        </div>

        <div className={styles.selectorTabs}>
          {(Object.keys(METRIC_CONFIG) as MetricType[]).map(metricKey => (
            <button
              key={metricKey}
              className={`${styles.tabBtn} ${activeMetric === metricKey ? styles.active : ''}`}
              onClick={() => setActiveMetric(metricKey)}
            >
              {METRIC_CONFIG[metricKey].label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Current</span>
          <span className={styles.statVal} style={{ color: config.color }}>
            {stats.current.toFixed(decimals)} {config.unit}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Min</span>
          <span className={styles.statVal}>
            {stats.min.toFixed(decimals)} {config.unit}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Max</span>
          <span className={styles.statVal}>
            {stats.max.toFixed(decimals)} {config.unit}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Average</span>
          <span className={styles.statVal}>
            {stats.avg.toFixed(decimals)} {config.unit}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Samples</span>
          <span className={styles.statVal}>{dataPoints.length}</span>
        </div>
      </div>

      <div className={styles.chartContainer}>
        {!isMounted ? null : dataPoints.length === 0 ? (
          <div className={styles.emptyState}>
            <Activity size={32} />
            <span>Waiting for telemetry points...</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dataPoints} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={config.gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={config.color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={config.color} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
              <XAxis
                dataKey="timeLabel"
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
                minTickGap={25}
              />
              <YAxis
                stroke="var(--text-muted)"
                domain={config.domain}
                fontSize={11}
                tickLine={false}
                unit={` ${config.unit}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderColor: 'var(--card-border)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                  color: 'var(--foreground)',
                }}
                formatter={(val: unknown) => [
                  `${Number(val).toFixed(decimals)} ${config.unit}`,
                  config.label,
                ]}
                labelFormatter={(label) => `Time: ${label}`}
              />
              {config.highAlarm !== undefined && (
                <ReferenceLine
                  y={config.highAlarm}
                  stroke="var(--status-critical)"
                  strokeDasharray="4 4"
                  label={{
                    position: 'insideTopRight',
                    value: `High Alarm (${config.highAlarm}${config.unit})`,
                    fill: 'var(--status-critical)',
                    fontSize: 11,
                  }}
                />
              )}
              {config.lowAlarm !== undefined && (
                <ReferenceLine
                  y={config.lowAlarm}
                  stroke="var(--status-warning)"
                  strokeDasharray="4 4"
                  label={{
                    position: 'insideBottomRight',
                    value: `Low Alarm (${config.lowAlarm}${config.unit})`,
                    fill: 'var(--status-warning)',
                    fontSize: 11,
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey={activeMetric}
                stroke={config.stroke}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={`url(#${config.gradientId})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
