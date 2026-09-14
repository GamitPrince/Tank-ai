#!/usr/bin/env python3
"""
Nucleo-F7 RTU Level Control — Data Acquisition (DAQ) Collector Service
-----------------------------------------------------------------------
Polls Modbus TCP holding registers from the Nucleo-F7 board over
Ethernet/Router and inserts real-time sensor readings into the existing
TimescaleDB schema:

  readings  — one row per sensor per poll cycle (5 sensors × N polls)
  events    — one row when relay state *changes* (crosses 80 % threshold)

Existing tables (devices, sensors) are NOT touched; they were pre-seeded.
"""

import os
import sys
import time
import logging
from datetime import datetime, timezone

# Optional dotenv support
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

import psycopg2
from pymodbus.client import ModbusTcpClient

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("daq_collector")

# ---------------------------------------------------------------------------
# Configuration from environment / .env
# ---------------------------------------------------------------------------
DB_URI          = os.getenv("DATABASE_URL",  "postgresql://postgres:2056@localhost:5432/timeseries_db")
NUCLEO_IP       = os.getenv("NUCLEO_IP",     "192.168.2.100")
NUCLEO_PORT     = int(os.getenv("NUCLEO_PORT",    502))
POLL_INTERVAL   = float(os.getenv("POLL_INTERVAL", 1.0))
MODBUS_TIMEOUT  = float(os.getenv("MODBUS_TIMEOUT", 3.0))
DEVICE_ID       = os.getenv("DEVICE_ID",    "rtu_level_control_01")

# ---------------------------------------------------------------------------
# Sensor-ID mapping  (index in the Modbus register array → sensor_id in DB)
#
# Modbus Holding Register layout (see modbus_tcp_server.c lines 109-131):
#   Register 0 (40001) = ADC raw count        → sensor_id "adc_raw"
#   Register 1 (40002) = Voltage × 100        → sensor_id "voltage"
#   Register 2 (40003) = Current (mA) × 100   → sensor_id "current_ma"
#   Register 3 (40004) = Level (%) × 100      → sensor_id "level"
#   Register 4 (40005) = Relay status (0 | 1)  → sensor_id "relay_status"
# ---------------------------------------------------------------------------
SENSOR_MAP = [
    # (sensor_id,           scale_divisor,  has_raw_value)
    ("adc_raw",             1,              False),
    ("voltage",             100.0,          None ),   # raw_value = raw register
    ("current_ma",          100.0,          None ),
    ("level",               100.0,          None ),
    ("relay_status",        1,              False),
]


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def connect_db():
    """Connect to TimescaleDB / PostgreSQL with a retry loop."""
    while True:
        try:
            masked = DB_URI.split("@")[-1]
            logger.info("Connecting to database: %s …", masked)
            conn = psycopg2.connect(DB_URI)
            conn.autocommit = False
            logger.info("Database connection established.")
            return conn
        except Exception as exc:
            logger.error("Database connection failed: %s. Retrying in 5 s …", exc)
            time.sleep(5)


def insert_readings(cursor, now, regs):
    """Insert one row per sensor into the *readings* hypertable.

    readings schema:
        time        TIMESTAMPTZ NOT NULL DEFAULT now()
        device_id   TEXT        NOT NULL
        sensor_id   TEXT        NOT NULL
        raw_value   FLOAT               (nullable)
        value       FLOAT        NOT NULL
        quality     TEXT         DEFAULT 'GOOD'
    """
    for idx, (sensor_id, divisor, _) in enumerate(SENSOR_MAP):
        raw_reg = float(regs[idx])
        scaled  = raw_reg / divisor

        # For scaled sensors, store the raw register as raw_value
        if divisor != 1:
            raw_value = raw_reg
        else:
            raw_value = None  # ADC count and relay are already "raw"

        cursor.execute(
            """
            INSERT INTO readings (time, device_id, sensor_id, raw_value, value, quality)
            VALUES (%s, %s, %s, %s, %s, %s);
            """,
            (now, DEVICE_ID, sensor_id, raw_value, scaled, "GOOD"),
        )


