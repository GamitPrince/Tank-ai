/*
 * relay_control.h
 *
 * TEMPORARY ESP32-ONLY IMPLEMENTATION
 * ====================================
 * Nucleo-F767ZI is currently unavailable.
 * This code replaces the Nucleo relay control on PE0.
 * Revert to the original Nucleo + ESP32 architecture when
 * the replacement Nucleo board becomes available.
 *
 * Original Nucleo code: Core/Src/main.c (Control_Relay)
 */

#ifndef TEMP_RELAY_CONTROL_H
#define TEMP_RELAY_CONTROL_H

#include <Arduino.h>

/* Initialize the relay output GPIO pin */
void RelayControl_Init(void);

/* Update relay state based on level percentage.
 * Identical logic to Nucleo: level >= 80% → ON, else OFF.
 * Returns the current relay state (1 = ON, 0 = OFF). */
uint8_t RelayControl_Update(float level_pct);

/* Get the current relay state without changing it */
uint8_t RelayControl_GetState(void);

#endif /* TEMP_RELAY_CONTROL_H */
