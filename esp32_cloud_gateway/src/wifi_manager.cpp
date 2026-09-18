/*
 * wifi_manager.cpp
 *
 * Wi-Fi connection management for the ESP32 cloud gateway.
 */

#include "wifi_manager.h"
#include "config.h"
#include <WiFi.h>

bool WiFi_Connect()
{
    Serial.printf("[WiFi] Connecting to '%s'...\n", WIFI_SSID);

    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    unsigned long start = millis();

    while (WiFi.status() != WL_CONNECTED)
    {
        if ((millis() - start) > WIFI_CONNECT_TIMEOUT_MS)
        {
            Serial.println("[WiFi] Connection TIMEOUT");
            WiFi.disconnect(true);
            return false;
        }

        delay(500);
        Serial.print(".");
    }

    Serial.println();
    Serial.printf("[WiFi] Connected! IP: %s\n",
                  WiFi.localIP().toString().c_str());

    return true;
}

bool WiFi_IsConnected()
{
    return (WiFi.status() == WL_CONNECTED);
}

void WiFi_Disconnect()
{
    WiFi.disconnect(true);
    WiFi.mode(WIFI_OFF);
    Serial.println("[WiFi] Disconnected");
}
