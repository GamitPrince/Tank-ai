# Data Acquisition Device --- Antigravity Setup

## Project purpose

Industrial RTU/data-acquisition system for bitumen tank monitoring,
based on an **STM32 NUCLEO-F767ZI**.

The system collects sensor/PLC signals, performs engineering conversions
and validation, handles alarms/states, and sends telemetry to local and
cloud infrastructure.

## Current architecture

### Local

``` text
Sensors / industrial signals
        |
        v
STM32 NUCLEO-F767ZI
        |
        v
Local Collector
        |
        v
PostgreSQL + TimescaleDB
        |
        v
Grafana
```

The local PostgreSQL + TimescaleDB + Grafana + collector setup is
already working.

### Cloud

``` text
Sensors
  |
  v
STM32 RTU
  |
Internet
  |
  v
Cloud ingestion/backend
  |
  v
PostgreSQL + TimescaleDB
  |
  v
Backend API
  +----> Web app
  +----> Mobile app
```

Cloud Grafana is **not** a requirement. The final customer interface is
expected to be custom software.

------------------------------------------------------------------------

## Hardware

### Controller

**STM32 NUCLEO-F767ZI**

Responsibilities:

-   Acquire analog and digital signals
-   Convert raw signals to engineering values
-   Validate measurements
-   Detect alarms/faults
-   Maintain device state
-   Package telemetry
-   Communicate with backend/cloud
-   Support configuration and diagnostics

### Tank

Tank geometry varies by client. Never hard-code one tank geometry.

Potential per-tank configuration:

-   Height
-   Diameter
-   Length
-   Volume
-   Reference point
-   Maximum allowable/overflow level
-   Sensor mounting/reference information
-   Calibration parameters

------------------------------------------------------------------------

## Level measurement

Two level sources are used:

1.  Radar level sensor
2.  Pressure transmitter (PT)

When both are valid, calculate/obtain both levels and compare them.

``` text
Radar level
     |
     +----> comparison ----> difference threshold
     |
PT-derived level
```

If the difference exceeds a configurable threshold, generate a
sensor-disagreement alarm.

### PT 4 mA special case

Approximately 4 mA from the pressure transmitter can represent zero/no
pressure.

When PT is in the no-pressure/invalid-for-level state:

-   Radar can remain the valid level source.
-   Do not compare radar against an invalid PT-derived level.
-   Do not generate a false disagreement alarm merely because PT is at 4
    mA.
-   Distinguish valid measurement, zero/no-pressure, and
    fault/out-of-range conditions.

Do not hard-code the comparison threshold without an engineering
requirement.

------------------------------------------------------------------------

## VEGAMET 341

A VEGAMET 341 provides a continuous **4--20 mA** output.

Existing customer display connection:

-   Terminal 41 (+)
-   Terminal 42 (-)
-   Signal: 4--20 mA

The goal is to acquire the continuous value in the NUCLEO system while
preserving the customer's existing display function.

**Do not connect an industrial 4--20 mA loop directly to a NUCLEO ADC.**
Use suitable current-loop/signal-conditioning circuitry and protect the
MCU input.

Conceptually:

``` text
4–20 mA
   |
   v
Current-to-voltage interface
   |
   v
ADC
   |
   v
Raw ADC -> voltage -> current -> engineering value
```

------------------------------------------------------------------------

## Temperature

Temperature is measured using a **PT100 RTD**.

The NUCLEO needs proper RTD excitation and signal-conditioning
circuitry; a PT100 should not be treated as a normal voltage output.

Callendar--Van Dusen is used for resistance-to-temperature conversion.

For the positive-temperature range:

``` text
R(T) = R0 [1 + A*T + B*T^2]
```

Where:

-   `R(T)` = resistance at temperature T
-   `R0` = 100 ohms for a PT100
-   `T` = temperature in °C
-   `A`, `B` = PT100 coefficients

Actual PT100 acquisition circuitry still needs to be finalized.

------------------------------------------------------------------------

## Heater and relay signals

There are two main heaters.

Heater status depends on the actual electrical contact/wiring logic. Do
not assume that a relay contact alone always means the heater is ON.

Signals discussed include:

-   `1M`
-   `2M`
-   `3M`
-   `1S`
-   `HLT5`
-   `HHLS5`
-   `HPL5`
-   `HRL5`

Some level/alarm switches are wired in parallel. Final interpretation
must follow the electrical drawing and actual contact behavior.

------------------------------------------------------------------------

## Current telemetry baseline

The local database uses a **normalized schema** (not a flat table).
Four tables are defined in `daq_service/schema.sql`:

