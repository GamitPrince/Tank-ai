# RTU Network & Connectivity Architecture — Antigravity Project Context

## Status

**Architecture selected:** Approach 1 — NUCLEO as the main DAQ and connectivity decision-maker, with ESP32-S3 + A7672S as the wireless communication module.

This document is the authoritative architecture context for implementing and modifying the project in Antigravity.

---

# 1. Architecture Summary

The system contains two main embedded devices:

- **STM32 NUCLEO-F767ZI** — main DAQ/controller
- **ESP32-S3 + A7672S** — wireless communication gateway/module

The fundamental separation is:

> **NUCLEO decides what data the system has and what the DAQ/control system should do. ESP32-S3/A7672S handles wireless communication to the Internet.**

The NUCLEO remains the main field-side device and owns Ethernet.

The ESP32 owns:

- Wi-Fi
- 4G LTE
- Cellular modem communication
- MQTT/HTTPS
- TLS
- Wireless network monitoring

---

# 2. Overall Architecture

```text
                         ┌──────────────────────┐
                         │       SENSORS        │
                         │                      │
                         │ Level / Temperature  │
                         │ Pressure / etc.      │
                         └──────────┬───────────┘
                                    │
                                    │ Analog / RS485
                                    ▼
                         ┌──────────────────────┐
                         │    NUCLEO-F767ZI     │
                         │                      │
                         │ • Data Acquisition   │
                         │ • Sensor Processing  │
                         │ • Control Logic      │
                         │ • Timestamping       │
                         │ • Data Buffering     │
                         │ • Connectivity       │
                         │   Decision Manager   │
                         │ • Ethernet           │
                         └──────────┬───────────┘
                                    │
                              UART / SPI
                                    │
                                    ▼
                    ┌──────────────────────────────┐
                    │      ESP32-S3 + A7672S       │
                    │                              │
                    │ • Wi-Fi                     │
                    │ • 4G LTE                    │
                    │ • MQTT / HTTPS              │
                    │ • TLS                       │
                    │ • Network Monitoring         │
                    └──────────────┬───────────────┘
                                   │
                         ┌─────────┴─────────┐
                         │                   │
                       Wi-Fi               4G LTE
                         │                   │
                         ▼                   ▼
                  Client Network        Cellular Network
                         │                   │
                         └─────────┬─────────┘
                                   ▼
                                INTERNET
                                   │
                                   ▼
                             MQTT / HTTPS
                                   │
                                   ▼
                              SERVER/BROKER
                                   │
                                   ▼
                              BACKEND/API
                                   │
                                   ▼
                              TIMESCALEDB
                                   │
                                   ▼
                               DASHBOARD
```

---

# 3. Core Design Principle

The system is intentionally divided into two layers.

## NUCLEO

The NUCLEO answers:

> **"What data do I have, and what should the DAQ/control system do?"**

It is responsible for:

- Sensor acquisition
- Sensor processing
- Engineering-unit conversion
- Data validation
- Local control
- Alarms
- Interlocks
- Timestamping
- Local data buffering
- Connectivity decision-making
- Ethernet

## ESP32-S3 + A7672S

The ESP32 answers:

> **"How do I get this data to the Internet?"**

It is responsible for:

- Wi-Fi
- 4G LTE
- Cellular modem control
- Wireless network status
- MQTT/HTTPS transport
- TLS
- Network health monitoring
- Wireless communication
- Receiving data from the NUCLEO
- Sending data to the server
- Receiving remote commands and forwarding them to the NUCLEO

---

# 4. Important Architecture Decision

## NUCLEO owns Ethernet

Ethernet is connected directly to the NUCLEO.

```text
NUCLEO-F767ZI
      │
      └──── Ethernet ────► Client LAN / Network
```

Do **not** move Ethernet functionality to the ESP32.

## ESP32 owns wireless networking

```text
ESP32-S3
   │
   ├──── Wi-Fi
   │
   └──── A7672S ──── 4G LTE / Cellular
```

The two boards communicate through a local embedded interface.

```text
NUCLEO
   │
   │ UART / SPI
   │
   ▼
ESP32-S3 + A7672S
```

