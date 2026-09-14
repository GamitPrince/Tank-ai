"use client";

import { useAppStore } from '@/lib/store';
import { Bell, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function AlarmsPage() {
  const { tanks, acknowledgeAlarm } = useAppStore();
  
  // Flatten all alarms across tanks
  const allAlarms = tanks.flatMap(tank => 
    tank.alarms.map(alarm => ({
      ...alarm,
      tankName: tank.name
    }))
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Bell size={28} color="var(--primary)" />
        <h1 style={{ margin: 0 }}>Global Alarms Feed</h1>
      </div>
      
      {allAlarms.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No active alarms across any site.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {allAlarms.map(alarm => (
            <div key={`${alarm.tankId}-${alarm.id}`} style={{ 
              padding: '1rem', 
              borderRadius: '8px', 
              backgroundColor: alarm.severity === 'critical' ? 'var(--status-critical-bg)' : 'var(--status-warning-bg)',
              border: `1px solid ${alarm.severity === 'critical' ? 'var(--status-critical)' : 'var(--status-warning)'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={18} color={alarm.severity === 'critical' ? 'var(--status-critical)' : 'var(--status-warning)'} />
                    <strong style={{ color: alarm.severity === 'critical' ? 'var(--status-critical)' : 'var(--status-warning)' }}>
                      {alarm.severity.toUpperCase()}
                    </strong>
                  </div>
                  <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem' }}>{alarm.tankName}</h3>
                  <p style={{ margin: '0.25rem 0', color: 'var(--foreground)' }}>{alarm.message}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
                  <small style={{ color: 'var(--text-muted)' }}>{new Date(alarm.timestamp).toLocaleTimeString()}</small>
                  {!alarm.acknowledged && (
                    <button 
                      onClick={() => alarm.tankId && acknowledgeAlarm(alarm.tankId, alarm.id)}
                      style={{ padding: '0.5rem 1rem', borderRadius: '4px', backgroundColor: 'var(--card-bg)', color: 'var(--foreground)', border: '1px solid var(--card-border)' }}
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                <Link href={`/tanks/${alarm.tankId}`} style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  Go to Tank &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
