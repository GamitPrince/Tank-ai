/*
 * main.cpp
 *
 * TEMPORARY ESP32-ONLY IMPLEMENTATION
 * ====================================
 * Nucleo-F767ZI is currently unavailable.
 * This code replaces the Nucleo functionality temporarily.
 * Revert to the original Nucleo + ESP32 architecture when
 * the replacement Nucleo board becomes available.
 *
 * This file is the unified entry point that combines:
 *   1. Nucleo responsibilities (sensor acquisition, relay control,
 *      data formatting, telemetry dispatch)
 *   2. ESP32 responsibilities (WiFi/4G connectivity, cloud HTTP POST)
 *
 * Data flow (TEMPORARY):
 *   Sensors (4–20 mA, conditioned to 0–3.3V)
 *          ↓
 *   ESP32 ADC acquisition
 *          ↓
 *   Processing (voltage → current → level)
 *          ↓
 *   Relay control (level ≥ 80% → ON)
 *          ↓
 *   Build cloud JSON (same format as production)
 *          ↓
 *   HTTP POST via WiFi or 4G LTE
 *          ↓
 *   Cloud Server → TimescaleDB
 *
 * Original data flow (PRODUCTION):
 *   Sensors → Nucleo (ADC + processing) → UART → ESP32 → Cloud
 */

#include <Arduino.h>
#include <ArduinoJson.h>

#include "config.h"
#include "sensor_acquisition.h"
#include "relay_control.h"
#include "cloud_client.h"
#include "wifi_manager.h"
#include "buffer_manager.h"

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
/*  Telemetry State                                                    */
/* ------------------------------------------------------------------ */
static uint32_t last_telemetry_time = 0;
static uint32_t record_sequence     = 0;
static uint32_t last_transport_eval = 0;

/* ------------------------------------------------------------------ */
/*  Build Cloud Ingest JSON                                            */
/* ------------------------------------------------------------------ */
/*
 * Produces the EXACT same JSON body that the original ESP32 cloud
 * gateway (esp32_cloud_gateway/src/main.cpp, build_cloud_body())
 * creates.  This ensures the cloud server and database see no
 * difference between the production and temporary systems.
 *
 * Format:
 *   {
 *     "device_id": "rtu_level_control_01",
 *     "api_key": "...",
 *     "readings": [
 *       {"sensor_id":"adc_raw",          "value": 2048},
 *       {"sensor_id":"voltage",          "raw_value": 165,  "value": 1.65},
 *       {"sensor_id":"current_ma",       "raw_value": 1200, "value": 12.0},
 *       {"sensor_id":"engineering_value", "raw_value": 5000, "value": 50.0},
 *       {"sensor_id":"relay_status",      "value": 0}
 *     ]
 *   }
 */
static bool build_cloud_body(const sensor_reading_t *reading, uint8_t relay,
                              char *outBuf, size_t outSize)
{
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
        DEVICE_ID,
        CLOUD_API_KEY,
        (unsigned)reading->adc_raw,
        (unsigned)(uint16_t)(reading->voltage * 100.0f),    reading->voltage,
        (unsigned)(uint16_t)(reading->current_ma * 100.0f),  reading->current_ma,
        (unsigned)(uint16_t)(reading->level_pct * 100.0f),   reading->level_pct,
        (unsigned)relay
    );

    return (len > 0 && len < (int)outSize);
}

