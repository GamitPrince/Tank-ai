# UBERBILT — Tank Monitoring Dashboard
### Build prompt for Google Antigravity

> **How to use this:** Open Antigravity's Agent Manager → New Workspace → **Planning mode** (not Fast mode — this is an 8+ screen build, worth the extra planning pass). Paste everything below as your first message, then **attach the 8 reference screenshots to the same message** (drag-and-drop, or copy + Ctrl/Cmd+V into the prompt box) so the agent can visually cross-check its own browser-rendered output against them. Pick a higher-capability model (e.g. Gemini 3 Pro) given the number of screens involved. Review the generated Implementation Plan before approving it — trim or reorder steps there if you want to change scope.

## Task

Build **UBERBILT**, a mobile-first responsive web app for monitoring industrial storage tanks — temperature, heating, fill level, pressure, and connectivity — across one or more branches. Recreate the 8 attached reference screens faithfully using the exact design tokens in this doc, then wire them into a working, navigable prototype backed by mock data.

## Reference screen ↔ file mapping

Two of your file names don't match their content, so here's the exact mapping used throughout this doc:

| Screen (used below) | Your file |
|---|---|
| Login | `1_Landing_page.png` |
| Dashboard (all-tanks grid) | `2_Tanks_Details.png` |
| Tank Detail (single-tank hub) | `3_Dashboard.png` |
| Heater Control | `4_Heater.png` |
| Temperature (read-only) | `5_Temp.png` |
| Edit Target Temperature | `6_edit_Temp.png` |
| Level (read-only) | `7_Level.png` |
| Notification | `8_Notification.png` |

## Tech stack

- **Framework:** React 18 + TypeScript, bundled with Vite
- **Styling:** Tailwind CSS (config below)
- **Routing:** React Router, or Next.js App Router if you'd rather have file-based routes
- **State/data:** local mock data + React state is enough for v1 — shape it exactly as in the Data Model section so it's a clean swap for a real API/WebSocket later
- **Icons:** `lucide-react` (thin rounded-line set closest to the reference art)
- **Canvas:** design for **393 × 852px** (iPhone 14/15 Pro logical size, matches all 8 reference PNGs exactly), mobile-first, no `sm:`/`md:` prefixes needed for the core layout. Add a `max-w-[430px] mx-auto` wrapper so it stays phone-shaped on wider viewports instead of stretching edge-to-edge.

> Building a native app instead of a web app? Everything from here down (design tokens, screens, data model, component list) carries over directly — just swap this section for Flutter/Dart or React Native + Expo.

## Design system

### Colors
Pixel-sampled directly from the reference PNGs (not eyeballed) — use as exact values.

| Token | Hex | Used for |
|---|---|---|
| `canvas` | `#F2F3F7` | Screen background — identical on every screen |
| `surface` | `#FFFFFF` | Cards, inputs, buttons, icon-button circles |
| `shadow` | `#D6DCE6` | Soft drop-shadow tint under every surface, ~30–50% opacity |
| `brand` | `#F37121` | Logo, section labels, active icons, key metric numbers, primary button text |
| `brand-bright` | `#FF8526` | Gradient highlight on the heater dial arc |
| `brand-deep` | `#C66E16` | Gradient shadow-side of the heater dial arc |
| `accent-light` | `#11E4F3` | Top of teal vertical gradients (level fill, target-temp slider) |
| `accent-dark` | `#01646A` | Bottom of teal vertical gradients |
| `danger` | `#D64343` | Warning triangles, offline/low-signal icons, critical states |
| `success` | `#4ECF27` | "Online" wifi icon + label |
| `ink` | `#332E2D` | Titles, big numeric read-outs |
| `muted` | `#7C7577` | Sub-labels, units, placeholder copy — also use at reduced opacity for inactive/"off" icon tints instead of a separate gray |

```js
// tailwind.config.js — theme.extend
colors: {
  canvas: '#F2F3F7',
  surface: '#FFFFFF',
  shadow: '#D6DCE6',
  brand: { DEFAULT: '#F37121', bright: '#FF8526', deep: '#C66E16' },
  accent: { light: '#11E4F3', dark: '#01646A' },
  danger: '#D64343',
  success: '#4ECF27',
  ink: '#332E2D',
  muted: '#7C7577',
},
borderRadius: { '2xl': '24px' },
```

### Typography
- Geometric, slightly-rounded sans — **Manrope** or **Poppins** (Google Fonts) both read very close to the reference.
- Bold/700 for titles, big numbers ("280°", "145.5", "TANK 1") and button labels.
- Regular/500 for sub-labels ("Product Name", "Temperature", "KW/h").
- The **UBERBILT wordmark** is a separate bold condensed display face, not the body font — orange "U", rest of the word in near-black, with a small triangular accent near the top-right of the mark. If you have the client's logo file/SVG, use that directly instead of re-typesetting it.
- Watch exact copy casing — it's inconsistent in the source and should stay that way: button reads **"SUBMIT"** (all caps) on Login but **"Apply"** (sentence case) on Edit Target Temperature. The Notification screen's title is singular — **"Notification"**, not "Notifications" — even though it lists several.

