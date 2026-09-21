import os
import json
import psycopg2
from http.server import BaseHTTPRequestHandler, HTTPServer

# Connect to database (Same string as .env.local)
DB_URL = "postgres://tsdbadmin:Princ3%4020561@om61u613bx.fbpbxhbuec.tsdb.cloud.timescale.com:33660/tsdb?sslmode=require"

print("Connecting to TimescaleDB...")
try:
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = True
    print("Database connected.")
except Exception as e:
    print(f"ERROR: Could not connect to DB: {e}")
    exit(1)

last_relay_state = None

class IngestHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        global last_relay_state
        if self.path == '/api/v1/ingest':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                payload = json.loads(post_data.decode('utf-8'))
                device_id = payload.get("device_id", "rtu_level_control_01")
                
                with conn.cursor() as cursor:
                    # Insert readings
                    sensors = payload.get("sensors", [])
                    for sensor in sensors:
                        cursor.execute(
                            "INSERT INTO readings (time, device_id, sensor_id, raw_value, value, quality) VALUES (now(), %s, %s, %s, %s, %s);",
                            (device_id, sensor.get("sensor_id"), sensor.get("raw_value"), sensor.get("value"), sensor.get("quality", "GOOD"))
                        )
                    
                    # Insert events if relay changed
                    current_relay = payload.get("relay_state", 0)
                    if last_relay_state is not None and current_relay != last_relay_state:
                        state_label = "ON" if current_relay else "OFF"
                        severity = "WARNING" if current_relay else "INFO"
                        cursor.execute(
                            "INSERT INTO events (time, device_id, event_type, state, severity) VALUES (now(), %s, 'relay_state_change', %s, %s);",
                            (device_id, state_label, severity)
                        )
                    last_relay_state = current_relay

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"status":"success"}')
                print(f"Received from ESP32: Inserted {len(sensors)} reading(s).")
                
            except Exception as e:
                print(f"Error processing payload: {e}")
                self.send_response(500)
                self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

server = HTTPServer(('0.0.0.0', 8080), IngestHandler)
print("Starting Temporary ESP32 Ingest Server on port 8080...")
server.serve_forever()
