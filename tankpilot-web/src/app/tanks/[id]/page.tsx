"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import styles from './page.module.css';
import { BrainCircuit, AlertTriangle, ArrowLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function TankDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { tanks, acknowledgeAlarm } = useAppStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const tank = tanks.find(t => t.id === id);
  if (!tank) {
    return <div>Tank not found</div>;
  }

  let statusClass = 'normal';
  if (tank.alarms.some(a => a.severity === 'critical')) statusClass = 'critical';
  else if (tank.alarms.some(a => a.severity === 'warning')) statusClass = 'warning';

  // Mock historical data for charts based on current live value (for demo)
  const mockTrendData = Array.from({ length: 20 }).map((_, i) => ({
    time: `-${20 - i}m`,
    radar: tank.level.radar_pct + (Math.sin(i) * 2),
    pressure: tank.level.pressure_pct + (Math.cos(i) * 2),
    temp: tank.temperature.zones[0].value - ((20 - i) * (tank.temperature.currentTrend === 'heating' ? -1 : tank.temperature.currentTrend === 'cooling' ? 1 : 0))
  }));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>
          <button onClick={() => router.back()} style={{ marginRight: '10px' }}><ArrowLeft size={24} color="var(--foreground)"/></button>
          {tank.name} 
          <div className={`${styles.statusIndicator} ${styles[statusClass]}`} />
        </h1>
      </div>

      <div className={styles.tabs}>
        {['overview', 'level', 'temperature', 'alarms', 'maintenance'].map(tab => (
          <button 
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'overview' && (
          <>
            {tank.advisories.length > 0 && (
              <div className={styles.advisoryChip}>
                <BrainCircuit size={24} />
                <div>
                  <strong>AI Advisory: </strong>
                  <p>{tank.advisories[0].message}</p>
                </div>
              </div>
            )}
            
            <div className={styles.overviewGrid}>
              <div className={`card ${styles.graphicCard}`}>
                {/* Simple SVG Tank Graphic */}
                <svg width="100" height="150" viewBox="0 0 100 150">
                  <rect x="10" y="10" width="80" height="130" rx="10" fill="none" stroke="var(--card-border)" strokeWidth="4" />
                  <rect 
                    x="12" 
                    y={140 - (128 * (tank.level.radar_pct / 100))} 
                    width="76" 
                    height={128 * (tank.level.radar_pct / 100)} 
                    rx="8" 
                    fill="var(--primary)" 
                    opacity="0.8"
                  />
                  <text x="50" y="165" textAnchor="middle" fill="var(--text-muted)" fontSize="12">{tank.level.radar_pct.toFixed(1)}%</text>
                </svg>
              </div>
              <div className={styles.metricsGrid}>
                <div className={styles.metricBox}>
                  <span className={styles.label}>Live Level</span>
                  <span className={styles.value}>{tank.level.radar_pct.toFixed(1)}%</span>
                </div>
                <div className={styles.metricBox}>
                  <span className={styles.label}>Volume</span>
                  <span className={styles.value}>{tank.level.volume_m3.toFixed(1)} m³</span>
                </div>
                <div className={styles.metricBox}>
                  <span className={styles.label}>Temperature</span>
                  <span className={styles.value}>{tank.temperature.zones[0].value.toFixed(1)}°C</span>
                </div>
                <div className={styles.metricBox}>
                  <span className={styles.label}>Status</span>
                  <span className={styles.value} style={{ color: tank.equipment.heaterStatus ? 'var(--status-warning)' : 'var(--text-muted)' }}>
                    {tank.equipment.heaterStatus ? 'Heating' : 'Idle'}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'level' && (
          <div className="card">
            <h3>Level Trend (Radar vs Pressure)</h3>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                  <XAxis dataKey="time" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }} />
                  <ReferenceLine y={90} stroke="var(--status-warning)" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'High Alarm', fill: 'var(--status-warning)' }} />
                  <Line type="monotone" dataKey="radar" stroke="var(--primary)" strokeWidth={2} dot={false} name="Radar %" />
                  <Line type="monotone" dataKey="pressure" stroke="var(--status-normal)" strokeWidth={2} dot={false} name="Pressure %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <p><strong>Agreement Status:</strong> <span style={{ color: tank.level.agreementStatus === 'ok' ? 'var(--status-normal)' : 'var(--status-critical)' }}>{tank.level.agreementStatus.toUpperCase()}</span></p>
              <p><strong>Filling Rate:</strong> {tank.level.fillingRate} %/hr | <strong>Emptying Rate:</strong> {tank.level.emptyingRate} %/hr</p>
            </div>
          </div>
        )}

        {activeTab === 'temperature' && (
          <div className="card">
            <h3>Temperature Trend</h3>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                  <XAxis dataKey="time" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" domain={['dataMin - 10', 'dataMax + 10']} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }} />
                  <ReferenceLine y={tank.temperature.target} stroke="var(--status-normal)" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Target', fill: 'var(--status-normal)' }} />
                  <Line type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={2} dot={false} name="Bottom Temp °C" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <h4>Zones</h4>
                <ul>
                  {tank.temperature.zones.map(z => (
                    <li key={z.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid var(--card-border)' }}>
                      <span>{z.name}</span>
                      <strong>{z.value.toFixed(1)}°C</strong>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p><strong>Trend:</strong> {tank.temperature.currentTrend.toUpperCase()}</p>
                <p><strong>Heater Sheath:</strong> {tank.temperature.heaterSheathTemp}°C</p>
                {tank.temperature.stratificationDetected && (
                  <p style={{ color: 'var(--status-warning)', marginTop: '0.5rem' }}>
                    <AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }}/> 
                    Stratification Detected
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alarms' && (
          <div className="card">
            <h3>Active Alarms</h3>
            {tank.alarms.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No active alarms.</p>
            ) : (
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {tank.alarms.map(alarm => (
                  <li key={alarm.id} style={{ 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    backgroundColor: alarm.severity === 'critical' ? 'var(--status-critical-bg)' : 'var(--status-warning-bg)',
                    border: `1px solid ${alarm.severity === 'critical' ? 'var(--status-critical)' : 'var(--status-warning)'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <strong style={{ color: alarm.severity === 'critical' ? 'var(--status-critical)' : 'var(--status-warning)' }}>{alarm.severity.toUpperCase()}</strong>
                      <p style={{ margin: '0.25rem 0 0 0' }}>{alarm.message}</p>
                      <small style={{ color: 'var(--text-muted)' }}>{new Date(alarm.timestamp).toLocaleTimeString()}</small>
                    </div>
                    {!alarm.acknowledged && (
                      <button 
                        onClick={() => acknowledgeAlarm(tank.id, alarm.id)}
                        style={{ padding: '0.5rem 1rem', borderRadius: '4px', backgroundColor: 'var(--card-bg)', color: 'var(--foreground)', border: '1px solid var(--card-border)' }}
                      >
                        ACK
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="card">
            <h3>Maintenance & Health</h3>
            <div style={{ marginBottom: '1.5rem' }}>
              <h4>Sensor Health Scores</h4>
              <ul style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {tank.maintenance.sensorHealthScores.map(s => (
                  <li key={s.sensorId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{s.name}</span>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      backgroundColor: s.score > 90 ? 'var(--status-normal-bg)' : 'var(--status-critical-bg)',
                      color: s.score > 90 ? 'var(--status-normal)' : 'var(--status-critical)'
                    }}>
                      {s.score}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            
            {tank.maintenance.predictiveAlerts.length > 0 && (
              <div>
                <h4>Predictive Alerts</h4>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', color: 'var(--text-muted)' }}>
                  {tank.maintenance.predictiveAlerts.map((alert, i) => (
                    <li key={i} style={{ listStyleType: 'disc' }}>{alert}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
