/*
 * cloud_client.h
 *
 * Sends telemetry JSON to the cloud ingest API via either
 * Wi-Fi (WiFiClient) or 4G LTE (TinyGsmClient).
 */

#ifndef CLOUD_CLIENT_H
#define CLOUD_CLIENT_H

#include <Arduino.h>

/* Connection transport currently in use */
typedef enum {
    TRANSPORT_NONE,
    TRANSPORT_WIFI,
    TRANSPORT_4G
} transport_t;

/* Initialize the cloud client and establish connectivity.
 * Tries Wi-Fi first; if that fails, falls back to 4G modem.
 * Returns the transport that was successfully established. */
transport_t Cloud_Init();

/* Send a raw JSON body string to the cloud ingest API.
 * Uses whichever transport was established by Cloud_Init().
 * Returns the HTTP status code, or -1 on failure. */
int Cloud_PostTelemetry(const char *jsonBody);

/* Get the currently active transport */
transport_t Cloud_GetTransport();

/* Re-attempt connectivity if the current transport is down.
 * Call this periodically from the main loop. */
void Cloud_CheckReconnect();

#endif /* CLOUD_CLIENT_H */
