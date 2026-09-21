# TEMP_ESP32_ONLY — Temporary ESP32-Only Architecture

> **⚠️ TEMPORARY IMPLEMENTATION**
>
> The Nucleo-F767ZI is currently unavailable (short-circuited).
> The ESP32-S3 is temporarily performing all Nucleo functionality.
> **Revert to the original Nucleo + ESP32 architecture** when the
> replacement Nucleo board arrives.

---

## Why This Folder Exists

The RTU Level Control system has two main hardware components:

1. **Nucleo-F767ZI** — sensor acquisition, ADC, relay control, Modbus TCP, data formatting
2. **ESP32-S3** (KTRON ESP-S3-4G-DEV) — cloud gateway (WiFi / 4G LTE)

The Nucleo board is currently short-circuited and a replacement is on order.
This folder contains a **temporary, isolated** ESP32-only firmware that performs
both the Nucleo's and ESP32's jobs on a single ESP32 board, so development and
testing can continue.

---

## Architecture

### Production (Normal)

```
Sensors (4–20 mA)
       ↓
Nucleo-F767ZI
  • ADC (PA3, 12-bit)
  • Voltage → Current → Level
  • Relay control (PE0)
  • Modbus TCP server (port 502)
  • Data formatting (JSON)
       ↓ UART (binary framed protocol)
ESP32-S3
  • Receive Nucleo data
  • HTTP POST via WiFi / 4G LTE
       ↓
Cloud Server (FastAPI, port 8080)
       ↓
TimescaleDB (readings + events)
       ↓
Custom Software
```

### Temporary (This Folder)

```
Sensors (4–20 mA, with signal conditioning)
       ↓
ESP32-S3 (single board)
  • ADC (GPIO1 / ADC1_CH0, 12-bit)
  • Voltage → Current → Level (same math)
  • Relay control (GPIO2)
  • Data formatting (same JSON)
  • HTTP POST via WiFi / 4G LTE
       ↓
Cloud Server (FastAPI, port 8080)
       ↓
TimescaleDB (readings + events)
       ↓
Custom Software
```

### Differences from Production

| Aspect | Production | Temporary |
|--------|-----------|-----------|
| Sensor acquisition | Nucleo ADC (PA3) | ESP32 ADC (GPIO1) |
| Signal processing | Nucleo (STM32 HAL) | ESP32 (analogRead + esp_adc_cal) |
| Relay output | Nucleo PE0 (5V tolerant) | ESP32 GPIO2 (3.3V) |
| Modbus TCP | Nucleo LwIP, port 502 | **NOT AVAILABLE** (no Ethernet) |
| Local DAQ collector | Polls Modbus TCP | **NOT AVAILABLE** during temp mode |
| Nucleo ↔ ESP32 UART | Binary framed protocol | **ELIMINATED** (same chip) |
| Cloud JSON format | **Same** | **Same** |
| Device ID | `rtu_level_control_01` | `rtu_level_control_01` |
| Database schema | **Unchanged** | **Unchanged** |
| Cloud API endpoint | **Same** | **Same** |

---

## Folder Structure

```
TEMP_ESP32_ONLY/
├── README.md                              ← This file
├── esp32_firmware/
│   ├── platformio.ini                     ← PlatformIO project config
│   └── src/
│       ├── main.cpp                       ← Unified entry point
│       ├── config.h                       ← All configuration
│       ├── sensor_acquisition.h/.cpp      ← ADC + conversions (replaces Nucleo)
│       ├── relay_control.h/.cpp           ← Relay GPIO (replaces Nucleo PE0)
│       ├── cloud_client.h/.cpp            ← HTTP POST with failover
│       ├── wifi_manager.h/.cpp            ← WiFi connection management
│       ├── modem_manager.h/.cpp           ← 4G LTE modem management
│       └── buffer_manager.h/.cpp          ← Offline message buffering
└── documentation/
    └── hardware_wiring.md                 ← Wiring guide with safety notes
```

---

## Hardware Pin Mapping

| Signal | Nucleo Pin | ESP32 Pin | Signal Range | Conditioning |
|--------|------------|-----------|--------------|--------------|
| Analog sensor (4–20 mA) | PA3 (ADC1_IN3) | GPIO1 (ADC1_CH0) | 0–3.3V after conditioning | **YES** — see `hardware_wiring.md` |
| Relay output | PE0 | GPIO2 | 3.3V logic | **MAYBE** — level shifter if relay needs 5V |
| Status LED | PB14 | GPIO14 | 3.3V | No |
| 4G modem TX | N/A | GPIO18 | TTL 3.3V | No (onboard) |
| 4G modem RX | N/A | GPIO17 | TTL 3.3V | No (onboard) |
| 4G modem RST | N/A | GPIO13 | Active low | No (onboard) |

