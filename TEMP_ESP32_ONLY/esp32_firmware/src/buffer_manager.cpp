/*
 * buffer_manager.cpp
 *
 * TEMPORARY ESP32-ONLY IMPLEMENTATION
 * ====================================
 * Nucleo-F767ZI is currently unavailable.
 * This code replaces the Nucleo buffer manager.
 * Revert to the original Nucleo + ESP32 architecture when
 * the replacement Nucleo board becomes available.
 *
 * Original Nucleo code: Core/Src/buffer_manager.c
 *
 * Implementation is functionally identical to the Nucleo version:
 * a fixed-size circular buffer of text messages.
 */

#include "buffer_manager.h"
#include "config.h"

#include <Arduino.h>
#include <string.h>

typedef struct {
    char     messages[MAX_BUFFERED_MESSAGES][MAX_MESSAGE_SIZE];
    uint16_t head;
    uint16_t tail;
    uint16_t count;
} BufferManager_t;

static BufferManager_t buffer;

/* ------------------------------------------------------------------ */
/*  Initialize                                                         */
/* ------------------------------------------------------------------ */

void BufferManager_Init(void)
{
    buffer.head  = 0;
    buffer.tail  = 0;
    buffer.count = 0;

    Serial.printf("%s Buffer manager initialized (capacity: %d messages)\n",
                  LOG_PREFIX_BUFFER, MAX_BUFFERED_MESSAGES);
}

/* ------------------------------------------------------------------ */
/*  Enqueue                                                            */
/* ------------------------------------------------------------------ */

bool BufferManager_Enqueue(const char* message)
{
    if (buffer.count >= MAX_BUFFERED_MESSAGES)
    {
        return false; /* Buffer full */
    }

    strncpy(buffer.messages[buffer.tail], message, MAX_MESSAGE_SIZE - 1);
    buffer.messages[buffer.tail][MAX_MESSAGE_SIZE - 1] = '\0';

    buffer.tail = (buffer.tail + 1) % MAX_BUFFERED_MESSAGES;
    buffer.count++;

    return true;
}

/* ------------------------------------------------------------------ */
/*  Peek                                                               */
/* ------------------------------------------------------------------ */

bool BufferManager_Peek(char* message_out, uint16_t max_len)
{
    if (buffer.count == 0)
    {
        return false;
    }

    strncpy(message_out, buffer.messages[buffer.head], max_len - 1);
    message_out[max_len - 1] = '\0';

    return true;
}

/* ------------------------------------------------------------------ */
/*  Dequeue                                                            */
/* ------------------------------------------------------------------ */

void BufferManager_Dequeue(void)
{
    if (buffer.count > 0)
    {
        buffer.head = (buffer.head + 1) % MAX_BUFFERED_MESSAGES;
        buffer.count--;
    }
}

/* ------------------------------------------------------------------ */
/*  Has Data                                                           */
/* ------------------------------------------------------------------ */

bool BufferManager_HasData(void)
{
    return buffer.count > 0;
}

/* ------------------------------------------------------------------ */
/*  Count                                                              */
/* ------------------------------------------------------------------ */

uint16_t BufferManager_Count(void)
{
    return buffer.count;
}