UART is the preferred starting point unless hardware constraints require another interface.

---

# 5. Connectivity Architecture

The selected architecture supports deployment profiles.

## Profile A — Wi-Fi Primary

```text
                 NUCLEO
                   │
                  UART
                   │
                   ▼
                 ESP32
                   │
              ┌────┴────┐
              │         │
            Wi-Fi       4G
           PRIMARY     BACKUP
              │         │
              ▼         ▼
         Client AP    Cellular
              │         │
              └────┬────┘
                   ▼
                Internet
```

Normal operation:

```text
Wi-Fi → Internet → Server
```

If Wi-Fi becomes unavailable:

```text
4G → Internet → Server
```

---

# 6. Ethernet Deployment Profile

For an Ethernet-primary installation:

```text
Sensors
   ↓
NUCLEO-F767ZI
   │
   ├──────── Ethernet ────────► Client LAN
   │                              │
   │                              ▼
   │                           Internet
   │
   │ UART
   ▼
ESP32-S3 + A7672S
   │
   ▼
  4G backup
```

The NUCLEO is the connectivity decision-maker.

If Ethernet fails and the configured deployment profile allows wireless fallback:

```text
Ethernet failure
       ↓
NUCLEO detects failure
       ↓
NUCLEO requests wireless transport
       ↓
ESP32
       ↓
4G LTE
       ↓
Internet
       ↓
Server
```

The exact routing/transport behavior must be implemented explicitly; do not assume that Ethernet traffic is automatically routed through the ESP32.

---

# 7. Deployment Profiles

The system should not assume that every network interface is active simultaneously.

## Profile A — Wi-Fi Primary

```text
Wi-Fi    = PRIMARY
4G LTE   = BACKUP
Ethernet = NOT USED
```

## Profile B — Ethernet Primary

```text
Ethernet = PRIMARY
4G LTE   = BACKUP
Wi-Fi    = NOT USED
```

The deployment configuration should determine the active profile.

The firmware should be designed so additional profiles can be added later.

---

# 8. Sensor / DAQ Architecture

Typical field-side signal flow:

```text
PT100
  ↓
MAX31865
  ↓
NUCLEO

4–20 mA Level Sensor
  ↓
Current → Voltage
  ↓
NUCLEO ADC

Other Sensors
  ↓
Analog / Digital / RS485
  ↓
NUCLEO
```

The NUCLEO converts raw sensor signals into engineering values.

Example:

```text
Raw sensor signal
      ↓
NUCLEO acquisition
      ↓
Signal conversion
      ↓
Validation
      ↓
Engineering value
      ↓
Application data record
```

Example data record:

```text
Device ID:  RTU001
Timestamp:  2026-09-17 18:10:00
Level:      18.42 m
Temperature:31.6 °C
Pressure:   1.82 bar
```

---

# 9. NUCLEO ↔ ESP32 Communication

The NUCLEO and ESP32 communicate locally.

Preferred initial interface:

```text
NUCLEO-F767ZI
      │
      │ UART
      │
      ▼
ESP32-S3
```

SPI may be evaluated if future throughput requirements justify it.

For the initial implementation, do not add unnecessary protocol complexity.

---

# 10. Communication Protocol

The NUCLEO should send structured telemetry messages to the ESP32.

Initial conceptual message:

```text
DATA
RTU001
timestamp
level
temperature
pressure
```

The ESP32 responds with:

```text
ACK
RTU001
SEQ: 1024
```

The final implementation should use a robust framed packet.

Recommended packet structure:

```text
┌─────┬──────┬─────┬─────┬─────────┬───────┐
│ STX │ TYPE │ LEN │ SEQ │ PAYLOAD │ CRC16 │
└─────┴──────┴─────┴─────┴─────────┴───────┘
```

Where:

- `STX` = start-of-frame marker
- `TYPE` = message type
- `LEN` = payload length
- `SEQ` = sequence number
- `PAYLOAD` = actual data
- `CRC16` = integrity check

The protocol should support at least:

```text
TELEMETRY
ACK
NACK
HEARTBEAT
STATUS
COMMAND
CONFIG
TIME_SYNC
ERROR
```

