/*
 * nucleo_interface.h
 *
 *  ESP32 Interface to NUCLEO — handles NUCLEO <-> ESP32 UART communication
 *  using a binary framed packet protocol (STX, TYPE, LEN, SEQ, PAYLOAD, CRC16).
 */

#ifndef NUCLEO_INTERFACE_H
#define NUCLEO_INTERFACE_H

#include <Arduino.h>
#include <stdint.h>
#include <stdbool.h>

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

typedef void (*telemetry_callback_t)(const char* jsonPayload);

void Nucleo_Interface_Init();
void Nucleo_Interface_Process();
bool Nucleo_Interface_IsConnected();
void Nucleo_Interface_SetTelemetryCallback(telemetry_callback_t cb);
void Nucleo_Interface_SendStatus(bool wifi_ok, bool lte_ok, bool cloud_ok);

#endif // NUCLEO_INTERFACE_H
