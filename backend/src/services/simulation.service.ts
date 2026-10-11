// FabricTrace Hardware-Inspired Textile Machine Simulation Engine
// Models physical weaving loom signals, state machines, and output calculations

import {
  MachineOperatingState,
  MotorState,
  SensorCommStatus,
  SignalQuality,
  SignalType,
  SimulationScenario,
  HardwareSignal,
  MachineSimulationConfig,
  MachineWarning,
  MachineTelemetry,
} from '../models/simulation.types.js';
import { pool } from '../config/db.js';

class SimulationEngine {
  private machinesState: Map<string, MachineTelemetry> = new Map();
  private timer: NodeJS.Timeout | null = null;
  private tickIntervalMs: number = 1000; // 1 second real-time tick
  private globalSpeed: 1 | 5 | 10 = 1;
  private isPaused: boolean = false;
  private simulatedRecords: {
    id: string;
    order_id: string;
    order_no: string;
    machine_id: string;
    machine_code: string;
    operator_name: string;
    quantity_produced: number;
    recorded_at: string;
  }[] = [
    {
      id: 'rec-init-1',
      order_id: 'ord-1',
      order_no: 'PO-2026-101',
      machine_id: 'mach-1',
      machine_code: 'M-01 (Picanol Airjet Loom)',
      operator_name: 'Rajesh Kumar',
      quantity_produced: 450,
      recorded_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: 'rec-init-2',
      order_id: 'ord-2',
      order_no: 'PO-2026-102',
      machine_id: 'mach-2',
      machine_code: 'M-02 (Toyota JAT810 Loom)',
      operator_name: 'Sunil Verma',
      quantity_produced: 300,
      recorded_at: new Date(Date.now() - 85 * 60 * 1000).toISOString(),
    },
  ];

  constructor() {
    this.initializeDefaultMachines();
    this.startLoop();
  }

