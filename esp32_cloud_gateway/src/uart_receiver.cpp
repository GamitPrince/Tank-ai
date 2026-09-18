/*
 * uart_receiver.cpp
 *
 * Receives newline-delimited JSON telemetry lines from the
 * STM32 Nucleo over UART2.
 */

#include "uart_receiver.h"
#include "config.h"

/* Use HardwareSerial instance 2 (UART2) for Nucleo comms */
static HardwareSerial NucleoSerial(2);

/* Line buffer for accumulating characters */
static char   line_buf[NUCLEO_LINE_MAX];
static size_t line_pos = 0;

void UART_Receiver_Init()
{
    NucleoSerial.begin(NUCLEO_UART_BAUD, SERIAL_8N1,
                       NUCLEO_UART_RX, NUCLEO_UART_TX);

    line_pos = 0;
    memset(line_buf, 0, sizeof(line_buf));

    Serial.println("[UART_RX] Nucleo UART receiver initialized");
    Serial.printf("[UART_RX] RX=GPIO%d  TX=GPIO%d  Baud=%d\n",
                  NUCLEO_UART_RX, NUCLEO_UART_TX, NUCLEO_UART_BAUD);
}

bool UART_Receiver_ReadLine(char *outLine, size_t maxLen)
{
    while (NucleoSerial.available())
    {
        char c = (char)NucleoSerial.read();

        /* Newline marks end of JSON line */
        if (c == '\n')
        {
            if (line_pos == 0)
            {
                /* Empty line — skip */
                continue;
            }

            /* Null-terminate and copy out */
            line_buf[line_pos] = '\0';

            size_t copyLen = (line_pos < maxLen - 1) ? line_pos : (maxLen - 1);
            memcpy(outLine, line_buf, copyLen);
            outLine[copyLen] = '\0';

            /* Reset for next line */
            line_pos = 0;

            return true;
        }

        /* Ignore carriage returns */
        if (c == '\r')
        {
            continue;
        }

        /* Accumulate character */
        if (line_pos < NUCLEO_LINE_MAX - 1)
        {
            line_buf[line_pos++] = c;
        }
        else
        {
            /* Buffer overflow — discard and reset */
            Serial.println("[UART_RX] WARNING: line too long, discarding");
            line_pos = 0;
        }
    }

    return false;
}
