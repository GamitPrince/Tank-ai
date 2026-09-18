export type Connectivity = 'online' | 'offline' | 'connecting';
export type AlertLevel = 'none' | 'warning' | 'critical';
export type LevelZone = 'low' | 'safe' | 'high' | 'high-high';

export interface Tank {
  id: string;
  index: number;
  productName: string;
  connectivity: Connectivity;
  alertLevel: AlertLevel;
  temperatureC: number | null;
  targetTemperatureC: number | null;
  heaterOn: boolean | null;
  levelPercent: number | null;
  levelZone: LevelZone | null;
  pressureHpa: number | null;
}

export interface NotificationItem {
  id: string;
  tankId: string;
  alarmId?: string;
  tankLabel: string;
  type: 'warning' | 'connection';
  title: string;
  message: string;
}

export interface TankExtras {
  levelMeters: number | null;
  heaterTemperatureC: number | null;
  energyKwh: number;
  energyDeltaPct: number;
  energyDate: string;
  volumeM3: number;
  massTonnes: number;
  efficiencyScore: number;
  holdingTempRecommendation: number;
  estimatedSavingsPct: number;
  radarPct: number;
  pressurePct: number;
  agreementStatus: 'ok' | 'mismatch';
  fillingRate: number;
  emptyingRate: number;
  healthScore: number;
  capacityM3: number;
  zones: { name: string; value: number }[];
  trend: 'heating' | 'cooling' | 'holding';
  stratificationDetected: boolean;
  predictedTimeToTarget: number | null;
  sensorHealth: { sensorId: string; name: string; score: number }[];
  predictiveAlerts: string[];
  advisories: string[];
}

export interface Branch {
  id: string;
  name: string;
  location?: string;
}
