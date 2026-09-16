import type { Industry, Plant, PilotTank as Tank, User } from './pilotTypes';

export const mockUsers: User[] = [
  { id: 'u1', name: 'Operator John', role: 'operator', industryAccess: ['ind1'] },
  { id: 'u2', name: 'Admin Sarah', role: 'admin', industryAccess: ['ind1', 'ind2'] },
];

export const mockIndustries: Industry[] = [
  {
    id: 'ind1',
    name: 'Shree Cement Ltd',
    plantIds: ['p1', 'p2'],
  },
  {
    id: 'ind2',
    name: 'National Highways Authority',
    plantIds: ['p3'],
  },
];

export const mockPlants: Plant[] = [
  {
    id: 'p1',
    name: 'Beawar Hot Mix Plant',
    location: 'Beawar, Rajasthan',
    industryId: 'ind1',
    tankIds: ['t1', 't2'],
  },
  {
    id: 'p2',
    name: 'Ras Depot',
    location: 'Ras, Rajasthan',
    industryId: 'ind1',
    tankIds: ['t3'],
  },
  {
    id: 'p3',
    name: 'NH-48 Batch Plant',
    location: 'Udaipur, Rajasthan',
    industryId: 'ind2',
    tankIds: ['t4', 't5'],
  },
];

const now = new Date().toISOString();
const tenMinsAgo = new Date(Date.now() - 10 * 60000).toISOString();

