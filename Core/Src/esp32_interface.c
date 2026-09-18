/*
 * esp32_interface.c
 *
 *  ESP32 Interface — handles NUCLEO <-> ESP32 UART communication
 */

#include "esp32_interface.h"
#include "usart.h"
#include <string.h>
#include <stdio.h>

#define STX_MARKER 0x02
#define UART_RX_BUF_SIZE 256
#define UART_TX_TIMEOUT_MS 100

static uint8_t  rx_buffer[UART_RX_BUF_SIZE];
static uint16_t rx_index = 0;
static uint16_t tx_seq = 0;
static uint32_t last_heartbeat_rx = 0;
static bool     is_connected = false;

static bool     wifi_healthy = false;
static bool     lte_healthy = false;

/* Simple CRC16 (Modbus polynomial 0xA001) */
static uint16_t CalculateCRC16(const uint8_t *data, uint16_t length)
{
    uint16_t crc = 0xFFFF;
    for (uint16_t i = 0; i < length; i++)
    {
        crc ^= data[i];
        for (int j = 0; j < 8; j++)
        {
            if (crc & 0x0001)
            {
                crc = (crc >> 1) ^ 0xA001;
            }
            else
            {
                crc >>= 1;
            }
        }
    }
    return crc;
}

static bool SendPacket(esp32_packet_type_t type, const uint8_t *payload, uint8_t len)
{
    uint8_t packet[ESP32_MAX_PAYLOAD_LEN + 8];
    uint16_t idx = 0;
    
    packet[idx++] = STX_MARKER;
    packet[idx++] = (uint8_t)type;
    packet[idx++] = len;
    packet[idx++] = (uint8_t)(tx_seq & 0xFF);
    packet[idx++] = (uint8_t)((tx_seq >> 8) & 0xFF);
    
    if (len > 0 && payload != NULL)
    {
        memcpy(&packet[idx], payload, len);
        idx += len;
    }
    
    uint16_t crc = CalculateCRC16(packet, idx);
    packet[idx++] = (uint8_t)(crc & 0xFF);
    packet[idx++] = (uint8_t)((crc >> 8) & 0xFF);
    
    tx_seq++;
    
    /* Transmit over UART4 */
    if (HAL_UART_Transmit(&huart4, packet, idx, UART_TX_TIMEOUT_MS) != HAL_OK)
    {
        return false;
    }
    return true;
}

void ESP32_Interface_Init(void)
{
    rx_index = 0;
    tx_seq = 0;
    is_connected = false;
    last_heartbeat_rx = HAL_GetTick();
    printf("ESP32 Interface initialized\r\n");
}

void ESP32_Interface_Process(void)
{
    uint8_t byte;
    /* Basic polling for now. Should be interrupt-based in production. */
    if (HAL_UART_Receive(&huart4, &byte, 1, 0) == HAL_OK)
    {
        /* Very basic packet assembly logic.
           Real implementation requires state machine for STX, TYPE, LEN, etc. */
        if (rx_index == 0 && byte != STX_MARKER)
        {
            return; /* Wait for STX */
        }
        
        if (rx_index < UART_RX_BUF_SIZE)
        {
            rx_buffer[rx_index++] = byte;
        }
        else
        {
            rx_index = 0; /* Overflow */
        }
        
        /* Check if we have at least header + crc */
        if (rx_index >= 7)
        {
            uint8_t len = rx_buffer[2];
            if (rx_index == (7 + len)) /* Full packet received */
            {
                uint16_t received_crc = rx_buffer[rx_index - 2] | (rx_buffer[rx_index - 1] << 8);
                uint16_t calc_crc = CalculateCRC16(rx_buffer, rx_index - 2);
                
                if (received_crc == calc_crc)
                {
                    esp32_packet_type_t type = (esp32_packet_type_t)rx_buffer[1];
                    /* Handle packet */
                    if (type == ESP32_PKT_HEARTBEAT_ACK || type == ESP32_PKT_HEARTBEAT)
                    {
                        last_heartbeat_rx = HAL_GetTick();
                        is_connected = true;
                        if (type == ESP32_PKT_HEARTBEAT)
                        {
                            SendPacket(ESP32_PKT_HEARTBEAT_ACK, NULL, 0);
                        }
                    }
                    else if (type == ESP32_PKT_STATUS)
                    {
                        /* Basic substring parsing for demo */
                        rx_buffer[rx_index - 2] = '\0'; /* null terminate payload */
                        char* payload = (char*)&rx_buffer[5];
                        if (strstr(payload, "\"wifi\":true")) wifi_healthy = true;
                        else if (strstr(payload, "\"wifi\":false")) wifi_healthy = false;
                        
                        if (strstr(payload, "\"lte\":true")) lte_healthy = true;
                        else if (strstr(payload, "\"lte\":false")) lte_healthy = false;
                    }
                    else if (type == ESP32_PKT_ACK)
                    {
                        /* Telemetry ACK received */
                    }
                }
                rx_index = 0; /* Reset for next packet */
            }
        }
    }
    
    /* Connection timeout check */
    if (is_connected && (HAL_GetTick() - last_heartbeat_rx > 15000))
    {
        is_connected = false;
        printf("ESP32 connection lost\r\n");
    }
}

bool ESP32_Interface_SendHeartbeat(void)
{
    return SendPacket(ESP32_PKT_HEARTBEAT, NULL, 0);
}

bool ESP32_Interface_SendTelemetry(const uint8_t *payload, uint8_t len)
{
    return SendPacket(ESP32_PKT_TELEMETRY, payload, len);
}

bool ESP32_Interface_IsConnected(void)
{
    return is_connected;
}

bool ESP32_Interface_IsWiFiHealthy(void)
{
    return is_connected && wifi_healthy;
}

bool ESP32_Interface_IsLTEHealthy(void)
{
    return is_connected && lte_healthy;
}
