/*
 * wifi_manager.cpp
 *
 * TEMPORARY ESP32-ONLY IMPLEMENTATION
 * ====================================
 * Nucleo-F767ZI is currently unavailable.
 * This code provides Wi-Fi connection management for the temporary
 * ESP32-only firmware.
 * Revert to the original Nucleo + ESP32 architecture when
 * the replacement Nucleo board becomes available.
 *
 * Based on: esp32_cloud_gateway/src/wifi_manager.cpp
 * Added: periodic auto-reconnect logic for standalone operation.
 */

#include "wifi_manager.h"
#include "config.h"
#include <WiFi.h>

static uint32_t last_reconnect_attempt = 0;

/* ------------------------------------------------------------------ */
/*  Connect                                                            */
/* ------------------------------------------------------------------ */

bool WiFi_Connect(void)
{
    Serial.printf("%s Connecting to '%s'...\n", LOG_PREFIX_WIFI, WIFI_SSID);

    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    unsigned long start = millis();

    while (WiFi.status() != WL_CONNECTED)
    {
        if ((millis() - start) > WIFI_CONNECT_TIMEOUT_MS)
        {
            Serial.printf("%s Connection TIMEOUT\n", LOG_PREFIX_WIFI);
            WiFi.disconnect(true);
            return false;
        }

        delay(500);
        Serial.print(".");
    }

    Serial.println();
    Serial.printf("%s Connected! IP: %s\n", LOG_PREFIX_WIFI,
                  WiFi.localIP().toString().c_str());

    last_reconnect_attempt = millis();
    return true;
}

/* ------------------------------------------------------------------ */
/*  Is Connected                                                       */
/* ------------------------------------------------------------------ */

bool WiFi_IsConnected(void)
{
    return (WiFi.status() == WL_CONNECTED);
}

/* ------------------------------------------------------------------ */
/*  Disconnect                                                         */
/* ------------------------------------------------------------------ */

void WiFi_Disconnect(void)
{
    WiFi.disconnect(true);
    WiFi.mode(WIFI_OFF);
    Serial.printf("%s Disconnected\n", LOG_PREFIX_WIFI);
}

/* ------------------------------------------------------------------ */
/*  Auto-Reconnect (new for standalone operation)                      */
/* ------------------------------------------------------------------ */

void WiFi_ReconnectIfNeeded(void)
{
    if (WiFi_IsConnected())
    {
        return; /* Already connected, nothing to do */
    }

    /* Rate-limit reconnection attempts */
    if ((millis() - last_reconnect_attempt) < WIFI_RECONNECT_INTERVAL_MS)
    {
        return;
    }

    last_reconnect_attempt = millis();
    Serial.printf("%s Connection lost, attempting reconnect...\n", LOG_PREFIX_WIFI);

    WiFi_Connect();
}