### `devices` — RTU/device metadata

  Field          Type           Meaning
  -------------- -------------- -------------------------
  `device_id`    TEXT (PK)      Unique device identifier
  `device_name`  TEXT           Human-readable name
  `location`     TEXT           Installation location
  `created_at`   TIMESTAMPTZ    Row creation timestamp

### `sensors` — per-device sensor catalogue

  Field          Type           Meaning
  -------------- -------------- -------------------------
  `device_id`    TEXT (FK)      Parent device
  `sensor_id`    TEXT           Sensor identifier
  `sensor_type`  TEXT           raw / analog / level / digital
  `unit`         TEXT           Engineering unit
  `description`  TEXT           Human-readable label

Composite PK: `(device_id, sensor_id)`

### `readings` — time-series hypertable (one row per sensor per poll)

  Field          Type           Meaning
  -------------- -------------- -------------------------
  `time`         TIMESTAMPTZ    Sample timestamp
  `device_id`    TEXT (FK)      Device that produced the reading
  `sensor_id`    TEXT (FK)      Sensor within that device
  `raw_value`    FLOAT          Unscaled register value (nullable)
  `value`        FLOAT          Scaled engineering value
  `quality`      TEXT           Data quality flag (default `GOOD`)

FK: `(device_id, sensor_id)` → `sensors`

### `events` — time-series hypertable (relay state changes, alarms)

  Field          Type           Meaning
  -------------- -------------- -------------------------
  `time`         TIMESTAMPTZ    Event timestamp
  `device_id`    TEXT (FK)      Source device
  `event_type`   TEXT           Event category
  `state`        TEXT           New state (e.g. ON / OFF)
  `severity`     TEXT           INFO / WARNING / etc.

Sampling interval: **1 second** (configurable via `POLL_INTERVAL`).

The collector writes **5 rows per poll** into `readings` (one per
sensor: `adc_raw`, `voltage`, `current_ma`, `level`, `relay_status`).
Relay state changes additionally produce an `events` row.

### Data volume

One RTU (5 sensors × 1 Hz):

-   432,000 readings/day
-   157,680,000 readings/year

100 RTUs:

-   43,200,000 readings/day
-   15,768,000,000 readings/year

TimescaleDB is appropriate for this time-series workload.

------------------------------------------------------------------------

## Cloud database

Selected platform: **Tiger Cloud / Timescale Cloud**

Service:

``` text
rtu-timescaledb-dev
```

Configuration:

``` text
Plan: Performance trial
Region: AWS Mumbai
Region ID: ap-south-1
CPU: 0.5
RAM: 2 GiB
Environment: Development
HA replica: None
Connection pooler: Disabled
VPC peering: None
```

The service is created and ready.

### TimescaleDB verification

This query was executed successfully:

``` sql
SELECT extversion
FROM pg_extension
WHERE extname = 'timescaledb';
```

Result:

``` text
2.30.0
```

Therefore TimescaleDB **2.30.0** is installed and active.

### Cloud ingestion architecture

A direct Nucleo → cloud path has been designed and partially
implemented. The architecture is:

``` text
Nucleo-F767ZI
     |
     | HTTP POST (JSON, port 8080)
     | via LwIP raw TCP
     |
  INTERNET
     |
     v
Remote Server
  FastAPI ingest API  (/api/v1/ingest)
     |
     v
  TimescaleDB (readings / events hypertables)
```

The firmware HTTP POST client (`Core/Src/http_post_client.c`) is
implemented. The server-side ingest API (`daq_service/ingest_api.py`)
is designed but not yet deployed. The server IP in the firmware is
currently set to `0.0.0.0` (placeholder).

### Security

A database password was previously exposed during setup. Treat that old
password as compromised and reset it.

Never put passwords, API keys, tokens, private keys, or connection
strings containing secrets into:

-   This document
-   Source control
-   Screenshots
-   Code
-   Public issue trackers

Use environment variables or a secret manager.

#### Known security violations (to be fixed)

-   `Core/Inc/main.h` contains a hardcoded `DB_CONNECTION_STRING` with
    plaintext credentials.
-   `Core/Src/http_post_client.c` contains a hardcoded `API_KEY`.
-   `daq_service/docker-compose.yml` contains a plaintext
    `POSTGRES_PASSWORD`.

These must be moved to environment variables or a secret manager before
production deployment.

------------------------------------------------------------------------

## Implemented telemetry schema

The database supports multiple RTUs from the beginning via the
`device_id` field present in every table.

The schema is defined in `daq_service/schema.sql` and consists of four
tables (see "Current telemetry baseline" above for column details):

``` sql
CREATE TABLE IF NOT EXISTS devices (...);
CREATE TABLE IF NOT EXISTS sensors (...);
CREATE TABLE IF NOT EXISTS readings (...);   -- hypertable
CREATE TABLE IF NOT EXISTS events (...);     -- hypertable
```