---

# 11. Sequence Numbers

Every important NUCLEO-to-ESP32 data packet should have a sequence number.

Example:

```text
SEQ 1024
SEQ 1025
SEQ 1026
SEQ 1027
```

This enables:

- Missing packet detection
- Duplicate detection
- Retry handling
- Data ordering
- Offline synchronization

The sequence number should not be the primary timestamp.

Timestamps must be retained separately.

---

# 12. Acknowledgement

The ESP32 should acknowledge successful receipt of a valid packet.

Example:

```text
NUCLEO
  │
  │ TELEMETRY SEQ=1024
  ▼
ESP32
  │
  │ ACK SEQ=1024
  ▼
NUCLEO
```

If the ESP32 does not acknowledge within a defined timeout:

```text
NUCLEO
  │
  ├── timeout
  │
  ▼
retry
```

Retry limits should be configurable.

---

# 13. Heartbeat

The NUCLEO and ESP32 should exchange periodic heartbeat/status messages.

Purpose:

- Detect disconnected UART
- Detect firmware lockup
- Detect communication failure
- Provide diagnostics
- Support watchdog recovery

Example:

```text
NUCLEO → ESP32
HEARTBEAT

ESP32 → NUCLEO
HEARTBEAT_ACK
```

The system should define a timeout after which the connection is considered unhealthy.

---

# 14. ESP32 Wireless Architecture

The ESP32-S3 provides Wi-Fi directly.

```text
ESP32-S3
    │
    │ Wi-Fi
    ▼
Client Wi-Fi AP
    │
    ▼
Internet
```

The A7672S provides cellular connectivity.

```text
ESP32-S3
    │
    │ Modem interface
    ▼
A7672S
    │
    ▼
SIM
    │
    ▼
4G LTE Network
    │
    ▼
Internet
```

The exact modem interface and driver implementation must remain modular.

---

# 15. Network Manager

The NUCLEO is the overall connectivity decision-maker.

The ESP32 provides the wireless transport services requested by the NUCLEO.

Logical model:

```text
                 ┌─────────────────────┐
                 │  Connectivity       │
                 │  Decision Manager   │
                 │      NUCLEO         │
                 └──────────┬──────────┘
                            │
                    Local NUCLEO↔ESP32
                            │
                            ▼
                 ┌─────────────────────┐
                 │       ESP32         │
                 │                     │
                 │ Wi-Fi Manager       │
                 │ LTE Manager         │
                 │ Network Monitor     │
                 └─────────────────────┘
```

The NUCLEO should be able to determine which configured path should be used.

---

# 16. Network Health

Do not define network health only by checking whether a Wi-Fi or LTE link is connected.

A healthy path should be evaluated through the complete chain:

```text
Physical link
     ↓
IP address
     ↓
Gateway
     ↓
Internet reachability
     ↓
MQTT/HTTPS endpoint
     ↓
Application/server availability
```

For example:

```text
Wi-Fi connected
       ↓
IP assigned
       ↓
Gateway reachable
       ↓
Internet reachable
       ↓
MQTT/HTTPS server reachable
       ↓
PATH = HEALTHY
```

If any critical stage fails, the path may be considered unhealthy according to configured rules.

---

# 17. Failover

For a Wi-Fi-primary deployment:

```text
                 START
                   │
                   ▼
             Check Wi-Fi
                   │
            ┌──────┴──────┐
            │             │
           OK           FAILED
            │             │
            ▼             ▼
       Use Wi-Fi         4G
            │             │
            └──────┬──────┘
                   ▼
                Server
```

Do not switch networks on a single transient failure.

Use:

- Connection timeout
- Retry count
- Failure threshold
- Recovery threshold
- Reconnection delay
- Hysteresis

Example:

```text
Wi-Fi failure
     ↓
Retry Wi-Fi
     ↓
Failure persists
     ↓
Switch to 4G
     ↓
Monitor Wi-Fi
     ↓
Wi-Fi stable again
     ↓
Return according to configured policy
```

---

# 18. Data Buffering / Store-and-Forward

