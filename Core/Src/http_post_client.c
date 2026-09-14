/*
 * http_post_client.c
 *
 *  HTTP POST Client — sends sensor telemetry to a remote ingest API
 *  using LwIP raw TCP API.  Runs alongside the existing Modbus TCP
 *  server without interfering.
 *
 *  Target endpoint:
 *    POST http://<SERVER_IP>:8080/api/v1/ingest
 *    Content-Type: application/json
 *    X-API-Key: <API_KEY>
 */

#include "http_post_client.h"
#include "main.h"

#include "lwip/tcp.h"
#include "lwip/ip_addr.h"

#include <stdio.h>
#include <string.h>

/* ------------------------------------------------------------------ */
/*  Configuration — update SERVER_IP once the server is provisioned   */
/* ------------------------------------------------------------------ */

/* >>> PLACEHOLDER — replace with the real public IP of your server <<< */
#define SERVER_IP_0   0
#define SERVER_IP_1   0
#define SERVER_IP_2   0
#define SERVER_IP_3   0

#define SERVER_PORT   8080

#define API_KEY       "360ae11193304b4e68929616926b2e9436c09761e8f93155cf47b58ca97de83d"
#define DEVICE_ID     "rtu_level_control_01"
#define API_PATH      "/api/v1/ingest"

/* Retry / backoff */
#define BACKOFF_INIT_MS    1000
#define BACKOFF_MAX_MS     30000

/* Maximum size of the full HTTP request (headers + body).
 * Our JSON body is ~550 bytes, headers ~350 bytes → ~900 total.
 * 1200 bytes gives comfortable headroom.                          */
#define HTTP_BUF_SIZE      1200

/* ------------------------------------------------------------------ */
/*  Module state                                                      */
/* ------------------------------------------------------------------ */

/* Connection state machine */
typedef enum {
    HTTP_IDLE,          /* No connection in progress              */
    HTTP_CONNECTING,    /* tcp_connect() called, waiting callback */
    HTTP_SENDING,       /* Connected, tcp_write() in progress     */
    HTTP_WAITING_ACK,   /* Data written, waiting for sent cb      */
    HTTP_CLOSING        /* Graceful close in progress             */
} http_state_t;

static http_state_t    state        = HTTP_IDLE;
static struct tcp_pcb *http_pcb     = NULL;
static uint32_t        backoff_ms   = BACKOFF_INIT_MS;
static uint32_t        last_try_ms  = 0;

/* Pending payload (filled by SendReadings, consumed by callbacks) */
static uint8_t  pending       = 0;   /* 1 = payload waiting to be sent */
static char     http_buf[HTTP_BUF_SIZE];
static uint16_t http_buf_len  = 0;

/* ------------------------------------------------------------------ */
/*  Forward declarations — LwIP callbacks                             */
/* ------------------------------------------------------------------ */
static err_t  http_connected_cb(void *arg, struct tcp_pcb *tpcb, err_t err);
static err_t  http_sent_cb(void *arg, struct tcp_pcb *tpcb, u16_t len);
static err_t  http_recv_cb(void *arg, struct tcp_pcb *tpcb,
                           struct pbuf *p, err_t err);
static void   http_err_cb(void *arg, err_t err);

/* ------------------------------------------------------------------ */
/*  Helper: close / clean up a connection                             */
/* ------------------------------------------------------------------ */
static void http_close(struct tcp_pcb *tpcb)
{
    if (tpcb != NULL)
    {
        tcp_arg(tpcb,  NULL);
        tcp_sent(tpcb, NULL);
        tcp_recv(tpcb, NULL);
        tcp_err(tpcb,  NULL);
        tcp_close(tpcb);
    }

    if (tpcb == http_pcb)
    {
        http_pcb = NULL;
    }

    state = HTTP_IDLE;
}

/* ------------------------------------------------------------------ */
/*  Helper: build the full HTTP request into http_buf                 */
/* ------------------------------------------------------------------ */
static void build_http_request(uint16_t adc,
                               float    voltage,
                               float    current_ma,
                               float    level,
                               uint8_t  relay)
{
    /* --- JSON body ------------------------------------------------ */
    char body[700];
    int  body_len;

    body_len = snprintf(body, sizeof(body),
        "{"
            "\"device_id\":\"%s\","
            "\"api_key\":\"%s\","
            "\"readings\":["
                "{\"sensor_id\":\"adc_raw\",\"value\":%u},"
                "{\"sensor_id\":\"voltage\",\"raw_value\":%u,\"value\":%.4f},"
                "{\"sensor_id\":\"current_ma\",\"raw_value\":%u,\"value\":%.4f},"
                "{\"sensor_id\":\"engineering_value\",\"raw_value\":%u,\"value\":%.4f},"
                "{\"sensor_id\":\"relay_status\",\"value\":%u}"
            "]"
        "}",
        DEVICE_ID,
        API_KEY,
        (unsigned)adc,
        (unsigned)(uint16_t)(voltage   * 100.0f), voltage,
        (unsigned)(uint16_t)(current_ma * 100.0f), current_ma,
        (unsigned)(uint16_t)(level      * 100.0f), level,
        (unsigned)relay
    );

    if (body_len < 0 || body_len >= (int)sizeof(body))
    {
        body_len = (int)strlen(body);  /* truncated — best effort */
    }

    /* --- HTTP headers --------------------------------------------- */
    http_buf_len = (uint16_t)snprintf(http_buf, sizeof(http_buf),
        "POST %s HTTP/1.1\r\n"
        "Host: %u.%u.%u.%u:%u\r\n"
        "Content-Type: application/json\r\n"
        "X-API-Key: %s\r\n"
        "Content-Length: %d\r\n"
        "Connection: close\r\n"
        "\r\n"
        "%s",
        API_PATH,
        SERVER_IP_0, SERVER_IP_1, SERVER_IP_2, SERVER_IP_3, SERVER_PORT,
        API_KEY,
        body_len,
        body
    );
}

