#include "buffer_manager.h"
#include <string.h>
#include <stdio.h>

static BufferManager_t buffer;

void BufferManager_Init(void)
{
    buffer.head = 0;
    buffer.tail = 0;
    buffer.count = 0;
}

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

void BufferManager_Dequeue(void)
{
    if (buffer.count > 0)
    {
        buffer.head = (buffer.head + 1) % MAX_BUFFERED_MESSAGES;
        buffer.count--;
    }
}

bool BufferManager_HasData(void)
{
    return buffer.count > 0;
}