The system must support temporary connectivity loss.

When the Internet is unavailable:

```text
Sensors
   ↓
NUCLEO
   ↓
Data Record
   ↓
Local Buffer
```

Example:

```text
10:00:01 → 18.21 m
10:00:02 → 18.22 m
10:00:03 → 18.22 m
...
10:05:00 → 18.31 m
```

When connectivity returns:

```text
Local Buffer
     ↓
Upload historical records
     ↓
Upload current records
     ↓
Return to normal operation
```

Original timestamps must be retained.

---

# 19. Buffer Ownership

The architecture allows data buffering on the NUCLEO and/or ESP32.

Recommended responsibility:

### NUCLEO

Maintain the authoritative DAQ/application data and short-term queue required to protect data from NUCLEO↔ESP32 communication interruptions.

### ESP32

Maintain the communication-side queue required to protect data from Internet/cloud interruptions.

Conceptually:

```text
             NUCLEO
               │
        DAQ data queue
               │
               ▼
             ESP32
               │
       Network data queue
               │
               ▼
            Internet
```

The exact memory/persistent-storage implementation should be determined based on expected sampling rate, outage duration, and hardware memory.

---

# 20. Server Architecture

All physical communication paths should converge on the same backend.

```text
                  ┌── Wi-Fi ───────┐
                  │                │
DAQ ──────────────┤                ├──► Internet
                  │                │
                  └── 4G LTE ─────┘
                                       │
                                       ▼
                                  MQTT Broker
                                       │
                                       ▼
                                  Backend/API
                                       │
                                       ▼
                                  TimescaleDB
                                       │
                                       ▼
                                   Dashboard
```

The backend should not need to care whether:

```text
RTU001 → Wi-Fi
```

or:

```text
RTU001 → 4G LTE
```

or:

```text
RTU001 → Ethernet
```

was used.

The telemetry schema remains the same.

---

# 21. Backend Stack

Current project backend architecture:

```text
ESP32 / NUCLEO
       ↓
MQTT / HTTPS
       ↓
Server / Broker
       ↓
Backend / API
       ↓
TimescaleDB
       ↓
Grafana / Dashboard
```

The database layer should remain independent of the physical connectivity method.

---

# 22. Data Example

Example telemetry payload:

```json
{
  "device_id": "RTU001",
  "timestamp": "2026-09-17T18:10:00Z",
  "sequence": 1024,
  "level": 18.42,
  "temperature": 31.6,
  "pressure": 1.82
}
```

Additional fields may include:

```text
radar_level
pressure_level
heater_status
alarm_status
operating_mode
sensor_status
network_status
diagnostics
```

Do not hard-code the final telemetry schema until the complete I/O and backend schema are finalized.

---

# 23. Remote Commands

The same architecture can support downstream communication.

```text
Backend
   ↓
MQTT / HTTPS
   ↓
ESP32
   ↓
NUCLEO
   ↓
Control / Configuration
```

Potential future commands:

- Setpoint updates
- Operating mode changes
- Configuration updates
- Time synchronization
- Diagnostics requests
- Acknowledgement requests

Safety-critical control decisions should remain under the NUCLEO's local control logic and defined interlocks.

The ESP32 should act as a communication transport, not as the primary safety controller.

---

# 24. NUCLEO Responsibilities

The NUCLEO should handle:

### Data Acquisition

- Analog inputs
- 4–20 mA signals
- ADC processing
- RTD interface
- RS485 sensor communication
- Digital inputs
- Digital outputs

### Sensor Processing

- Raw-to-engineering conversion
- Scaling
- Filtering
- Validation
- Range checking
- Sensor diagnostics

### Control

- Local control logic
- Heater control
- Operating modes
- Interlocks
- Alarm processing

### Data

- Timestamping
- Sequence numbering
- Data records
- Local buffering
- Telemetry preparation

### Connectivity

- Ethernet
- Connectivity decision logic
- NUCLEO↔ESP32 communication
- Network path selection

---

# 25. ESP32 Responsibilities

The ESP32 should handle:

### Wireless

- Wi-Fi
- A7672S communication
- 4G LTE
- Cellular registration
- SIM/modem management

