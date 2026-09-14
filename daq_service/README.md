# DAQ Service Gateway (Nucleo-F7 Modbus TCP → TimescaleDB)

Polls real-time sensor metrics from the Nucleo-F7 Modbus TCP server (port 502)
over the 192.168.10.0/24 subnet and writes them into TimescaleDB:

| Table      | What gets written                                            |
| :--------- | :----------------------------------------------------------- |
| `readings` | 5 rows per poll cycle (one per sensor: `adc_raw`, `voltage`, `current_ma`, `engineering_value`, `relay_status`) |
| `events`   | 1 row only when relay state **changes** (crosses 80 % threshold) |

`schema.sql` creates and seeds `devices` and `sensors`; the collector never
touches those two tables at runtime.

---

## 🚀 Step 1 — Bring up TimescaleDB locally (Docker)

You don't need to install Postgres/TimescaleDB natively — `docker-compose.yml`
already defines it.

```bash
cd daq_service
docker compose up -d daq_timescaledb
```

The first time this runs against an empty volume, Docker automatically
executes `schema.sql`, which:
- creates `devices`, `sensors`, `readings` (hypertable), `events` (hypertable)
- seeds one device row (`rtu_level_control_01`) and its 5 sensor rows

Verify it worked:
```bash
docker exec -it daq_timescaledb psql -U daq_user -d daq -c "\dt"
docker exec -it daq_timescaledb psql -U daq_user -d daq -c "SELECT * FROM sensors;"
```

If you ever need to re-apply `schema.sql` by hand (e.g. you edited it after
the volume already existed):
```bash
docker exec -i daq_timescaledb psql -U daq_user -d daq < schema.sql
```

---

## 🚀 Step 2 — Run the collector on your PC (recommended for local dev)

Running the collector directly on the host — rather than in its own
container — is the simplest setup on Windows/Mac and avoids Docker
host-networking quirks, while still using the *containerized* TimescaleDB
from Step 1 (its port 5432 is published to your machine).

1. **Make sure your PC can reach the Nucleo board** at `192.168.10.100`
   (same LAN/subnet, or a router routing between them — see the main project
   README for the board's network config in `lwip.c`).

2. **Install dependencies**:
   ```bash
   cd daq_service
   python -m venv venv
   source venv/bin/activate      # venv\Scripts\activate on Windows
   pip install -r requirements.txt
   ```

3. **Check `.env`** — the defaults already point at the local Dockerized DB:
   ```env
   DATABASE_URL=postgresql://daq_user:changeme@localhost:5432/daq
   NUCLEO_IP=192.168.10.100
   DEVICE_ID=rtu_level_control_01
   ```

4. **Start the collector**:
   ```bash
   python collector.py
   ```

   You should see it connect to the DB, connect to the Nucleo over Modbus
   TCP, and start logging readings once per second.

### Alternative: run the collector in Docker too

`docker-compose.yml` also defines a `daq_collector` service using
`network_mode: host` so the container can reach the Nucleo's LAN IP directly.
This mode is Linux-only (Docker Desktop on Mac/Windows does not support host
networking the same way), so it's best reserved for a Linux gateway PC or
edge device:

```bash
docker compose up -d --build
```

---

## ☁️ Moving to the cloud later

Everything here was written so the **only thing that changes** is one
environment variable:

- **Schema**: run the exact same `schema.sql` once against the cloud database
  (`psql "$CLOUD_DATABASE_URL" -f schema.sql`). It's plain standard SQL plus
  `create_hypertable`, so it works identically on Timescale Cloud or
  self-managed TimescaleDB.
- **Collector**: change `DATABASE_URL` in `.env` (or the `daq_collector`
  environment block in `docker-compose.yml`) to the cloud connection string,
  typically with `?sslmode=require` appended, e.g.:
  ```env
  DATABASE_URL=postgresql://daq_user:REAL_PASSWORD@your-cloud-host:5432/daq?sslmode=require
  ```
  No code changes in `collector.py` are needed — it already reads the whole
  connection string from `DATABASE_URL` via `psycopg2.connect(DB_URI)`.
- **Nucleo side is unaffected either way** — the board only ever talks
  Modbus TCP to whatever machine runs `collector.py` on the local network;
  it never talks to the database directly in this architecture.

---

## 📊 Schema Reference

### `devices`
| Column        | Type          | Description                     |
| :------------ | :------------ | :------------------------------ |
| `device_id`   | `TEXT` (PK)   | e.g. `rtu_level_control_01`     |
| `device_name` | `TEXT`        | Human-readable name             |
| `location`    | `TEXT`        | Physical location / description |
| `created_at`  | `TIMESTAMPTZ` | Row insert time                 |

### `sensors`
| Column        | Type   | Description                                  |
| :------------ | :----- | :-------------------------------------------- |
| `device_id`   | `TEXT` | FK → `devices.device_id`                      |
| `sensor_id`   | `TEXT` | e.g. `adc_raw`, `voltage`, `engineering_value` |
| `sensor_type` | `TEXT` | `raw` / `analog` / `level` / `digital`        |
| `unit`        | `TEXT` | `counts`, `V`, `mA`, `%`, `bool`              |
| `description` | `TEXT` | Free-text description                         |

### `readings` hypertable
| Column      | Type            | Description                                |
| :---------- | :-------------- | :----------------------------------------- |
| `time`      | `TIMESTAMPTZ`   | Record timestamp (UTC)                     |
| `device_id` | `TEXT`          | FK → `devices.device_id`                   |
| `sensor_id` | `TEXT`          | FK → `sensors.sensor_id`                   |
| `raw_value` | `FLOAT`         | Raw Modbus register value (nullable)       |
| `value`     | `FLOAT`         | Scaled / engineering-unit value            |
| `quality`   | `TEXT`          | `'GOOD'` by default                        |

### `events` hypertable
| Column       | Type          | Description                               |
| :----------- | :------------ | :----------------------------------------- |
| `time`       | `TIMESTAMPTZ` | Event timestamp (UTC)                     |
| `device_id`  | `TEXT`        | FK → `devices.device_id`                  |
| `event_type` | `TEXT`        | e.g. `relay_state_change`                 |
| `state`      | `TEXT`        | `ON` / `OFF`                               |
| `severity`   | `TEXT`        | `WARNING` (relay ON) / `INFO` (relay OFF) |

### Quick queries
```sql
-- Latest 20 sensor readings
SELECT time, sensor_id, raw_value, value
  FROM readings
 WHERE device_id = 'rtu_level_control_01'
 ORDER BY time DESC
 LIMIT 20;

-- Relay state-change events
SELECT time, state, severity
  FROM events
 WHERE device_id = 'rtu_level_control_01'
   AND event_type = 'relay_state_change'
 ORDER BY time DESC;
```