/* ------------------------------------------------------------------ */
/*  Drain Buffered Messages                                            */
/* ------------------------------------------------------------------ */
static void drain_buffer()
{
    if (!BufferManager_HasData())
    {
        return;
    }

    transport_t transport = Cloud_GetTransport();
    if (transport == TRANSPORT_NONE)
    {
        return;
    }

    char payload[1024];
    while (BufferManager_HasData())
    {
        if (BufferManager_Peek(payload, sizeof(payload)))
        {
            int httpCode = Cloud_PostTelemetry(payload);
            if (httpCode >= 200 && httpCode < 300)
            {
                BufferManager_Dequeue();
                Serial.printf("%s Sent buffered message (%u remaining)\n",
                              LOG_PREFIX_BUFFER, BufferManager_Count());
            }
            else
            {
                /* Failed to send — stop draining, try again later */
                break;
            }
        }
        else
        {
            break;
        }
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
    Serial.println("=====================================================");
    Serial.println("  [TEMP] ESP32-ONLY MODE — RTU Level Control");
    Serial.println("  [TEMP] Nucleo-F767ZI unavailable");
    Serial.println("  [TEMP] ESP32 performing all Nucleo functions");
    Serial.println("=====================================================");
    Serial.println();
    Serial.printf("%s Device ID   : %s\n", LOG_PREFIX_TEMP, DEVICE_ID);
    Serial.printf("%s Device Type : %s\n", LOG_PREFIX_TEMP, DEVICE_TYPE);
    Serial.printf("%s Telemetry   : every %d ms\n", LOG_PREFIX_TEMP, TELEMETRY_INTERVAL_MS);
    Serial.printf("%s Relay       : threshold %.1f%%\n", LOG_PREFIX_TEMP, RELAY_LEVEL_THRESHOLD);
    Serial.println();

    led_init();
    led_blink(5, 50, 50);  /* 5 fast blinks = temporary mode indicator */

    /* Initialize sensor acquisition (replaces Nucleo ADC) */
    SensorAcq_Init();

    /* Initialize relay control (replaces Nucleo PE0 output) */
    RelayControl_Init();

    /* Initialize buffer for offline storage */
    BufferManager_Init();

    /* Connect to WiFi */
    Serial.println();
    if (WiFi_Connect())
    {
        Serial.printf("%s WiFi connected successfully\n", LOG_PREFIX_TEMP);
    }
    else
    {
        Serial.printf("%s WiFi connection failed, will use 4G fallback\n", LOG_PREFIX_TEMP);
    }

    /* Initialize cloud connectivity (modem hardware) */
    Cloud_Init();

    Serial.println();
    Serial.printf("%s Initialization complete. Starting main loop.\n", LOG_PREFIX_TEMP);
    Serial.println();

    led_blink(2, 100, 100);
}

/* ------------------------------------------------------------------ */
/*  Arduino loop()                                                     */
/* ------------------------------------------------------------------ */
void loop()
{
    /* ---- 1. Read Sensors (replaces Nucleo main loop) ---- */
    sensor_reading_t reading = SensorAcq_Read();

    /* ---- 2. Control Relay (replaces Nucleo Control_Relay) ---- */
    uint8_t relay_state = 0;
    if (reading.valid)
    {
        relay_state = RelayControl_Update(reading.level_pct);
    }
    else
    {
        /* Safety: don't activate relay on invalid readings */
        relay_state = RelayControl_GetState();
    }

    /* ---- 3. WiFi auto-reconnect ---- */
    WiFi_ReconnectIfNeeded();

    /* ---- 4. Evaluate transport periodically (every 2s, like Nucleo ConnectivityManager) ---- */
    if (millis() - last_transport_eval > 2000)
    {
        last_transport_eval = millis();
        Cloud_EvaluateTransport();
    }

    /* ---- 5. Send Telemetry (replaces Nucleo DataManager_RecordReadings) ---- */
    if (millis() - last_telemetry_time >= TELEMETRY_INTERVAL_MS)
    {
        last_telemetry_time = millis();
        record_sequence++;

        /* Log sensor values (never log credentials) */
        Serial.printf("%s ADC=%u V=%.4f mA=%.4f Level=%.2f%% Relay=%s Valid=%s (SEQ %lu)\n",
                      LOG_PREFIX_SENSOR,
                      (unsigned)reading.adc_raw,
                      reading.voltage,
                      reading.current_ma,
                      reading.level_pct,
                      relay_state ? "ON" : "OFF",
                      reading.valid ? "YES" : "NO",
                      record_sequence);

        /* Build cloud JSON body */
        char cloudBody[1024];

        if (build_cloud_body(&reading, relay_state, cloudBody, sizeof(cloudBody)))
        {
            transport_t transport = Cloud_GetTransport();

            if (transport != TRANSPORT_NONE)
            {
                int httpCode = Cloud_PostTelemetry(cloudBody);

                if (httpCode >= 200 && httpCode < 300)
                {
                    /* Success blink */
                    digitalWrite(STATUS_LED_PIN, HIGH);
                    delay(50);
                    digitalWrite(STATUS_LED_PIN, LOW);

                    /* Try to drain any buffered messages */
                    drain_buffer();
                }
                else
                {
                    /* POST failed — buffer the message */
                    if (BufferManager_Enqueue(cloudBody))
                    {
                        Serial.printf("%s POST failed, buffered SEQ %lu (%u buffered)\n",
                                      LOG_PREFIX_BUFFER, record_sequence, BufferManager_Count());
                    }
                    else
                    {
                        Serial.printf("%s POST failed, buffer FULL, dropped SEQ %lu\n",
                                      LOG_PREFIX_BUFFER, record_sequence);
                    }
                }
            }
            else
            {
                /* No connectivity — buffer */
                if (BufferManager_Enqueue(cloudBody))
                {
                    Serial.printf("%s No transport, buffered SEQ %lu (%u buffered)\n",
                                  LOG_PREFIX_BUFFER, record_sequence, BufferManager_Count());
                }
                else
                {
                    Serial.printf("%s No transport, buffer FULL, dropped SEQ %lu\n",
                                  LOG_PREFIX_BUFFER, record_sequence);
                }
            }
        }
        else
        {
            Serial.printf("%s Failed to build cloud JSON body\n", LOG_PREFIX_TEMP);
        }
    }

    /* ---- 6. Main loop delay (matches Nucleo's ~10 Hz rate) ---- */
    delay(MAIN_LOOP_DELAY_MS);
}