### Transport

- MQTT
- HTTPS
- TLS
- Connection management
- Retry logic

### Network Monitoring

- Wi-Fi state
- LTE state
- Signal strength
- IP state
- Internet reachability
- Server reachability

### Communication

- NUCLEO interface
- Data acknowledgement
- Cloud transmission
- Remote command reception

### Diagnostics

- Network state
- Modem state
- Connection errors
- Last successful transmission
- Communication statistics

---

# 26. Responsibility Matrix

| Function | NUCLEO-F767ZI | ESP32-S3 + A7672S |
|---|---:|---:|
| Sensor acquisition | YES | NO |
| 4–20 mA acquisition | YES | NO |
| ADC processing | YES | NO |
| RTD processing | YES | NO |
| RS485 field communication | YES | NO |
| Sensor validation | YES | NO |
| Engineering calculations | YES | NO |
| Local control | YES | NO |
| Alarm logic | YES | NO |
| Interlocks | YES | NO |
| Heater control | YES | NO |
| Timestamping | YES | SUPPORT |
| Data buffering | YES | YES |
| Ethernet | YES | NO |
| Connectivity decision | YES | SUPPORT |
| Wi-Fi | NO | YES |
| 4G LTE | NO | YES |
| Cellular modem | NO | YES |
| MQTT | TRANSPORT REQUEST | YES |
| HTTPS | TRANSPORT REQUEST | YES |
| TLS | NO | YES |
| Network monitoring | DECISION | YES |
| Cloud communication | NO | YES |
| Remote command transport | YES | YES |
| Safety-critical local control | YES | NO |

---

# 27. Reliability Requirement

The ESP32 must not become a single point of failure for the control system.

Loss of:

- Wi-Fi
- 4G
- Internet
- Cloud server
- ESP32 wireless connectivity

must not stop essential local NUCLEO operation.

The NUCLEO must continue operating the local system when communication is unavailable.

At minimum, the NUCLEO should continue:

```text
Sensor acquisition
       ↓
Signal processing
       ↓
Control logic
       ↓
Alarm/interlock logic
       ↓
Local outputs
```

Network communication is secondary to local control.

---

# 28. Ethernet Failure Behavior

For Ethernet-primary deployments, the NUCLEO should monitor Ethernet health.

Conceptually:

```text
Ethernet
   ↓
Healthy?
 ┌─┴─┐
YES  NO
 │    │
 ▼    ▼
Use  Trigger configured
Ethernet   wireless fallback
              │
              ▼
            ESP32
              │
              ▼
             4G
```

The exact mechanism for requesting wireless fallback must be defined in the NUCLEO↔ESP32 protocol.

Do not assume that the ESP32 can transparently route arbitrary NUCLEO Ethernet traffic unless that functionality is deliberately implemented.

---

# 29. Security

The ESP32 is the Internet-facing communication component.

It should support:

- TLS
- Certificate validation
- Secure credentials
- MQTT authentication
- HTTPS authentication
- Device identity
- Secure configuration
- Secure firmware-update strategy where applicable

Do not hard-code:

- Wi-Fi passwords
- APNs
- SIM credentials
- MQTT passwords
- API keys
- TLS private credentials

Use appropriate configuration/storage mechanisms.

The NUCLEO↔ESP32 protocol should use:

- CRC/checksum
- Message validation
- Length validation
- Sequence numbers
- Timeouts
- Invalid packet rejection

---

# 30. Time Synchronization

The ESP32 has Internet access and can obtain network time.

Possible architecture:

```text
Internet
   ↓
ESP32
   ↓
Time synchronization
   ↓
NUCLEO
```

The NUCLEO can use the ESP32 as a time source when appropriate.

However, the application must preserve the timestamp associated with each actual measurement.

---

# 31. Watchdogs

Both embedded devices require independent watchdog/recovery mechanisms.

## NUCLEO watchdog

Protect:

- Sensor acquisition
- Control firmware
- I/O processing
- Communication stack

## ESP32 watchdog

Protect:

- Wi-Fi manager
- LTE modem communication
- Cloud communication
- NUCLEO interface
- Network manager
- Data buffering