### Shape & elevation
- Large cards: `24px` corner radius. Inputs, buttons, nav tiles: `16–18px`. Icon buttons, pill buttons, and slider tracks: fully rounded (`9999px`).
- Every surface — cards, inputs, buttons, gauge tracks — sits on the `canvas` with the same soft, diffused drop shadow; there are no hard borders or strokes anywhere. (The flattened screenshots don't let me confirm whether inputs use a subtly inverted/inset shadow vs. cards' outer shadow — if you have Figma access, check; otherwise a uniform soft outer shadow is a safe default.)
- Icon buttons (back, settings, bell, power) are consistently a `44–48px` white circle with a single centered icon — build once as a shared `IconButton` and reuse everywhere.

### Iconography
Thin, rounded-stroke line icons (`lucide-react` maps well): chevron-left, settings/gear, bell, wifi, triangle-alert, flame, thermometer, droplet, gauge, zap/bolt, power, pencil, chevron-down.

## Global patterns

- **Header pattern** (every screen except Login): back `IconButton` top-left, optional centered screen title, settings `IconButton` top-right. Dashboard is the one exception — logo instead of back button, notification bell (with an unread-dot badge) instead of settings.
- **Status is never color-only:** every state pairs an icon *and* a color *and* a text label — wifi icon + green + "Online", flame icon + gray + "Off", triangle + red + "Warning". Keep that redundancy; it's good practice, don't simplify it away.
- **Card-first layout:** almost nothing sits directly on the gray canvas except the header icons — everything else lives inside a white rounded card.

## Data model

```ts
type Connectivity = "online" | "offline" | "connecting";
type AlertLevel = "none" | "warning" | "critical";
type LevelZone = "low" | "safe" | "high" | "high-high";

interface Tank {
  id: string;                     // "tank-1"
  index: number;                  // 1–8 → renders as "TANK {index}"
  productName: string;
  connectivity: Connectivity;
  alertLevel: AlertLevel;
  temperatureC: number | null;
  targetTemperatureC: number | null;
  heaterOn: boolean | null;       // null while connecting/critical — render as unknown, not "Off"
  levelPercent: number | null;    // 0–100
  levelZone: LevelZone | null;
  pressureHpa: number | null;
}

interface NotificationItem {
  id: string;
  tankId: string;
  tankLabel: string;              // "TANK 1"
  type: "warning" | "connection";
  title: string;                  // "Warning" | "Connection"
  message: string;                // "Low level limit Warning", "Tank connection is offline", ...
}
```

Note: the reference screens show literal placeholder copy — "Product Name" on the grid, "Running Product Name" on Tank Detail/Temperature — on every single card. Swap in real product names (Diesel, Crude Oil, Water, …) for your mock data so the prototype doesn't look unfinished; keep "Running Product Name" as the exact label pattern where a product genuinely isn't assigned.

Seed at least 8 mock tanks reproducing every state visible in the reference Dashboard — see the 5 states listed under Screen 2 below — and 4 mock notifications matching both `type` values.

## Screens

### 1. Login
No header icons at all. Centered wordmark over three labeled fields — **Name** (text), **Password** (with a show/hide toggle, shown hidden by default), **Branch** (select, chevron-down) — each an inset-looking white field with an orange label above it. Large empty spacer, then a centered (not full-width) pill **"SUBMIT"** button, orange label on white.

### 2. Dashboard (all-tanks grid)
Logo top-left, notification bell with an unread-dot badge top-right. 2-column grid of 8 `TankCard`s, each "TANK N" (orange) + "Product Name" (muted) + a temperature/flame row — except where a state overrides that. Model **5 distinct card states**, all present in the reference:
1. **Online + heating** — green wifi/online indicator, full data, flame lit orange
2. **Offline** — offline indicator, full data still shown, flame gray/off
3. **Active warning** — red triangle badge in the corner, data still visible
4. **Connecting** — only a large wifi icon shown, no product/temp/flame data yet
5. **Critical/fault** — visibly dimmed card background, red-tinted title, large warning icon, no data at all

Tapping a card opens Tank Detail for that tank; tapping the bell opens Notification.

### 3. Tank Detail (single-tank hub)
Back + settings header, no title text. Hero card: tank name + "Running Product Name" on the left, a large live temperature reading on the right, a 3-column stat row underneath (Heating on/off with flame icon, Level in meters, Pressure in hPa). Below it, a 2×2 grid of `NavTile`s — Heater, Temperature, Level, **Pressure** — each linking to its own screen. A full-width "Network connection" card closes out the screen, reflecting that tank's live connectivity.

