import serial
import json
import psycopg2
import time
import sys

COM_PORT = 'COM6'
BAUD_RATE = 115200

DB_URL = "postgres://tsdbadmin:Princ3%4020561@om61u613bx.fbpbxhbuec.tsdb.cloud.timescale.com:33660/tsdb?sslmode=require"

print("Connecting to TimescaleDB...")
try:
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = True
    print("Database connected.")
except Exception as e:
    print(f"ERROR: Could not connect to DB: {e}")
    sys.exit(1)

print(f"Opening Serial Port {COM_PORT} at {BAUD_RATE} baud...")
try:
    ser = serial.Serial(COM_PORT, BAUD_RATE, timeout=1)
except Exception as e:
    print(f"ERROR: Could not open {COM_PORT}. Is it being used by another program? {e}")
    sys.exit(1)

print("Listening for sensor data over USB Cable...")
last_relay_state = None

while True:
    try:
        if ser.in_waiting > 0:
            line = ser.readline().decode('utf-8', errors='ignore').strip()
            
            # Print EVERYTHING to the console (Acting like Tera Term)
            if line:
                print(line)
                
            if line.startswith("[SERIAL_JSON] "):
                json_str = line[len("[SERIAL_JSON] "):]
                try:
                    payload = json.loads(json_str)
                    device_id = payload.get("device_id", "rtu_level_control_01")
                    
                    with conn.cursor() as cursor:
                        # The ESP32 sends a "readings" array
                        readings = payload.get("readings", [])
                        inserted_count = 0
                        
                        for reading in readings:
                            s_id = reading.get("sensor_id")
                            
                            # Map "engineering_value" to level so the UI sees it
                            if s_id == "engineering_value":
                                s_id = "level"
                                
                            if s_id == "relay_status":
                                current_relay = reading.get("value", 0)
                                if last_relay_state is not None and current_relay != last_relay_state:
                                    state_label = "ON" if current_relay else "OFF"
                                    severity = "WARNING" if current_relay else "INFO"
                                    cursor.execute(
                                        "INSERT INTO events (time, device_id, event_type, state, severity) VALUES (now(), %s, 'relay_state_change', %s, %s);",
                                        (device_id, state_label, severity)
                                    )
                                last_relay_state = current_relay
                                continue # don't insert relay state into the readings table
                                
                            cursor.execute(
                                "INSERT INTO readings (time, device_id, sensor_id, raw_value, value, quality) VALUES (now(), %s, %s, %s, %s, %s);",
                                (device_id, s_id, reading.get("raw_value"), reading.get("value"), reading.get("quality", "GOOD"))
                            )
                            inserted_count += 1
                            
                    print(f"USB Ingest: Inserted {inserted_count} reading(s) from {device_id}.")
                except json.JSONDecodeError:
                    print("Error parsing JSON payload from Serial.")
                except Exception as e:
                    print(f"Database error: {e}")
    except KeyboardInterrupt:
        print("\nExiting...")
        break
    except Exception as e:
        print(f"Serial Error: {e}")
        time.sleep(1)

ser.close()
