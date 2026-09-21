/*
 * buffer_manager.h
 *
 * TEMPORARY ESP32-ONLY IMPLEMENTATION
 * ====================================
 * Nucleo-F767ZI is currently unavailable.
 * This code replaces the Nucleo buffer manager.
 * Revert to the original Nucleo + ESP32 architecture when
 * the replacement Nucleo board becomes available.
 *
 * Original Nucleo code: Core/Inc/buffer_manager.h, Core/Src/buffer_manager.c
 *
 * Circular buffer for storing telemetry messages when connectivity
 * (WiFi/4G) is temporarily unavailable. Messages are sent in FIFO
 * order when connectivity is restored.
 */

#ifndef TEMP_BUFFER_MANAGER_H
#define TEMP_BUFFER_MANAGER_H

#include <stdint.h>
#include <stdbool.h>

/* Same buffer size as Nucleo implementation */
#define MAX_BUFFERED_MESSAGES   50
#define MAX_MESSAGE_SIZE        256

/* Initialize the circular buffer */
void BufferManager_Init(void);

/* Add a message to the buffer. Returns true if successful, false if full. */
bool BufferManager_Enqueue(const char* message);

/* Peek at the oldest message without removing it. Returns true if message exists. */
bool BufferManager_Peek(char* message_out, uint16_t max_len);

/* Remove the oldest message from the buffer (usually after successful transmission) */
void BufferManager_Dequeue(void);

/* Check if the buffer has any messages */
bool BufferManager_HasData(void);

/* Get the current number of buffered messages */
uint16_t BufferManager_Count(void);

#endif /* TEMP_BUFFER_MANAGER_H */
