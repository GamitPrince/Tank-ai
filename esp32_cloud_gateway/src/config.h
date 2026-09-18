/*
 * config.h
 *
 * Central configuration for the ESP32 Cloud Gateway.
 *
 * WARNING: This file contains placeholder credentials.
 * For production, move secrets to NVS or a secure config mechanism.
 */

#ifndef CONFIG_H
#define CONFIG_H

/* ------------------------------------------------------------------ */
/*  Device Identity                                                    */
/* ------------------------------------------------------------------ */
#define DEVICE_ID           "rtu_level_control_01"

/* ------------------------------------------------------------------ */
/*  Cloud Server                                                       */
/* ------------------------------------------------------------------ */
#define CLOUD_SERVER_HOST   "0.0.0.0"       /* TODO: Replace with actual server IP/hostname */
#define CLOUD_SERVER_PORT   8080
#define CLOUD_API_PATH      "/api/v1/ingest"

/* TODO: Move to NVS or secure storage for production */
#define CLOUD_API_KEY       "CHANGE_ME"

/* ------------------------------------------------------------------ */
/*  Wi-Fi Configuration                                                */
/* ------------------------------------------------------------------ */
#define WIFI_SSID           "CHANGE_ME"     /* TODO: Set your Wi-Fi SSID */
#define WIFI_PASSWORD       "CHANGE_ME"     /* TODO: Set your Wi-Fi password */
#define WIFI_CONNECT_TIMEOUT_MS  15000      /* 15 seconds to try Wi-Fi */

/* ------------------------------------------------------------------ */
/*  4G / Cellular Configuration                                        */
/* ------------------------------------------------------------------ */

/* APN settings — get these from your SIM card provider */
#define MODEM_APN           "internet"      /* TODO: Set your carrier APN */
#define MODEM_APN_USER      ""              /* Often blank */
#define MODEM_APN_PASS      ""              /* Often blank */

/* UART pins connecting the ESP32 to the onboard 4G modem.
 * These are board-specific — check your ESP32+4G board's schematic.
 * Common defaults for LilyGO T-SIM7600:
 *   MODEM_TX = 27, MODEM_RX = 26
 * Adjust if your board differs.                                      */
#define MODEM_UART_TX       27
#define MODEM_UART_RX       26
#define MODEM_UART_BAUD     115200

/* Modem power/reset pin (board-specific, set to -1 if not used) */
#define MODEM_PWRKEY_PIN    4
#define MODEM_RST_PIN       5
#define MODEM_POWER_ON_PIN  23

/* ------------------------------------------------------------------ */
/*  Nucleo UART Configuration                                          */
/* ------------------------------------------------------------------ */

/* UART pins receiving telemetry from the STM32 Nucleo.
 * Using ESP32 UART2 — GPIO16 (RX from Nucleo TX) and
 * GPIO17 (TX to Nucleo RX, currently unused for ACK).
 * IMPORTANT: Verify these pins are free on your board and
 * not used by the onboard 4G modem.                                  */
#define NUCLEO_UART_RX      16
#define NUCLEO_UART_TX      17
#define NUCLEO_UART_BAUD    115200

/* Maximum length of a single JSON line from the Nucleo */
#define NUCLEO_LINE_MAX     256

/* ------------------------------------------------------------------ */
/*  Timing                                                             */
/* ------------------------------------------------------------------ */

/* How long to wait for a line from Nucleo before declaring timeout */
#define NUCLEO_READ_TIMEOUT_MS   10000

/* HTTP POST timeout */
#define HTTP_POST_TIMEOUT_MS     10000

/* Retry backoff for failed cloud POSTs */
#define BACKOFF_INIT_MS          1000
#define BACKOFF_MAX_MS           30000

/* Status LED (onboard LED on most ESP32 dev boards) */
#define STATUS_LED_PIN           2

#endif /* CONFIG_H */
