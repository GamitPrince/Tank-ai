/*
 * cloud_client.h
 *
 * TEMPORARY ESP32-ONLY IMPLEMENTATION
 * ====================================
 * Nucleo-F767ZI is currently unavailable.
 * This code provides cloud HTTP POST functionality for the temporary
 * ESP32-only firmware.
 * Revert to the original Nucleo + ESP32 architecture when
 * the replacement Nucleo board becomes available.
 *
 * Based on: esp32_cloud_gateway/src/cloud_client.h
 * Enhanced: auto-failover from WiFi to 4G, backoff retry.
 */

#ifndef TEMP_CLOUD_CLIENT_H
#define TEMP_CLOUD_CLIENT_H

#include <Arduino.h>

/* Connection transport currently in use */
typedef enum {
    TRANSPORT_NONE,
    TRANSPORT_WIFI,
    TRANSPORT_4G
} transport_t;

/* Initialize cloud connectivity (modem hardware, etc.) */
void Cloud_Init(void);

/* Evaluate connectivity and choose best transport (WiFi → 4G fallback).
 * Call periodically from the main loop. */
void Cloud_EvaluateTransport(void);

/* POST telemetry JSON body to the cloud ingest API.
 * Returns the HTTP status code (e.g. 200), or -1 on failure. */
int Cloud_PostTelemetry(const char *jsonBody);

/* Get the currently active transport */
transport_t Cloud_GetTransport(void);

#endif /* TEMP_CLOUD_CLIENT_H */
