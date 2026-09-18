/*
 * main.cpp
 *
 * ESP32 Cloud Gateway — Main entry point.
 *
 * Receives sensor telemetry from the STM32 Nucleo over UART,
 * wraps it into the cloud ingest API JSON format, and sends it
 * via Wi-Fi or 4G LTE.
 *
 * Data flow:
 *   Nucleo UART4 TX → ESP32 UART2 RX → Parse JSON → HTTP POST → Cloud
 */

#include <Arduino.h>
#include <ArduinoJson.h>

#include "config.h"
#include "nucleo_interface.h"
#include "cloud_client.h"
#include "wifi_manager.h"
#include "modem_manager.h"

/* ------------------------------------------------------------------ */
/*  Status LED                                                         */
/* ------------------------------------------------------------------ */
static void led_init()
{
    pinMode(STATUS_LED_PIN, OUTPUT);
    digitalWrite(STATUS_LED_PIN, LOW);
}

static void led_blink(int count, int on_ms, int off_ms)
{
    for (int i = 0; i < count; i++)
    {
        digitalWrite(STATUS_LED_PIN, HIGH);
        delay(on_ms);
        digitalWrite(STATUS_LED_PIN, LOW);
        delay(off_ms);
    }
}

/* ------------------------------------------------------------------ */
/*  Build cloud ingest JSON body from parsed Nucleo data               */
/* ------------------------------------------------------------------ */
static bool build_cloud_body(const char *nucleoJson, char *outBuf, size_t outSize)
{
    /*
     * Input from Nucleo (compact):
     *   {"d":"rtu_level_control_01","adc":2048,"v":1.6500,"ma":12.0000,"lv":50.0000,"rl":0}
     *
     * Output for cloud API:
     *   {
     *     "device_id": "rtu_level_control_01",
     *     "api_key": "...",
     *     "readings": [
     *       {"sensor_id":"adc_raw",           "value": 2048},
     *       {"sensor_id":"voltage",           "raw_value": 165, "value": 1.6500},
     *       {"sensor_id":"current_ma",        "raw_value": 1200, "value": 12.0000},
     *       {"sensor_id":"engineering_value",  "raw_value": 5000, "value": 50.0000},
     *       {"sensor_id":"relay_status",       "value": 0}
     *     ]
     *   }
     */

    JsonDocument doc;
    DeserializationError err = deserializeJson(doc, nucleoJson);

    if (err)
    {
        Serial.printf("[MAIN] JSON parse error: %s\n", err.c_str());
        return false;
    }

    const char *deviceId   = doc["d"]  | DEVICE_ID;
    uint16_t    adc        = doc["adc"] | 0;
    float       voltage    = doc["v"]   | 0.0f;
    float       current_ma = doc["ma"]  | 0.0f;
    float       level      = doc["lv"]  | 0.0f;
    uint8_t     relay      = doc["rl"]  | 0;

    /* Build the cloud-format JSON */
    int len = snprintf(outBuf, outSize,
        "{"
            "\"device_id\":\"%s\","
            "\"api_key\":\"%s\","
            "\"readings\":["
                "{\"sensor_id\":\"adc_raw\",\"value\":%u},"
                "{\"sensor_id\":\"voltage\",\"raw_value\":%u,\"value\":%.4f},"
                "{\"sensor_id\":\"current_ma\",\"raw_value\":%u,\"value\":%.4f},"
                "{\"sensor_id\":\"engineering_value\",\"raw_value\":%u,\"value\":%.4f},"
                "{\"sensor_id\":\"relay_status\",\"value\":%u}"
            "]"
        "}",
        deviceId,
        CLOUD_API_KEY,
        (unsigned)adc,
        (unsigned)(uint16_t)(voltage * 100.0f),    voltage,
        (unsigned)(uint16_t)(current_ma * 100.0f),  current_ma,
        (unsigned)(uint16_t)(level * 100.0f),       level,
        (unsigned)relay
    );

    return (len > 0 && len < (int)outSize);
}

/* ------------------------------------------------------------------ */
/*  Telemetry Callback                                                 */
/* ------------------------------------------------------------------ */
static void on_telemetry_received(const char* nucleoJson)
{
    Serial.printf("[RX] %s\n", nucleoJson);

    /* Build cloud API payload */
    char cloudBody[1024];

    if (build_cloud_body(nucleoJson, cloudBody, sizeof(cloudBody)))
    {
        /* POST to cloud */
        int httpCode = Cloud_PostTelemetry(cloudBody);

        if (httpCode >= 200 && httpCode < 300)
        {
            /* Success blink */
            digitalWrite(STATUS_LED_PIN, HIGH);
            delay(50);
            digitalWrite(STATUS_LED_PIN, LOW);
        }
    }
    else
    {
        Serial.println("[MAIN] Failed to build cloud body");
    }
}

/* ------------------------------------------------------------------ */
/*  Arduino setup()                                                    */
/* ------------------------------------------------------------------ */
void setup()
{
    /* USB Serial for debugging */
    Serial.begin(115200);
    delay(1000);

    Serial.println();
    Serial.println("===========================================");
    Serial.println("  ESP32 Cloud Gateway — RTU Level Control  ");
    Serial.println("===========================================");
    Serial.println();

    led_init();
    led_blink(3, 100, 100);  /* Boot indicator */

    /* Initialize UART interface (Nucleo ↔ ESP32) */
    Nucleo_Interface_Init();
    Nucleo_Interface_SetTelemetryCallback(on_telemetry_received);

    /* Initialize cloud connectivity (Wi-Fi → 4G fallback) */
    Cloud_Init();

    Serial.println("[MAIN] Initialized in standby. Waiting for NUCLEO commands...");
    led_blink(2, 50, 50);

    Serial.println("[MAIN] Waiting for telemetry from Nucleo...");
    Serial.println();
}

static uint32_t last_status_send = 0;

/* ------------------------------------------------------------------ */
/*  Arduino loop()                                                     */
/* ------------------------------------------------------------------ */
void loop()
{
    /* Process incoming NUCLEO packets */
    Nucleo_Interface_Process();

    /* Periodically send status back to NUCLEO */
    if (millis() - last_status_send > 5000) {
        last_status_send = millis();
        bool wifi_ok = WiFi_IsConnected();
        bool modem_ok = Modem_IsConnected();
        Nucleo_Interface_SendStatus(wifi_ok, modem_ok, true); // Cloud status is simplified for now
    }

    /* Small delay to avoid tight-looping */
    delay(10);
}