  // Initialize initial machine configurations matching the factory floor looms
  private initializeDefaultMachines() {
    const defaultConfigs: {
      id: string;
      code: string;
      process: string;
      state: MachineOperatingState;
      orderId: string | null;
      orderNo: string | null;
      target: number;
      produced: number;
      rpm: number;
    }[] = [
      {
        id: 'mach-1',
        code: 'M-01 (Picanol Airjet Loom)',
        process: 'Weaving',
        state: 'RUNNING',
        orderId: 'ord-1',
        orderNo: 'PO-2026-101',
        target: 5000,
        produced: 3200,
        rpm: 650,
      },
      {
        id: 'mach-2',
        code: 'M-02 (Toyota JAT810 Loom)',
        process: 'Weaving',
        state: 'RUNNING',
        orderId: 'ord-2',
        orderNo: 'PO-2026-102',
        target: 3500,
        produced: 1800,
        rpm: 620,
      },
      {
        id: 'mach-3',
        code: 'M-03 (Dornier Rapier Loom)',
        process: 'Weaving',
        state: 'STOPPED',
        orderId: 'ord-1',
        orderNo: 'PO-2026-101',
        target: 5000,
        produced: 3200,
        rpm: 0,
      },
      {
        id: 'mach-4',
        code: 'M-04 (Mayer & Cie Circular Knit)',
        process: 'Knitting',
        state: 'IDLE',
        orderId: null,
        orderNo: null,
        target: 0,
        produced: 0,
        rpm: 0,
      },
      {
        id: 'mach-5',
        code: 'M-05 (Santoni Seamless Knit)',
        process: 'Knitting',
        state: 'MAINTENANCE',
        orderId: null,
        orderNo: null,
        target: 0,
        produced: 0,
        rpm: 0,
      },
    ];

    for (const d of defaultConfigs) {
      const isRunning = d.state === 'RUNNING';
      const config: MachineSimulationConfig = {
        machine_id: d.id,
        rated_rpm: d.rpm || 650,
        min_rpm_running: 500,
        max_rpm: 850,
        picks_per_cm: 25.0, // standard 25 picks/cm for twill/jersey
        meters_per_hour: 15.6,
        vibration_warning_threshold: 5.5,
        vibration_critical_threshold: 8.0,
        temp_warning_threshold: 75.0,
        temp_critical_threshold: 90.0,
        no_output_threshold_seconds: 1800,
        counter_precision: 1,
      };

      const nowIso = new Date().toISOString();
      const telemetry: MachineTelemetry = {
        machine_id: d.id,
        machine_code: d.code,
        process_type: d.process,
        active_order_id: d.orderId,
        active_order_no: d.orderNo,
        target_quantity: d.target,
        produced_quantity: d.produced,
        operating_state: d.state,
        motor_state: isRunning ? 'ON' : 'OFF',
        rpm: isRunning ? d.rpm : 0,
        vibration_rms: isRunning ? 2.4 : 0.1,
        motor_temp_c: isRunning ? 54.0 : 26.0,
        power_kw: isRunning ? 7.2 : d.state === 'IDLE' ? 1.5 : 0.1,
        current_amps: isRunning ? 16.5 : d.state === 'IDLE' ? 3.8 : 0.2,
        e_stop_active: false,
        sensor_comm_status: 'CONNECTED',
        cumulative_counter_meters: d.produced,
        fractional_meters_buffer: 0,
        last_processed_counter_meters: d.produced,
        active_scenario: isRunning ? 'NORMAL_PRODUCTION' : 'START_MACHINE',
        simulation_speed: 1,
        simulation_paused: false,
        downtime_started_at: d.state === 'STOPPED' ? new Date(Date.now() - 45 * 60 * 1000).toISOString() : null,
        total_downtime_seconds: d.state === 'STOPPED' ? 45 * 60 : 0,
        last_output_persisted_at: isRunning ? new Date(Date.now() - 5 * 60 * 1000).toISOString() : null,
        active_warnings: [],
        recent_signals: [],
        config,
      };

      // M-02 has simulated dormancy warning (no output for > 30m)
      if (d.id === 'mach-2') {
        telemetry.last_output_persisted_at = new Date(Date.now() - 85 * 60 * 1000).toISOString();
      }

      this.machinesState.set(d.id, telemetry);
      this.generateSignalsSnapshot(telemetry);
    }
  }

