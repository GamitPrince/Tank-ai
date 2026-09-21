# Task: Create Temporary ESP32-Only Architecture

## Context

Our current project has two main hardware components:

1. **Nucleo-F767ZI**
2. **ESP32**

The Nucleo board is currently short-circuited/unavailable and a replacement board is expected to arrive later.

For temporary development and testing, we need to move the functionality currently handled by the Nucleo onto the ESP32.

**IMPORTANT:** This is a TEMPORARY implementation.

Do NOT destroy, modify, or replace the existing Nucleo + ESP32 architecture. The original implementation must remain intact so that we can switch back to the Nucleo when the replacement board arrives.

---

# Objective

Create a new, clearly isolated temporary folder/module in the existing project.

Suggested folder name:

```text
TEMP_ESP32_ONLY
```

or, if the existing project naming convention suggests a better name:

```text
temporary_esp32
```

The new folder must contain an architecture that mirrors the existing:

```text
Nucleo + ESP32
```

architecture as closely as possible, with the following temporary change:

```text
CURRENT:

Sensors / Inputs
       ↓
Nucleo-F767ZI
       ↓
ESP32
       ↓
MQTT / Server
       ↓
Database
       ↓
Custom Software


TEMPORARY:

Sensors / Inputs
       ↓
ESP32
       ↓
MQTT / Server
       ↓
Database
       ↓
Custom Software
```

The ESP32 will temporarily perform the functionality that was previously handled by the Nucleo.

---

# Critical Requirements

## 1. Preserve the Existing Architecture

DO NOT modify or delete the existing Nucleo code.

DO NOT rename existing Nucleo files unless absolutely necessary.

DO NOT replace the existing ESP32 implementation.

DO NOT mix temporary ESP32-only code with production Nucleo/ESP32 code.

The existing implementation must continue to represent the intended final architecture:

```text
Nucleo-F767ZI + ESP32
```

---

# 2. Create a Separate Temporary Architecture

Create a completely separate folder for the temporary implementation.

For example:

```text
project_root/
│
├── nucleo/
│   └── ...
│
├── esp32/
│   └── ...
│
├── server/
│   └── ...
│
├── database/
│   └── ...
│
├── software/
│   └── ...
│
└── TEMP_ESP32_ONLY/
    ├── README.md
    ├── esp32_firmware/
    │   ├── src/
    │   ├── include/
    │   ├── config/
    │   └── ...
    │
    ├── communication/
    │   └── ...
    │
    └── documentation/
        └── architecture.md
```

Adapt this structure to the actual project architecture after inspecting the existing project.

Do NOT blindly create duplicate files.

First inspect the existing project and understand:

- Nucleo responsibilities
- ESP32 responsibilities
- communication between Nucleo and ESP32
- sensor inputs
- ADC requirements
- GPIO requirements
- data processing
- MQTT communication
- server communication
- database interaction
- configuration
- error handling
- watchdog/reconnection logic
- data format

Then create the temporary implementation.

---

# 3. Replicate Nucleo Functionality on ESP32

Identify everything currently performed by the Nucleo.

For every Nucleo responsibility:

```text
Nucleo Function
      ↓
Temporary ESP32 Equivalent
```

Examples may include:

- Reading sensor inputs
- ADC acquisition
- Digital input acquisition
- Analog signal conversion
- Sensor value processing
- Scaling
- Filtering
- Validation
- Calibration
- Data formatting
- Fault detection
- Sensor status monitoring
- Generating the data packet
- Sending data to the communication layer

Only replicate functionality that can safely and realistically be performed by the ESP32.

---

# 4. Preserve the Existing Data Flow

The downstream architecture should remain unchanged as much as possible.

The temporary ESP32 should produce the same data format that the original Nucleo + ESP32 system ultimately produces.

For example:

```text
Sensors
   ↓
TEMP ESP32 acquisition
   ↓
Processing
   ↓
Same data structure
   ↓
Same MQTT topic
   ↓
Same server
   ↓
Same database
   ↓
Same custom software
```

Do NOT create a second completely different server/database protocol unless absolutely required.

The purpose is to make the temporary hardware substitution transparent to the rest of the system.

---

# 5. Maintain Interface Compatibility

Where possible, maintain compatibility with the existing:

- MQTT topics
- MQTT payload format
- JSON structure
- sensor IDs
- timestamps
- device IDs
- server API
- database schema
- database tables
- authentication
- communication protocol
- configuration variables

If the original system uses something such as:

