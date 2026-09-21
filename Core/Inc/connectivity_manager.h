/*
 * connectivity_manager.h
 *
 *  Connectivity Manager — evaluates network health and decides which transport
 *  (Ethernet, Wi-Fi, LTE) to use for telemetry and cloud communication.
 */

#ifndef __CONNECTIVITY_MANAGER_H
#define __CONNECTIVITY_MANAGER_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
    TRANSPORT_NONE     = 0,
    TRANSPORT_ETHERNET = 1,
    TRANSPORT_WIFI     = 2,
    TRANSPORT_LTE      = 3
} active_transport_t;

/* Initialize the connectivity manager */
void ConnectivityManager_Init(void);

/* Process connectivity state machine (call periodically in main loop) */
void ConnectivityManager_Process(void);

/* Get the currently active transport */
active_transport_t ConnectivityManager_GetActiveTransport(void);

/* Check if cloud is currently reachable */
bool ConnectivityManager_IsCloudReachable(void);

#ifdef __cplusplus
}
#endif

#endif /* __CONNECTIVITY_MANAGER_H */
