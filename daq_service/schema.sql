-- DAQ Database Schema for TimescaleDB

-- 1. Create tables

CREATE TABLE IF NOT EXISTS devices (
    device_id TEXT PRIMARY KEY,
    device_name TEXT,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sensors (
    device_id TEXT REFERENCES devices(device_id),
    sensor_id TEXT,
    sensor_type TEXT,
    unit TEXT,
    description TEXT,
    PRIMARY KEY (device_id, sensor_id)
);

CREATE TABLE IF NOT EXISTS readings (
    time TIMESTAMPTZ NOT NULL DEFAULT now(),
    device_id TEXT NOT NULL,
    sensor_id TEXT NOT NULL,
    raw_value FLOAT,
    value FLOAT NOT NULL,
    quality TEXT DEFAULT 'GOOD',
    FOREIGN KEY (device_id, sensor_id) REFERENCES sensors(device_id, sensor_id)
);

CREATE TABLE IF NOT EXISTS events (
    time TIMESTAMPTZ NOT NULL DEFAULT now(),
    device_id TEXT REFERENCES devices(device_id),
    event_type TEXT NOT NULL,
    state TEXT,
    severity TEXT
);

-- 2. Convert readings and events to TimescaleDB hypertables
SELECT create_hypertable('readings', 'time', if_not_exists => TRUE);
SELECT create_hypertable('events', 'time', if_not_exists => TRUE);

-- 3. Seed data
INSERT INTO devices (device_id, device_name, location)
VALUES ('rtu_level_control_01', 'RTU Level Control 01', 'Main Tank')
ON CONFLICT (device_id) DO NOTHING;

INSERT INTO sensors (device_id, sensor_id, sensor_type, unit, description)
VALUES 
    ('rtu_level_control_01', 'adc_raw', 'raw', 'counts', 'Raw ADC Count'),
    ('rtu_level_control_01', 'voltage', 'analog', 'V', 'Voltage'),
    ('rtu_level_control_01', 'current_ma', 'analog', 'mA', 'Current in mA'),
    ('rtu_level_control_01', 'level', 'level', '%', 'Level Percentage'),
    ('rtu_level_control_01', 'relay_status', 'digital', 'bool', 'Relay Status')
ON CONFLICT (device_id, sensor_id) DO NOTHING;