> ⚠️ **GPIO1 and GPIO2 are provisional.** Confirm availability on your KTRON board.

---

## Build & Flash Instructions

### Prerequisites

- [PlatformIO](https://platformio.org/) installed (CLI or VS Code extension)
- USB cable connected to ESP32-S3 board

### Steps

```bash
# 1. Navigate to the firmware directory
cd TEMP_ESP32_ONLY/esp32_firmware

# 2. Build
pio run

# 3. Upload to ESP32
pio run --target upload

# 4. Monitor serial output
pio device monitor
```

### Expected Serial Output

```
=====================================================
  [TEMP] ESP32-ONLY MODE — RTU Level Control
  [TEMP] Nucleo-F767ZI unavailable
  [TEMP] ESP32 performing all Nucleo functions
=====================================================

[TEMP] Device ID   : rtu_level_control_01
[TEMP] Device Type : ESP32_ONLY
[TEMP] Telemetry   : every 5000 ms
[TEMP] Relay       : threshold 80.0%

[SENSOR] Sensor acquisition initialized (pin GPIO1, 12-bit, 16 samples)
[RELAY] Relay control initialized (pin GPIO2, threshold 80.0%)
[BUFFER] Buffer manager initialized (capacity: 50 messages)
[WiFi] Connecting to 'YOUR_SSID'...
[WiFi] Connected! IP: 192.168.1.100
[CLOUD] Cloud client initialized

[SENSOR] ADC=2048 V=1.6500 mA=12.0000 Level=50.00% Relay=OFF Valid=YES (SEQ 1)
[CLOUD] POST OK (HTTP 200)
```

---

## Testing Checklist

1. ☐ `pio run` compiles without errors
2. ☐ `pio run --target upload` flashes successfully
3. ☐ Serial monitor shows `[TEMP] ESP32-ONLY MODE` boot banner
4. ☐ Serial monitor shows sensor readings every 5 seconds
5. ☐ Relay toggles when level crosses 80%
6. ☐ WiFi connects successfully
7. ☐ `[CLOUD] POST OK` appears in serial output
8. ☐ Database query shows new rows in `readings` table
9. ☐ Disconnect WiFi → verify 4G fallback activates
10. ☐ Reconnect WiFi → verify auto-reconnect works

---

## Reverting to Production Architecture

When the replacement Nucleo-F767ZI arrives:

### Step 1: Stop Temporary Firmware
1. Disconnect the sensor and relay wires from the ESP32
2. Remove any signal conditioning circuits

### Step 2: Flash Original ESP32 Gateway
1. Open the original `esp32_cloud_gateway/` project
2. Build and upload: `cd esp32_cloud_gateway && pio run --target upload`
3. This restores the ESP32 to its gateway-only role

### Step 3: Set Up Replacement Nucleo
1. Open the STM32CubeIDE project (`.cproject`)
2. Build and flash the Nucleo firmware
3. Connect the sensor to Nucleo PA3
4. Connect the relay to Nucleo PE0
5. Connect UART4 between Nucleo and ESP32

### Step 4: Verify Full Pipeline
1. Verify Modbus TCP on the Nucleo (port 502)
2. Verify UART communication between Nucleo and ESP32
3. Start the local DAQ collector: `cd daq_service && docker-compose up`
4. Verify cloud POST is working
5. Check both local and cloud database for new readings

### Step 5: Decommission Temporary Code
- The `TEMP_ESP32_ONLY/` folder can be archived or deleted
- **No other files need to be changed** — the production code was never modified

---

## Configuration

All configuration is in `esp32_firmware/src/config.h`.

**Before building**, update these values:

| Setting | Current Value | Action Required |
|---------|---------------|-----------------|
| `WIFI_SSID` | `"CHANGE_ME"` | Set your WiFi SSID |
| `WIFI_PASSWORD` | `"CHANGE_ME"` | Set your WiFi password |
| `CLOUD_SERVER_HOST` | `"0.0.0.0"` | Set actual cloud server IP |
| `CLOUD_API_KEY` | `"CHANGE_ME"` | Set actual API key |
| `MODEM_APN` | `"internet"` | Set your carrier APN |
| `SENSOR_ADC_PIN` | `1` (GPIO1) | Confirm against board pinout |
| `RELAY_OUTPUT_PIN` | `2` (GPIO2) | Confirm against board pinout |
