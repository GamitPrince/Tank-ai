/*
 * modem_manager.cpp
 *
 * TEMPORARY ESP32-ONLY IMPLEMENTATION
 * ====================================
 * Nucleo-F767ZI is currently unavailable.
 * This code provides 4G LTE modem management for the temporary
 * ESP32-only firmware.
 * Revert to the original Nucleo + ESP32 architecture when
 * the replacement Nucleo board becomes available.
 *
 * Based on: esp32_cloud_gateway/src/modem_manager.cpp
 * Functionally identical — same modem, same UART pins, same TinyGSM API.
 *
 * IMPORTANT: The modem chip define (e.g. TINY_GSM_MODEM_SIM7600)
 * must be set BEFORE including TinyGsmClient.h.  It is set in
 * platformio.ini via build_flags.
 *
 * The power-on sequence (PWRKEY pulse timing) is board-specific.
 * The defaults here match the KTRON ESP-S3-4G-DEV board.
 */

#include "modem_manager.h"
#include "config.h"

#include <TinyGsmClient.h>

/* UART1 for modem communication (UART0 = USB Serial) */
static HardwareSerial ModemSerial(1);

/* TinyGSM modem object */
static TinyGsm       modem(ModemSerial);
static TinyGsmClient gsmClient(modem);

/* ------------------------------------------------------------------ */
/*  Hardware power-on sequence                                         */
/* ------------------------------------------------------------------ */
static void modem_power_on()
{
    /* Power on pin (if available) */
    if (MODEM_POWER_ON_PIN >= 0)
    {
        pinMode(MODEM_POWER_ON_PIN, OUTPUT);
        digitalWrite(MODEM_POWER_ON_PIN, HIGH);
    }

    /* PWRKEY pulse — most SIMCom modules need a 1-second LOW pulse */
    if (MODEM_PWRKEY_PIN >= 0)
    {
        pinMode(MODEM_PWRKEY_PIN, OUTPUT);
        digitalWrite(MODEM_PWRKEY_PIN, LOW);
        delay(100);
        digitalWrite(MODEM_PWRKEY_PIN, HIGH);
        delay(1000);
        digitalWrite(MODEM_PWRKEY_PIN, LOW);
    }

    /* Reset pin (active low) */
    if (MODEM_RST_PIN >= 0)
    {
        pinMode(MODEM_RST_PIN, OUTPUT);
        digitalWrite(MODEM_RST_PIN, LOW);
        delay(100);
        digitalWrite(MODEM_RST_PIN, HIGH);
        delay(3000);   /* Wait for modem boot */
    }

    delay(3000); /* Extra time for modem to be ready */
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

bool Modem_Init()
{
    Serial.printf("%s Powering on...\n", LOG_PREFIX_MODEM);
    modem_power_on();

    Serial.printf("%s Initializing serial...\n", LOG_PREFIX_MODEM);
    ModemSerial.begin(MODEM_UART_BAUD, SERIAL_8N1,
                      MODEM_UART_RX, MODEM_UART_TX);
    delay(1000);

    Serial.printf("%s Initializing modem...\n", LOG_PREFIX_MODEM);
    if (!modem.init())
    {
        Serial.printf("%s init() FAILED — check wiring and power\n", LOG_PREFIX_MODEM);
        return false;
    }

    String modemInfo = modem.getModemInfo();
    Serial.printf("%s Info: %s\n", LOG_PREFIX_MODEM, modemInfo.c_str());

    /* Wait for network registration (up to 60 seconds) */
    Serial.printf("%s Waiting for network...\n", LOG_PREFIX_MODEM);
    if (!modem.waitForNetwork(60000))
    {
        Serial.printf("%s Network registration FAILED\n", LOG_PREFIX_MODEM);
        return false;
    }

    Serial.printf("%s Registered on network\n", LOG_PREFIX_MODEM);
    return true;
}

bool Modem_IsConnected()
{
    return modem.isGprsConnected();
}

bool Modem_Connect()
{
    Serial.printf("%s Connecting GPRS (APN: %s)...\n", LOG_PREFIX_MODEM, MODEM_APN);

    if (!modem.gprsConnect(MODEM_APN, MODEM_APN_USER, MODEM_APN_PASS))
    {
        Serial.printf("%s GPRS connect FAILED\n", LOG_PREFIX_MODEM);
        return false;
    }

    Serial.printf("%s GPRS connected\n", LOG_PREFIX_MODEM);

    IPAddress ip = modem.localIP();
    Serial.printf("%s IP: %s\n", LOG_PREFIX_MODEM, ip.toString().c_str());

    return true;
}

void Modem_Disconnect()
{
    modem.gprsDisconnect();
    Serial.printf("%s GPRS disconnected\n", LOG_PREFIX_MODEM);
}

int Modem_HttpPost(const char *host, uint16_t port,
                   const char *path, const char *body,
                   const char *apiKey)
{
    /* Connect TCP */
    if (!gsmClient.connect(host, port))
    {
        Serial.printf("%s TCP connect to %s:%u FAILED\n", LOG_PREFIX_MODEM, host, port);
        return -1;
    }

    int bodyLen = strlen(body);

    /* Build and send HTTP request */
    gsmClient.printf("POST %s HTTP/1.1\r\n", path);
    gsmClient.printf("Host: %s:%u\r\n", host, port);
    gsmClient.print("Content-Type: application/json\r\n");
    gsmClient.printf("X-API-Key: %s\r\n", apiKey);
    gsmClient.printf("Content-Length: %d\r\n", bodyLen);
    gsmClient.print("Connection: close\r\n");
    gsmClient.print("\r\n");
    gsmClient.print(body);

    /* Read response status line */
    unsigned long timeout = millis() + HTTP_POST_TIMEOUT_MS;
    while (gsmClient.connected() && !gsmClient.available())
    {
        if (millis() > timeout)
        {
            Serial.printf("%s HTTP response timeout\n", LOG_PREFIX_MODEM);
            gsmClient.stop();
            return -1;
        }
        delay(10);
    }

    /* Parse HTTP status code from first line: "HTTP/1.1 200 OK" */
    int statusCode = -1;
    if (gsmClient.available())
    {
        String statusLine = gsmClient.readStringUntil('\n');
        int spaceIdx = statusLine.indexOf(' ');
        if (spaceIdx > 0)
        {
            statusCode = statusLine.substring(spaceIdx + 1).toInt();
        }
    }

    /* Drain remaining response */
    while (gsmClient.available())
    {
        gsmClient.read();
    }

    gsmClient.stop();

    return statusCode;
}
