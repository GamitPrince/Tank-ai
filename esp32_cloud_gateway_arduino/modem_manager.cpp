/*
 * modem_manager.cpp
 *
 * 4G LTE modem management via TinyGSM.
 *
 * IMPORTANT: The modem chip define (e.g. TINY_GSM_MODEM_SIM7600)
 * must be set BEFORE including TinyGsmClient.h.  It is set in
 * platformio.ini via build_flags.
 *
 * The power-on sequence (PWRKEY pulse timing) is board-specific.
 * The defaults here match common LilyGO T-SIM7600 boards.
 * Adjust if your board uses a different modem or power circuit.
 */

#include "modem_manager.h"
#include "config.h"

#include <TinyGsmClient.h>

/* UART1 for modem communication (UART0 = USB Serial, UART2 = Nucleo) */
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
    Serial.println("[MODEM] Powering on...");
    modem_power_on();

    Serial.println("[MODEM] Initializing serial...");
    ModemSerial.begin(MODEM_UART_BAUD, SERIAL_8N1,
                      MODEM_UART_RX, MODEM_UART_TX);
    delay(1000);

    Serial.println("[MODEM] Initializing modem...");
    if (!modem.init())
    {
        Serial.println("[MODEM] init() FAILED — check wiring and power");
        return false;
    }

    String modemInfo = modem.getModemInfo();
    Serial.printf("[MODEM] Info: %s\n", modemInfo.c_str());

    /* Wait for network registration (up to 60 seconds) */
    Serial.println("[MODEM] Waiting for network...");
    if (!modem.waitForNetwork(60000))
    {
        Serial.println("[MODEM] Network registration FAILED");
        return false;
    }

    Serial.println("[MODEM] Registered on network");
    return true;
}

bool Modem_IsConnected()
{
    return modem.isGprsConnected();
}

bool Modem_Connect()
{
    Serial.printf("[MODEM] Connecting GPRS (APN: %s)...\n", MODEM_APN);

    if (!modem.gprsConnect(MODEM_APN, MODEM_APN_USER, MODEM_APN_PASS))
    {
        Serial.println("[MODEM] GPRS connect FAILED");
        return false;
    }

    Serial.println("[MODEM] GPRS connected");

    IPAddress ip = modem.localIP();
    Serial.printf("[MODEM] IP: %s\n", ip.toString().c_str());

    return true;
}

void Modem_Disconnect()
{
    modem.gprsDisconnect();
    Serial.println("[MODEM] GPRS disconnected");
}

int Modem_HttpPost(const char *host, uint16_t port,
                   const char *path, const char *body,
                   const char *apiKey)
{
    /* Connect TCP */
    if (!gsmClient.connect(host, port))
    {
        Serial.printf("[MODEM] TCP connect to %s:%u FAILED\n", host, port);
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
            Serial.println("[MODEM] HTTP response timeout");
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