Hypertable conversion:

``` sql
SELECT create_hypertable('readings', 'time', if_not_exists => TRUE);
SELECT create_hypertable('events',   'time', if_not_exists => TRUE);
```

Seed data for the first RTU is pre-loaded:

``` sql
INSERT INTO devices (device_id, device_name, location)
VALUES ('rtu_level_control_01', 'RTU Level Control 01', 'Main Tank');

INSERT INTO sensors (device_id, sensor_id, sensor_type, unit, description)
VALUES
    ('rtu_level_control_01', 'adc_raw',      'raw',     'counts', 'Raw ADC Count'),
    ('rtu_level_control_01', 'voltage',       'analog',  'V',      'Voltage'),
    ('rtu_level_control_01', 'current_ma',    'analog',  'mA',     'Current in mA'),
    ('rtu_level_control_01', 'level',         'level',   '%',      'Level Percentage'),
    ('rtu_level_control_01', 'relay_status',  'digital', 'bool',   'Relay Status');
```

Conceptually:

``` text
RTU 001 ─┐
RTU 002 ─┤
RTU 003 ─┤
...      ├──> shared TimescaleDB
RTU 100 ─┘
```

Relay state is stored as a numeric `0`/`1` value in the `readings`
table, and relay *transitions* are recorded as events in the `events`
table with severity and state labels.

------------------------------------------------------------------------

## Future database structure

As the project grows, separate these concepts where useful:

``` text
devices
tanks
device_configuration
telemetry
alarms
events
```

Possible device metadata:

``` text
device_id
serial_number
name
client_id
tank_id
firmware_version
status
created_at
```

Possible tank configuration:

``` text
tank_id
height
diameter
length
volume
reference_point
maximum_level
...
```

Telemetry should remain optimized for time-series data.

Alarms/events should eventually store history and state transitions
instead of only current booleans.

Do not create unnecessary complexity before the basic telemetry path
works.

------------------------------------------------------------------------

## Firmware architecture

Keep these concerns separate:

1.  Sensor acquisition
2.  Signal conditioning/interface
3.  Engineering conversion
4.  Measurement validation
5.  Alarm/state logic
6.  Data model
7.  Communication
8.  Configuration
9.  Diagnostics

Conceptual structure:

``` text
+-----------------------------+
| Application                 |
| Level / Temp / Heater Logic |
| Alarm / State Management    |
+--------------+--------------+
               |
+--------------v--------------+
| Data Model                  |
+--------------+--------------+
               |
+--------------v--------------+
| Communication Service       |
+--------------+--------------+
               |
       +-------+-------+
       |       |       |
   Ethernet   Wi-Fi  Cellular
```

------------------------------------------------------------------------

## Internet/communication architecture

Do not permanently hard-code Ethernet as the only possible Internet
interface.

Prefer a modular transport layer:

``` text
Application
     |
Transport Interface
     |
 +---+---------+---------+
 |             |         |
Ethernet      Wi-Fi   Cellular
```

This allows future communication hardware changes without rewriting the
application layer.

------------------------------------------------------------------------

## Data acquisition flow

Every sensor/input should conceptually follow:

``` text
Physical signal
      |
      v
Signal conditioning
      |
      v
NUCLEO input
      |
      v
Raw measurement
      |
      v
Engineering conversion
      |
      v
Validation / fault detection
      |
      v
Application value
      |
      v
Telemetry
```

------------------------------------------------------------------------

## Alarm architecture

Potential alarms include:

-   High level
-   High-high level
-   Low level
-   Sensor disagreement
-   Sensor fault
-   Temperature alarm
-   Heater alarm
-   Communication fault
-   Invalid measurement
-   Device fault

Each alarm should eventually have:

-   Alarm ID
-   Source/device/tank
-   Severity
-   Trigger condition
-   Clear condition
-   Current state
-   Timestamp
-   Acknowledgement state if required

Avoid representing a complex alarm only as one unexplained boolean.

------------------------------------------------------------------------

## Configuration

Client/tank-specific values must be configurable, not compiled into
firmware.

Potential configuration:

``` text
RTU ID
Tank ID
Tank geometry
Reference point
Maximum tank level
Level alarm thresholds
Sensor comparison threshold
Sampling interval
Sensor scaling
4–20 mA calibration
PT100 calibration
Temperature limits
Heater limits
Communication settings
Cloud endpoint
Authentication credentials
```

------------------------------------------------------------------------

## Local collector

The local collector already exists and writes to PostgreSQL/TimescaleDB.

Keep the data pipeline modular so that local and cloud destinations can
evolve independently.

Possible future architecture:

``` text
RTU
 |
 v
Collector/Gateway
 |
 +----> Local DB
 |
 +----> Cloud
```

