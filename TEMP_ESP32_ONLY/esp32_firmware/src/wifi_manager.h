/*
 * wifi_manager.h
 *
 * TEMPORARY ESP32-ONLY IMPLEMENTATION
 * ====================================
 * Nucleo-F767ZI is currently unavailable.
 * This code provides Wi-Fi connection management for the temporary
 * ESP32-only firmware.
 * Revert to the original Nucleo + ESP32 architecture when
 * the replacement Nucleo board becomes available.
 *
 * Based on: esp32_cloud_gateway/src/wifi_manager.h
 * Added: auto-reconnect logic for standalone operation.
 */

#ifndef TEMP_WIFI_MANAGER_H
#define TEMP_WIFI_MANAGER_H

#include <Arduino.h>

/* Attempt to connect to Wi-Fi.
 * Returns true if connected within the timeout, false otherwise. */
bool WiFi_Connect(void);

/* Check if Wi-Fi is currently connected */
bool WiFi_IsConnected(void);

/* Disconnect Wi-Fi */
void WiFi_Disconnect(void);

/* Auto-reconnect if Wi-Fi was lost.
 * Call periodically from the main loop. */
void WiFi_ReconnectIfNeeded(void);

#endif /* TEMP_WIFI_MANAGER_H */
