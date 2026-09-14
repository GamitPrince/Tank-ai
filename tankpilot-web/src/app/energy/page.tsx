"use client";

import { useAppStore } from '@/lib/store';
import { Zap, Leaf } from 'lucide-react';
import Link from 'next/link';

export default function EnergyPage() {
  const { tanks } = useAppStore();
  
  // Calculate average site efficiency
  const avgEfficiency = tanks.length > 0 
    ? Math.round(tanks.reduce((acc, t) => acc + t.energy.efficiencyScore, 0) / tanks.length)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Zap size={28} color="var(--primary)" />
        <h1 style={{ margin: 0 }}>Energy Dashboard</h1>
      </div>
      
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--status-ai-bg)', borderColor: 'var(--status-ai)' }}>
        <div>
          <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--status-ai)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Leaf size={24} /> Site Efficiency Score
          </h2>
          <p style={{ margin: 0, color: 'var(--foreground)' }}>Based on heater usage vs ambient heat loss.</p>
        </div>
        <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--status-ai)' }}>
          {avgEfficiency}%
        </div>
      </div>
      
      <h3>Tank Breakdown</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {tanks.map(tank => (
          <Link href={`/tanks/${tank.id}`} key={tank.id} className="card" style={{ transition: 'transform 0.2s', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong style={{ fontSize: '1.1rem' }}>{tank.name}</strong>
              <span style={{ 
                padding: '0.25rem 0.5rem', 
                borderRadius: '4px', 
                backgroundColor: tank.energy.efficiencyScore >= 85 ? 'var(--status-normal-bg)' : 'var(--status-warning-bg)',
                color: tank.energy.efficiencyScore >= 85 ? 'var(--status-normal)' : 'var(--status-warning)',
                fontWeight: 'bold'
              }}>
                {tank.energy.efficiencyScore}%
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Holding Recommendation:</span>
                <strong>{tank.energy.holdingTempRecommendation}°C</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Estimated Savings:</span>
                <strong style={{ color: 'var(--status-normal)' }}>{tank.energy.estimatedSavingsPct}%</strong>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
