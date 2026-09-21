/*
 * connectivity_manager.c
 *
 *  Connectivity Manager
 */

#include "connectivity_manager.h"
#include "esp32_interface.h"
#include "main.h" /* For HAL_GetTick */
#include <stdio.h>

static active_transport_t current_transport = TRANSPORT_NONE;
static uint32_t last_check_time = 0;
static bool cloud_reachable = false;

/* Simulated Ethernet link status for this skeleton */
static bool Ethernet_IsLinkUp(void)
{
    /* TODO: Query actual PHY/LwIP state */
    return false;
}

void ConnectivityManager_Init(void)
{
    current_transport = TRANSPORT_NONE;
    last_check_time = 0;
    cloud_reachable = false;
    printf("Connectivity Manager initialized\r\n");
}

void ConnectivityManager_Process(void)
{
    uint32_t now = HAL_GetTick();
    
    /* Evaluate health periodically (e.g. every 2 seconds) */
    if (now - last_check_time > 2000)
    {
        last_check_time = now;
        
        bool eth_up = Ethernet_IsLinkUp();
        bool wifi_up = ESP32_Interface_IsWiFiHealthy();
        bool lte_up = ESP32_Interface_IsLTEHealthy();
        
        /* State Machine for Failover */
        if (eth_up)
        {
            if (current_transport != TRANSPORT_ETHERNET)
            {
                printf("CM: Switching to ETHERNET\r\n");
                current_transport = TRANSPORT_ETHERNET;
            }
            cloud_reachable = true; /* Simplified assumption for now */
        }
        else if (wifi_up)
        {
            if (current_transport != TRANSPORT_WIFI)
            {
                printf("CM: Switching to ESP32 (WIFI)\r\n");
                current_transport = TRANSPORT_WIFI;
            }
            cloud_reachable = true;
        }
        else if (lte_up)
        {
            if (current_transport != TRANSPORT_LTE)
            {
                printf("CM: Switching to ESP32 (LTE)\r\n");
                current_transport = TRANSPORT_LTE;
            }
            cloud_reachable = true;
        }
        else
        {
            if (current_transport != TRANSPORT_NONE)
            {
                printf("CM: All transports down\r\n");
                current_transport = TRANSPORT_NONE;
            }
            cloud_reachable = false;
        }
    }
}

active_transport_t ConnectivityManager_GetActiveTransport(void)
{
    return current_transport;
}

bool ConnectivityManager_IsCloudReachable(void)
{
    return cloud_reachable;
}
