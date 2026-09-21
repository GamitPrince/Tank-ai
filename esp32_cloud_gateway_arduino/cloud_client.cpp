/*
 * cloud_client.cpp
 *
 * Sends telemetry JSON to the cloud ingest API.
 * Tries Wi-Fi first; falls back to 4G LTE if Wi-Fi is unavailable.
 */

#include "cloud_client.h"
#include "config.h"
#include "wifi_manager.h"
#include "modem_manager.h"

#include <WiFi.h>
#include <WiFiClient.h>

static transport_t active_transport = TRANSPORT_NONE;
static uint32_t    backoff_ms       = BACKOFF_INIT_MS;
static uint32_t    last_fail_ms     = 0;

/* ------------------------------------------------------------------ */
/*  Wi-Fi HTTP POST helper                                             */
/* ------------------------------------------------------------------ */
static int wifi_http_post(const char *jsonBody)
{
    WiFiClient client;

    if (!client.connect(CLOUD_SERVER_HOST, CLOUD_SERVER_PORT))
    {
        Serial.printf("[CLOUD] WiFi TCP connect to %s:%d FAILED\n",
                      CLOUD_SERVER_HOST, CLOUD_SERVER_PORT);
        return -1;
    }

    int bodyLen = strlen(jsonBody);

    client.printf("POST %s HTTP/1.1\r\n", CLOUD_API_PATH);
    client.printf("Host: %s:%d\r\n", CLOUD_SERVER_HOST, CLOUD_SERVER_PORT);
    client.print("Content-Type: application/json\r\n");
    client.printf("X-API-Key: %s\r\n", CLOUD_API_KEY);
    client.printf("Content-Length: %d\r\n", bodyLen);
    client.print("Connection: close\r\n");
    client.print("\r\n");
    client.print(jsonBody);

    /* Wait for response */
    unsigned long timeout = millis() + HTTP_POST_TIMEOUT_MS;
    while (client.connected() && !client.available())
    {
        if (millis() > timeout)
        {
            Serial.println("[CLOUD] WiFi HTTP response timeout");
            client.stop();
            return -1;
        }
        delay(10);
    }

    /* Parse status code */
    int statusCode = -1;
    if (client.available())
    {
        String statusLine = client.readStringUntil('\n');
        int spaceIdx = statusLine.indexOf(' ');
        if (spaceIdx > 0)
        {
            statusCode = statusLine.substring(spaceIdx + 1).toInt();
        }
    }

    /* Drain and close */
    while (client.available()) { client.read(); }
    client.stop();

    return statusCode;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

void Cloud_Init()
{
    Serial.println("[CLOUD] Initializing connectivity (Standby)...");
    /* We don't auto-connect anymore. NUCLEO decides. 
       But we can initialize the modem hardware. */
    Modem_Init();
}

void Cloud_SetActiveTransport(transport_t t)
{
    active_transport = t;
    if (t == TRANSPORT_WIFI && !WiFi_IsConnected()) {
        WiFi_Connect();
    } else if (t == TRANSPORT_4G && !Modem_IsConnected()) {
        Modem_Connect();
    }
}

transport_t Cloud_GetTransport()
{
    return active_transport;
}

int Cloud_PostTelemetry(const char *jsonBody)
{
    /* Respect backoff after failures */
    if (last_fail_ms > 0 && (millis() - last_fail_ms) < backoff_ms)
    {
        return -1; /* Still in backoff period */
    }

    int statusCode = -1;

    if (active_transport == TRANSPORT_WIFI)
    {
        if (WiFi_IsConnected()) {
            statusCode = wifi_http_post(jsonBody);
        } else {
            Serial.println("[CLOUD] Wi-Fi requested but not connected");
            return -1;
        }
    }
    else if (active_transport == TRANSPORT_4G)
    {
        if (Modem_IsConnected()) {
            statusCode = Modem_HttpPost(CLOUD_SERVER_HOST, CLOUD_SERVER_PORT,
                                        CLOUD_API_PATH, jsonBody, CLOUD_API_KEY);
        } else {
            Serial.println("[CLOUD] 4G requested but not connected");
            return -1;
        }
    }

    if (statusCode >= 200 && statusCode < 300)
    {
        Serial.printf("[CLOUD] POST OK (HTTP %d)\n", statusCode);
    }
    else
    {
        Serial.printf("[CLOUD] POST FAILED (HTTP %d)\n", statusCode);
    }

    return statusCode;
}
