import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { toExtras, toNotifications, toViewTank } from './lib/mapTank';
import { mockUsers, usePilotStore } from './lib/pilotStore';
import type { Industry, PilotTank, Plant, User } from './lib/pilotTypes';
import type { Branch, NotificationItem, Tank, TankExtras } from './types';

export type Theme = 'light' | 'dark';

function readTheme(): Theme {
  return 'dark';
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  try {
    localStorage.setItem('uberbilt-theme', theme);
  } catch {
    /* ignore */
  }
}

function matchUser(name: string): User {
  const needle = name.trim().toLowerCase();
  return (
    mockUsers.find((u) => u.name.toLowerCase() === needle) ||
    mockUsers.find((u) => u.name.toLowerCase().includes(needle) && needle.length > 0) ||
    mockUsers[0]
  );
}

interface AppContextValue {
  authenticated: boolean;
  userName: string;
  branchId: string;
  theme: Theme;
  tanks: Tank[];
  notifications: NotificationItem[];
  extras: Record<string, TankExtras>;
  branches: Branch[];
  currentUser: User | null;
  isSimulating: boolean;
  plantSelected: boolean;
  accessibleIndustries: Industry[];
  accessiblePlants: Plant[];
  pilotTanks: PilotTank[];
  login: (userName: string, branchId?: string) => void;
  logout: () => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setBranchId: (branchId: string) => void;
  selectPlant: (plantId: string) => void;
  getTank: (id: string) => Tank | undefined;
  setTargetTemperature: (tankId: string, value: number) => void;
  toggleHeater: (tankId: string) => void;
  toggleSimulation: () => void;
  acknowledgeAlarm: (tankId: string, alarmId: string) => void;
  switchUser: (userId: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const pilotTanks = usePilotStore((s) => s.tanks);
  const plants = usePilotStore((s) => s.plants);
  const industries = usePilotStore((s) => s.industries);
  const currentUser = usePilotStore((s) => s.currentUser);
  const isSimulating = usePilotStore((s) => s.isSimulating);
  const [authenticated, setAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [branchId, setBranchIdState] = useState('');
  const [plantSelected, setPlantSelected] = useState(false);
  const [theme, setThemeState] = useState<Theme>(readTheme);

  const accessiblePlants = useMemo(() => {
    if (!currentUser) return plants;
    const plantIds = new Set(
      currentUser.industryAccess.flatMap(
        (industryId) => industries.find((industry) => industry.id === industryId)?.plantIds ?? [],
      ),
    );
    return plants.filter((plant) => plantIds.has(plant.id));
  }, [currentUser, industries, plants]);

  const accessibleIndustries = useMemo(() => {
    const allowed = new Set(currentUser?.industryAccess ?? industries.map((industry) => industry.id));
    return industries
      .filter((industry) => allowed.has(industry.id))
      .map((industry) => ({
        ...industry,
        plantIds: industry.plantIds.filter((plantId) => accessiblePlants.some((plant) => plant.id === plantId)),
      }))
      .filter((industry) => industry.plantIds.length > 0);
  }, [accessiblePlants, currentUser, industries]);

  const branches: Branch[] = useMemo(
    () => accessiblePlants.map((plant) => ({ id: plant.id, name: plant.name, location: plant.location })),
    [accessiblePlants],
  );

  const activePlantId =
    plantSelected && branches.some((branch) => branch.id === branchId) ? branchId : '';

  const plantTanks = useMemo(() => {
    const plant = accessiblePlants.find((item) => item.id === activePlantId);
    if (!plant) return [];
    return plant.tankIds
      .map((id) => pilotTanks.find((tank) => tank.id === id))
      .filter((tank): tank is NonNullable<typeof tank> => Boolean(tank));
  }, [accessiblePlants, activePlantId, pilotTanks]);

  const tanks = useMemo(
    () => plantTanks.map((tank, index) => toViewTank(tank, index + 1)),
    [plantTanks],
  );

  const extras = useMemo(
    () => Object.fromEntries(plantTanks.map((tank) => [tank.id, toExtras(tank)])),
    [plantTanks],
  );

  const notifications = useMemo(() => toNotifications(plantTanks), [plantTanks]);

  const login = useCallback((name: string, nextBranchId?: string) => {
    const user = matchUser(name);
    usePilotStore.getState().login(user.id);
    const state = usePilotStore.getState();
    const plantIds = new Set(
      user.industryAccess.flatMap(
        (industryId) => state.industries.find((industry) => industry.id === industryId)?.plantIds ?? [],
      ),
    );
    const userPlants = state.plants.filter((plant) => plantIds.has(plant.id));
    setUserName(user.name);
    setAuthenticated(true);
    if (nextBranchId && userPlants.some((plant) => plant.id === nextBranchId)) {
      setBranchIdState(nextBranchId);
      setPlantSelected(true);
    } else {
      setBranchIdState('');
      setPlantSelected(false);
    }
  }, []);

  const logout = useCallback(() => {
    setAuthenticated(false);
    setUserName('');
    setBranchIdState('');
    setPlantSelected(false);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next);
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      return next;
    });
  }, []);

  const setBranchId = useCallback((id: string) => {
    setBranchIdState(id);
    setPlantSelected(Boolean(id));
  }, []);

  const selectPlant = useCallback((plantId: string) => {
    setBranchIdState(plantId);
    setPlantSelected(true);
  }, []);

  const getTank = useCallback((id: string) => tanks.find((tank) => tank.id === id), [tanks]);

  const setTargetTemperature = useCallback((tankId: string, value: number) => {
    usePilotStore.getState().setTargetTemperature(tankId, value);
  }, []);

  const toggleHeater = useCallback((tankId: string) => {
    usePilotStore.getState().toggleHeater(tankId);
  }, []);

  const toggleSimulation = useCallback(() => {
    usePilotStore.getState().toggleSimulation();
  }, []);

  const acknowledgeAlarm = useCallback((tankId: string, alarmId: string) => {
    usePilotStore.getState().acknowledgeAlarm(tankId, alarmId);
  }, []);

  const switchUser = useCallback((userId: string) => {
    const user = mockUsers.find((item) => item.id === userId);
    if (!user) return;
    usePilotStore.getState().login(user.id);
    setUserName(user.name);
    const state = usePilotStore.getState();
    const plantIds = new Set(
      user.industryAccess.flatMap(
        (industryId) => state.industries.find((industry) => industry.id === industryId)?.plantIds ?? [],
      ),
    );
    const userPlants = state.plants.filter((plant) => plantIds.has(plant.id));
    const keepPlant = userPlants.some((plant) => plant.id === branchId);
    setBranchIdState(keepPlant ? branchId : '');
    setPlantSelected(keepPlant);
  }, [branchId]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      authenticated,
      userName,
      branchId: activePlantId,
      theme,
      tanks,
      notifications,
      extras,
      branches,
      currentUser,
      isSimulating,
      plantSelected,
      accessibleIndustries,
      accessiblePlants,
      pilotTanks,
      login,
      logout,
      setTheme,
      toggleTheme,
      setBranchId,
      selectPlant,
      getTank,
      setTargetTemperature,
      toggleHeater,
      toggleSimulation,
      acknowledgeAlarm,
      switchUser,
    }),
    [
      authenticated,
      userName,
      activePlantId,
      theme,
      tanks,
      notifications,
      extras,
      branches,
      currentUser,
      isSimulating,
      plantSelected,
      accessibleIndustries,
      accessiblePlants,
      pilotTanks,
      login,
      logout,
      setTheme,
      toggleTheme,
      setBranchId,
      selectPlant,
      getTank,
      setTargetTemperature,
      toggleHeater,
      toggleSimulation,
      acknowledgeAlarm,
      switchUser,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