### 4. Heater Control
Back + centered "Heater" title + settings. A large circular gauge shows the heater value as an orange arc (gradient `brand-deep` → `brand-bright`) around a centered "50°" reading and "Heater Temperature" label, with a power toggle button overlapping the bottom of the ring. *(The reference doesn't show the dial's min/max — assume 0–100° unless you know the real hardware range.)* Below: an energy-usage card ("21 July 2025" / "Energy Usage" / "145.5 KW/h" / "15% less than yesterday") and a second compact card repeating the day's usage total.

### 5. Temperature (read-only)
Back + "Temperature" title + settings. Tank name + "Running Product Name" on the left with a small thermometer icon; on the right, a tall vertical capsule track with tick labels every 50° from 0–300°c, filled in two tones — `brand` orange from 0 up to the live reading, `accent` teal from there up to the target, unfilled above that. A summary card below shows Live vs. Target temperature side by side, with a small teal edit button on the Target value opening Screen 6.

### 6. Edit Target Temperature
Back + "Target Temperature" title + settings. The same tall track, now an interactive vertical slider — draggable pill handle, teal gradient fill below it. A side card restates the current Live/Target values for reference; a "Change Temperature" card shows a live preview that updates as the handle moves. A bottom **"Apply"** button commits the new target back to Screen 5.

### 7. Level (read-only)
Back + "Level" title + settings. A slim reference track on the left labeled with the 4 zones top-to-bottom (Level 4 High-High, Level 3 High, Level 2 Safe, Level 1 Low) with a short teal marker roughly at the current zone; a wide capsule on the right shows the same reading as a teal gradient fill height. A summary card names the current level and zone (e.g. "Level 2 — Safe Level").

### 8. Notification
Back + "Notification" title (singular) + settings. A vertical list of cards, each showing the tank label + a type tag (**Warning** / **Connection**) in muted text, a one-line message, and a trailing red icon — triangle-alert for warnings, wifi/signal for connection issues.

### 9. Pressure — not in the reference shots
Build it as a sibling of Temperature/Level using the same vertical-track pattern (hPa scale instead of °c or %), so all four tiles on Tank Detail's nav grid have a working destination.

### 10. Settings — not in the reference shots
The gear icon appears on every inner screen but no destination was provided. Stub a simple placeholder screen (header pattern + "Settings" title + empty state) rather than leaving the icon dead.

## Navigation map

```
Login --(submit)--> Dashboard
Dashboard --(bell)--> Notification --(back)--> Dashboard
Dashboard --(tap a tank card)--> Tank Detail --(back)--> Dashboard
Tank Detail --(Heater tile)--> Heater --(back)--> Tank Detail
Tank Detail --(Temperature tile)--> Temperature --(back)--> Tank Detail
Temperature --(edit icon)--> Edit Target Temperature --(Apply or back)--> Temperature
Tank Detail --(Level tile)--> Level --(back)--> Tank Detail
Tank Detail --(Pressure tile)--> Pressure --(back)--> Tank Detail
Any inner screen --(gear)--> Settings --(back)--> previous screen
```

## Component checklist

Build these once, reuse everywhere: `IconButton`, `FormField` (text / password / select variants), `PillButton`, `TankCard` (5 states), `HeroSummaryCard`, `NavTile`, `InlineStatRow`, `CircularGaugeDial`, `StatCard`, `VerticalGaugeTrack` (read-only, dual-tone), `VerticalSliderTrack` (draggable), `ValuePairCard` (Live/Target, Current Level), `NotificationCard`.

## Verification checklist

Use this against your own browser screenshots during the Verification phase:

- [ ] Login: 393×852 canvas, `canvas` background, logo centered near the top, three fields + a centered (not full-width) "SUBMIT" pill
- [ ] Dashboard: 2×4 card grid; all 5 `TankCard` states present in the mock data and visually distinct from each other
- [ ] Tank Detail: hero card's 2-column layout + 3-stat row match; 2×2 nav grid links to all four sub-screens; network card reflects that tank's live connectivity
- [ ] Heater: arc gauge reflects the value; power button overlaps the ring's lower edge; both energy cards match the copy format ("KW/h", "% less than yesterday")
- [ ] Temperature: dual-tone track (orange → teal → empty), 50° ticks 0–300, edit button opens Screen 6
- [ ] Edit Target Temperature: dragging the handle live-updates the preview card; Apply writes the new value back to Screen 5
- [ ] Level: the mini 4-zone track and the wide gradient fill agree with each other; summary card names the correct zone
- [ ] Notification: both `warning` and `connection` types render with the correct icon + copy; title reads "Notification" (singular)
- [ ] Every status anywhere in the app is icon + color + text together — never color alone

## If you hit the weekly token quota

Split into three Planning-mode tasks instead of one: **(1)** design tokens + Login + Dashboard, **(2)** Tank Detail + Heater + Temperature + Edit Target Temperature, **(3)** Level + Notification + Pressure/Settings stubs + a final pass against the verification checklist above.
