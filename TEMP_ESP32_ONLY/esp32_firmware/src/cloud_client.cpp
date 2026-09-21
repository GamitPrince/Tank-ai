/*
 * cloud_client.cpp
 *
 * TEMPORARY ESP32-ONLY IMPLEMENTATION
 * ====================================
 * Nucleo-F767ZI is currently unavailable.
 * This code provides cloud HTTP POST functionality for the temporary
 * ESP32-only firmware.
 * Revert to the original Nucleo + ESP32 architecture when
 * the replacement Nucleo board becomes available.
 *
 * Based on: esp32_cloud_gateway/src/cloud_client.cpp
 *
 * Key difference from the original:
 *   - In production, the Nucleo decided the transport and told ESP32.
 *   - In temporary mode, the ESP32 itself evaluates WiFi/4G and
 *     performs automatic failover.
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
        Serial.printf("%s WiFi TCP connect to %s:%d FAILED\n",
                      LOG_PREFIX_CLOUD, CLOUD_SERVER_HOST, CLOUD_SERVER_PORT);
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
            Serial.printf("%s WiFi HTTP response timeout\n", LOG_PREFIX_CLOUD);
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
    Serial.printf("%s Initializing connectivity...\n", LOG_PREFIX_CLOUD);

    /* Initialize the 4G modem hardware (non-blocking, doesn't connect yet) */
    Modem_Init();

    Serial.printf("%s Cloud client initialized\n", LOG_PREFIX_CLOUD);
}

void Cloud_EvaluateTransport()
{
    /*
     * Transport failover logic (replaces Nucleo's ConnectivityManager):
     *   1. If WiFi is connected → use WiFi
     *   2. Else if 4G is connected → use 4G
     *   3. Else try to connect 4G as fallback
     *   4. Else → TRANSPORT_NONE
     */
    if (WiFi_IsConnected())
    {
        if (active_transport != TRANSPORT_WIFI)
        {
            Serial.printf("%s Switching to WiFi transport\n", LOG_PREFIX_CLOUD);
            active_transport = TRANSPORT_WIFI;
        }
    }
    else if (Modem_IsConnected())
    {
        if (active_transport != TRANSPORT_4G)
        {
            Serial.printf("%s Switching to 4G transport\n", LOG_PREFIX_CLOUD);
            active_transport = TRANSPORT_4G;
        }
    }
    else
    {
        /* Try 4G as fallback if WiFi is down */
        if (active_transport != TRANSPORT_NONE)
        {
            Serial.printf("%s All transports down, trying 4G fallback...\n", LOG_PREFIX_CLOUD);
        }

        if (Modem_Connect())
        {
            active_transport = TRANSPORT_4G;
            Serial.printf("%s 4G fallback connected\n", LOG_PREFIX_CLOUD);
        }
        else
        {
            if (active_transport != TRANSPORT_NONE)
            {
                Serial.printf("%s All transports DOWN\n", LOG_PREFIX_CLOUD);
            }
            active_transport = TRANSPORT_NONE;
        }
    }
}

transport_t Cloud_GetTransport()
{
    return active_transport;
}

int Cloud_PostTelemetry(const char *jsonBody)
{
    /* Always print the JSON payload to serial so the PC can read it via USB */
    Serial.printf("[SERIAL_JSON] %s\n", jsonBody);

    /* Respect backoff after failures */
    if (last_fail_ms > 0 && (millis() - last_fail_ms) < backoff_ms)
    {
        return -1; /* Still in backoff period */
    }

    int statusCode = -1;

    if (active_transport == TRANSPORT_WIFI)
    {
        if (WiFi_IsConnected())
        {
            statusCode = wifi_http_post(jsonBody);
        }
        else
        {
            Serial.printf("%s Wi-Fi transport selected but not connected\n", LOG_PREFIX_CLOUD);
            return -1;
        }
    }
    else if (active_transport == TRANSPORT_4G)
    {
        if (Modem_IsConnected())
        {
            statusCode = Modem_HttpPost(CLOUD_SERVER_HOST, CLOUD_SERVER_PORT,
                                        CLOUD_API_PATH, jsonBody, CLOUD_API_KEY);
        }
        else
        {
            Serial.printf("%s 4G transport selected but not connected\n", LOG_PREFIX_CLOUD);
            return -1;
        }
    }
    else
    {
        /* No transport available */
        return -1;
    }

    /* Handle success/failure with backoff */
    if (statusCode >= 200 && statusCode < 300)
    {
        Serial.printf("%s POST OK (HTTP %d)\n", LOG_PREFIX_CLOUD, statusCode);
        backoff_ms   = BACKOFF_INIT_MS;  /* Reset backoff on success */
        last_fail_ms = 0;
    }
    else
    {
        Serial.printf("%s POST FAILED (HTTP %d)\n", LOG_PREFIX_CLOUD, statusCode);
        last_fail_ms = millis();
        backoff_ms   = min(backoff_ms * 2, (uint32_t)BACKOFF_MAX_MS);
    }

    return statusCode;
}
