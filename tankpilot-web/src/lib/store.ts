import { create } from 'zustand';
import { Tank, Plant, Industry, User } from './types';
import { mockTanks, mockPlants, mockIndustries, mockUsers } from './mockData';

interface AppState {
  tanks: Tank[];
  plants: Plant[];
  industries: Industry[];
  currentUser: User | null;
  isSimulating: boolean;

  // Actions
  login: (userId: string) => void;
  logout: () => void;
  toggleSimulation: () => void;
  acknowledgeAlarm: (tankId: string, alarmId: string) => void;

  // Selectors
  getTanksByPlant: (plantId: string) => Tank[];
  getPlantsByIndustry: (industryId: string) => Plant[];
}

export const useAppStore = create<AppState>((set, get) => {

  let simInterval: ReturnType<typeof setInterval> | null = null;

  const startSimulation = () => {
    if (simInterval) return;
    simInterval = setInterval(() => {
      set((state) => ({
        tanks: state.tanks.map(tank => {
          const levelFluctuation = tank.level.fillingRate > 0
            ? (tank.level.fillingRate / 60) * (Math.random() * 0.2 + 0.9)
            : tank.level.emptyingRate < 0
              ? (tank.level.emptyingRate / 60) * (Math.random() * 0.2 + 0.9)
              : (Math.random() * 0.1 - 0.05);

          let newRadar = tank.level.radar_pct + levelFluctuation;
          if (newRadar > 100) newRadar = 100;
          if (newRadar < 0) newRadar = 0;

          let tempTrend = tank.temperature.currentTrend;
          let newZones = [...tank.temperature.zones];
          if (tempTrend === 'heating' && newZones[0].value < tank.temperature.target) {
            newZones = newZones.map(z => ({ ...z, value: z.value + (Math.random() * 0.2) }));
          } else if (tempTrend === 'heating' && newZones[0].value >= tank.temperature.target) {
            tempTrend = 'holding';
          }

          return {
            ...tank,
            level: {
              ...tank.level,
              radar_pct: parseFloat(newRadar.toFixed(1)),
              pressure_pct: tank.level.agreementStatus === 'ok'
                ? parseFloat((newRadar + (Math.random() * 0.4 - 0.2)).toFixed(1))
                : tank.level.pressure_pct,
            },
            temperature: {
              ...tank.temperature,
              zones: newZones,
              currentTrend: tempTrend
            }
          };
        })
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

    login: (userId) => set({ currentUser: mockUsers.find(u => u.id === userId) || null }),
    logout: () => set({ currentUser: null }),

    toggleSimulation: () => set((state) => {
      const newState = !state.isSimulating;
      if (newState) startSimulation();
      else stopSimulation();
      return { isSimulating: newState };
    }),

    acknowledgeAlarm: (tankId, alarmId) => set((state) => ({
      tanks: state.tanks.map(tank => {
        if (tank.id !== tankId) return tank;
        return {
          ...tank,
          alarms: tank.alarms.map(a => a.id === alarmId ? { ...a, acknowledged: true } : a)
        };
      })
    })),

    getTanksByPlant: (plantId: string) => {
      const plant = get().plants.find(p => p.id === plantId);
      if (!plant) return [];
      return get().tanks.filter(t => plant.tankIds.includes(t.id));
    },

    getPlantsByIndustry: (industryId: string) => {
      const industry = get().industries.find(i => i.id === industryId);
      if (!industry) return [];
      return get().plants.filter(p => industry.plantIds.includes(p.id));
    },
  };
});