export const mockTanks: Tank[] = [
  {
    id: 't1',
    name: 'TK-101 Bitumen',
    type: 'bitumen',
    plantId: 'p1',
    capacity_m3: 500,
    level: {
      radar_pct: 82.5,
      pressure_pct: 82.1,
      healthScore: 98,
      agreementStatus: 'ok',
      volume_m3: 412.5,
      mass_tonnes: 420.7,
      fillingRate: 0,
      emptyingRate: -5.2,
    },
    temperature: {
      zones: [
        { name: 'Bottom', value: 162 },
        { name: 'Middle', value: 160 },
        { name: 'Top', value: 158 },
      ],
      heaterSheathTemp: 185,
      target: 160,
      currentTrend: 'holding',
      predictedTimeToTarget: null,
      stratificationDetected: false,
    },
    alarms: [],
    advisories: [
      {
        id: 'adv1',
        message: 'Heating should start at 02:45 to meet 07:00 dispatch.',
        category: 'energy',
        timestamp: tenMinsAgo,
        tankId: 't1',
      },
    ],
    equipment: {
      inletValve: false, outletValve: true, inletPump: false,
      outletPump: true, heaterStatus: false, circulationPumpStatus: true,
    },
    energy: { holdingTempRecommendation: 155, efficiencyScore: 88, estimatedSavingsPct: 4 },
    maintenance: {
      sensorHealthScores: [
        { sensorId: 'radar1', name: 'Primary Radar', score: 99 },
        { sensorId: 'press1', name: 'Bottom PT', score: 95 },
      ],
      predictiveAlerts: [],
    },
  },
  {
    id: 't2',
    name: 'TK-102 PMB',
    type: 'PMB/CRMB',
    plantId: 'p1',
    capacity_m3: 300,
    level: {
      radar_pct: 94.2,
      pressure_pct: 94.5,
      healthScore: 96,
      agreementStatus: 'ok',
      volume_m3: 282.6,
      mass_tonnes: 288.2,
      fillingRate: 15.0,
      emptyingRate: 0,
    },
    temperature: {
      zones: [
        { name: 'Bottom', value: 175 },
        { name: 'Middle', value: 174 },
        { name: 'Top', value: 170 },
      ],
      heaterSheathTemp: 190,
      target: 175,
      currentTrend: 'heating',
      predictedTimeToTarget: 12,
      stratificationDetected: true,
    },
    alarms: [
      {
        id: 'al1', severity: 'warning',
        message: 'High level warning (94%)',
        timestamp: tenMinsAgo, acknowledged: false, tankId: 't2',
      },
    ],
    advisories: [
      {
        id: 'adv2',
        message: 'Tank will reach high-high level trip in 14 minutes.',
        category: 'level', timestamp: now, tankId: 't2',
      },
      {
        id: 'adv3',
        message: 'Temperature stratification detected. Ensure circulation pump is running.',
        category: 'temperature', timestamp: now, tankId: 't2',
      },
    ],
    equipment: {
      inletValve: true, outletValve: false, inletPump: true,
      outletPump: false, heaterStatus: true, circulationPumpStatus: false,
    },
    energy: { holdingTempRecommendation: 170, efficiencyScore: 72, estimatedSavingsPct: 8 },
    maintenance: {
      sensorHealthScores: [
        { sensorId: 'radar2', name: 'Primary Radar', score: 98 },
        { sensorId: 'press2', name: 'Bottom PT', score: 92 },
      ],
      predictiveAlerts: ['Agitator seal inspection due in 14 days.'],
    },
  },
  {
    id: 't3',
    name: 'TK-201 Fuel Oil',
    type: 'fuel oil',
    plantId: 'p2',
    capacity_m3: 1000,
    level: {
      radar_pct: 45.0,
      pressure_pct: 12.0,
      healthScore: 40,
      agreementStatus: 'mismatch',
      volume_m3: 450.0,
      mass_tonnes: 430.0,
      fillingRate: 0,
      emptyingRate: 0,
    },
    temperature: {
      zones: [
        { name: 'Bottom', value: 45 },
        { name: 'Middle', value: 44 },
        { name: 'Top', value: 44 },
      ],
      heaterSheathTemp: 45,
      target: 40,
      currentTrend: 'holding',
      predictedTimeToTarget: null,
      stratificationDetected: false,
    },
    alarms: [
      {
        id: 'al2', severity: 'critical',
        message: 'Sensor disagreement > 10%. Level derivation unsafe.',
        timestamp: tenMinsAgo, acknowledged: false, tankId: 't3',
      },
    ],
    advisories: [
      {
        id: 'adv4',
        message: 'Pressure level sensor drifting from radar. Check calibration.',
        category: 'sensor', timestamp: tenMinsAgo, tankId: 't3',
      },
    ],
    equipment: {
      inletValve: false, outletValve: false, inletPump: false,
      outletPump: false, heaterStatus: false, circulationPumpStatus: false,
    },
    energy: { holdingTempRecommendation: 35, efficiencyScore: 95, estimatedSavingsPct: 1 },
    maintenance: {
      sensorHealthScores: [
        { sensorId: 'radar3', name: 'Primary Radar', score: 98 },
        { sensorId: 'press3', name: 'Bottom PT', score: 35 },
      ],
      predictiveAlerts: ['Pressure transmitter out of bounds.'],
    },
  },
  {
    id: 't4',
    name: 'TK-301 Bitumen VG-30',
    type: 'bitumen',
    plantId: 'p3',
    capacity_m3: 800,
    level: {
      radar_pct: 60.0,
      pressure_pct: 59.8,
      healthScore: 97,
      agreementStatus: 'ok',
      volume_m3: 480.0,
      mass_tonnes: 489.0,
      fillingRate: 0,
      emptyingRate: -3.5,
    },
    temperature: {
      zones: [
        { name: 'Bottom', value: 155 },
        { name: 'Middle', value: 154 },
        { name: 'Top', value: 153 },
      ],
      heaterSheathTemp: 180,
      target: 155,
      currentTrend: 'holding',
      predictedTimeToTarget: null,
      stratificationDetected: false,
    },
    alarms: [],
    advisories: [],
    equipment: {
      inletValve: false, outletValve: true, inletPump: false,
      outletPump: true, heaterStatus: false, circulationPumpStatus: true,
    },
    energy: { holdingTempRecommendation: 150, efficiencyScore: 91, estimatedSavingsPct: 3 },
    maintenance: {
      sensorHealthScores: [
        { sensorId: 'radar4', name: 'Primary Radar', score: 99 },
        { sensorId: 'press4', name: 'Bottom PT', score: 96 },
      ],
      predictiveAlerts: [],
    },
  },
  {
    id: 't5',
    name: 'TK-302 Emulsion',
    type: 'emulsion',
    plantId: 'p3',
    capacity_m3: 200,
    level: {
      radar_pct: 25.0,
      pressure_pct: 24.8,
      healthScore: 99,
      agreementStatus: 'ok',
      volume_m3: 50.0,
      mass_tonnes: 51.0,
      fillingRate: 0,
      emptyingRate: 0,
    },
    temperature: {
      zones: [
        { name: 'Bottom', value: 70 },
        { name: 'Middle', value: 69 },
        { name: 'Top', value: 68 },
      ],
      heaterSheathTemp: 75,
      target: 70,
      currentTrend: 'holding',
      predictedTimeToTarget: null,
      stratificationDetected: false,
    },
    alarms: [],
    advisories: [
      {
        id: 'adv5',
        message: 'Low level — consider scheduling next delivery.',
        category: 'level', timestamp: now, tankId: 't5',
      },
    ],
    equipment: {
      inletValve: false, outletValve: false, inletPump: false,
      outletPump: false, heaterStatus: false, circulationPumpStatus: false,
    },
    energy: { holdingTempRecommendation: 65, efficiencyScore: 94, estimatedSavingsPct: 2 },
    maintenance: {
      sensorHealthScores: [
        { sensorId: 'radar5', name: 'Primary Radar', score: 100 },
        { sensorId: 'press5', name: 'Bottom PT', score: 98 },
      ],
      predictiveAlerts: [],
    },
  },
];
