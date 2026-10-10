// FabricTrace Hardware-Inspired Simulation Models & Types

export type MachineOperatingState =
  | 'IDLE'
  | 'STARTING'
  | 'RUNNING'
  | 'STOPPED'
  | 'BREAKDOWN_REPORTED'
  | 'MAINTENANCE'
  | 'EMERGENCY_STOP';

export type MotorState = 'ON' | 'OFF';
export type SensorCommStatus = 'CONNECTED' | 'DISCONNECTED' | 'STALE';
export type SignalQuality = 'GOOD' | 'WARNING' | 'CRITICAL' | 'UNCERTAIN';

export type SignalType =
  | 'MOTOR_STATE'
  | 'MACHINE_RPM'
  | 'VIBRATION_RMS'
  | 'MOTOR_TEMPERATURE'
  | 'PRODUCTION_COUNTER'
  | 'POWER_CURRENT'
  | 'EMERGENCY_STOP'
  | 'SENSOR_COMM_STATUS';

export type SimulationScenario =
  | 'START_MACHINE'
  | 'NORMAL_PRODUCTION'
  | 'UNEXPECTED_STOP'
  | 'VIBRATION_ANOMALY'
  | 'OVERHEATING'
  | 'EMERGENCY_STOP'
  | 'SENSOR_DISCONNECT'
  | 'SENSOR_RECONNECT'
  | 'RESUME_PRODUCTION'
  | 'PLANNED_MAINTENANCE';

export interface HardwareSignal {
  machine_id: string;
  signal_type: SignalType;
  signal_name: string;
  value: number | string | boolean;
  unit: string;
  simulated_timestamp: string;
  signal_source: 'SIMULATED';
  quality: SignalQuality;
}

export interface MachineSimulationConfig {
  machine_id: string;
  rated_rpm: number; // e.g., 650 RPM for Picanol OmniPlus / Toyota JAT
  min_rpm_running: number; // e.g., 500 RPM
  max_rpm: number; // e.g., 900 RPM
  picks_per_cm: number; // e.g., 25 picks/cm
  meters_per_hour: number; // e.g., 15.6 m/hr at rated RPM
  vibration_warning_threshold: number; // mm/s RMS (e.g., 5.5)
  vibration_critical_threshold: number; // mm/s RMS (e.g., 8.0)
  temp_warning_threshold: number; // °C (e.g., 75.0)
  temp_critical_threshold: number; // °C (e.g., 90.0)
  no_output_threshold_seconds: number; // default 1800 (30 mins)
  counter_precision: number; // meters precision (1)
}

export interface MachineWarning {
  id: string;
  code: string;
  level: 'WARNING' | 'CRITICAL';
  message: string;
  triggered_at: string;
  can_dismiss: boolean;
}

export interface MachineTelemetry {
  machine_id: string;
  machine_code: string;
  process_type: string;
  active_order_id?: string | null;
  active_order_no?: string | null;
  target_quantity: number;
  produced_quantity: number;
  operating_state: MachineOperatingState;
  motor_state: MotorState;
  rpm: number;
  vibration_rms: number;
  motor_temp_c: number;
  power_kw: number;
  current_amps: number;
  e_stop_active: boolean;
  sensor_comm_status: SensorCommStatus;
  cumulative_counter_meters: number;
  fractional_meters_buffer: number;
  last_processed_counter_meters: number;
  active_scenario: SimulationScenario;
  simulation_speed: 1 | 5 | 10;
  simulation_paused: boolean;
  downtime_started_at?: string | null;
  total_downtime_seconds: number;
  last_output_persisted_at?: string | null;
  active_warnings: MachineWarning[];
  recent_signals: HardwareSignal[];
  config: MachineSimulationConfig;
}
