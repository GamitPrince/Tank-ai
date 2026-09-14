/*
 * http_post_client.h
 *
 *  HTTP POST Client for sending sensor telemetry
 *  to a remote ingest API over LwIP raw TCP.
 */

#ifndef __HTTP_POST_CLIENT_H
#define __HTTP_POST_CLIENT_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Initialize the HTTP POST client (call once at startup) */
void HttpPost_Init(void);

/* Send a single telemetry payload to the remote ingest API.
 * This is non-blocking: it queues the data and the actual TCP
 * send happens asynchronously via LwIP callbacks.
 *
 * Parameters use the same values already computed in main.c:
 *   adc          - raw 12-bit ADC count  (0 – 4095)
 *   voltage      - sensor voltage in volts  (0.0 – 3.3)
 *   current      - loop current in mA       (4.0 – 20.0)
 *   level        - tank level percentage     (0.0 – 100.0)
 *   relay_status - relay output state        (0 or 1)
 */
void HttpPost_SendReadings(uint16_t adc,
                           float    voltage,
                           float    current,
                           float    level,
                           uint8_t  relay_status);

#ifdef __cplusplus
}
#endif

#endif /* __HTTP_POST_CLIENT_H */