```json
{
    "device_id": "...",
    "sensor_id": "...",
    "temperature": 0,
    "pressure": 0,
    "level": 0,
    "timestamp": "..."
}
```

the temporary implementation should use the same structure unless there is a documented reason not to.

---

# 6. Clearly Mark Temporary Code

Every temporary implementation should be clearly identified.

Use comments such as:

```cpp
// TEMPORARY ESP32-ONLY IMPLEMENTATION
// Nucleo-F767ZI is currently unavailable.
// This code replaces the Nucleo functionality temporarily.
// Revert to the original Nucleo + ESP32 architecture when
// the replacement Nucleo board becomes available.
```

Do NOT scatter temporary logic throughout the permanent codebase if it can be avoided.

Prefer isolation.

---

# 7. Hardware Abstraction

If the current code does not already have a hardware abstraction layer, create one where practical.

The goal should be to make this transition:

```text
Nucleo Hardware
       ↓
Hardware Interface
       ↓
Application Logic
```

and temporarily:

```text
ESP32 Hardware
       ↓
Same Hardware Interface
       ↓
Application Logic
```

This will make the eventual return to the Nucleo significantly easier.

Do not over-engineer this. Keep it simple and compatible with the existing project.

---

# 8. ESP32 Pin Configuration

Inspect the existing project and identify the required Nucleo inputs/outputs.

Then determine the equivalent ESP32 pins.

Create a dedicated configuration file, for example:

```text
TEMP_ESP32_ONLY/esp32_firmware/config/pins.h
```

or the equivalent configuration mechanism used by the project.

Clearly document:

```text
Sensor/Input
    ↓
Signal Type
    ↓
ESP32 GPIO / ADC Pin
    ↓
Expected Voltage/Current Range
    ↓
Scaling
```

IMPORTANT:

Do not assume that a signal can be connected directly to an ESP32 GPIO/ADC.

Respect ESP32 electrical limitations.

If the original Nucleo accepted a signal that the ESP32 cannot safely accept directly, document the required interface/converter instead of pretending the connection is safe.

---

# 9. ADC / Analog Input Handling

Pay particular attention to analog signals.

The ESP32 ADC must not be treated as electrically equivalent to the Nucleo ADC.

Check:

- ESP32 ADC input voltage limits
- ADC resolution
- attenuation configuration
- reference behavior
- ADC calibration
- signal conditioning
- voltage dividers
- current-to-voltage converters
- filtering
- scaling

For example, if a sensor produces:

```text
4–20 mA
```

and a current-to-voltage converter produces:

```text
0–3.3 V
```

then the ESP32 should read the resulting voltage through an appropriate ADC input.

Document the conversion mathematically.

Example:

```text
4 mA  →  minimum voltage
20 mA →  maximum voltage
```

Then convert:

```text
ADC reading
    ↓
Voltage
    ↓
Current
    ↓
Engineering value
```

Use the actual project's existing conversion equations where available.

---

# 10. Do Not Change Business Logic Unnecessarily

The temporary implementation should change:

```text
HARDWARE SOURCE
```

not:

```text
APPLICATION BEHAVIOR
```

Avoid changing:

- database design
- MQTT topic structure
- server behavior
- dashboard behavior
- sensor naming
- device identification
- data interpretation

unless required by the temporary hardware.

---

# 11. Configuration

Create a temporary configuration clearly separated from production configuration.

For example:

```text
TEMP_ESP32_ONLY/
    config/
        temporary_config.h
```

Include things such as:

```text
TEMPORARY_MODE = true
DEVICE_TYPE = ESP32_ONLY
NUCLEO_AVAILABLE = false
```

Use the actual project's configuration conventions instead of blindly copying these exact variables.

---

# 12. Safety

Because this is a hardware substitution, prioritize electrical safety.

Before implementing GPIO/ADC connections:

1. Check signal voltage/current.
2. Check ESP32 pin maximum ratings.
3. Check whether the signal requires a converter.
4. Check common ground requirements.
5. Check whether the sensor supply is separate from the ESP32 supply.
6. Check whether any 5 V signal could reach an ESP32 GPIO.
7. Check whether any 12/24 V industrial signal could reach the ESP32 directly.

NEVER create firmware that assumes:

```text
24 V → ESP32 GPIO
```

or

```text
5 V → ESP32 GPIO
```

is safe.

If hardware conditioning is required, document it clearly.

---

# 13. Build and Test Independently

The temporary ESP32 firmware should be independently buildable.

Verify:

