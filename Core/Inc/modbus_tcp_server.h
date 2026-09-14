/*
 * modbus_tcp_server.h
 *
 *  Modbus TCP Server
 */

#ifndef __MODBUS_TCP_SERVER_H
#define __MODBUS_TCP_SERVER_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Number of Holding Registers */
#define MB_HOLDING_REGS_SIZE    100

/* Holding Register Table */
extern uint16_t HoldingRegs[MB_HOLDING_REGS_SIZE];

/* Initialize Modbus TCP Server */
void ModbusTCP_Server_Init(void);

#ifdef __cplusplus
}
#endif

#endif /* __MODBUS_TCP_SERVER_H */
