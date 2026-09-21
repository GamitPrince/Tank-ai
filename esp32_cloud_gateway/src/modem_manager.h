/*
 * modem_manager.h
 *
 * 4G LTE modem management via TinyGSM for the ESP32 cloud gateway.
 */

#ifndef MODEM_MANAGER_H
#define MODEM_MANAGER_H

#include <Arduino.h>

/* Power on the modem hardware and initialize AT communication.
 * Returns true if the modem responds and registers on the network. */
bool Modem_Init();

/* Check if the modem has an active data connection */
bool Modem_IsConnected();

/* Establish GPRS data connection using APN from config.
 * Returns true on success. */
bool Modem_Connect();

/* Disconnect GPRS */
void Modem_Disconnect();

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

#endif /* MODEM_MANAGER_H */
