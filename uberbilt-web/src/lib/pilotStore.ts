import { create } from 'zustand';
import { mockIndustries, mockPlants, mockTanks, mockUsers } from './pilotData';
import type { Industry, PilotTank, Plant, User } from './pilotTypes';

interface PilotState {
  tanks: PilotTank[];
  plants: Plant[];
  industries: Industry[];
  currentUser: User | null;
  isSimulating: boolean;
  login: (userId: string) => void;
  logout: () => void;
  toggleSimulation: () => void;
  acknowledgeAlarm: (tankId: string, alarmId: string) => void;
  setTargetTemperature: (tankId: string, value: number) => void;
  toggleHeater: (tankId: string) => void;
  getTanksByPlant: (plantId: string) => PilotTank[];
  getPlantsByIndustry: (industryId: string) => Plant[];
}

export const usePilotStore = create<PilotState>((set, get) => {
  let simInterval: ReturnType<typeof setInterval> | null = null;

  const startSimulation = () => {
    if (simInterval) return;
    simInterval = setInterval(() => {
      set((state) => ({
        tanks: state.tanks.map((tank) => {
          const levelFluctuation =
            tank.level.fillingRate > 0
              ? (tank.level.fillingRate / 60) * (Math.random() * 0.2 + 0.9)
              : tank.level.emptyingRate < 0
                ? (tank.level.emptyingRate / 60) * (Math.random() * 0.2 + 0.9)
                : Math.random() * 0.1 - 0.05;

          let newRadar = tank.level.radar_pct + levelFluctuation;
          if (newRadar > 100) newRadar = 100;
          if (newRadar < 0) newRadar = 0;

          let tempTrend = tank.temperature.currentTrend;
          let newZones = [...tank.temperature.zones];
          if (tempTrend === 'heating' && newZones[0].value < tank.temperature.target) {
            newZones = newZones.map((z) => ({ ...z, value: z.value + Math.random() * 0.2 }));
          } else if (tempTrend === 'heating' && newZones[0].value >= tank.temperature.target) {
            tempTrend = 'holding';
          }

          return {
            ...tank,
            level: {
              ...tank.level,
              radar_pct: parseFloat(newRadar.toFixed(1)),
              pressure_pct:
                tank.level.agreementStatus === 'ok'
                  ? parseFloat((newRadar + (Math.random() * 0.4 - 0.2)).toFixed(1))
                  : tank.level.pressure_pct,
              volume_m3: parseFloat(((newRadar / 100) * tank.capacity_m3).toFixed(1)),
            },
            temperature: {
              ...tank.temperature,
              zones: newZones,
              currentTrend: tempTrend,
            },
          };
        }),
      }));
    }, 2000);
  };

  const stopSimulation = () => {
    if (simInterval) {
      clearInterval(simInterval);
      simInterval = null;
    }
  };

  return {
    tanks: mockTanks,
    plants: mockPlants,
    industries: mockIndustries,
    currentUser: mockUsers[0],
    isSimulating: false,

    login: (userId) => set({ currentUser: mockUsers.find((u) => u.id === userId) || null }),
    logout: () => set({ currentUser: null }),

    toggleSimulation: () =>
      set((state) => {
        const next = !state.isSimulating;
        if (next) startSimulation();
        else stopSimulation();
        return { isSimulating: next };
      }),

    acknowledgeAlarm: (tankId, alarmId) =>
      set((state) => ({
        tanks: state.tanks.map((tank) => {
          if (tank.id !== tankId) return tank;
          return {
            ...tank,
            alarms: tank.alarms.map((a) => (a.id === alarmId ? { ...a, acknowledged: true } : a)),
          };
        }),
      })),

    setTargetTemperature: (tankId, value) =>
      set((state) => ({
        tanks: state.tanks.map((tank) =>
          tank.id === tankId
            ? { ...tank, temperature: { ...tank.temperature, target: value } }
            : tank,
        ),
      })),

    toggleHeater: (tankId) =>
      set((state) => ({
        tanks: state.tanks.map((tank) => {
          if (tank.id !== tankId) return tank;
          const heaterStatus = !tank.equipment.heaterStatus;
          return {
            ...tank,
            equipment: { ...tank.equipment, heaterStatus },
            temperature: {
              ...tank.temperature,
              currentTrend: heaterStatus ? 'heating' : 'holding',
            },
          };
        }),
      })),

    getTanksByPlant: (plantId) => {
      const plant = get().plants.find((p) => p.id === plantId);
      if (!plant) return [];
      return get().tanks.filter((t) => plant.tankIds.includes(t.id));
    },

    getPlantsByIndustry: (industryId) => {
      const industry = get().industries.find((i) => i.id === industryId);
      if (!industry) return [];
      return get().plants.filter((p) => industry.plantIds.includes(p.id));
    },
  };
});

export { mockUsers };
