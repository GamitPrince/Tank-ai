import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AppShell } from './components/AppShell';
import { Dashboard } from './screens/Dashboard';
import { EditTargetTemperature } from './screens/EditTargetTemperature';
import { Energy } from './screens/Energy';
import { Heater } from './screens/Heater';
import { Industries } from './screens/Industries';
import { Level } from './screens/Level';
import { Live } from './screens/Live';
import { Login } from './screens/Login';
import { Notification } from './screens/Notification';
import { Pressure } from './screens/Pressure';
import { Settings } from './screens/Settings';
import { TankDetail } from './screens/TankDetail';
import { Temperature } from './screens/Temperature';
import { useApp } from './store';

function Protected({ children }: { children: ReactNode }) {
  const { authenticated } = useApp();
  if (!authenticated) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { authenticated } = useApp();

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={authenticated ? <Navigate to="/industries" replace /> : <Login />} />
        <Route
          path="/industries"
          element={
            <Protected>
              <Industries />
            </Protected>
          }
        />
        <Route
          path="/dashboard"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route
          path="/notifications"
          element={
            <Protected>
              <Notification />
            </Protected>
          }
        />
        <Route path="/live" element={<Live />} />
        <Route
          path="/energy"
          element={
            <Protected>
              <Energy />
            </Protected>
          }
        />
        <Route
          path="/tanks/:tankId"
          element={
            <Protected>
              <TankDetail />
            </Protected>
          }
        />
        <Route
          path="/tanks/:tankId/heater"
          element={
            <Protected>
              <Heater />
            </Protected>
          }
        />
        <Route
          path="/tanks/:tankId/temperature"
          element={
            <Protected>
              <Temperature />
            </Protected>
          }
        />
        <Route
          path="/tanks/:tankId/temperature/edit"
          element={
            <Protected>
              <EditTargetTemperature />
            </Protected>
          }
        />
        <Route
          path="/tanks/:tankId/level"
          element={
            <Protected>
              <Level />
            </Protected>
          }
        />
        <Route
          path="/tanks/:tankId/pressure"
          element={
            <Protected>
              <Pressure />
            </Protected>
          }
        />
        <Route
          path="/settings"
          element={
            <Protected>
              <Settings />
            </Protected>
          }
        />
      </Routes>
    </AppShell>
  );
}