  // Periodic simulation tick loop
  private startLoop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (!this.isPaused) {
        this.tick();
      }
    }, this.tickIntervalMs);
  }

  // Simulation execution for all machines on each tick
  private tick() {
    const speed = this.globalSpeed;

    for (const [id, m] of this.machinesState.entries()) {
      if (m.simulation_paused) continue;

      // 1. Dynamics and state updates
      this.updateMachinePhysics(m, speed);

      // 2. Production output calculations (Section 4)
      this.calculateSimulatedOutput(m, speed);

      // 3. State-aware no-output warnings (Section 6)
      this.evaluateStateWarnings(m);

      // 4. Record signal packet readings (Section 2)
      this.generateSignalsSnapshot(m);
    }
  }

  // Physical dynamics: RPM inertia, motor temp dissipation, vibration jitter
  private updateMachinePhysics(m: MachineTelemetry, speed: number) {
    const jitter = (Math.random() - 0.5) * 0.4;

    switch (m.operating_state) {
      case 'STARTING':
        m.motor_state = 'ON';
        m.rpm = Math.min(m.config.rated_rpm, m.rpm + 75 * speed);
        m.power_kw = 8.5;
        m.current_amps = 19.5;
        m.vibration_rms = Number((2.8 + jitter).toFixed(2));
        if (m.rpm >= m.config.min_rpm_running) {
          m.operating_state = 'RUNNING';
          m.active_scenario = 'NORMAL_PRODUCTION';
          this.logStateEvent(m, 'Running', 'Loom motor reached operational RPM');
        }
        break;

      case 'RUNNING':
        m.motor_state = 'ON';
        // Fluctuate naturally around rated RPM with realistic motor flutter
        const rpmNoise = (Math.random() - 0.5) * 16;
        m.rpm = Math.max(m.config.min_rpm_running, Math.min(m.config.max_rpm, m.config.rated_rpm + rpmNoise));
        m.power_kw = Number((7.2 + jitter * 0.4).toFixed(2));
        m.current_amps = Number((16.4 + jitter * 0.8).toFixed(2));

        // Vibration behavior based on scenario
        if (m.active_scenario === 'VIBRATION_ANOMALY') {
          m.vibration_rms = Number((6.8 + (Math.random() - 0.5) * 1.2).toFixed(2));
        } else {
          m.vibration_rms = Number((2.4 + (Math.random() - 0.5) * 0.4).toFixed(2));
        }

        // Temperature behavior based on scenario
        if (m.active_scenario === 'OVERHEATING') {
          m.motor_temp_c = Math.min(95, m.motor_temp_c + 0.8 * speed);
          if (m.motor_temp_c >= m.config.temp_critical_threshold) {
            // Critical thermal safety stop
            this.triggerScenario(m.machine_id, 'UNEXPECTED_STOP', 'Thermal overload protection trip (Temperature exceeded critical threshold)');
          }
        } else {
          // Normal thermal equilibrium with slight dynamic breath
          if (m.motor_temp_c < 54) m.motor_temp_c += 0.3 * speed;
          if (m.motor_temp_c > 58) m.motor_temp_c -= 0.3 * speed;
          m.motor_temp_c = Number((m.motor_temp_c + (Math.random() - 0.5) * 0.2).toFixed(1));
        }
        break;

      case 'STOPPED':
      case 'BREAKDOWN_REPORTED':
      case 'EMERGENCY_STOP':
        m.motor_state = 'OFF';
        m.rpm = 0;
        m.vibration_rms = Number((0.08 + Math.random() * 0.05).toFixed(2));
        m.power_kw = 0.1;
        m.current_amps = 0.2;
        // Dynamically accumulate downtime seconds every tick
        m.total_downtime_seconds += speed;
        // Cool down towards ambient 25°C
        if (m.motor_temp_c > 25.5) {
          m.motor_temp_c = Math.max(25, Number((m.motor_temp_c - 0.4 * speed).toFixed(1)));
        }
        break;

      case 'IDLE':
        m.motor_state = 'OFF';
        m.rpm = 0;
        m.vibration_rms = 0.1;
        m.power_kw = 1.2;
        m.current_amps = 3.2;
        if (m.motor_temp_c > 26) m.motor_temp_c = Number((m.motor_temp_c - 0.3 * speed).toFixed(1));
        break;

      case 'MAINTENANCE':
        m.motor_state = 'OFF';
        m.rpm = 0;
        m.vibration_rms = 0.05;
        m.power_kw = 0.0;
        m.current_amps = 0.0;
        m.total_downtime_seconds += speed;
        if (m.motor_temp_c > 25) m.motor_temp_c = Number((m.motor_temp_c - 0.5 * speed).toFixed(1));
        break;
    }
  }

  // Section 4: Calculate simulated fabric output from machine signals
  private calculateSimulatedOutput(m: MachineTelemetry, speed: number) {
    if (
      m.operating_state !== 'RUNNING' ||
      m.motor_state !== 'ON' ||
      m.rpm < m.config.min_rpm_running ||
      m.e_stop_active ||
      m.sensor_comm_status === 'DISCONNECTED' ||
      !m.active_order_id
    ) {
      return;
    }

    if (m.target_quantity > 0 && m.produced_quantity >= m.target_quantity) {
      // Order completed
      m.operating_state = 'IDLE';
      m.motor_state = 'OFF';
      m.rpm = 0;
      this.logStateEvent(m, 'Idle', `Production order ${m.active_order_no} reached target quantity. Loom set to Idle.`);
      return;
    }

    // Dynamic pacing for real-time demo visibility (smooth fractional meter progression)
    const picksPerMeter = m.config.picks_per_cm * 100;
    const metersPerSecond = ((m.rpm / picksPerMeter) / 60) * 12;
    const deltaMeters = metersPerSecond * speed;

    m.fractional_meters_buffer += deltaMeters;
    m.cumulative_counter_meters = Number((m.cumulative_counter_meters + deltaMeters).toFixed(1));

    // Persist full meter increments
    const wholeMetersIncrement = Math.floor(m.fractional_meters_buffer);
    if (wholeMetersIncrement >= 1) {
      m.fractional_meters_buffer -= wholeMetersIncrement;
      const incrementToRecord = wholeMetersIncrement;
      m.last_processed_counter_meters = Math.floor(m.cumulative_counter_meters);
      m.produced_quantity += incrementToRecord;
      m.last_output_persisted_at = new Date().toISOString();

      // Check target limit
      if (m.target_quantity > 0 && m.produced_quantity >= m.target_quantity) {
        m.produced_quantity = m.target_quantity;
      }

      // Persist to database
      this.persistProductionRecord(m, incrementToRecord);
    }
  }

  // Section 6: State-aware no-output warning logic
  private evaluateStateWarnings(m: MachineTelemetry) {
    const now = Date.now();
    const warnings: MachineWarning[] = [];

    // Rule 1: No-output warning (Section 6)
    // Only when RUNNING, order not completed, not idle/maintenance, and last output is older than threshold
    if (m.operating_state === 'RUNNING' && m.last_output_persisted_at) {
      const elapsedSeconds = Math.round((now - new Date(m.last_output_persisted_at).getTime()) / 1000);
      if (elapsedSeconds >= m.config.no_output_threshold_seconds) {
        const elapsedMinutes = Math.round(elapsedSeconds / 60);
        warnings.push({
          id: `warn-no-output-${m.machine_id}`,
          code: 'NO_OUTPUT_DETECTED',
          level: 'WARNING',
          message: `No Output Detected — Verify Production (No meters persisted for ${elapsedMinutes} mins).`,
          triggered_at: new Date().toISOString(),
          can_dismiss: true,
        });
      }
    }

    // Rule 2: Vibration warning
    if (m.vibration_rms >= m.config.vibration_critical_threshold) {
      warnings.push({
        id: `warn-vib-crit-${m.machine_id}`,
        code: 'CRITICAL_VIBRATION',
        level: 'CRITICAL',
        message: `Critical mechanical vibration (${m.vibration_rms} mm/s RMS exceeds ${m.config.vibration_critical_threshold} limit). Inspection required.`,
        triggered_at: new Date().toISOString(),
        can_dismiss: false,
      });
    } else if (m.vibration_rms >= m.config.vibration_warning_threshold) {
      warnings.push({
        id: `warn-vib-warn-${m.machine_id}`,
        code: 'ABNORMAL_VIBRATION',
        level: 'WARNING',
        message: `Abnormal vibration anomaly detected (${m.vibration_rms} mm/s RMS). Bearing / warp tension inspection advised.`,
        triggered_at: new Date().toISOString(),
        can_dismiss: true,
      });
    }

    // Rule 3: Temperature warning
    if (m.motor_temp_c >= m.config.temp_critical_threshold) {
      warnings.push({
        id: `warn-temp-crit-${m.machine_id}`,
        code: 'CRITICAL_OVERHEAT',
        level: 'CRITICAL',
        message: `Motor thermal overload (${m.motor_temp_c.toFixed(1)}°C exceeds ${m.config.temp_critical_threshold}°C safety cutoff).`,
        triggered_at: new Date().toISOString(),
        can_dismiss: false,
      });
    } else if (m.motor_temp_c >= m.config.temp_warning_threshold) {
      warnings.push({
        id: `warn-temp-warn-${m.machine_id}`,
        code: 'MOTOR_OVERHEATING',
        level: 'WARNING',
        message: `High motor temperature warning (${m.motor_temp_c.toFixed(1)}°C). Check airflow and lubrication.`,
        triggered_at: new Date().toISOString(),
        can_dismiss: true,
      });
    }

    // Rule 4: Sensor Communication
    if (m.sensor_comm_status === 'DISCONNECTED') {
      warnings.push({
        id: `warn-comm-disc-${m.machine_id}`,
        code: 'SENSOR_COMM_LOST',
        level: 'WARNING',
        message: 'Telemetry communication link offline. Sensor signals are stale or disconnected.',
        triggered_at: new Date().toISOString(),
        can_dismiss: false,
      });
    }

    // Rule 5: Emergency Stop
    if (m.e_stop_active) {
      warnings.push({
        id: `warn-estop-${m.machine_id}`,
        code: 'EMERGENCY_STOP_ACTIVE',
        level: 'CRITICAL',
        message: 'Emergency Stop Circuit Tripped. Loom halted immediately.',
        triggered_at: new Date().toISOString(),
        can_dismiss: false,
      });
    }

    m.active_warnings = warnings;
  }

  // Section 2: Generate realistic hardware input signals snapshot
  private generateSignalsSnapshot(m: MachineTelemetry) {
    const timestamp = new Date().toISOString();
    const isDisconnected = m.sensor_comm_status === 'DISCONNECTED';
    const quality: SignalQuality = isDisconnected
      ? 'UNCERTAIN'
      : m.active_warnings.some((w) => w.level === 'CRITICAL')
      ? 'CRITICAL'
      : m.active_warnings.length > 0
      ? 'WARNING'
      : 'GOOD';

    const signals: HardwareSignal[] = [
      {
        machine_id: m.machine_id,
        signal_type: 'MOTOR_STATE',
        signal_name: 'Main Drive Motor State',
        value: m.motor_state,
        unit: 'state',
        simulated_timestamp: timestamp,
        signal_source: 'SIMULATED',
        quality: isDisconnected ? 'UNCERTAIN' : 'GOOD',
      },
      {
        machine_id: m.machine_id,
        signal_type: 'MACHINE_RPM',
        signal_name: 'Mainshaft Rotational Speed',
        value: Math.round(m.rpm),
        unit: 'RPM',
        simulated_timestamp: timestamp,
        signal_source: 'SIMULATED',
        quality: m.rpm > m.config.max_rpm ? 'WARNING' : quality,
      },
      {
        machine_id: m.machine_id,
        signal_type: 'VIBRATION_RMS',
        signal_name: 'Bearing Housing Vibration',
        value: m.vibration_rms,
        unit: 'mm/s RMS',
        simulated_timestamp: timestamp,
        signal_source: 'SIMULATED',
        quality:
          m.vibration_rms >= m.config.vibration_critical_threshold
            ? 'CRITICAL'
            : m.vibration_rms >= m.config.vibration_warning_threshold
            ? 'WARNING'
            : 'GOOD',
      },
      {
        machine_id: m.machine_id,
        signal_type: 'MOTOR_TEMPERATURE',
        signal_name: 'Drive Motor Stator Temp',
        value: Number(m.motor_temp_c.toFixed(1)),
        unit: '°C',
        simulated_timestamp: timestamp,
        signal_source: 'SIMULATED',
        quality:
          m.motor_temp_c >= m.config.temp_critical_threshold
            ? 'CRITICAL'
            : m.motor_temp_c >= m.config.temp_warning_threshold
            ? 'WARNING'
            : 'GOOD',
      },
      {
        machine_id: m.machine_id,
        signal_type: 'PRODUCTION_COUNTER',
        signal_name: 'Woven Cloth Counter',
        value: Math.round(m.cumulative_counter_meters),
        unit: 'meters',
        simulated_timestamp: timestamp,
        signal_source: 'SIMULATED',
        quality: isDisconnected ? 'UNCERTAIN' : 'GOOD',
      },
      {
        machine_id: m.machine_id,
        signal_type: 'POWER_CURRENT',
        signal_name: 'Three-Phase Motor Current',
        value: m.current_amps,
        unit: 'A',
        simulated_timestamp: timestamp,
        signal_source: 'SIMULATED',
        quality: 'GOOD',
      },
      {
        machine_id: m.machine_id,
        signal_type: 'EMERGENCY_STOP',
        signal_name: 'E-Stop Safety Relay',
        value: m.e_stop_active ? 'ACTIVE' : 'INACTIVE',
        unit: 'contact',
        simulated_timestamp: timestamp,
        signal_source: 'SIMULATED',
        quality: m.e_stop_active ? 'CRITICAL' : 'GOOD',
      },
      {
        machine_id: m.machine_id,
        signal_type: 'SENSOR_COMM_STATUS',
        signal_name: 'Industrial Gateway Comms',
        value: m.sensor_comm_status,
        unit: 'link',
        simulated_timestamp: timestamp,
        signal_source: 'SIMULATED',
        quality: isDisconnected ? 'WARNING' : 'GOOD',
      },
    ];

    m.recent_signals = signals;
  }

  // Section 5: Build realistic event scenarios (10 Scenarios)
  public triggerScenario(machineId: string, scenario: SimulationScenario, customReason?: string) {
    let m = this.machinesState.get(machineId);
    if (!m) {
      m = this.machinesState.get(`mach-${machineId}`);
    }
    if (!m) {
      const idNum = machineId.replace(/[^0-9]/g, '');
      for (const val of this.machinesState.values()) {
        const valNum = val.machine_id.replace(/[^0-9]/g, '');
        if (
          val.machine_code.toLowerCase().includes(machineId.toLowerCase()) ||
          machineId.toLowerCase().includes(val.machine_id.toLowerCase()) ||
          (idNum && valNum && idNum === valNum)
        ) {
          m = val;
          break;
        }
      }
    }
    if (!m) throw new Error(`Machine ${machineId} not found`);

    m.active_scenario = scenario;

    switch (scenario) {
      case 'START_MACHINE':
        m.e_stop_active = false;
        m.operating_state = 'STARTING';
        m.motor_state = 'ON';
        m.rpm = 250;
        this.logStateEvent(m, 'Running', customReason || 'Machine start initiated via operator controls');
        break;

      case 'NORMAL_PRODUCTION':
        m.operating_state = 'RUNNING';
        m.motor_state = 'ON';
        m.rpm = m.config.rated_rpm;
        m.vibration_rms = 2.4;
        m.e_stop_active = false;
        m.sensor_comm_status = 'CONNECTED';
        m.last_output_persisted_at = new Date().toISOString();
        this.logStateEvent(m, 'Running', customReason || 'Normal production weaving operating mode');
        break;

      case 'UNEXPECTED_STOP':
        m.operating_state = 'STOPPED';
        m.motor_state = 'OFF';
        m.rpm = 0;
        m.downtime_started_at = new Date().toISOString();
        this.logStateEvent(m, 'Stopped', customReason || 'Unexpected stoppage: warp yarn breakage / mechanical sensor trip');
        break;

      case 'VIBRATION_ANOMALY':
        m.vibration_rms = 6.8;
        // Does not immediately claim confirmed breakdown (Section 3)
        this.logStateEvent(m, 'Running', customReason || 'Vibration anomaly detected on main bearing housing');
        break;

      case 'OVERHEATING':
        m.motor_temp_c = 78.5; // Exceeds warning threshold
        this.logStateEvent(m, 'Running', customReason || 'Drive motor stator temperature warning threshold crossed');
        break;

      case 'EMERGENCY_STOP':
        m.e_stop_active = true;
        m.operating_state = 'EMERGENCY_STOP';
        m.motor_state = 'OFF';
        m.rpm = 0;
        m.downtime_started_at = new Date().toISOString();
        this.logStateEvent(m, 'Stopped', customReason || 'Simulated Emergency Stop button pressed by floor operator');
        break;

      case 'SENSOR_DISCONNECT':
        m.sensor_comm_status = 'DISCONNECTED';
        this.logStateEvent(m, m.operating_state === 'RUNNING' ? 'Running' : 'Stopped', customReason || 'Sensor communication gateway disconnected');
        break;

      case 'SENSOR_RECONNECT':
        m.sensor_comm_status = 'CONNECTED';
        this.logStateEvent(m, m.operating_state === 'RUNNING' ? 'Running' : 'Stopped', customReason || 'Sensor communication gateway restored');
        break;

      case 'RESUME_PRODUCTION':
        if (m.e_stop_active) m.e_stop_active = false;
        if (m.downtime_started_at) {
          const diffSec = Math.round((Date.now() - new Date(m.downtime_started_at).getTime()) / 1000);
          m.total_downtime_seconds += Math.max(1, diffSec);
          m.downtime_started_at = null;
        }
        m.operating_state = 'RUNNING';
        m.motor_state = 'ON';
        m.rpm = m.config.rated_rpm;
        m.last_output_persisted_at = new Date().toISOString();
        this.logStateEvent(m, 'Resumed', customReason || 'Operator cleared stoppage and resumed loom production');
        break;

      case 'PLANNED_MAINTENANCE':
        m.operating_state = 'MAINTENANCE';
        m.motor_state = 'OFF';
        m.rpm = 0;
        this.logStateEvent(m, 'Maintenance', customReason || 'Scheduled preventative maintenance lubrication and overhaul');
        break;
    }

    this.evaluateStateWarnings(m);
    this.generateSignalsSnapshot(m);
    return m;
  }

  // Record events to machine_events and sync order review flag
  private async logStateEvent(m: MachineTelemetry, eventType: string, reason: string) {
    try {
      // Resolve numeric machine_id for PostgreSQL
      let numericId: number | null = null;
      const numMatch = m.machine_id.match(/\d+/);
      if (numMatch) {
        numericId = parseInt(numMatch[0], 10);
      }

      let dbMachineId: number | null = null;
      if (numericId) {
        const mCheck = await pool.query("SELECT id FROM machines WHERE id = $1 LIMIT 1", [numericId]);
        if (mCheck.rows.length > 0) dbMachineId = mCheck.rows[0].id;
      }
      if (!dbMachineId) {
        const mCheck = await pool.query("SELECT id FROM machines WHERE machine_code ILIKE $1 LIMIT 1", [`%${m.machine_code.split(' ')[0]}%`]);
        if (mCheck.rows.length > 0) dbMachineId = mCheck.rows[0].id;
      }

      if (dbMachineId) {
        let dbStatus = 'AVAILABLE';
        let dbEventType = 'OTHER';
        if (eventType === 'Running' || eventType === 'Resumed') {
          dbStatus = 'RUNNING';
          dbEventType = 'START';
        } else if (eventType === 'Stopped' || eventType === 'Emergency Stop') {
          dbStatus = 'STOPPED';
          dbEventType = 'STOP';
        } else if (eventType === 'Maintenance') {
          dbStatus = 'MAINTENANCE';
          dbEventType = 'MAINTENANCE';
        }

        await pool.query(
          "UPDATE machines SET status = $1 WHERE id = $2",
          [dbStatus, dbMachineId]
        );

        await pool.query(
          `INSERT INTO machine_events (machine_id, event_type, reason, started_at, remarks, created_at)
           VALUES ($1, $2, $3, NOW(), $4, NOW())`,
          [dbMachineId, dbEventType, reason, `Simulator event: ${eventType}`]
        );
      }
    } catch {
      // Offline fallback: handled in-memory
    }
  }

  // Persist calculated output to production_records
  private async persistProductionRecord(m: MachineTelemetry, qty: number) {
    if (!m.active_order_id || qty <= 0) return;
    const nowIso = new Date().toISOString();
    
    // Always store in memory for immediate live sync
    const simRec = {
      id: `rec-sim-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      order_id: m.active_order_id,
      order_no: m.active_order_no || 'PO-2026-101',
      machine_id: m.machine_id,
      machine_code: m.machine_code,
      operator_name: 'Simulator Auto-Runner',
      quantity_produced: qty,
      recorded_at: nowIso,
    };
    this.simulatedRecords.unshift(simRec);
    if (this.simulatedRecords.length > 50) {
      this.simulatedRecords.pop();
    }

    try {
      let numericMachineId: number | null = null;
      const mMatch = String(m.machine_id).match(/\d+/);
      if (mMatch) numericMachineId = parseInt(mMatch[0], 10);

      const numOrderId = Number(m.active_order_id);
      if (!isNaN(numOrderId)) {
        await pool.query(
          `INSERT INTO production_records (production_order_id, machine_id, employee_id, quantity_produced, production_date, remarks, created_at)
           VALUES ($1, $2, 1, $3, NOW(), 'Simulator telemetry auto-logged output', NOW())`,
          [numOrderId, numericMachineId, qty]
        );
        await pool.query(
          `UPDATE production_orders 
           SET produced_quantity = produced_quantity + $1, updated_at = NOW() 
           WHERE id = $2`,
          [qty, numOrderId]
        );
      }
    } catch {
      // Offline fallback: already captured in this.simulatedRecords
    }
  }

  // Public records APIs
  public getSimulatedRecords() {
    return this.simulatedRecords;
  }

  public addSimulatedRecord(record: {
    order_id: string;
    order_no?: string;
    machine_id: string;
    machine_code?: string;
    operator_name?: string;
    quantity_produced: number;
  }) {
    const mach = this.machinesState.get(record.machine_id);
    const rec = {
      id: `rec-user-${Date.now()}`,
      order_id: record.order_id,
      order_no: record.order_no || mach?.active_order_no || 'PO-2026-101',
      machine_id: record.machine_id,
      machine_code: record.machine_code || mach?.machine_code || 'Loom',
      operator_name: record.operator_name || 'Floor Operator',
      quantity_produced: record.quantity_produced,
      recorded_at: new Date().toISOString(),
    };
    this.simulatedRecords.unshift(rec);
    if (mach) {
      mach.produced_quantity += record.quantity_produced;
      mach.cumulative_counter_meters += record.quantity_produced;
      mach.last_output_persisted_at = rec.recorded_at;
      if (mach.operating_state === 'STOPPED' || mach.operating_state === 'IDLE' || mach.operating_state === 'STARTING') {
        mach.operating_state = 'RUNNING';
        mach.rpm = mach.config.rated_rpm;
      }
    }
    return rec;
  }

  // Public control APIs
  public getMachineTelemetry(machineId: string): MachineTelemetry | undefined {
    return this.machinesState.get(machineId);
  }

  public getAllMachinesTelemetry(): MachineTelemetry[] {
    return Array.from(this.machinesState.values());
  }

  public setGlobalSpeed(speed: 1 | 5 | 10) {
    this.globalSpeed = speed;
    for (const m of this.machinesState.values()) {
      m.simulation_speed = speed;
    }
  }

  public getGlobalSpeed(): 1 | 5 | 10 {
    return this.globalSpeed;
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
    for (const m of this.machinesState.values()) {
      m.simulation_paused = paused;
    }
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  public updateConfig(machineId: string, partial: Partial<MachineSimulationConfig>) {
    const m = this.machinesState.get(machineId);
    if (!m) throw new Error(`Machine ${machineId} not found`);
    m.config = { ...m.config, ...partial };
    return m.config;
  }
}

export const simulationEngine = new SimulationEngine();