def insert_relay_event(cursor, now, new_state):
    """Insert one row into the *events* hypertable on relay state change.

    events schema:
        time        TIMESTAMPTZ NOT NULL DEFAULT now()
        device_id   TEXT        NOT NULL
        event_type  TEXT        NOT NULL
        state       TEXT
        severity    TEXT
    """
    state_label = "ON" if new_state else "OFF"
    severity    = "WARNING" if new_state else "INFO"

    cursor.execute(
        """
        INSERT INTO events (time, device_id, event_type, state, severity)
        VALUES (%s, %s, %s, %s, %s);
        """,
        (now, DEVICE_ID, "relay_state_change", state_label, severity),
    )
    logger.info("EVENT: relay → %s  (severity=%s)", state_label, severity)


# ---------------------------------------------------------------------------
# Modbus reader
# ---------------------------------------------------------------------------

def read_modbus_registers(client):
    """Read holding registers 0-4 from the Nucleo-F7 (40001–40005)."""
    try:
        response = client.read_holding_registers(address=0, count=5, device_id=1)
        if response.isError():
            logger.warning("Modbus error response: %s", response)
            return None
        regs = response.registers
        if len(regs) < 5:
            logger.warning("Insufficient registers returned: %s", regs)
            return None
        return regs
    except Exception as exc:
        logger.error("Error reading Modbus registers: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------

def main():
    logger.info("Starting Nucleo-F7 DAQ Collector Service …")
    logger.info("  Device ID  : %s", DEVICE_ID)
    logger.info("  Nucleo IP  : %s:%s", NUCLEO_IP, NUCLEO_PORT)
    logger.info("  Poll every : %s s", POLL_INTERVAL)

    db_conn       = connect_db()
    modbus_client = ModbusTcpClient(NUCLEO_IP, port=NUCLEO_PORT, timeout=MODBUS_TIMEOUT)

    # Track previous relay state so we only log events on *change*
    prev_relay: int | None = None

    while True:
        try:
            # --- Modbus connection ------------------------------------------
            if not modbus_client.is_socket_open():
                logger.info("Connecting to Nucleo-F7 Modbus TCP at %s:%s …",
                            NUCLEO_IP, NUCLEO_PORT)
                if not modbus_client.connect():
                    logger.warning("Could not reach Nucleo-F7. Retrying in 3 s …")
                    time.sleep(3)
                    continue

            # --- Read registers ---------------------------------------------
            regs = read_modbus_registers(modbus_client)
            if regs is None:
                time.sleep(POLL_INTERVAL)
                continue

            now = datetime.now(timezone.utc)

            # --- Write to DB ------------------------------------------------
            try:
                with db_conn.cursor() as cur:
                    # 1. Insert 5 rows into readings
                    insert_readings(cur, now, regs)

                    # 2. Check relay state change → events
                    relay_now = regs[4]
                    if prev_relay is not None and relay_now != prev_relay:
                        insert_relay_event(cur, now, relay_now)
                    prev_relay = relay_now

                db_conn.commit()

                level_pct = regs[3] / 100.0
                logger.info(
                    "Logged: Level=%.2f%% | Current=%.2fmA | Voltage=%.2fV | "
                    "ADC=%d | Relay=%s",
                    level_pct,
                    regs[2] / 100.0,
                    regs[1] / 100.0,
                    regs[0],
                    "ON" if regs[4] else "OFF",
                )

            except Exception as db_err:
                logger.error("Database insertion failed: %s", db_err)
                db_conn.rollback()
                db_conn = connect_db()

        except KeyboardInterrupt:
            logger.info("Stopping DAQ Collector Service …")
            break
        except Exception as exc:
            logger.error("Unexpected loop exception: %s", exc)
            time.sleep(2)

        time.sleep(POLL_INTERVAL)

    # Cleanup
    if modbus_client.is_socket_open():
        modbus_client.close()
    if db_conn:
        db_conn.close()
    logger.info("DAQ Collector stopped.")


if __name__ == "__main__":
    main()