A communication failure should result in controlled recovery rather than stopping local control.

---

# 32. Software Architecture

## NUCLEO

Suggested modules:

```text
NUCLEO Firmware
│
├── main
├── io_manager
├── analog_manager
├── rtd_manager
├── rs485_manager
├── sensor_processing
├── tank_calculation
├── alarm_manager
├── control_manager
├── data_manager
├── timestamp_manager
├── buffer_manager
├── ethernet_manager
├── connectivity_manager
├── esp32_interface
├── diagnostics
└── watchdog
```

## ESP32

Suggested modules:

```text
ESP32 Firmware
│
├── main
├── nucleo_interface
├── wifi_manager
├── cellular_manager
├── modem_manager
├── network_manager
├── cloud_client
├── mqtt_client
├── https_client
├── tls_manager
├── data_buffer
├── configuration_manager
├── diagnostics
├── logging
└── watchdog
```

The exact module names can change, but responsibilities should remain separated.

---

# 33. Hardware Abstraction

The firmware must avoid tightly coupling application code to one modem.

Use an abstraction such as:

```text
Cellular Interface
       │
       ├── A7672S driver
       │
       └── Future modem driver
```

The same principle should apply to:

```text
Cloud Transport
       │
       ├── MQTT
       └── HTTPS
```

This keeps the architecture extensible.

---

# 34. Configuration Separation

## NUCLEO configuration

Contains field/application configuration:

```text
Tank dimensions
Sensor configuration
Sensor scaling
Alarm limits
Temperature limits
Level limits
Control setpoints
I/O configuration
Ethernet configuration
Connectivity profile
```

## ESP32 configuration

Contains communication configuration:

```text
Wi-Fi SSID
Wi-Fi password
LTE APN
SIM/modem configuration
Server address
MQTT broker
MQTT port
HTTPS endpoint
Authentication
TLS certificates
Retry parameters
Network priority
Buffer parameters
```

Do not unnecessarily duplicate configuration between devices.

---

# 35. Connectivity Abstraction

Application code should not directly depend on:

```text
Wi-Fi
4G
Ethernet
```

Instead use a logical connectivity interface:

```text
Application
     ↓
Connectivity Manager
     ↓
Transport Interface
     ↓
┌──────────┬──────────┬──────────┐
│ Ethernet │   Wi-Fi  │  4G LTE  │
└──────────┴──────────┴──────────┘
```

The application should request:

```text
SEND TELEMETRY
```

rather than:

```text
SEND USING WIFI
```

or:

```text
SEND USING LTE
```

The connectivity layer decides how the request is transported.

---

# 36. Important Distinction: Decision-Maker vs Wireless Gateway

The selected Approach 1 means:

### NUCLEO

Main DAQ + overall connectivity decision-maker.

### ESP32-S3/A7672S

Wireless communication module/gateway.

Therefore, do not implement the architecture as though the ESP32 independently owns all connectivity policy.

The NUCLEO should know the configured deployment profile and decide which connectivity path is appropriate.

The ESP32 should expose wireless capabilities and report their status.

---

# 37. Example Connectivity State

Example state information from ESP32 to NUCLEO:

```json
{
  "wifi": {
    "enabled": true,
    "connected": true,
    "internet": true,
    "signal_dbm": -62
  },
  "lte": {
    "enabled": true,
    "registered": true,
    "internet": true,
    "signal": 18
  },
  "cloud": {
    "connected": true
  },
  "active_transport": "WIFI"
}
```

This is an example only; the final schema can be adjusted during implementation.

---

# 38. End-to-End Data Flow

```text
FIELD SENSOR
     │
     ▼
NUCLEO
     │
     ├── Acquire
     ├── Process
     ├── Validate
     ├── Timestamp
     ├── Store
     └── Prepare telemetry
             │
             ▼
       NUCLEO Connectivity Manager
             │
             ├── Ethernet
             │
             └── ESP32
                    │
                    ├── Wi-Fi
                    │
                    └── 4G LTE
                           │
                           ▼
                        Internet
                           │
                           ▼
                      MQTT / HTTPS
                           │
                           ▼
                       Backend/API
                           │
                           ▼
                       TimescaleDB
                           │
                           ▼
                        Grafana
```

