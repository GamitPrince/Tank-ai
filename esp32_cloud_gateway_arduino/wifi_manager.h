/*
 * wifi_manager.h
 *
 * Wi-Fi connection management for the ESP32 cloud gateway.
 */

#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <Arduino.h>

/* Attempt to connect to Wi-Fi.
 * Returns true if connected within the timeout, false otherwise. */
bool WiFi_Connect();

/* Check if Wi-Fi is currently connected */
bool WiFi_IsConnected();

/* Disconnect Wi-Fi (e.g., before switching to 4G) */
void WiFi_Disconnect();

#endif /* WIFI_MANAGER_H */