or direct cloud communication:

``` text
RTU -> Internet -> Cloud ingestion
```

The final choice is still under development.

------------------------------------------------------------------------

## Development status

### Completed

-   Local PostgreSQL + TimescaleDB
-   Local collector (Modbus TCP polling → TimescaleDB)
-   Local Grafana
-   Local telemetry baseline
-   Cloud database comparison
-   Tiger Cloud selected
-   Tiger Cloud Performance trial created
-   AWS Mumbai selected
-   `rtu-timescaledb-dev` created
-   TimescaleDB verified (v2.30.0)
-   Normalized local DB schema (`devices`, `sensors`, `readings`,
    `events`) with TimescaleDB hypertables
-   Docker Compose stack (TimescaleDB + collector service)
-   STM32 firmware: ADC acquisition, voltage/current/level conversion
-   STM32 firmware: Relay control logic (PE0, 80%/20% thresholds)
-   STM32 firmware: UART3 debug console (`printf` redirection)
-   STM32 firmware: Modbus TCP server (FC 03, 5 holding registers on
    port 502)
-   STM32 firmware: HTTP POST client (LwIP raw TCP, JSON payload,
    exponential backoff)
-   LwIP network: Static IP `192.168.2.100`, gateway `192.168.2.1`,
    netmask `255.255.255.0`
-   Implementation plan for direct Nucleo → remote server ingestion
    (FastAPI ingest API)

### Immediate next task

1.  Deploy and test the remote ingest API (`daq_service/ingest_api.py`)
    on the target server.
2.  Configure the real server IP in `http_post_client.c`
    (`SERVER_IP_0`–`SERVER_IP_3` are currently `0.0.0.0`).
3.  Test end-to-end cloud telemetry path: Nucleo → Internet → ingest
    API → remote TimescaleDB.
4.  Move hardcoded secrets out of source code.
5.  Add appropriate indexes and retention/compression policies.
6.  Verify data arrives in Tiger Cloud TimescaleDB.

Suggested verification:

``` sql
SELECT *
FROM timescaledb_information.hypertables;
```

Test read from remote:

``` sql
SELECT *
FROM readings
WHERE device_id = 'rtu_level_control_01'
ORDER BY time DESC
LIMIT 10;
```

------------------------------------------------------------------------

## Recommended development order

### 1. Database

-   Telemetry table
-   Hypertable
-   Indexes
-   Test data
-   Time-series queries
-   Retention/compression strategy later

### 2. Backend

-   Telemetry ingestion endpoint/protocol
-   Device authentication
-   Payload validation
-   Database storage
-   Alarm/event storage
-   API for web/mobile

### 3. Firmware

-   I/O map
-   ADC acquisition
-   4--20 mA conversion
-   PT100 acquisition
-   Radar interface
-   Digital inputs
-   Relay/heater status
-   Engineering conversions
-   Validation/fault detection
-   Alarm/state logic
-   Communication abstraction
-   Telemetry packaging
-   Configuration

### 4. Frontend

Eventually:

-   Tank overview
-   Live level
-   Temperature
-   Heater status
-   Alarm status
-   Historical trends
-   Device status
-   Tank configuration
-   Alarm history
-   Device health

------------------------------------------------------------------------

## Important constraints

1.  Tank geometry varies by client.
2.  Multiple RTUs/tanks must be supported.
3.  Current sampling interval is configurable (currently 1 second for
    local, defined by `POLL_INTERVAL`).
4.  One telemetry row represents one sensor on one RTU at one sampling
    instant.
5.  Cloud database requires PostgreSQL + TimescaleDB.
6.  Cloud Grafana is NOT a requirement. The final customer interface is
    custom software.
7.  Communication must be modular.
8.  Sensor validity must be checked before calculations/comparisons.
9.  PT approximately 4 mA/no-pressure must not be treated as a valid
    pressure-derived level for disagreement comparison.
10. Industrial 4--20 mA requires proper signal conditioning.
11. PT100 requires proper RTD measurement circuitry.
12. Client-specific values must be configurable.
13. Secrets must never be committed.
14. Do not prematurely optimize for 100+ RTUs; keep the initial
    implementation simple but structurally scalable.

## Antigravity instruction

Use this document as the project baseline. Before changing architecture,
database design, or firmware structure, check the constraints above.

When a hardware value, wiring behavior, threshold, sensor protocol, or
electrical characteristic is unknown, explicitly mark it as an
assumption and verify it from the actual hardware
documentation/electrical drawings rather than inventing a value.

The immediate objective is to complete the cloud telemetry path
end-to-end (the cloud schema is deployed, the firmware HTTP POST client
is implemented; the remaining step is deploying the ingest API and
configuring the server IP in firmware).