---

# 39. Reverse Data Flow

Remote configuration/commands:

```text
Grafana / Application
        │
        ▼
     Backend
        │
        ▼
   MQTT / HTTPS
        │
        ▼
      ESP32
        │
        │ Local protocol
        ▼
      NUCLEO
        │
        ▼
 Control / Configuration
```

The ESP32 should not independently make safety-critical decisions.

---

# 40. Failure Cases

The implementation must account for at least:

## Case 1 — Wi-Fi unavailable

```text
Wi-Fi fails
   ↓
NUCLEO/Connectivity Manager detects failure
   ↓
ESP32 LTE becomes active
   ↓
Data continues through 4G
```

## Case 2 — 4G unavailable

```text
4G unavailable
   ↓
Use Wi-Fi if configured and healthy
```

## Case 3 — Internet unavailable

```text
No Internet
   ↓
Buffer data
   ↓
Retry
   ↓
Internet restored
   ↓
Upload buffered records
```

## Case 4 — Cloud server unavailable

```text
Cloud unavailable
   ↓
Retain data
   ↓
Retry
   ↓
Server restored
   ↓
Synchronize data
```

## Case 5 — ESP32 disconnected

```text
ESP32 unavailable
   ↓
NUCLEO continues local operation
   ↓
Telemetry remains buffered according to capacity
   ↓
ESP32 reconnects
   ↓
Data synchronization
```

## Case 6 — NUCLEO disconnected

```text
NUCLEO unavailable
   ↓
ESP32 reports NUCLEO communication failure
   ↓
ESP32 does not invent sensor data
   ↓
ESP32 reports communication fault
```

---

# 41. Data Integrity

Telemetry must not be silently lost or duplicated during communication failures.

Use:

- Sequence numbers
- Timestamps
- CRC16 for local packets
- ACK/NACK
- Retry logic
- Duplicate detection
- Persistent buffering where required

The backend should preferably be able to identify a telemetry record using a combination such as:

```text
device_id + sequence_number
```

or another explicitly defined unique record identifier.

---

# 42. Antigravity Implementation Rules

When modifying the project, follow these rules.

### Rule 1

Keep the **NUCLEO-F767ZI as the primary DAQ/controller**.

### Rule 2

Keep **Ethernet on the NUCLEO**.

### Rule 3

Implement **Wi-Fi on the ESP32-S3**.

### Rule 4

Implement **4G LTE/cellular communication through the A7672S on the ESP32 side**.

### Rule 5

Use **UART as the initial NUCLEO↔ESP32 interface**, unless hardware constraints require otherwise.

### Rule 6

Do not move sensor acquisition or local control logic into the ESP32.

### Rule 7

Do not make the ESP32 responsible for safety-critical local control.

### Rule 8

Keep connectivity logic modular.

### Rule 9

Do not hard-code credentials.

### Rule 10

Implement network health using end-to-end connectivity checks rather than only physical link status.

### Rule 11

Implement retry and failover with hysteresis/debounce rather than switching on every transient failure.

### Rule 12

Implement store-and-forward buffering.

### Rule 13

Use sequence numbers and acknowledgements between NUCLEO and ESP32.

### Rule 14

Keep the cloud protocol independent from the sensor application layer.

### Rule 15

Do not assume that Ethernet traffic is automatically routed through the ESP32.

### Rule 16

Do not assume that all network interfaces must be active simultaneously.

### Rule 17

Support deployment profiles.

### Rule 18

Keep modem-specific code isolated behind a cellular abstraction.

### Rule 19

Keep MQTT/HTTPS transport implementations modular.

### Rule 20

A network failure must never stop essential local NUCLEO operation.

---

# 43. Development Order

Implement in this order.

## Phase 1 — NUCLEO ↔ ESP32 Link

Implement:

- UART initialization
- Packet framing
- CRC16
- Sequence number
- ACK/NACK
- Timeout
- Retry
- Heartbeat

