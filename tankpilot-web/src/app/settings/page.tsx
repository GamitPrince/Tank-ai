"use client";

import { useAppStore } from '@/lib/store';
import { Settings as SettingsIcon, User as UserIcon } from 'lucide-react';
import { mockUsers } from '@/lib/mockData';

export default function SettingsPage() {
  const { currentUser, login, logout, isSimulating, toggleSimulation } = useAppStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <SettingsIcon size={28} color="var(--primary)" />
        <h1 style={{ margin: 0 }}>Settings</h1>
      </div>
      
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.25rem' }}>
          <UserIcon size={20} /> Account Profile
        </h2>
        
        {currentUser ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Name:</span>
              <strong>{currentUser.name}</strong>
              
              <span style={{ color: 'var(--text-muted)' }}>Role:</span>
              <span style={{ textTransform: 'capitalize' }}>{currentUser.role}</span>
              
              <span style={{ color: 'var(--text-muted)' }}>Access:</span>
              <span>{currentUser.industryAccess.join(', ')}</span>
            </div>
            
            <button 
              onClick={logout}
              style={{ padding: '0.5rem 1rem', borderRadius: '4px', backgroundColor: 'var(--status-critical-bg)', color: 'var(--status-critical)', border: '1px solid var(--status-critical)', alignSelf: 'flex-start' }}
            >
              Log Out
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>You are not logged in.</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {mockUsers.map(u => (
                <button 
                  key={u.id}
                  onClick={() => login(u.id)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '4px', backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none' }}
                >
                  Log in as {u.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Developer Tools</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>Real-time Simulation</strong>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
              Simulates live telemetry data changing over time.
            </p>
          </div>
          <button 
            onClick={toggleSimulation}
            style={{ 
              padding: '0.5rem 1rem', 
              borderRadius: '4px', 
              backgroundColor: isSimulating ? 'var(--status-ai-bg)' : 'var(--card-bg)', 
              color: isSimulating ? 'var(--status-ai)' : 'var(--foreground)', 
              border: `1px solid ${isSimulating ? 'var(--status-ai)' : 'var(--card-border)'}` 
            }}
          >
            {isSimulating ? 'Stop Simulation' : 'Start Simulation'}
          </button>
        </div>
      </div>
    </div>
  );
}
