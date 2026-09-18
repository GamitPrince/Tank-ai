import type { AlertLevel, LevelZone, NotificationItem, Tank, TankExtras } from '../types';
import type { PilotTank } from './pilotTypes';

export function levelZoneFromPct(pct: number): LevelZone {
  if (pct >= 95) return 'high-high';
  if (pct >= 85) return 'high';
  if (pct >= 30) return 'safe';
  return 'low';
}

function alertLevel(tank: PilotTank): AlertLevel {
  const unacked = tank.alarms.filter((a) => !a.acknowledged);
  if (unacked.some((a) => a.severity === 'critical')) return 'critical';
  if (unacked.some((a) => a.severity === 'warning') || tank.level.agreementStatus === 'mismatch') {
    return 'warning';
  }
  return 'none';
}

export function toViewTank(tank: PilotTank, index: number): Tank {
  const mid =
    tank.temperature.zones.find((z) => z.name === 'Middle') ??
    tank.temperature.zones[1] ??
    tank.temperature.zones[0];

  return {
    id: tank.id,
    index,
    productName: tank.name,
    connectivity: tank.level.agreementStatus === 'mismatch' ? 'connecting' : 'online',
    alertLevel: alertLevel(tank),
    temperatureC: Math.round(mid?.value ?? 0),
    targetTemperatureC: tank.temperature.target,
    heaterOn: tank.equipment.heaterStatus,
    levelPercent: tank.level.radar_pct,
    levelZone: levelZoneFromPct(tank.level.radar_pct),
    pressureHpa: Math.round(tank.level.pressure_pct * 20),
  };
}

export function toExtras(tank: PilotTank): TankExtras {
  const heaterLoad = tank.equipment.heaterStatus ? 2.4 : 0.85;
  return {
    levelMeters: Math.round((tank.level.volume_m3 / tank.capacity_m3) * 12 * 10) / 10,
    heaterTemperatureC: Math.round(tank.temperature.heaterSheathTemp),
    energyKwh: Math.round(tank.capacity_m3 * heaterLoad) / 10,
    energyDeltaPct: -tank.energy.estimatedSavingsPct,
    energyDate: new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    volumeM3: tank.level.volume_m3,
    massTonnes: tank.level.mass_tonnes,
    efficiencyScore: tank.energy.efficiencyScore,
    holdingTempRecommendation: tank.energy.holdingTempRecommendation,
    estimatedSavingsPct: tank.energy.estimatedSavingsPct,
    radarPct: tank.level.radar_pct,
    pressurePct: tank.level.pressure_pct,
    agreementStatus: tank.level.agreementStatus,
    fillingRate: tank.level.fillingRate,
    emptyingRate: tank.level.emptyingRate,
    healthScore: tank.level.healthScore,
    capacityM3: tank.capacity_m3,
    zones: tank.temperature.zones,
    trend: tank.temperature.currentTrend,
    stratificationDetected: tank.temperature.stratificationDetected,
    predictedTimeToTarget: tank.temperature.predictedTimeToTarget,
    sensorHealth: tank.maintenance.sensorHealthScores,
    predictiveAlerts: tank.maintenance.predictiveAlerts,
    advisories: tank.advisories.map((a) => a.message),
  };
}

export function toNotifications(tanks: PilotTank[]): NotificationItem[] {
  const items: NotificationItem[] = [];

  for (const tank of tanks) {
    for (const alarm of tank.alarms.filter((a) => !a.acknowledged)) {
      const sensorIssue = /sensor|connection|disagreement/i.test(alarm.message);
      items.push({
        id: alarm.id,
        tankId: tank.id,
        alarmId: alarm.id,
        tankLabel: tank.name,
        type: sensorIssue ? 'connection' : 'warning',
        title: alarm.severity === 'critical' ? 'Critical' : 'Warning',
        message: alarm.message,
      });
    }

    for (const advisory of tank.advisories) {
      items.push({
        id: advisory.id,
        tankId: tank.id,
        tankLabel: tank.name,
        type: advisory.category === 'sensor' ? 'connection' : 'warning',
        title: advisory.category,
        message: advisory.message,
      });
    }
  }

  return items;
}
