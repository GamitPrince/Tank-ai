export type Severity = 'critical' | 'warning' | 'advisory';
export type TankType =
  | 'bitumen'
  | 'PMB/CRMB'
  | 'fuel oil'
  | 'thermal oil'
  | 'additive'
  | 'emulsion'
  | 'chemical';
export type UserRole = 'operator' | 'supervisor' | 'admin' | 'service';

export interface Alarm {
  id: string;
  severity: Severity;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  tankId?: string;
}

export interface Advisory {
  id: string;
  message: string;
  category: 'level' | 'temperature' | 'energy' | 'maintenance' | 'sensor';
  timestamp: string;
  tankId?: string;
}

export interface PilotTank {
  id: string;
  name: string;
  type: TankType;
  plantId: string;
  capacity_m3: number;
  level: {
    radar_pct: number;
    pressure_pct: number;
    healthScore: number;
    agreementStatus: 'ok' | 'mismatch';
    volume_m3: number;
    mass_tonnes: number;
    fillingRate: number;
    emptyingRate: number;
  };
  temperature: {
    zones: { name: string; value: number }[];
    heaterSheathTemp: number;
    target: number;
    currentTrend: 'heating' | 'cooling' | 'holding';
    predictedTimeToTarget: number | null;
    stratificationDetected: boolean;
  };
  alarms: Alarm[];
  advisories: Advisory[];
  equipment: {
    inletValve: boolean;
    outletValve: boolean;
    inletPump: boolean;
    outletPump: boolean;
    heaterStatus: boolean;
    circulationPumpStatus: boolean;
  };
  energy: {
    holdingTempRecommendation: number;
    efficiencyScore: number;
    estimatedSavingsPct: number;
  };
  maintenance: {
    sensorHealthScores: { sensorId: string; name: string; score: number }[];
    predictiveAlerts: string[];
  };
}

export interface Plant {
  id: string;
  name: string;
  location: string;
  industryId: string;
  tankIds: string[];
}

export interface Industry {
  id: string;
  name: string;
  plantIds: string[];
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  industryAccess: string[];
}