## Phase 2 — NUCLEO Telemetry

Implement:

- Telemetry structure
- Sensor data mapping
- Timestamp
- Sequence number
- Buffering
- Transmission request

## Phase 3 — ESP32 Wi-Fi

Implement:

- Wi-Fi configuration
- Connection
- Reconnection
- Signal status
- IP status
- Internet health check

## Phase 4 — A7672S / LTE

Implement:

- UART/modem interface as required by hardware
- SIM handling
- APN configuration
- Network registration
- Signal status
- Data connection
- Reconnection

## Phase 5 — Connectivity Manager

Implement:

- Deployment profile
- Network priority
- Health checks
- Failover
- Recovery
- Hysteresis

## Phase 6 — Cloud Transport

Implement:

- MQTT and/or HTTPS
- TLS
- Authentication
- Telemetry publishing
- Command receiving
- Connection recovery

## Phase 7 — Store-and-Forward

Implement:

- Queue
- Persistent storage if required
- Retry
- Sequence tracking
- Duplicate protection
- Overflow handling

## Phase 8 — Diagnostics

Expose:

- NUCLEO link state
- Wi-Fi state
- LTE state
- Signal strength
- Internet state
- Cloud state
- Active transport
- Last successful transmission
- Failed transmission count
- Buffer utilization
- ESP32 uptime
- NUCLEO uptime

---

# 44. Final Selected Architecture

```text
                         ┌───────────────────────┐
                         │      FIELD DEVICES    │
                         │                       │
                         │ Level                 │
                         │ Temperature           │
                         │ Pressure              │
                         │ Radar                 │
                         │ Heater Feedback       │
                         └───────────┬───────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │      NUCLEO-F767ZI    │
                         │                       │
                         │ Main DAQ              │
                         │ Sensor Processing     │
                         │ Control Logic         │
                         │ Alarm / Interlocks    │
                         │ Timestamping          │
                         │ Data Buffering         │
                         │ Connectivity Decision │
                         │ Ethernet              │
                         └──────────┬────────────┘
                                    │
                              UART / SPI
                                    │
                                    ▼
                         ┌───────────────────────┐
                         │   ESP32-S3 + A7672S   │
                         │                       │
                         │ Wi-Fi                 │
                         │ 4G LTE                │
                         │ Cellular              │
                         │ MQTT / HTTPS          │
                         │ TLS                   │
                         │ Network Monitoring    │
                         └──────────┬────────────┘
                                    │
                          ┌─────────┴─────────┐
                          │                   │
                        Wi-Fi               4G LTE
                          │                   │
                          ▼                   ▼
                    Client Network       Cellular Network
                          │                   │
                          └─────────┬─────────┘
                                    │
                                    ▼
                                 INTERNET
                                    │
                                    ▼
                              MQTT / HTTPS
                                    │
                                    ▼
                              SERVER/BROKER
                                    │
                                    ▼
                                BACKEND/API
                                    │
                                    ▼
                               TIMESCALEDB
                                    │
                                    ▼
                                 GRAFANA
```

---

# 45. Final Design Statement

The selected architecture is:

> **NUCLEO-F767ZI = Main DAQ + local control + Ethernet + connectivity decision-maker**

> **ESP32-S3 + A7672S = Wi-Fi + 4G LTE/cellular wireless communication module**

The system should preserve a strict separation between:

```text
FIELD / CONTROL DOMAIN
        │
        ▼
     NUCLEO
        │
        │ Local communication
        ▼
COMMUNICATION DOMAIN
        │
        ▼
     ESP32
        │
        ├── Wi-Fi
        └── 4G LTE
        │
        ▼
     INTERNET
        │
        ▼
     BACKEND
        │
        ▼
  TIMESCALEDB
        │
        ▼
    GRAFANA
```

The most important rule is:

> **Sensor and control application logic must remain independent of the physical Internet transport.**

The NUCLEO should work even when the Internet is unavailable.

The ESP32 should handle wireless communication without taking over the NUCLEO's DAQ/control responsibilities.

This architecture is the baseline for future hardware, firmware, connectivity, backend, and Antigravity implementation decisions.
