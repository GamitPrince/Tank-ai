# Build Prompt: Smart Tank AI Companion App (Mobile)

Paste this whole prompt into your AI coding agent (Antigravity, Claude Code, Cursor, etc.) as the project brief.

---

## 1. Project Summary

Build a cross-platform mobile app (React Native + Expo, or Flutter — pick React Native + Expo unless told otherwise) called **"TankPilot"** (placeholder name) that acts as the operator/manager companion app for an AI-assisted industrial tank control system (bitumen, fuel oil, thermal oil, chemical, and additive storage tanks).

The app is **not** the safety system. It is a monitoring, advisory, and reporting layer that sits on top of a PLC/SCADA backend. All hard interlocks (high-high level trip, overtemperature trip, emergency stop, etc.) live in the PLC and are read-only status in this app — the app must never claim to control safety-critical outputs directly.

Target users: plant operators (shift-level, mobile-first, glanceable UI), plant/maintenance managers (trend and alarm history), and OEM/service engineers (multi-site fleet view, later phase).

## 2. Tech Stack

- **Framework:** React Native (Expo, TypeScript)
- **Navigation:** React Navigation (bottom tabs + stack)
- **State/data:** React Query for server state, Zustand (or Context) for local UI state
- **Realtime data:** WebSocket or MQTT-over-WebSocket client subscribing to a backend gateway (backend exposes OPC UA/Modbus data via MQTT bridge — assume a REST + MQTT API is already available; mock it locally first)
- **Charts:** Victory Native or react-native-svg-charts for trends (level %, temperature, filling rate)
- **Local persistence/offline cache:** MMKV or AsyncStorage for last-known values when connectivity drops
- **Auth:** Role-based login (Operator / Supervisor / Admin / Service Engineer) via JWT against backend auth endpoint
- **Push notifications:** Expo Notifications for critical and warning alarms
- **Design system:** Dark-mode-first industrial UI (control-room aesthetic), high-contrast status colors, large touch targets for gloved/field use

## 3. Core Data Model (mock this with a local JSON/fixture layer first, then wire to real API)

```
Tank {
  id, name, type (bitumen | PMB/CRMB | fuel oil | thermal oil | additive | emulsion | chemical),
  siteId, capacity_m3,
  level: { radar_pct, pressure_pct, healthScore, agreementStatus (ok|mismatch), volume_m3, mass_tonnes, fillingRate, emptyingRate },
  temperature: { zones: [{ name, value }], heaterSheathTemp, target, currentTrend (heating|cooling|holding), predictedTimeToTarget, stratificationDetected },
  alarms: [{ id, severity (critical|warning|advisory), message, timestamp, acknowledged }],
  advisories: [{ id, message, category (level|temperature|energy|maintenance|sensor), timestamp }],
  equipment: { inletValve, outletValve, inletPump, outletPump, heaterStatus, circulationPumpStatus },
  energy: { holdingTempRecommendation, efficiencyScore, estimatedSavingsPct },
  maintenance: { sensorHealthScores: [{ sensorId, name, score }], predictiveAlerts: [] }
}

Site {
  id, name, tanks: [Tank.id]
}

User {
  id, name, role (operator|supervisor|admin|service), siteAccess: [Site.id]
}
```

## 4. Screens (MVP scope — Phase 1 & 2 from the design doc)

1. **Login** — role-based auth, site selection.
2. **Site Dashboard** — grid/list of tank cards. Each card: tank name, level %, temperature, status color (green/amber/red/blue-advisory/grey-offline), top alarm if any.
3. **Tank Detail** — tabs within one screen:
   - *Overview*: tank graphic (simple SVG level fill), live level, volume, temperature, heater/pump/valve status icons, AI advisory box.
   - *Level*: radar vs. pressure comparison, sensor agreement status, filling/emptying rate, predicted time-to-high-level / time-to-high-high-level, trend chart.
   - *Temperature*: multi-zone temperature readout, heating trend chart, predicted time-to-target, stratification indicator, ScorchGuard status.
   - *Alarms*: filterable list (critical/warning/advisory), acknowledge action, timestamped history.
   - *Maintenance*: sensor health scores, predictive maintenance alerts.
4. **Alarms (global)** — cross-tank alarm feed with push notification deep-linking, acknowledge/mute (mute never suppresses critical alarms — advisory/warning only).
5. **Energy** — per-tank and site-level energy efficiency score, holding-temperature recommendations, estimated savings.
6. **Settings / Profile** — user role, site access, notification preferences, unit preferences (°C/°F, m³/L/tonnes), connectivity/VPN status indicator.

Defer to later phases (build the nav/data model to allow these, but don't fully implement in MVP): multi-site fleet comparison dashboard, OEM remote diagnostics, benchmarking.

## 5. AI Advisory Rendering

Advisories are short, plain-language, and always sourced from a specific tank + category. Render them as a distinct "AI Advisory" chip/card style (blue accent) so operators never confuse them with hard alarms. Examples the UI should be able to display verbatim from the backend:
- "Tank will reach high level in 14 minutes."
- "Heating should start at 02:45 to meet 07:00 dispatch."
- "Temperature stratification detected. Start circulation pump."
- "Pressure level sensor drifting from radar. Check calibration."

## 6. Non-Functional Requirements

- **Offline resilience:** app must show last-known cached values with a clear "stale data" indicator if the realtime connection drops; never fabricate data.
- **No safety authority:** UI must never expose a control that overrides a hard interlock (e.g., no "override high-high trip" button). Any manual command screens (if added later) require Supervisor/Admin role and a confirmation step, and must be clearly labeled as advisory/non-safety commands only.
- **Accessibility:** large fonts option, high-contrast mode, works one-handed.
- **Security:** no hardcoded credentials, token refresh flow, session timeout, role-based screen access.
- **Performance:** dashboard should render smoothly with 50+ tanks across multiple sites (virtualized lists).

## 7. Build Order (ask the agent to follow this sequence)

1. Scaffold Expo TypeScript project, navigation shell, dark theme design tokens.
2. Build mock data layer (fixtures matching the data model above) and a simple data-fetching hook layer so real API/MQTT can be swapped in later without UI changes.
3. Build Site Dashboard + Tank Detail (Overview tab) against mock data.
4. Add Level and Temperature tabs with charts.
5. Add Alarms (tank-level + global) with push notification wiring (can stub the push service initially).
6. Add Energy and Maintenance screens.
7. Add Settings/auth/role-gating.
8. Write a short README describing how to swap the mock data layer for a real backend (REST + MQTT endpoints, expected payload shapes).

---

### Notes for the agent
- Keep components small and typed; avoid `any`.
- Use the color convention from the design doc: Green = normal, Amber = advisory/warning, Red = critical trip, Blue = AI recommendation, Grey = offline/manual.
- Do not implement any control logic that would function as a safety interlock — this app is advisory/monitoring only.
