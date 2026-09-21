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

void Cloud_Init();
int Cloud_PostTelemetry(const char *jsonBody);
transport_t Cloud_GetTransport();
void Cloud_SetActiveTransport(transport_t t);

#endif /* CLOUD_CLIENT_H */
