/*
 * nucleo_interface.cpp
 *
 *  ESP32 Interface to NUCLEO — handles NUCLEO <-> ESP32 UART communication
 */

#include "nucleo_interface.h"
#include "config.h"

#define STX_MARKER 0x02
#define UART_RX_BUF_SIZE 256

static HardwareSerial NucleoSerial(2);

static uint8_t  rx_buffer[UART_RX_BUF_SIZE];
static uint16_t rx_index = 0;
static uint16_t tx_seq = 0;
static uint32_t last_heartbeat_rx = 0;
static bool     is_connected = false;
static telemetry_callback_t telem_cb = NULL;

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

static void SendPacket(esp32_packet_type_t type, const uint8_t *payload, uint8_t len)
{
    uint8_t packet[256];
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
    
    NucleoSerial.write(packet, idx);
}

void Nucleo_Interface_Init()
{
    NucleoSerial.begin(NUCLEO_UART_BAUD, SERIAL_8N1, NUCLEO_UART_RX, NUCLEO_UART_TX);
    rx_index = 0;
    tx_seq = 0;
    is_connected = false;
    last_heartbeat_rx = millis();
    Serial.println("[NUCLEO_IF] Initialized");
}

void Nucleo_Interface_Process()
{
    while (NucleoSerial.available())
    {
        uint8_t byte = NucleoSerial.read();
        
        if (rx_index == 0 && byte != STX_MARKER)
        {
            continue; /* Wait for STX */
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
                        last_heartbeat_rx = millis();
                        is_connected = true;
                        if (type == ESP32_PKT_HEARTBEAT)
                        {
                            SendPacket(ESP32_PKT_HEARTBEAT_ACK, NULL, 0);
                        }
                    }
                    else if (type == ESP32_PKT_TELEMETRY)
                    {
                        /* Telemetry received */
                        Serial.println("[NUCLEO_IF] Telemetry received");
                        SendPacket(ESP32_PKT_ACK, NULL, 0);
                        
                        /* null terminate payload for JSON parsing */
                        uint8_t payload_len = len;
                        if (payload_len < UART_RX_BUF_SIZE) {
                            rx_buffer[3 + payload_len] = '\0';
                            if (telem_cb != NULL) {
                                telem_cb((const char*)&rx_buffer[3]);
                            }
                        }
                    }
                }
                rx_index = 0; /* Reset for next packet */
            }
        }
    }
    
    if (is_connected && (millis() - last_heartbeat_rx > 15000))
    {
        is_connected = false;
        Serial.println("[NUCLEO_IF] Connection lost");
    }
}

bool Nucleo_Interface_IsConnected()
{
    return is_connected;
}

void Nucleo_Interface_SetTelemetryCallback(telemetry_callback_t cb)
{
    telem_cb = cb;
}

void Nucleo_Interface_SendStatus(bool wifi_ok, bool lte_ok, bool cloud_ok)
{
    char payload[64];
    int len = snprintf(payload, sizeof(payload),
                       "{\"wifi\":%s,\"lte\":%s,\"cloud\":%s}",
                       wifi_ok ? "true" : "false",
                       lte_ok ? "true" : "false",
                       cloud_ok ? "true" : "false");
    
    if (len > 0)
    {
        SendPacket(ESP32_PKT_STATUS, (const uint8_t*)payload, (uint8_t)len);
    }
}
