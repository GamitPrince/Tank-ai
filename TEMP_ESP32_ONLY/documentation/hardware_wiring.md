# Hardware Wiring Guide — Temporary ESP32-Only Architecture

> **⚠️ CRITICAL: READ BEFORE CONNECTING ANY WIRES**
>
> The ESP32 is **NOT** electrically equivalent to the Nucleo-F767ZI.
> Connecting industrial signals directly to the ESP32 can permanently
> damage the board. Follow this guide carefully.

---

## ESP32-S3 Electrical Limits

| Parameter | ESP32-S3 Limit |
|-----------|----------------|
| GPIO max voltage | **3.3V** (NOT 5V tolerant) |
| ADC input range | 0–3.3V (with ADC_ATTEN_DB_11) |
| ADC resolution | 12-bit (0–4095) |
| GPIO output current | 40 mA max per pin |
| Total GPIO current | 1200 mA max (all pins combined) |

> ⚠️ **The ESP32-S3 GPIOs are NOT 5V tolerant.** Never connect 5V, 12V,
> or 24V signals directly to any GPIO pin.

---

## Sensor Input: 4–20 mA Level Transmitter

The level sensor outputs a 4–20 mA current loop. The ESP32 ADC can only read 0–3.3V.

### Using the Commercial 4–20mA to 0–3.3V Converter

Since you have a commercial 4–20mA to 0–3.3V converter available, the wiring is greatly simplified. You do not need to build a custom resistor and voltage divider circuit.

**Typical Converter Module Connections:**

*   **Current Input Side:**
    *   `I+` (or `4-20mA In`): Connect to the sensor's current loop.
    *   `I-` (or `GND`): Connect to the sensor loop supply ground.
    *   *(Note: Some modules have separate VCC/GND to power the module itself. Follow your specific module's datasheet).*
*   **Voltage Output Side:**
    *   `VOUT` (or `Signal`): Connect to **ESP32 GPIO1 (ADC input)**.
    *   `GND`: Connect to **ESP32 GND**.

### Complete Signal Chain

```
4–20 mA sensor
       ↓
[ 4-20mA to 0-3.3V Converter Module ]
       ↓
0.0V – 3.30V (Analog Voltage)
       ↓
ESP32 GPIO1 (ADC Input)
```

### Conversion Math (No Code Changes Needed)

The firmware in `sensor_acquisition.cpp` uses the exact same conversion equations as the original Nucleo code:

```c
// 0.0V = 4mA, 3.3V = 20mA
voltage = (adc_raw * 3.3) / 4095.0
current = 4.0 + (voltage * 16.0 / 3.3)
level   = ((current - 4.0) * 100.0) / 16.0
```

This perfectly matches a converter that linearly maps 4mA to 0V, and 20mA to 3.3V. **No code changes are required.**

> ⚠️ **The converter module's output ground and the ESP32 ground MUST be connected together** (common ground reference). Without this, the ADC readings will be meaningless or dangerous.
---

## Relay Output

### Nucleo Configuration (Production)

- Pin: PE0 (push-pull output, 5V tolerant)
- Logic: HIGH when level ≥ 80%, LOW otherwise

### ESP32 Configuration (Temporary)

- Pin: GPIO2 (push-pull output, 3.3V)
- Logic: Same as Nucleo

### Compatibility Check

| Relay Module Type | Compatible? | Notes |
|-------------------|-------------|-------|
| 3.3V logic relay module | ✅ Yes | Direct connection OK |
| 5V logic relay module | ⚠️ Maybe | May need level shifter |
| Mechanical relay (coil) | ❌ No | Need transistor driver |
| SSR (solid state relay) | ✅ Usually | Check input voltage spec |

### If 5V Logic is Required

```
ESP32 GPIO2 ──── [10kΩ] ──── Gate ┐
                                   │
                              ┌────┤ N-Channel MOSFET
                              │    │ (e.g. 2N7000)
                              │    └── Source ── GND
                              │
                        Drain ─┤
                              │
                      Relay Module Input
                              │
                             +5V
```

> ⚠️ **Do NOT connect a relay coil directly to the ESP32 GPIO.**
> The GPIO cannot supply enough current to drive a relay coil directly.
> Always use a relay module with built-in driver, or add a MOSFET/transistor.

---

## KTRON Board GPIO Availability

Based on the KTRON ESP-S3-4G-DEV board manual:

| GPIO | Used By | Available? |
|------|---------|------------|
| GPIO0 | Boot/Strapping | ❌ Avoid |
| GPIO1 | Free | ✅ **ADC sensor input** |
| GPIO2 | Free | ✅ **Relay output** |
| GPIO3 | Free | ✅ Available |
| GPIO4 | NUCLEO UART RX (production) | ✅ Free in temp mode |
| GPIO5 | NUCLEO UART TX (production) | ✅ Free in temp mode |
| GPIO11 | WiFi LED | ⚠️ LED indicator |
| GPIO12 | LTE LED | ⚠️ LED indicator |
| GPIO13 | 4G Modem RST | ❌ Modem |
| GPIO14 | System Status LED | ⚠️ LED indicator |
| GPIO17 | 4G Modem UART RX | ❌ Modem |
| GPIO18 | 4G Modem UART TX | ❌ Modem |

> **ASSUMPTION:** GPIO1 and GPIO2 are shown as free in the manual.
> Verify against your actual board revision before wiring.

---

## Safety Checklist

Before powering on the temporary system:

- [ ] Commercial 4-20mA to 0-3.3V converter is wired correctly according to its manual.
- [ ] Maximum voltage output from the converter module does not exceed 3.3V.
- [ ] Common ground is established between the converter's output side and the ESP32.
- [ ] Relay module is compatible with 3.3V logic (or level shifter installed).
- [ ] No 5V, 12V, or 24V signals connected directly to any ESP32 pin.
- [ ] All connections are secure and insulated.
- [ ] **Multimeter check:** Measure the voltage at the ESP32 ADC pin before connecting the wire to the ESP32 — it must be **between 0V and 3.3V**.
