/*
 * data_manager.c
 *
 *  Data Manager
 */

#include "data_manager.h"
#include "connectivity_manager.h"
#include "esp32_interface.h"
#include "buffer_manager.h"
#include "main.h"
#include <stdio.h>
#include <string.h>

#define DEVICE_ID "rtu_level_control_01"
#define TELEMETRY_INTERVAL_MS 5000

static uint32_t last_send_time = 0;
static uint32_t record_sequence = 0;

void DataManager_Init(void)
{
    last_send_time = 0;
    record_sequence = 0;
    BufferManager_Init();
    printf("Data Manager initialized\r\n");
}

void DataManager_Process(void)
{
    active_transport_t transport = ConnectivityManager_GetActiveTransport();
    if (transport != TRANSPORT_NONE && BufferManager_HasData())
    {
        char payload[256];
        if (BufferManager_Peek(payload, sizeof(payload)))
        {
            if (transport == TRANSPORT_WIFI || transport == TRANSPORT_LTE)
            {
                ESP32_Interface_SendTelemetry((const uint8_t*)payload, (uint8_t)strlen(payload));
                printf("DM: Sent Buffered Msg to ESP32\r\n");
                BufferManager_Dequeue();
            }
            else if (transport == TRANSPORT_ETHERNET)
            {
                printf("DM: Sent Buffered Msg via Ethernet (Stub)\r\n");
                BufferManager_Dequeue();
            }
        }
    }
}

void DataManager_RecordReadings(uint16_t adc, float voltage, float current, float level, uint8_t relay)
{
    uint32_t now = HAL_GetTick();
    
    if (now - last_send_time < TELEMETRY_INTERVAL_MS)
    {
        return;
    }
    last_send_time = now;
    record_sequence++;
    
    active_transport_t transport = ConnectivityManager_GetActiveTransport();
    
    
    char payload[256];
    int len = snprintf(payload, sizeof(payload),
        "{\"d\":\"%s\",\"seq\":%lu,\"adc\":%u,\"v\":%.4f,\"ma\":%.4f,\"lv\":%.4f,\"rl\":%u}",
        DEVICE_ID,
        record_sequence,
        (unsigned)adc,
        voltage,
        current,
        level,
        (unsigned)(relay ? 1 : 0)
    );

    if (len <= 0 || len >= (int)sizeof(payload)) return;

    if (transport == TRANSPORT_NONE)
    {
        if (BufferManager_Enqueue(payload)) {
            printf("DM: Transport down, buffered SEQ %lu\r\n", record_sequence);
        } else {
            printf("DM: Buffer full, dropped SEQ %lu\r\n", record_sequence);
        }
        return;
    }
    
    if (transport == TRANSPORT_WIFI || transport == TRANSPORT_LTE)
        {
            /* Send via ESP32 using the framed protocol */
            ESP32_Interface_SendTelemetry((const uint8_t*)payload, (uint8_t)len);
            printf("DM: Sent SEQ %lu to ESP32\r\n", record_sequence);
        }
        else if (transport == TRANSPORT_ETHERNET)
        {
            /* TODO: Send via HTTP POST client */
            printf("DM: Sent SEQ %lu via Ethernet (Stub)\r\n", record_sequence);
        }
}
