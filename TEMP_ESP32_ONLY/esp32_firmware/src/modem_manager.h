/*
 * modem_manager.h
 *
 * TEMPORARY ESP32-ONLY IMPLEMENTATION
 * ====================================
 * Nucleo-F767ZI is currently unavailable.
 * This code provides 4G LTE modem management for the temporary
 * ESP32-only firmware.
 * Revert to the original Nucleo + ESP32 architecture when
 * the replacement Nucleo board becomes available.
 *
 * Based on: esp32_cloud_gateway/src/modem_manager.h
 * Functionally identical.
 */

#ifndef TEMP_MODEM_MANAGER_H
#define TEMP_MODEM_MANAGER_H

#include <Arduino.h>

/* Power on the modem hardware and initialize AT communication.
 * Returns true if the modem responds and registers on the network. */
bool Modem_Init(void);

/* Check if the modem has an active data connection */
bool Modem_IsConnected(void);

/* Establish GPRS data connection using APN from config.
 * Returns true on success. */
bool Modem_Connect(void);

/* Disconnect GPRS */
void Modem_Disconnect(void);

/* Perform an HTTP POST using the modem's TCP stack (via TinyGSM).
 * Returns the HTTP status code (e.g. 200), or -1 on failure.
 *
 *   host     — server hostname or IP
 *   port     — server port
 *   path     — URL path (e.g. "/api/v1/ingest")
 *   body     — JSON body string
 *   apiKey   — value for the X-API-Key header
 */
int Modem_HttpPost(const char *host, uint16_t port,
                   const char *path, const char *body,
                   const char *apiKey);

#endif /* TEMP_MODEM_MANAGER_H */