/* ------------------------------------------------------------------ */
/*  Helper: initiate TCP connection to the remote server              */
/* ------------------------------------------------------------------ */
static void http_start_connection(void)
{
    ip_addr_t server_ip;

    IP4_ADDR(&server_ip, SERVER_IP_0, SERVER_IP_1,
                          SERVER_IP_2, SERVER_IP_3);

    http_pcb = tcp_new();
    if (http_pcb == NULL)
    {
        printf("HTTP: tcp_new failed\r\n");
        state = HTTP_IDLE;
        return;
    }

    tcp_arg(http_pcb,  NULL);
    tcp_err(http_pcb,  http_err_cb);
    tcp_recv(http_pcb, http_recv_cb);
    tcp_sent(http_pcb, http_sent_cb);

    state = HTTP_CONNECTING;

    err_t err = tcp_connect(http_pcb, &server_ip, SERVER_PORT,
                            http_connected_cb);
    if (err != ERR_OK)
    {
        printf("HTTP: tcp_connect failed: %d\r\n", err);
        http_close(http_pcb);
    }
}

/* ------------------------------------------------------------------ */
/*  LwIP Callbacks                                                    */
/* ------------------------------------------------------------------ */

/* Called when TCP connection to the server is established */
static err_t http_connected_cb(void *arg, struct tcp_pcb *tpcb, err_t err)
{
    (void)arg;

    if (err != ERR_OK)
    {
        printf("HTTP: connect callback error: %d\r\n", err);
        http_close(tpcb);
        return ERR_OK;
    }

    /* Send the pre-built HTTP request */
    state = HTTP_SENDING;

    err_t wr = tcp_write(tpcb, http_buf, http_buf_len, TCP_WRITE_FLAG_COPY);
    if (wr != ERR_OK)
    {
        printf("HTTP: tcp_write failed: %d\r\n", wr);
        http_close(tpcb);
        return ERR_OK;
    }

    tcp_output(tpcb);
    state = HTTP_WAITING_ACK;

    return ERR_OK;
}

/* Called when the remote end acknowledges our sent data */
static err_t http_sent_cb(void *arg, struct tcp_pcb *tpcb, u16_t len)
{
    (void)arg;
    (void)len;

    /* Request fully acknowledged — success */
    printf("HTTP: POST sent OK (%u bytes)\r\n", http_buf_len);

    /* Reset backoff on success */
    backoff_ms = BACKOFF_INIT_MS;
    pending    = 0;

    /* We used Connection: close, so start closing from our side */
    state = HTTP_CLOSING;
    http_close(tpcb);

    return ERR_OK;
}

/* Called when we receive data back from the server (HTTP response) */
static err_t http_recv_cb(void *arg, struct tcp_pcb *tpcb,
                          struct pbuf *p, err_t err)
{
    (void)arg;
    (void)err;

    if (p == NULL)
    {
        /* Server closed the connection */
        http_close(tpcb);
        return ERR_OK;
    }

    /* We don't parse the HTTP response in detail —
     * just acknowledge and free the pbuf.  The sent_cb
     * already confirmed successful transmission.       */
    tcp_recved(tpcb, p->tot_len);
    pbuf_free(p);

    return ERR_OK;
}

/* Called on a fatal TCP error (connection reset, timeout, etc.) */
static void http_err_cb(void *arg, err_t err)
{
    (void)arg;

    printf("HTTP: TCP error: %d\r\n", err);

    /* PCB is already freed by LwIP when err_cb fires */
    http_pcb = NULL;
    state    = HTTP_IDLE;

    /* Exponential backoff */
    backoff_ms *= 2;
    if (backoff_ms > BACKOFF_MAX_MS)
    {
        backoff_ms = BACKOFF_MAX_MS;
    }

    printf("HTTP: next retry in %lu ms\r\n", backoff_ms);
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

void HttpPost_Init(void)
{
    state       = HTTP_IDLE;
    http_pcb    = NULL;
    pending     = 0;
    backoff_ms  = BACKOFF_INIT_MS;
    last_try_ms = 0;

    printf("HTTP POST client initialized\r\n");
    printf("  Server : %u.%u.%u.%u:%u\r\n",
           SERVER_IP_0, SERVER_IP_1, SERVER_IP_2, SERVER_IP_3,
           SERVER_PORT);
    printf("  Path   : %s\r\n", API_PATH);
    printf("  Device : %s\r\n", DEVICE_ID);
}

void HttpPost_SendReadings(uint16_t adc,
                           float    voltage,
                           float    current,
                           float    level,
                           uint8_t  relay_status)
{
    /* Don't queue a new request if one is already in flight */
    if (state != HTTP_IDLE)
    {
        return;
    }

    /* Respect backoff timing */
    uint32_t now = HAL_GetTick();
    if ((now - last_try_ms) < backoff_ms)
    {
        return;
    }

    /* Build the HTTP request payload */
    build_http_request(adc, voltage, current, level, relay_status);

    pending     = 1;
    last_try_ms = now;

    /* Initiate TCP connection (async — callbacks handle the rest) */
    http_start_connection();
}
