/*
 * uart_telemetry.c
 *
 *  UART Telemetry — formats sensor data as compact JSON and sends
 *  it over UART4 to the ESP32 cloud gateway.
 *
 *  JSON format (newline-delimited):
 *    {"d":"rtu_level_control_01","adc":2048,"v":1.6500,"ma":12.0000,"lv":50.0000,"rl":0}\n
 *
 *  The ESP32 reads lines, parses the JSON, and forwards via
 *  Wi-Fi or 4G LTE to the cloud ingest API.
 */

#include "uart_telemetry.h"
#include "main.h"
#include "usart.h"

#include <stdio.h>
#include <string.h>

/* ------------------------------------------------------------------ */
/*  Configuration                                                      */
/* ------------------------------------------------------------------ */

/* Device identifier — must match cloud database expectations.
 * TODO: make this configurable via NVM or Modbus register.       */
#define DEVICE_ID   "rtu_level_control_01"

/* Maximum size of a single JSON telemetry line.
 * Our payload is ~100 bytes; 256 gives comfortable headroom.     */
#define TX_BUF_SIZE  256

/* UART transmit timeout in milliseconds */
#define UART_TX_TIMEOUT_MS  100

/* ------------------------------------------------------------------ */
/*  Module state                                                       */
/* ------------------------------------------------------------------ */

static uint32_t last_send_tick = 0;
static char     tx_buf[TX_BUF_SIZE];

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

void UART_Telemetry_Init(void)
{
    last_send_tick = 0;

    printf("UART Telemetry initialized\r\n");
    printf("  UART     : UART4 (PA0 TX, PC11 RX)\r\n");
    printf("  Baud     : 115200\r\n");
    printf("  Interval : %u ms\r\n", CLOUD_SEND_INTERVAL_MS);
    printf("  Device   : %s\r\n", DEVICE_ID);
}

void UART_Telemetry_SendIfDue(uint16_t adc,
                               float    voltage,
                               float    current,
                               float    level,
                               uint8_t  relay)
{
    uint32_t now = HAL_GetTick();

    /* Throttle: only send once per CLOUD_SEND_INTERVAL_MS */
    if ((now - last_send_tick) < CLOUD_SEND_INTERVAL_MS)
    {
        return;
    }

    last_send_tick = now;

    /* Format compact JSON line */
    int len = snprintf(tx_buf, sizeof(tx_buf),
        "{\"d\":\"%s\","
         "\"adc\":%u,"
         "\"v\":%.4f,"
         "\"ma\":%.4f,"
         "\"lv\":%.4f,"
         "\"rl\":%u}\n",
        DEVICE_ID,
        (unsigned)adc,
        voltage,
        current,
        level,
        (unsigned)(relay ? 1 : 0)
    );

    if (len <= 0 || len >= (int)sizeof(tx_buf))
    {
        printf("UART_Telem: snprintf error or truncation\r\n");
        return;
    }

    /* Transmit over UART4 to ESP32 */
    HAL_StatusTypeDef status = HAL_UART_Transmit(
        &huart4,
        (uint8_t *)tx_buf,
        (uint16_t)len,
        UART_TX_TIMEOUT_MS
    );

    if (status != HAL_OK)
    {
        printf("UART_Telem: TX failed (%d)\r\n", status);
    }
}
