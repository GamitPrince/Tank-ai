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

transport_t Cloud_Init()
{
    Serial.println("[CLOUD] Initializing connectivity...");

    /* --- Try Wi-Fi first --- */
    if (WiFi_Connect())
    {
        active_transport = TRANSPORT_WIFI;
        Serial.println("[CLOUD] Using Wi-Fi transport");
        return active_transport;
    }

    /* --- Wi-Fi failed — try 4G modem --- */
    Serial.println("[CLOUD] Wi-Fi failed, trying 4G modem...");

    if (Modem_Init() && Modem_Connect())
    {
        active_transport = TRANSPORT_4G;
        Serial.println("[CLOUD] Using 4G LTE transport");
        return active_transport;
    }

    Serial.println("[CLOUD] WARNING: No connectivity established!");
    active_transport = TRANSPORT_NONE;
    return active_transport;
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
        if (!WiFi_IsConnected())
        {
            Serial.println("[CLOUD] Wi-Fi lost, attempting reconnect...");
            if (!WiFi_Connect())
            {
                /* Try 4G fallback */
                Serial.println("[CLOUD] Wi-Fi reconnect failed, switching to 4G...");
                if (Modem_Init() && Modem_Connect())
                {
                    active_transport = TRANSPORT_4G;
                }
                else
                {
                    active_transport = TRANSPORT_NONE;
                    last_fail_ms = millis();
                    backoff_ms = (backoff_ms * 2 > BACKOFF_MAX_MS)
                                 ? BACKOFF_MAX_MS : backoff_ms * 2;
                    return -1;
                }
            }
        }

        if (active_transport == TRANSPORT_WIFI)
        {
            statusCode = wifi_http_post(jsonBody);
        }
    }

    if (active_transport == TRANSPORT_4G)
    {
        if (!Modem_IsConnected())
        {
            Serial.println("[CLOUD] 4G lost, attempting reconnect...");
            if (!Modem_Connect())
            {
                active_transport = TRANSPORT_NONE;
                last_fail_ms = millis();
                backoff_ms = (backoff_ms * 2 > BACKOFF_MAX_MS)
                             ? BACKOFF_MAX_MS : backoff_ms * 2;
                return -1;
            }
        }

        statusCode = Modem_HttpPost(CLOUD_SERVER_HOST, CLOUD_SERVER_PORT,
                                    CLOUD_API_PATH, jsonBody, CLOUD_API_KEY);
    }

    if (active_transport == TRANSPORT_NONE)
    {
        /* No transport available */
        last_fail_ms = millis();
        return -1;
    }

    /* Handle result */
    if (statusCode >= 200 && statusCode < 300)
    {
        /* Success — reset backoff */
        backoff_ms   = BACKOFF_INIT_MS;
        last_fail_ms = 0;
        Serial.printf("[CLOUD] POST OK (HTTP %d)\n", statusCode);
    }
    else
    {
        /* Failure — exponential backoff */
        last_fail_ms = millis();
        backoff_ms   = (backoff_ms * 2 > BACKOFF_MAX_MS)
                       ? BACKOFF_MAX_MS : backoff_ms * 2;
        Serial.printf("[CLOUD] POST FAILED (HTTP %d), retry in %lu ms\n",
                      statusCode, backoff_ms);
    }

    return statusCode;
}

void Cloud_CheckReconnect()
{
    if (active_transport != TRANSPORT_NONE)
    {
        return; /* Already connected */
    }

    /* Respect backoff */
    if (last_fail_ms > 0 && (millis() - last_fail_ms) < backoff_ms)
    {
        return;
    }

    Serial.println("[CLOUD] Attempting reconnect...");

    /* Try Wi-Fi first */
    if (WiFi_Connect())
    {
        active_transport = TRANSPORT_WIFI;
        backoff_ms       = BACKOFF_INIT_MS;
        last_fail_ms     = 0;
        Serial.println("[CLOUD] Reconnected via Wi-Fi");
        return;
    }

    /* Then 4G */
    if (Modem_Init() && Modem_Connect())
    {
        active_transport = TRANSPORT_4G;
        backoff_ms       = BACKOFF_INIT_MS;
        last_fail_ms     = 0;
        Serial.println("[CLOUD] Reconnected via 4G LTE");
        return;
    }

    /* Still no luck */
    last_fail_ms = millis();
    backoff_ms   = (backoff_ms * 2 > BACKOFF_MAX_MS)
                   ? BACKOFF_MAX_MS : backoff_ms * 2;
    Serial.printf("[CLOUD] Reconnect failed, retry in %lu ms\n", backoff_ms);
}
