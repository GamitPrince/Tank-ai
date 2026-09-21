-- DAQ Database Schema for TimescaleDB

-- 1. Create hierarchical tables
CREATE TABLE IF NOT EXISTS industries (
    industry_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plants (
    plant_id TEXT PRIMARY KEY,
    industry_id TEXT REFERENCES industries(industry_id),
    name TEXT NOT NULL,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tanks (
    tank_id TEXT PRIMARY KEY,
    plant_id TEXT REFERENCES plants(plant_id),
    name TEXT NOT NULL,
    height_m FLOAT,
    diameter_m FLOAT,
    length_m FLOAT,
    volume_capacity_m3 FLOAT,
    volume_formula TEXT, -- 'VERTICAL_CYLINDER', 'HORIZONTAL_CYLINDER', etc.
    max_level_m FLOAT,
    high_high_level_m FLOAT,
    low_low_level_m FLOAT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Access control tables
CREATE TABLE IF NOT EXISTS roles (
    role_id TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    industry_id TEXT REFERENCES industries(industry_id),
    role_id TEXT REFERENCES roles(role_id),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_tank_access (
    user_id TEXT REFERENCES users(user_id),
    tank_id TEXT REFERENCES tanks(tank_id),
    PRIMARY KEY (user_id, tank_id)
);

-- Device tables
CREATE TABLE IF NOT EXISTS devices (
    device_id TEXT PRIMARY KEY,
    tank_id TEXT REFERENCES tanks(tank_id),
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
INSERT INTO industries (industry_id, name) VALUES ('ind_01', 'Acme Bitumen') ON CONFLICT DO NOTHING;
INSERT INTO plants (plant_id, industry_id, name, location) VALUES ('plt_01', 'ind_01', 'Plant Alpha', 'Mumbai') ON CONFLICT DO NOTHING;
INSERT INTO tanks (tank_id, plant_id, name, height_m, diameter_m, volume_formula, max_level_m, high_high_level_m, low_low_level_m) 
VALUES ('tnk_01', 'plt_01', 'Main Tank', 10.0, 5.0, 'VERTICAL_CYLINDER', 9.5, 9.0, 1.0) ON CONFLICT DO NOTHING;

INSERT INTO roles (role_id, name) VALUES ('platform_admin', 'Platform Admin'), ('industry_admin', 'Industry Admin'), ('plant_manager', 'Plant Manager') ON CONFLICT DO NOTHING;

INSERT INTO users (user_id, industry_id, role_id, username, email) VALUES 
('usr_01', 'ind_01', 'industry_admin', 'admin', 'admin@acme.com') ON CONFLICT DO NOTHING;

INSERT INTO user_tank_access (user_id, tank_id) VALUES ('usr_01', 'tnk_01') ON CONFLICT DO NOTHING;

INSERT INTO devices (device_id, tank_id, device_name, location)
VALUES ('rtu_level_control_01', 'tnk_01', 'RTU Level Control 01', 'Main Tank')
ON CONFLICT (device_id) DO UPDATE SET tank_id = EXCLUDED.tank_id;

INSERT INTO sensors (device_id, sensor_id, sensor_type, unit, description)
VALUES 
    ('rtu_level_control_01', 'adc_raw', 'raw', 'counts', 'Raw ADC Count'),
    ('rtu_level_control_01', 'voltage', 'analog', 'V', 'Voltage'),
    ('rtu_level_control_01', 'current_ma', 'analog', 'mA', 'Current in mA'),
    ('rtu_level_control_01', 'level', 'level', '%', 'Level Percentage'),
    ('rtu_level_control_01', 'radar_level', 'level', 'm', 'Radar Level'),
    ('rtu_level_control_01', 'pt_level', 'level', 'm', 'Pressure Transmitter Level'),
    ('rtu_level_control_01', 'temperature', 'analog', 'C', 'Product Temperature'),
    ('rtu_level_control_01', 'inlet_valve', 'digital', 'bool', 'Inlet Valve Status'),
    ('rtu_level_control_01', 'outlet_valve', 'digital', 'bool', 'Outlet Valve Status'),
    ('rtu_level_control_01', 'relay_status', 'digital', 'bool', 'Relay Status')
ON CONFLICT (device_id, sensor_id) DO NOTHING;
