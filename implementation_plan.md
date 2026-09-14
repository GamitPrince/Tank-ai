# Implementation Plan — Direct Nucleo-F7 → Remote TimescaleDB Pipeline

## Target Architecture

```text
[ Analog Sensors ]
       │ (4-20 mA)
       ▼
[ Nucleo-F767ZI ]              ← C firmware (reads ADC, computes values)
       │
       │  Ethernet cable → Router (provides internet)
       │
       ▼  HTTP POST every 1 s  (JSON payload over plain TCP)
       │
   ── INTERNET ──
       │
       ▼
[ Remote Server ]
  ┌──────────────────────┐
  │  Ingest API (FastAPI) │  ← lightweight Python HTTP endpoint (port 8080)
  │         │             │
  │         ▼             │
  │  TimescaleDB/PgSQL    │  ← existing readings / events hypertables
  └──────────────────────┘
```

**Key change**: No PC collector needed. The Nucleo board itself sends sensor data
over the internet to your remote server via HTTP POST requests.

---

## User Review Required

> [!IMPORTANT]
> **Remote server details needed**:
> 1. What is the **public IP address** (or domain name) of your remote server running TimescaleDB?
> 2. Is the remote server a **Linux VPS / cloud VM** (e.g. AWS, DigitalOcean, Hetzner)?
> 3. Can you open **port 8080** (or another port) on the remote server's firewall for the ingest API?
> 4. Does TimescaleDB on the remote server use the **same schema** (devices, sensors, readings, events) and the same connection string `postgresql://daq_user:changeme@...`?

> [!WARNING]
> **Security**: The initial implementation uses **plain HTTP** (no TLS/HTTPS) because
> adding mbedTLS to the STM32 firmware significantly increases complexity and flash usage.
> For production, we should add an API key header for authentication and consider
> a reverse proxy (nginx) with TLS on the server side.

---

## Proposed Changes

### Component 1 — Remote Server: Ingest API

A tiny FastAPI service deployed on the remote server that receives HTTP POST
requests from the Nucleo board and writes into TimescaleDB.

#### [NEW] `daq_service/ingest_api.py`
- FastAPI app with a single endpoint: `POST /api/v1/ingest`
- Accepts JSON payload:
  ```json
  {
    "device_id": "rtu_level_control_01",
    "api_key": "CHANGE_ME_TO_A_LONG_RANDOM_SECRET",
    "readings": [
      {"sensor_id": "adc_raw",           "value": 2048},
      {"sensor_id": "voltage",           "raw_value": 165, "value": 1.65},
      {"sensor_id": "current_ma",        "raw_value": 1200, "value": 12.00},
      {"sensor_id": "engineering_value", "raw_value": 5000, "value": 50.00},
      {"sensor_id": "relay_status",      "value": 0}
    ]
  }
  ```
- Validates `api_key` against `devices.api_key` in the database
- Inserts 5 rows into `readings` hypertable
- Detects relay state change → inserts into `events` hypertable
- Returns `200 OK` or error code

#### [MODIFY] `daq_service/requirements.txt`
- Add: `fastapi`, `uvicorn[standard]`

#### [MODIFY] `daq_service/docker-compose.yml`
- Add `daq_ingest_api` service (port 8080) alongside TimescaleDB

---

### Component 2 — STM32 Firmware: HTTP POST Client

New C module added to the Nucleo-F7 firmware that sends sensor data as an HTTP
POST request over LwIP raw TCP sockets.

#### [NEW] `Core/Src/http_post_client.c`
- Uses LwIP `tcp_new()` / `tcp_connect()` / `tcp_write()` to open a TCP
  connection to the remote server IP on port 8080
- Constructs a minimal HTTP/1.1 POST request with JSON body containing
  all 5 sensor readings
- Includes `X-API-Key` header for device authentication
- Handles connection callbacks (connected, sent, error, close)
- Retries on failure with exponential backoff

#### [NEW] `Core/Inc/http_post_client.h`
- Public API:
  ```c
  void HttpPost_Init(void);
  void HttpPost_SendReadings(uint16_t adc, float voltage,
                             float current, float level,
                             uint8_t relay_status);
  ```

#### [MODIFY] `Core/Src/main.c`
- Import `http_post_client.h`
- Call `HttpPost_Init()` after `ModbusTCP_Server_Init()`
- Call `HttpPost_SendReadings(adcValue, voltage, current, level, relay_status)`
  inside the main `while(1)` loop after reading sensor values

#### [MODIFY] `LWIP/App/lwip.c`
- Add a **gateway address** (your router's IP, e.g. `192.168.10.1`) so the
  Nucleo can route packets to the internet. Currently gateway is `0.0.0.0`
  which means **no internet access** — only local LAN.

---

## LwIP Gateway Fix (Critical)

> [!CAUTION]
> Your current LwIP config in [`lwip.c`](file:///e:/New%20folder/RTU_LEVEL_CONTROL/LWIP/App/lwip.c#L71-L74) has the gateway set to `0.0.0.0`:
> ```c
> GATEWAY_ADDRESS[0] = 0;
> GATEWAY_ADDRESS[1] = 0;
> GATEWAY_ADDRESS[2] = 0;
> GATEWAY_ADDRESS[3] = 0;
> ```
> Without a valid gateway, the STM32 **cannot send packets beyond the local subnet**
> (i.e. no internet). This must be changed to your router's IP (e.g. `192.168.10.1`).

---

## Open Questions

> [!IMPORTANT]
> 1. What is **your router's gateway IP** on the 192.168.10.0/24 subnet? (commonly `192.168.10.1`)
> 2. What is the **public IP or domain** of your remote server?
> 3. Is there a **DNS server** available, or should we hardcode the remote server's IP in the firmware?

---

## Verification Plan

### Automated Tests
- Test the ingest API locally with `curl`:
  ```bash
  curl -X POST http://localhost:8080/api/v1/ingest \
    -H "Content-Type: application/json" \
    -d '{"device_id":"rtu_level_control_01","api_key":"CHANGE_ME...","readings":[...]}'
  ```
- Verify rows appear in `readings` and `events` tables

### Manual Verification
1. Flash firmware to Nucleo-F7, connect Ethernet, check UART logs for HTTP POST success/failure
2. Query remote TimescaleDB to confirm live data streaming:
   ```sql
   SELECT * FROM readings WHERE device_id = 'rtu_level_control_01' ORDER BY time DESC LIMIT 10;
   ```
