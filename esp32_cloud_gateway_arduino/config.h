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

/* UART pins connecting the ESP32-S3 to the onboard A7672S 4G modem.
 * Values from KTRON Manual Page 6. */
#define MODEM_UART_TX       18
#define MODEM_UART_RX       17
#define MODEM_UART_BAUD     115200

/* Modem power/reset pin (from KTRON manual) */
#define MODEM_PWRKEY_PIN    -1  /* Not specified, likely auto-powered */
#define MODEM_RST_PIN       13  /* GPIO13 is 4G_RST */
#define MODEM_POWER_ON_PIN  -1

/* ------------------------------------------------------------------ */
/*  Nucleo UART Configuration                                          */
/* ------------------------------------------------------------------ */

/* UART pins receiving telemetry from the STM32 Nucleo.
 * Using ESP32-S3 UART1 — GPIO4 (RX) and GPIO5 (TX).
 * We changed these because 16 and 17 are used by the 4G modem! */
#define NUCLEO_UART_RX      4
#define NUCLEO_UART_TX      5
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

/* Status LEDs (from KTRON Manual Page 6) */
#define STATUS_LED_PIN           14  /* System LED */
#define WIFI_LED_PIN             11
#define LTE_LED_PIN              12

#endif /* CONFIG_H */
