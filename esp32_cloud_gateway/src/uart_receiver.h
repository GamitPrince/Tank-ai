/*
 * uart_receiver.h
 *
 * Receives newline-delimited JSON telemetry lines from the
 * STM32 Nucleo over UART2.
 */

#ifndef UART_RECEIVER_H
#define UART_RECEIVER_H

#include <Arduino.h>

/* Initialize UART2 for receiving Nucleo telemetry */
void UART_Receiver_Init();

/* Try to read a complete JSON line from the Nucleo.
 * Returns true if a full line was received and stored in `outLine`.
 * Returns false if no complete line is available yet.
 *
 * `outLine` must be at least NUCLEO_LINE_MAX bytes.  */
bool UART_Receiver_ReadLine(char *outLine, size_t maxLen);

#endif /* UART_RECEIVER_H */
