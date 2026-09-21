/*
 * config.h
 *
 * TEMPORARY ESP32-ONLY IMPLEMENTATION
 * ====================================
 * Nucleo-F767ZI is currently unavailable.
 * This code replaces the Nucleo functionality temporarily.
 * Revert to the original Nucleo + ESP32 architecture when
 * the replacement Nucleo board becomes available.
 *
 * Central configuration for the temporary ESP32-only firmware.
 *
 * WARNING: This file contains placeholder credentials.
 * For production, move secrets to NVS or a secure config mechanism.
 */

#ifndef TEMP_CONFIG_H
#define TEMP_CONFIG_H

/* ------------------------------------------------------------------ */
/*  Temporary Mode Flag                                                */
/* ------------------------------------------------------------------ */
#define TEMPORARY_MODE true
#define DEVICE_TYPE "ESP32_ONLY"
#define NUCLEO_AVAILABLE false

/* ------------------------------------------------------------------ */
/*  Device Identity                                                    */
/* ------------------------------------------------------------------ */
/* MUST match the production device_id so the cloud server and database
 * see this device as the same RTU.  */
#define DEVICE_ID "rtu_level_control_01"

/* ------------------------------------------------------------------ */
/*  Sensor / ADC Configuration                                         */
/* ------------------------------------------------------------------ */

/*
 * ASSUMPTION: GPIO1 (ADC1_CH0) is used for the analog sensor input.
 * This pin must be confirmed against the actual KTRON board pinout.
 *
 * The 4–20 mA sensor signal MUST be conditioned before reaching the
 * ESP32 ADC.  See documentation/hardware_wiring.md for details.
 *
 * Signal chain:
 *   4–20 mA → 250Ω resistor → 1.0–5.0V → voltage divider → 0–3.3V → ESP32 ADC
 *
 * The conversion equations below match the Nucleo's original math
 * (Core/Src/main.c lines 238–251) and assume a 0–3.3V input after
 * signal conditioning.
 */
#define SENSOR_ADC_PIN 1                 /* GPIO1 / ADC1_CH0 */
#define SENSOR_ADC_ATTEN ADC_ATTEN_DB_12 /* 0–3.3V range (ESP32-S3) */
#define SENSOR_ADC_RESOLUTION 12         /* 12-bit ADC (0–4095) */
#define SENSOR_ADC_VREF 3.3f             /* Reference voltage */
#define SENSOR_ADC_MAX_COUNTS 4095.0f    /* 2^12 - 1 */

/*
 * Multi-sample averaging to reduce ESP32 ADC noise.
 * The Nucleo ADC is significantly less noisy, so we average multiple
 * samples on the ESP32 to get comparable stability.
 */
#define SENSOR_ADC_SAMPLES 16

/*
 * Conversion constants (identical to Nucleo Core/Src/main.c):
 *   voltage  = (adc_raw * 3.3) / 4095
 *   current  = 4.0 + (voltage * 16.0 / 3.3)   [mA]
 *   level    = ((current - 4.0) * 100.0) / 16.0 [%]
 */
#define CURRENT_MIN_MA 4.0f
#define CURRENT_RANGE_MA 16.0f /* 20 - 4 */
#define LEVEL_MAX_PERCENT 100.0f

/* Validity bounds — reject clearly out-of-range readings */
#define SENSOR_CURRENT_MIN_MA 3.5f  /* Below 4 mA = wire fault */
#define SENSOR_CURRENT_MAX_MA 21.0f /* Above 20 mA = sensor fault */

/* ------------------------------------------------------------------ */
/*  Relay Configuration                                                */
/* ------------------------------------------------------------------ */

/*
 * ASSUMPTION: GPIO2 is used for the relay output.
 * This pin must be confirmed against the actual KTRON board pinout.
 *
 * WARNING: The ESP32 GPIO is 3.3V logic. If the relay module requires
 * 5V logic, a MOSFET driver or level shifter is needed.
 * See documentation/hardware_wiring.md for details.
 */
#define RELAY_OUTPUT_PIN 2 /* GPIO2 */
#define RELAY_LEVEL_THRESHOLD                                                  \
  80.0f /* Level % to activate relay (same as Nucleo) */

/* ------------------------------------------------------------------ */
/*  Cloud Server                                                       */
/* ------------------------------------------------------------------ */
#define CLOUD_SERVER_HOST "192.168.2.191" /* Laptop IP address on local WiFi   \
                                           */
#define CLOUD_SERVER_PORT 8080
#define CLOUD_API_PATH "/api/v1/ingest"

/* TODO: Move to NVS or secure storage for production */
#define CLOUD_API_KEY "my_api_key_123"

/* ------------------------------------------------------------------ */
/*  Wi-Fi Configuration                                                */
/* ------------------------------------------------------------------ */
#define WIFI_SSID "vivo V23e 5G"         /* TODO: Set your Wi-Fi SSID */
#define WIFI_PASSWORD "asdfghjkl2056"    /* TODO: Set your Wi-Fi password */
#define WIFI_CONNECT_TIMEOUT_MS 15000    /* 15 seconds to try Wi-Fi */
#define WIFI_RECONNECT_INTERVAL_MS 30000 /* Try reconnect every 30 s */

/* ------------------------------------------------------------------ */
/*  4G / Cellular Configuration                                        */
/* ------------------------------------------------------------------ */

/* APN settings — get these from your SIM card provider */
#define MODEM_APN "internet" /* TODO: Set your carrier APN */
#define MODEM_APN_USER ""    /* Often blank */
#define MODEM_APN_PASS ""    /* Often blank */

/* UART pins connecting the ESP32-S3 to the onboard A7672S 4G modem.
 * Values from KTRON Manual Page 6. */
#define MODEM_UART_TX 18
#define MODEM_UART_RX 17
#define MODEM_UART_BAUD 115200

/* Modem power/reset pin (from KTRON manual) */
#define MODEM_PWRKEY_PIN -1 /* Not specified, likely auto-powered */
#define MODEM_RST_PIN 13    /* GPIO13 is 4G_RST */
#define MODEM_POWER_ON_PIN -1

/* ------------------------------------------------------------------ */
/*  Timing                                                             */
/* ------------------------------------------------------------------ */

/* Main loop sensor read interval (matches Nucleo's ~10 Hz) */
#define MAIN_LOOP_DELAY_MS 100

/* Telemetry send interval (matches Nucleo data_manager.c TELEMETRY_INTERVAL_MS)
 */
#define TELEMETRY_INTERVAL_MS 5000

/* HTTP POST timeout */
#define HTTP_POST_TIMEOUT_MS 10000

/* Retry backoff for failed cloud POSTs */
#define BACKOFF_INIT_MS 1000
#define BACKOFF_MAX_MS 30000

/* ------------------------------------------------------------------ */
/*  Status LEDs (from KTRON Manual Page 6)                             */
/* ------------------------------------------------------------------ */
#define STATUS_LED_PIN 14 /* System LED */
#define WIFI_LED_PIN 11
#define LTE_LED_PIN 12

/* ------------------------------------------------------------------ */
/*  Serial Logging Prefix                                              */
/* ------------------------------------------------------------------ */
#define LOG_PREFIX_TEMP "[TEMP]"
#define LOG_PREFIX_SENSOR "[SENSOR]"
#define LOG_PREFIX_RELAY "[RELAY]"
#define LOG_PREFIX_CLOUD "[CLOUD]"
#define LOG_PREFIX_WIFI "[WiFi]"
#define LOG_PREFIX_MODEM "[MODEM]"
#define LOG_PREFIX_BUFFER "[BUFFER]"

#endif /* TEMP_CONFIG_H */
