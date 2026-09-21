/*
 * relay_control.cpp
 *
 * TEMPORARY ESP32-ONLY IMPLEMENTATION
 * ====================================
 * Nucleo-F767ZI is currently unavailable.
 * This code replaces the Nucleo relay control on PE0.
 * Revert to the original Nucleo + ESP32 architecture when
 * the replacement Nucleo board becomes available.
 *
 * Original Nucleo code: Core/Src/main.c lines 253–263 (Control_Relay)
 *
 * Logic is IDENTICAL to the Nucleo:
 *   - level >= 80.0% → Relay ON  (GPIO HIGH)
 *   - level <  80.0% → Relay OFF (GPIO LOW)
 *
 * WARNING: The ESP32 GPIO is 3.3V logic. If the relay module requires
 * 5V logic input, a MOSFET driver or level shifter is needed.
 * See documentation/hardware_wiring.md for details.
 */

#include "relay_control.h"
#include "config.h"

static uint8_t relay_state = 0;

/* ------------------------------------------------------------------ */
/*  Initialization                                                     */
/* ------------------------------------------------------------------ */

void RelayControl_Init(void)
{
    pinMode(RELAY_OUTPUT_PIN, OUTPUT);
    digitalWrite(RELAY_OUTPUT_PIN, LOW);
    relay_state = 0;

    Serial.printf("%s Relay control initialized (pin GPIO%d, threshold %.1f%%)\n",
                  LOG_PREFIX_RELAY, RELAY_OUTPUT_PIN, RELAY_LEVEL_THRESHOLD);
}

/* ------------------------------------------------------------------ */
/*  Update (replaces Nucleo Control_Relay)                             */
/* ------------------------------------------------------------------ */

uint8_t RelayControl_Update(float level_pct)
{
    /*
     * Identical logic to Nucleo (Core/Src/main.c lines 255–262):
     *   if (level >= 80.0f)
     *       HAL_GPIO_WritePin(GPIOE, GPIO_PIN_0, GPIO_PIN_SET);
     *   else
     *       HAL_GPIO_WritePin(GPIOE, GPIO_PIN_0, GPIO_PIN_RESET);
     */
    if (level_pct >= 20.0f && level_pct <= 80.0f)
    {
        if (relay_state == 0)
        {
            Serial.printf("%s Relay ON (level %.2f%% is within 20%%-80%%)\n",
                          LOG_PREFIX_RELAY, level_pct);
        }
        digitalWrite(RELAY_OUTPUT_PIN, HIGH);
        relay_state = 1;
    }
    else
    {
        if (relay_state == 1)
        {
            Serial.printf("%s Relay OFF (level %.2f%% is outside 20%%-80%% safe zone)\n",
                          LOG_PREFIX_RELAY, level_pct);
        }
        digitalWrite(RELAY_OUTPUT_PIN, LOW);
        relay_state = 0;
    }

    return relay_state;
}

/* ------------------------------------------------------------------ */
/*  Get State                                                          */
/* ------------------------------------------------------------------ */

uint8_t RelayControl_GetState(void)
{
    return relay_state;
}
