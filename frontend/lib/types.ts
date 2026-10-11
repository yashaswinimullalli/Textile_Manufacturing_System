export type YarnType = 'Cotton' | 'Polyester' | 'Blend';

export type StockMovementType = 'RECEIPT' | 'ISSUE' | 'CONSUMPTION' | 'ADJUSTMENT';

export type OrderStatus = 'Planned' | 'In Progress' | 'On Hold' | 'Completed';

export type MachineStatus = 'Idle' | 'Running' | 'Stopped' | 'Breakdown Reported' | 'Maintenance';

export type MachineEventType = 'Running' | 'Idle' | 'Stopped' | 'Breakdown Reported' | 'Maintenance' | 'Resumed';

export type EventSource = 'Operator Report' | 'Simulator';

export type InspectionDisposition =
  | 'PENDING_INSPECTION'
  | 'ON_HOLD'
  | 'PASSED'
  | 'PARTIALLY_ACCEPTED'
  | 'REJECTED';

export type InspectionStage = 'INITIAL' | 'REINSPECTION' | 'AUDIT';

export type SpecCheckResult = 'Pass' | 'Fail' | 'Not Tested';

export type PackagingCondition = 'Acceptable' | 'Damaged';
export type ContaminationObserved = 'Not observed' | 'Observed';
export type VisualQuality = 'Acceptable' | 'Issue found';

export interface SpecCheckItem {
  id: string;
  test_name: string;
  expected_spec: string;
  actual_value: string | number | null;
  unit: string;
  result: SpecCheckResult;
  is_mandatory: boolean;
  remarks?: string;
}

export interface QualityInspection {
  id: string;
  batch_id: string;
  batch_code?: string;
  barcode?: string;
  supplier?: string;
  yarn_type?: string;
  colour?: string;
  inspection_number: number;
  stage: InspectionStage;
  inspector_name: string;
  inspection_date: string;

  // Visual observations
  packaging_condition: PackagingCondition;
  visible_contamination: ContaminationObserved;
  colour_consistency: VisualQuality;
  yarn_appearance: VisualQuality;
  visual_remarks?: string;
  defect_description?: string;
  photo_url?: string;

  // Lab / specification checks
  spec_checks: SpecCheckItem[];
  supplier_cert_ref?: string;

  // Decision & quantities
  decision: InspectionDisposition;
  quantity_inspected: number;
  quantity_approved: number;
  quantity_held: number;
  quantity_rejected: number;
  decision_reason?: string;
  reinspection_reason?: string;

  created_at: string;
}

export interface YarnBatch {
  id: string;
  batch_code: string;
  barcode: string;
  yarn_type: YarnType;
  colour: string;
  supplier: string;
  quantity_received: number;
  quantity_available: number;
  quantity_approved?: number;
  quantity_held?: number;
  quantity_rejected?: number;
  inspection_status?: InspectionDisposition;
  yarn_count_spec?: string;
  po_reference?: string;
  certificate_reference?: string;
  unit: string;
  reorder_threshold: number;
  storage_location?: string;
  intake_scanned?: boolean;
  received_at: string;
  created_at: string;
}

export interface StockMovement {
  id: string;
  batch_id: string;
  batch_code?: string;
  movement_type: StockMovementType;
  quantity: number;
  reference: string;
  order_id?: string;
  order_no?: string;
  created_at: string;
}

export interface ProductionOrder {
  id: string;
  order_no: string;
  customer_reference: string;
  fabric_type: string;
  target_quantity: number;
  produced_quantity: number;
  required_yarn_quantity: number;
  due_date: string;
  status: OrderStatus;
  is_flagged_for_review?: boolean;
  flag_reason?: string;
  assigned_machine_code?: string;
  created_at: string;
  updated_at?: string;
}

export interface Machine {
  id: string;
  machine_code: string;
  machine_name?: string;
  process_type: string;
  current_status: MachineStatus;
  current_shift?: string;
  assigned_operator?: string;
  active_order_id?: string;
  active_order_no?: string;
  customer_name?: string;
  fabric_type?: string;
  capacity?: number;
  last_output_time?: string;
  created_at: string;
  updated_at?: string;
}

export interface MachineAssignment {
  id: string;
  machine_id: string;
  order_id: string;
  shift: string;
  operator_name?: string;
  start_time: string;
  end_time?: string;
}

export interface ProductionRecord {
  id: string;
  order_id: string;
  order_no?: string;
  machine_id: string;
  machine_code?: string;
  operator_name?: string;
  quantity_produced: number;
  recorded_at: string;
}


export interface MachineEvent {
  id: string;
  machine_id: string;
  machine_code?: string;
  order_id?: string;
  order_no?: string;
  event_type: MachineEventType;
  event_source: EventSource;
  reason?: string;
  event_time: string;
  created_at: string;
}

export interface MaterialAvailability {
  order_id: string;
  order_no: string;
  fabric_type: string;
  required_quantity: number;
  available_quantity: number;
  shortage_quantity: number;
  is_sufficient: boolean;
  unit: string;
  recommended_batches?: {
    batch_code: string;
    yarn_type: string;
    colour: string;
    quantity_available: number;
  }[];
}

export interface PossibleStoppageWarning {
  machine_id: string;
  machine_code: string;
  order_no?: string;
  last_output_time: string;
  minutes_inactive: number;
  status: MachineStatus;
  message: string;
}

export interface SupervisorDashboardMetrics {
  active_orders_count: number;
  running_machines_count: number;
  idle_machines_count: number;
  stopped_machines_count: number;
  total_target_quantity: number;
  total_produced_quantity: number;
  overall_progress_percentage: number;
  total_downtime_minutes: number;
  low_stock_batch_count: number;
  flagged_orders_count?: number;
  orders_approaching_deadline: ProductionOrder[];
  possible_stoppages: PossibleStoppageWarning[];
  recent_events: MachineEvent[];
}

// Hardware Simulation Types
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
  rated_rpm: number;
  min_rpm_running: number;
  max_rpm: number;
  picks_per_cm: number;
  meters_per_hour: number;
  vibration_warning_threshold: number;
  vibration_critical_threshold: number;
  temp_warning_threshold: number;
  temp_critical_threshold: number;
  no_output_threshold_seconds: number;
  counter_precision: number;
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

