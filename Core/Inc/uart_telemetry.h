/*
 * uart_telemetry.h
 *
 *  UART Telemetry — sends sensor readings as JSON lines over UART4
 *  to the ESP32 cloud gateway.
 */

#ifndef __UART_TELEMETRY_H
#define __UART_TELEMETRY_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Configurable cloud telemetry send interval (milliseconds).
 * Default 5000 ms (5 seconds) to conserve cellular data.
 * Change this to 1000 for 1-second updates if on Wi-Fi. */
#ifndef CLOUD_SEND_INTERVAL_MS
#define CLOUD_SEND_INTERVAL_MS   5000
#endif

/* Initialize the UART telemetry module (call once at startup) */
void UART_Telemetry_Init(void);

/* Send telemetry to ESP32 if the send interval has elapsed.
 * Call this every iteration of the main loop — it will only
 * actually transmit when CLOUD_SEND_INTERVAL_MS has passed.
 *
 * Parameters (same values computed in main.c):
 *   adc   - raw 12-bit ADC count  (0 – 4095)
 *   voltage - sensor voltage in volts  (0.0 – 3.3)
 *   current - loop current in mA       (4.0 – 20.0)
 *   level   - tank level percentage    (0.0 – 100.0)
 *   relay   - relay output state       (GPIO_PIN_SET / GPIO_PIN_RESET)
 */
void UART_Telemetry_SendIfDue(uint16_t adc,
                               float    voltage,
                               float    current,
                               float    level,
                               uint8_t  relay);

#ifdef __cplusplus
}
#endif

#endif /* __UART_TELEMETRY_H */
