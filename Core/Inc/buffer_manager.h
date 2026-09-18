#ifndef BUFFER_MANAGER_H
#define BUFFER_MANAGER_H

#include <stdint.h>
#include <stdbool.h>

#define MAX_BUFFERED_MESSAGES 50
#define MAX_MESSAGE_SIZE 256

typedef struct {
    char messages[MAX_BUFFERED_MESSAGES][MAX_MESSAGE_SIZE];
    uint16_t head;
    uint16_t tail;
    uint16_t count;
} BufferManager_t;

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

#endif /* BUFFER_MANAGER_H */
