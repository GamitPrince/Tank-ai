#include "modbus_tcp_server.h"
#include "main.h"

#include "lwip/tcp.h"
#include <stdio.h>
#include <string.h>

static struct tcp_pcb *modbus_pcb = NULL;

/*-------------------------------------------------------------
 * Callback when data is received
 *------------------------------------------------------------*/
static err_t modbus_recv(void *arg,
                         struct tcp_pcb *tpcb,
                         struct pbuf *p,
                         err_t err)
{
    (void)arg;
    (void)err;

    if (p == NULL)
    {
        printf("Client Disconnected\r\n");
        tcp_close(tpcb);
        return ERR_OK;
    }

    uint8_t rx[260];

    memset(rx, 0, sizeof(rx));

    pbuf_copy_partial(p, rx, p->tot_len, 0);

    /* Verify Modbus Protocol ID */
    if((rx[2] != 0x00) || (rx[3] != 0x00))
    {
        tcp_recved(tpcb, p->tot_len);
        pbuf_free(p);
        return ERR_OK;
    }

    printf("\r\n");
    printf("=====================================\r\n");
    printf("Received %d bytes\r\n", p->tot_len);
    printf("Packet : ");

    for(uint16_t i = 0; i < p->tot_len; i++)
    {
        printf("%02X ", rx[i]);
    }

    printf("\r\n");
    printf("=====================================\r\n");

    /*---------------------------------------------------------
     * Function Code 03 - Read Holding Registers
     *--------------------------------------------------------*/
    if((p->tot_len >= 12) && (rx[7] == 0x03))
    {
    	uint8_t tx[260];

    	memset(tx, 0, sizeof(tx));

    	uint16_t start =
            ((uint16_t)rx[8] << 8) | rx[9];

        uint16_t quantity =
            ((uint16_t)rx[10] << 8) | rx[11];

        /* MBAP Header */
        tx[0] = rx[0];
        tx[1] = rx[1];
        tx[2] = 0x00;
        tx[3] = 0x00;

        /* Unit ID + Function + Byte Count + Data */
        tx[4] = 0x00;
        tx[5] = (uint8_t)(3 + (quantity * 2));

        tx[6] = rx[6];
        tx[7] = 0x03;
        tx[8] = (uint8_t)(quantity * 2);

        printf("Start Register : %u\r\n", start);
        printf("Quantity       : %u\r\n", quantity);

        if((quantity == 0) || (quantity > 125))
        {
            uint8_t ex[9];

            memcpy(ex, rx, 7);

            ex[4] = 0x00;
            ex[5] = 0x03;

            ex[6] = rx[6];
            ex[7] = 0x83;
            ex[8] = 0x03;

            tcp_write(tpcb, ex, sizeof(ex), TCP_WRITE_FLAG_COPY);
            tcp_output(tpcb);

            tcp_recved(tpcb, p->tot_len);
            pbuf_free(p);

            return ERR_OK;
        }

        /* Register 40001 = ADC */
        uint16_t adc_reg = adcValue;

        /* Register 40002 = Voltage x100 */
        uint16_t voltage_reg = (uint16_t)(voltage * 100.0f);

        /* Register 40003 = Current x100 */
        uint16_t current_reg = (uint16_t)(current * 100.0f);

        /* Register 40004 = Level x100 */
        uint16_t level_reg = (uint16_t)(level * 100.0f);

        /* Register 40005 = Relay Status */
        uint16_t relay_reg =
            (HAL_GPIO_ReadPin(GPIOE, GPIO_PIN_0) == GPIO_PIN_SET) ? 1 : 0;

        uint16_t registers[5];

        registers[0] = adc_reg;
        registers[1] = voltage_reg;
        registers[2] = current_reg;
        registers[3] = level_reg;
        registers[4] = relay_reg;

        /* Check requested range */
        if((start + quantity) > 5)
        {
            uint8_t ex[9];

            memcpy(ex, rx, 7);

            ex[4] = 0x00;
            ex[5] = 0x03;

            ex[6] = rx[6];
            ex[7] = 0x83;
            ex[8] = 0x02;

            tcp_write(tpcb, ex, sizeof(ex), TCP_WRITE_FLAG_COPY);
            tcp_output(tpcb);

            tcp_recved(tpcb, p->tot_len);
            pbuf_free(p);

            return ERR_OK;
        }

        uint16_t index = 9;

        for(uint16_t i = 0; i < quantity; i++)
        {
            uint16_t value = registers[start + i];

            tx[index++] = value >> 8;
            tx[index++] = value & 0xFF;
        }

        uint16_t tx_len = index;

        err_t tx_err =
            tcp_write(tpcb, tx, tx_len, TCP_WRITE_FLAG_COPY);

        if(tx_err == ERR_OK)
        {
            tcp_output(tpcb);
            printf("Response Sent\r\n");
        }
        else
        {
            printf("tcp_write Failed : %d\r\n", tx_err);
        }
    }

    tcp_recved(tpcb, p->tot_len);

    pbuf_free(p);

    return ERR_OK;
}

/*-------------------------------------------------------------
 * Callback when client connects
 *------------------------------------------------------------*/
static err_t modbus_accept(void *arg,
                           struct tcp_pcb *newpcb,
                           err_t err)
{
    (void)arg;
    (void)err;

    printf("Modbus Client Connected\r\n");

    tcp_recv(newpcb, modbus_recv);

    return ERR_OK;
}

/*-------------------------------------------------------------
 * Initialize TCP Server
 *------------------------------------------------------------*/
void ModbusTCP_Server_Init(void)
{
    printf("Step 1\r\n");

    modbus_pcb = tcp_new();

    if(modbus_pcb == NULL)
    {
        printf("Step 2 - tcp_new FAILED\r\n");
        return;
    }

    printf("Step 3\r\n");

    err_t err = tcp_bind(modbus_pcb, IP_ADDR_ANY, 502);

    if(err != ERR_OK)
    {
        printf("Step 4 - Bind Failed: %d\r\n", err);
        return;
    }

    printf("Step 5\r\n");

    modbus_pcb = tcp_listen(modbus_pcb);

    printf("Step 6\r\n");

    tcp_accept(modbus_pcb, modbus_accept);

    printf("Step 7 - Server Ready\r\n");
}
