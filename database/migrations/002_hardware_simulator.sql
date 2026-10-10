-- FabricTrace Migration 002: Hardware-Inspired Textile Machine Simulator
-- Supports industrial weaving loom telemetry, operating states, and simulated hardware signals

-- 1. Machine Simulation Configuration
CREATE TABLE IF NOT EXISTS machine_simulation_configs (
    machine_id UUID PRIMARY KEY REFERENCES machines(id) ON DELETE CASCADE,
    rated_rpm NUMERIC(8, 2) NOT NULL DEFAULT 650.00,
    picks_per_cm NUMERIC(6, 2) NOT NULL DEFAULT 25.00,
    meters_per_hour NUMERIC(8, 2) NOT NULL DEFAULT 15.60,
    vibration_warning_threshold NUMERIC(6, 2) NOT NULL DEFAULT 5.50,
    vibration_critical_threshold NUMERIC(6, 2) NOT NULL DEFAULT 8.00,
    temp_warning_threshold NUMERIC(6, 2) NOT NULL DEFAULT 75.00,
    temp_critical_threshold NUMERIC(6, 2) NOT NULL DEFAULT 90.00,
    no_output_threshold_seconds INT NOT NULL DEFAULT 1800,
    counter_precision INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Machine Real-Time Telemetry & Simulator State
CREATE TABLE IF NOT EXISTS machine_simulator_state (
    machine_id UUID PRIMARY KEY REFERENCES machines(id) ON DELETE CASCADE,
    operating_state VARCHAR(50) NOT NULL DEFAULT 'IDLE' 
        CHECK (operating_state IN ('IDLE', 'STARTING', 'RUNNING', 'STOPPED', 'BREAKDOWN_REPORTED', 'MAINTENANCE', 'EMERGENCY_STOP')),
    motor_state VARCHAR(10) NOT NULL DEFAULT 'OFF' CHECK (motor_state IN ('ON', 'OFF')),
    rpm NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    vibration_rms NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    motor_temp_c NUMERIC(6, 2) NOT NULL DEFAULT 25.00,
    power_kw NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    current_amps NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    e_stop_active BOOLEAN NOT NULL DEFAULT FALSE,
    sensor_comm_status VARCHAR(20) NOT NULL DEFAULT 'CONNECTED' 
        CHECK (sensor_comm_status IN ('CONNECTED', 'DISCONNECTED', 'STALE')),
    cumulative_counter_meters NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    last_processed_counter_meters NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    active_scenario VARCHAR(50) NOT NULL DEFAULT 'NORMAL_PRODUCTION',
    simulation_speed INT NOT NULL DEFAULT 1 CHECK (simulation_speed IN (1, 5, 10)),
    simulation_paused BOOLEAN NOT NULL DEFAULT FALSE,
    downtime_started_at TIMESTAMPTZ,
    last_output_persisted_at TIMESTAMPTZ,
    active_warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. High-Frequency Simulated Hardware Signals Log
CREATE TABLE IF NOT EXISTS machine_signals_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    signal_type VARCHAR(50) NOT NULL,
    signal_value NUMERIC(12, 2) NOT NULL,
    signal_unit VARCHAR(20) NOT NULL,
    signal_source VARCHAR(20) NOT NULL DEFAULT 'SIMULATED',
    quality VARCHAR(20) NOT NULL DEFAULT 'GOOD' CHECK (quality IN ('GOOD', 'WARNING', 'CRITICAL', 'UNCERTAIN')),
    simulated_timestamp TIMESTAMPTZ NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signals_log_mach_time ON machine_signals_log(machine_id, simulated_timestamp DESC);

-- Update check constraint on machines if necessary to support the 7 standardized states
ALTER TABLE machines DROP CONSTRAINT IF EXISTS machines_current_status_check;
ALTER TABLE machines ADD CONSTRAINT machines_current_status_check 
    CHECK (current_status IN ('Idle', 'Running', 'Stopped', 'Breakdown Reported', 'Maintenance', 'IDLE', 'STARTING', 'RUNNING', 'STOPPED', 'BREAKDOWN_REPORTED', 'MAINTENANCE', 'EMERGENCY_STOP'));