```text
Compilation
    ↓
ESP32 upload
    ↓
Boot
    ↓
Sensor acquisition
    ↓
Data processing
    ↓
MQTT connection
    ↓
Data publishing
```

Add useful serial logging.

Example:

```text
[TEMP] ESP32-ONLY MODE
[TEMP] Nucleo unavailable
[SENSOR] Level = XX.XX
[SENSOR] Temperature = XX.XX
[MQTT] Connected
[MQTT] Data published
```

Do not expose credentials in logs.

---

# 14. Failure Handling

Implement or preserve:

- Wi-Fi reconnect
- MQTT reconnect
- sensor read failure detection
- invalid ADC value detection
- timeout handling
- watchdog where appropriate
- safe startup behavior

The temporary system should be stable enough for development/testing until the replacement Nucleo arrives.

---

# 15. Documentation

Create:

```text
TEMP_ESP32_ONLY/README.md
```

The README must explain:

### Why this folder exists

```text
The Nucleo-F767ZI is temporarily unavailable.
The ESP32 is temporarily performing the required Nucleo functionality.
```

### Architecture

Show:

```text
Sensors
   ↓
ESP32
   ↓
MQTT
   ↓
Server
   ↓
TimescaleDB
   ↓
Custom Software
```

### Differences from production

Clearly list:

```text
Production:
Nucleo + ESP32

Temporary:
ESP32 only
```

### Hardware mapping

Document the temporary ESP32 pins.

### Reverting to production

Explain exactly what needs to be done when the replacement Nucleo arrives.

---

# 16. Reversion Requirement

This is extremely important.

When the new Nucleo arrives, we should be able to return to:

```text
Nucleo-F767ZI
       ↓
ESP32
       ↓
MQTT
       ↓
Server
       ↓
Database
       ↓
Software
```

without having to rebuild the entire project.

Therefore:

- Keep original files untouched.
- Keep temporary files isolated.
- Avoid modifying production interfaces.
- Avoid changing database schema.
- Avoid changing MQTT topics.
- Document every temporary modification.
- Keep a clear migration/reversion procedure.

---

# 17. Before Making Changes

FIRST inspect the entire existing project.

Understand:

```text
Project structure
Nucleo firmware
ESP32 firmware
Communication
MQTT
Server
Database
Configuration
Sensor processing
Hardware interfaces
```

Then determine exactly which Nucleo functions must be moved to ESP32.

Do not start coding based on assumptions.

---

# 18. Final Deliverables

After implementation, provide:

### A. Folder structure

Show the complete new temporary folder structure.

### B. Architecture diagram

Show:

```text
TEMPORARY SYSTEM

Sensors
   ↓
ESP32
   ↓
Processing
   ↓
MQTT
   ↓
Server
   ↓
TimescaleDB
   ↓
Custom Software
```

### C. Nucleo → ESP32 mapping

Create a table:

| Original Nucleo Function | Temporary ESP32 Implementation | Status |
|---|---|---|
| Sensor acquisition | ESP32 ADC/GPIO | |
| Signal processing | ESP32 | |
| Data formatting | ESP32 | |
| Communication | Existing ESP32/MQTT path | |
| etc. | | |

Use the actual functions discovered in the project.

### D. Hardware pin mapping

Create a table:

| Signal | Original Nucleo Pin | Temporary ESP32 Pin | Signal Range | Conditioning Required |
|---|---|---|---|---|

Only fill values that can be verified from the existing project or hardware documentation.

Do not invent pin assignments.

### E. Modified files

List every newly created or modified file.

### F. Testing instructions

Give exact steps to:

1. Build
2. Flash ESP32
3. Power the system
4. Connect to Wi-Fi
5. Connect to MQTT
6. Verify sensor readings
7. Verify server reception
8. Verify database insertion
9. Verify the custom software

### G. Reversion instructions

Give exact steps for returning to the original Nucleo + ESP32 architecture.

---

# Golden Rule

The temporary implementation must be:

```text
ISOLATED
REVERSIBLE
COMPATIBLE
SAFE
DOCUMENTED
```

The goal is NOT to redesign the project.

The goal is simply:

```text
Nucleo unavailable
        ↓
ESP32 temporarily performs Nucleo responsibilities
        ↓
Everything downstream continues working
        ↓
Replacement Nucleo arrives
        ↓
Return to original architecture
```

Before modifying anything, inspect the existing project and report your understanding of the current architecture and the exact Nucleo responsibilities that need to be temporarily migrated to the ESP32.