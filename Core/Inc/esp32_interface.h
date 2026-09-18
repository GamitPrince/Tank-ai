/*
 * esp32_interface.h
 *
 *  ESP32 Interface — handles NUCLEO <-> ESP32 UART communication
 *  using a binary framed packet protocol (STX, TYPE, LEN, SEQ, PAYLOAD, CRC16).
 */

#ifndef __ESP32_INTERFACE_H
#define __ESP32_INTERFACE_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Protocol Packet Types */
typedef enum {
    ESP32_PKT_TELEMETRY   = 0x01,
    ESP32_PKT_ACK         = 0x02,
    ESP32_PKT_NACK        = 0x03,
    ESP32_PKT_HEARTBEAT   = 0x04,
    ESP32_PKT_HEARTBEAT_ACK = 0x05,
    ESP32_PKT_STATUS      = 0x06,
    ESP32_PKT_COMMAND     = 0x07,
    ESP32_PKT_CONFIG      = 0x08,
    ESP32_PKT_TIME_SYNC   = 0x09,
    ESP32_PKT_ERROR       = 0x0A
} esp32_packet_type_t;

/* Maximum payload size */
#define ESP32_MAX_PAYLOAD_LEN 256

/* Initialize the ESP32 interface */
void ESP32_Interface_Init(void);

/* Process incoming UART data and handle state machine */
void ESP32_Interface_Process(void);

/* Send a Heartbeat to the ESP32 */
bool ESP32_Interface_SendHeartbeat(void);

/* Send Telemetry payload to the ESP32 */
bool ESP32_Interface_SendTelemetry(const uint8_t *payload, uint8_t len);

/* Retrieve the status of the ESP32 connection */
bool ESP32_Interface_IsConnected(void);

/* Retrieve the latest reported Wi-Fi and LTE health from ESP32 */
bool ESP32_Interface_IsWiFiHealthy(void);
bool ESP32_Interface_IsLTEHealthy(void);

#ifdef __cplusplus
}
#endif

#endif /* __ESP32_INTERFACE_H */
