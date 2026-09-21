import { create } from 'zustand';
import {
  FIXED_ADMIN_EMAILS,
  FIXED_ADMIN_USERS,
  isFixedAdmin,
  mockIndustries,
  mockPlants,
  mockTanks,
  mockUsers,
} from './pilotData';
import type { Industry, PilotTank, Plant, User } from './pilotTypes';

interface PilotState {
  tanks: PilotTank[];
  plants: Plant[];
  industries: Industry[];
  users: User[];
  currentUser: User | null;
  isSimulating: boolean;
  login: (userId: string) => void;
  loginWithGoogle: (profile?: { name?: string; email?: string; avatar?: string }) => void;
  logout: () => void;
  toggleSimulation: () => void;
  acknowledgeAlarm: (tankId: string, alarmId: string) => void;
  setTargetTemperature: (tankId: string, value: number) => void;
  toggleHeater: (tankId: string) => void;
  getTanksByPlant: (plantId: string) => PilotTank[];
  getPlantsByIndustry: (industryId: string) => Plant[];
  updateUserAccess: (userId: string, updates: Partial<User>) => void;
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

          let newPressure = tank.level.pressure_pct;
          if (tank.level.agreementStatus === 'ok') {
              // Introduce gradual drift occasionally to test the alarm
              const drift = Math.random() < 0.05 ? (Math.random() * 0.5) : (newRadar - newPressure) * 0.1;
              newPressure = newPressure + drift;
          }

          // Check for sensor disagreement (difference > 5.0% instead of 0.5m for percentage scale)
          const isDisagreement = Math.abs(newRadar - newPressure) > 5.0;
          let newAlarms = [...tank.alarms];
          const hasDisagreementAlarm = newAlarms.some(a => a.message.includes('Sensor Disagreement'));
          
          if (isDisagreement && !hasDisagreementAlarm) {
              newAlarms.push({
                  id: `al-dis-${Date.now()}`,
                  severity: 'critical',
                  message: 'Sensor Disagreement Alarm: Radar and PT differ significantly.',
                  timestamp: new Date().toISOString(),
                  acknowledged: false,
                  tankId: tank.id
              });
          } else if (!isDisagreement && hasDisagreementAlarm) {
              newAlarms = newAlarms.filter(a => !a.message.includes('Sensor Disagreement'));
          }

          // Simulate inlet/outlet valves based on fill/empty rate
          const inletValve = tank.level.fillingRate > 0;
          const outletValve = tank.level.emptyingRate < 0;

          return {
            ...tank,
            alarms: newAlarms,
            equipment: {
              ...tank.equipment,
              inletValve,
              outletValve,
            },
            level: {
              ...tank.level,
              radar_pct: parseFloat(newRadar.toFixed(1)),
              pressure_pct: parseFloat(newPressure.toFixed(1)),
              volume_m3: parseFloat(((newRadar / 100) * tank.capacity_m3).toFixed(1)),
              agreementStatus: isDisagreement ? 'mismatch' : 'ok',
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
    users: mockUsers,
    currentUser: null, // Default to null until logged in
    isSimulating: false,

    login: (userId) => set((state) => ({ currentUser: state.users.find((u) => u.id === userId) || null })),
    
    loginWithGoogle: (profile) => {
      const email = profile?.email?.trim().toLowerCase();
      if (!email) return;

      const state = get();
      
      // Fixed Admins are automatically verified and granted admin access
      if (isFixedAdmin(email)) {
        const matchedAdmin = FIXED_ADMIN_USERS.find((u) => u.email?.toLowerCase() === email)!;
        const finalUser: User = {
          ...matchedAdmin,
          name: profile?.name || matchedAdmin.name,
          email: matchedAdmin.email,
          avatar: profile?.avatar || matchedAdmin.avatar,
          role: 'admin',
          industryAccess: ['ind1', 'ind2'], // Full access
          authProvider: 'google',
          isFixedAdmin: true,
        };
        
        // Ensure admin is in the users list
        const users = state.users.some(u => u.email === finalUser.email)
          ? state.users.map(u => u.email === finalUser.email ? finalUser : u)
          : [...state.users, finalUser];
          
        set({ currentUser: finalUser, users });
        return;
      }
      
      // Standard users
      const existingUser = state.users.find(u => u.email?.toLowerCase() === email);
      if (existingUser) {
        const updatedUser = { ...existingUser, name: profile?.name || existingUser.name, authProvider: 'google' as const };
        const users = state.users.map(u => u.id === existingUser.id ? updatedUser : u);
        set({ currentUser: updatedUser, users });
      } else {
        // Create new regular user
        const newUser: User = {
          id: `u-${Date.now()}`,
          name: profile?.name || email.split('@')[0],
          email: email,
          avatar: profile?.avatar,
          role: 'operator',
          industryAccess: [], // Admin must assign access
          authProvider: 'google',
          isFixedAdmin: false,
        };
        set({ currentUser: newUser, users: [...state.users, newUser] });
      }
    },
    
    logout: () => set({ currentUser: null }),

    updateUserAccess: (userId, updates) =>
      set((state) => {
        const userToUpdate = state.users.find(u => u.id === userId);
        if (!userToUpdate || userToUpdate.isFixedAdmin) return state; // Prevent modifying fixed admins
        
        const users = state.users.map((u) => (u.id === userId ? { ...u, ...updates } : u));
        // If updating the currently logged-in user, reflect changes immediately
        const currentUser = state.currentUser?.id === userId ? { ...state.currentUser, ...updates } : state.currentUser;
        
        return { users, currentUser };
      }),

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

export { mockUsers, FIXED_ADMIN_EMAILS, FIXED_ADMIN_USERS, isFixedAdmin };

