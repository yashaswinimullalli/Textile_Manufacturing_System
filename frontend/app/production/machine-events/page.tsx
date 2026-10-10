'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Activity,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Wrench,
  Play,
  RotateCcw,
  Send,
  ChevronDown,
  Gauge,
  Thermometer,
  Radio,
  Power,
  Flame,
  ShieldAlert,
  Wifi,
  WifiOff,
  Layers,
  Cpu,
  Sliders,
  RefreshCw,
  Info,
  Pause,
  FastForward,
  AlertOctagon,
  SkipForward,
  SkipBack,
  Square,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  MachineTelemetry,
  SimulationScenario,
  HardwareSignal,
  MachineOperatingState,
} from '@/lib/types';

const STATE_CONFIG: Record<
  MachineOperatingState,
  { label: string; badge: string; color: string; border: string }
> = {
  RUNNING: {
    label: 'RUNNING',
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    color: 'text-emerald-400',
    border: 'border-emerald-500/40',
  },
  STARTING: {
    label: 'STARTING',
    badge: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    color: 'text-teal-300',
    border: 'border-teal-500/40',
  },
  IDLE: {
    label: 'IDLE',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    color: 'text-amber-300',
    border: 'border-amber-500/40',
  },
  STOPPED: {
    label: 'STOPPED',
    badge: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    color: 'text-rose-400',
    border: 'border-rose-500/40',
  },
  BREAKDOWN_REPORTED: {
    label: 'BREAKDOWN REPORTED',
    badge: 'bg-red-600/25 text-red-400 border-red-600/50',
    color: 'text-red-400',
    border: 'border-red-600/50',
  },
  MAINTENANCE: {
    label: 'MAINTENANCE',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    color: 'text-purple-300',
    border: 'border-purple-500/40',
  },
  EMERGENCY_STOP: {
    label: 'EMERGENCY STOP',
    badge: 'bg-red-700/30 text-red-300 border-red-500 animate-pulse',
    color: 'text-red-400',
    border: 'border-red-500',
  },
};

export default function MachineEventsPage() {
  const [telemetries, setTelemetries] = useState<MachineTelemetry[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState<string>('mach-1');
  const [globalSpeed, setGlobalSpeed] = useState<1 | 5 | 10>(1);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Automated Scenario Walkthrough Simulation State
  const [isAutoSimRunning, setIsAutoSimRunning] = useState<boolean>(false);
  const [isAutoSimPaused, setIsAutoSimPaused] = useState<boolean>(false);
  const [currentAutoIndex, setCurrentAutoIndex] = useState<number>(0);
  const [autoStepSecondsLeft, setAutoStepSecondsLeft] = useState<number>(5);
  const [autoStepDuration, setAutoStepDuration] = useState<number>(5);
  const [autoSimTotalMeters, setAutoSimTotalMeters] = useState<number>(0);

  const autoScenarios = [
    {
      scenario: 'START_MACHINE' as SimulationScenario,
      stepNumber: 1,
      title: '1. Machine Startup & Spin-Up',
      description: 'Main drive motor engages. RPM ramps up smoothly from 0 to 250 RPM.',
      impactOnOutput: 'Motor engaged • Warming up drive • Output rate: 0.0 m/hr',
      metersToAdd: 0,
      badgeColor: 'text-teal-400 bg-teal-950/60 border-teal-800',
    },
    {
      scenario: 'NORMAL_PRODUCTION' as SimulationScenario,
      stepNumber: 2,
      title: '2. Normal Production Weaving',
      description: 'Loom runs at rated 650 RPM. Weaving 25 picks/cm cloth continuously.',
      impactOnOutput: 'Steady production: 15.6 m/hr • +25 meters logged to Work Order',
      metersToAdd: 25,
      badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-800',
    },
    {
      scenario: 'VIBRATION_ANOMALY' as SimulationScenario,
      stepNumber: 3,
      title: '3. Bearing Vibration Anomaly',
      description: 'Vibration RMS rises to 6.8 mm/s. State warning alert active; loom keeps running.',
      impactOnOutput: 'Warning flagged • Production continues cautiously (+15m)',
      metersToAdd: 15,
      badgeColor: 'text-amber-400 bg-amber-950/60 border-amber-800',
    },
    {
      scenario: 'OVERHEATING' as SimulationScenario,
      stepNumber: 4,
      title: '4. Motor Overheating Warning',
      description: 'Stator temperature rises to 78.5°C crossing thermal warning threshold.',
      impactOnOutput: 'Thermal warning active • Production continues (+10m)',
      metersToAdd: 10,
      badgeColor: 'text-rose-400 bg-rose-950/60 border-rose-800',
    },
    {
      scenario: 'UNEXPECTED_STOP' as SimulationScenario,
      stepNumber: 5,
      title: '5. Unexpected Stoppage (Warp Break)',
      description: 'Warp yarn breakage detected on beam 2. Immediate motor stop, downtime starts, order flagged.',
      impactOnOutput: 'HALTED: Output pauses • Downtime accumulating • Work Order FLAGGED FOR REVIEW',
      metersToAdd: 0,
      badgeColor: 'text-red-400 bg-red-950/60 border-red-800',
    },
    {
      scenario: 'EMERGENCY_STOP' as SimulationScenario,
      stepNumber: 6,
      title: '6. Simulated Emergency Stop Trip',
      description: 'E-Stop circuit tripped. Safety relay disengaged. Stoppage interlock engaged.',
      impactOnOutput: 'E-STOP Tripped • Output: 0.0 m/hr • Immediate safety halt',
      metersToAdd: 0,
      badgeColor: 'text-red-400 bg-red-950/60 border-red-800',
    },
    {
      scenario: 'SENSOR_DISCONNECT' as SimulationScenario,
      stepNumber: 7,
      title: '7. Disconnect Sensor Gateway',
      description: 'Telemetry gateway offline. Signals marked UNCERTAIN/STALE, preventing inaccurate logs.',
      impactOnOutput: 'Gateway link lost • Machine telemetry uncertain • Signals marked stale',
      metersToAdd: 0,
      badgeColor: 'text-slate-300 bg-slate-900 border-slate-700',
    },
    {
      scenario: 'SENSOR_RECONNECT' as SimulationScenario,
      stepNumber: 8,
      title: '8. Reconnect Sensor Gateway',
      description: 'Gateway restored. All 8 signal packets validated back to GOOD quality stream.',
      impactOnOutput: 'Gateway reconnected • Signals back to GOOD quality stream',
      metersToAdd: 0,
      badgeColor: 'text-teal-400 bg-teal-950/60 border-teal-800',
    },
    {
      scenario: 'RESUME_PRODUCTION' as SimulationScenario,
      stepNumber: 9,
      title: '9. Resume Production',
      description: 'Fault cleared. Operator resumes loom. RPM restored to 650. Downtime stops.',
      impactOnOutput: 'RESUMED: Output restarts • Downtime timer halted • +35 meters logged',
      metersToAdd: 35,
      badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-800',
    },
    {
      scenario: 'PLANNED_MAINTENANCE' as SimulationScenario,
      stepNumber: 10,
      title: '10. Planned Maintenance',
      description: 'Loom placed into scheduled maintenance mode for lubrication and routine servicing.',
      impactOnOutput: 'Maintenance Mode • Loom offline for servicing • Output safely paused',
      metersToAdd: 0,
      badgeColor: 'text-purple-400 bg-purple-950/60 border-purple-800',
    },
  ];

  // Poll telemetry every 1.5s for live signals visualization
  const fetchTelemetry = useCallback(async () => {
    try {
      const data = await api.getAllSimulationMachines();
      if (data && data.length > 0) {
        setTelemetries(data);
        if (!selectedMachineId) {
          setSelectedMachineId(data[0].machine_id);
        }
      }
    } catch (err) {
      console.error('Failed to poll machine telemetry', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMachineId]);

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 1500);
    return () => clearInterval(interval);
  }, [fetchTelemetry]);

  const selectedMachine =
    telemetries.find((t) => t.machine_id === selectedMachineId) || telemetries[0];

  const executeAutoStep = useCallback(
    async (stepIndex: number) => {
      const step = autoScenarios[stepIndex];
      if (!step) return;
      const targetMachine = selectedMachine || telemetries[0] || { machine_id: 'mach-1', machine_code: 'M-01', active_order_id: 'ord-1' };
      setCurrentAutoIndex(stepIndex);
      setAutoStepSecondsLeft(autoStepDuration);

      try {
        await api.triggerSimulationScenario(
          targetMachine.machine_id,
          step.scenario,
          `Auto-Simulation Step ${step.stepNumber}: ${step.title}`
        );

        if (step.metersToAdd > 0) {
          const targetOrderId = targetMachine.active_order_id || 'ord-1';
          await api.recordProductionOutput(targetOrderId, {
            machine_id: targetMachine.machine_id,
            quantity_produced: step.metersToAdd,
          });
          setAutoSimTotalMeters((prev) => prev + step.metersToAdd);
        }

        setFeedback({
          type: 'success',
          message: `Auto-Sim [${step.stepNumber}/10]: "${step.title}" running. ${step.impactOnOutput}`,
        });
        await fetchTelemetry();
      } catch (err: any) {
        console.error('Error executing auto step', err);
      }
    },
    [autoScenarios, selectedMachine, telemetries, autoStepDuration, fetchTelemetry]
  );

  // Auto-run ticker effect
  useEffect(() => {
    if (!isAutoSimRunning || isAutoSimPaused) return;

    const interval = setInterval(() => {
      setAutoStepSecondsLeft((prev) => {
        if (prev <= 1) {
          setCurrentAutoIndex((currIdx) => {
            const nextIdx = (currIdx + 1) % autoScenarios.length;
            executeAutoStep(nextIdx);
            return nextIdx;
          });
          return autoStepDuration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAutoSimRunning, isAutoSimPaused, autoStepDuration, autoScenarios.length, executeAutoStep]);

  const handleStartAutoSim = () => {
    setIsAutoSimRunning(true);
    setIsAutoSimPaused(false);
    setAutoSimTotalMeters(0);
    executeAutoStep(0);
  };

  const handleStopAutoSim = () => {
    setIsAutoSimRunning(false);
    setIsAutoSimPaused(false);
    setCurrentAutoIndex(0);
    setAutoStepSecondsLeft(autoStepDuration);
  };

  const handleToggleAutoSimPause = () => {
    setIsAutoSimPaused((p) => !p);
  };

  const handleNextAutoStep = () => {
    const nextIdx = (currentAutoIndex + 1) % autoScenarios.length;
    executeAutoStep(nextIdx);
  };

  const handlePrevAutoStep = () => {
    const prevIdx = (currentAutoIndex - 1 + autoScenarios.length) % autoScenarios.length;
    executeAutoStep(prevIdx);
  };

  // Control simulation speed or pause
  const handleSpeedChange = async (speed: 1 | 5 | 10) => {
    try {
      await api.setSimulationControl({ speed });
      setGlobalSpeed(speed);
      fetchTelemetry();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePause = async () => {
    try {
      const nextPaused = !isPaused;
      await api.setSimulationControl({ paused: nextPaused });
      setIsPaused(nextPaused);
      fetchTelemetry();
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger one of the 10 scenarios manually
  const handleTriggerScenario = async (scenario: SimulationScenario, reason?: string) => {
    if (!selectedMachine) return;
    setActionLoading(true);
    setFeedback(null);

    if (isAutoSimRunning) {
      setIsAutoSimRunning(false);
    }
    const idx = autoScenarios.findIndex((s) => s.scenario === scenario);
    if (idx !== -1) {
      setCurrentAutoIndex(idx);
    }

    try {
      const res = await api.triggerSimulationScenario(selectedMachine.machine_id, scenario, reason);

      if ((scenario === 'NORMAL_PRODUCTION' || scenario === 'RESUME_PRODUCTION') && selectedMachine.active_order_id) {
        const delta = scenario === 'NORMAL_PRODUCTION' ? 25 : 35;
        try {
          await api.recordProductionOutput(selectedMachine.active_order_id, {
            machine_id: selectedMachine.machine_id,
            quantity_produced: delta,
          });
          setAutoSimTotalMeters((prev) => prev + delta);
        } catch (e) {
          console.warn('Record output sync', e);
        }
      }

      setFeedback({
        type: 'success',
        message: `Scenario "${scenario}" executed. Operating State → ${res.operating_state}.`,
      });
      await fetchTelemetry();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to trigger scenario.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && telemetries.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-950 text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400" />
          <p className="text-xs font-mono">Initializing Hardware Telemetry Simulator...</p>
        </div>
      </div>
    );
  }

  const orderProgressPercent =
    selectedMachine && selectedMachine.target_quantity > 0
      ? Math.min(
          100,
          Math.round(
            (selectedMachine.produced_quantity / selectedMachine.target_quantity) * 100
          )
        )
      : 0;

  return (
    <div className="bg-slate-950 min-h-[calc(100vh-4rem)] -m-6 p-6 space-y-6 text-slate-100">
      {/* Disclaimer Alert Banner */}
      <div className="bg-slate-900 border border-teal-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Radio className="h-4 w-4 text-teal-400 animate-pulse flex-shrink-0" />
          <p className="text-slate-300 leading-relaxed">
            <strong className="text-teal-400">Software Simulation Engine:</strong> Signals and fabric output are computed via configurable physics models. No real physical sensor hardware is connected.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="bg-teal-950 text-teal-400 border border-teal-800 text-[11px] font-mono px-2 py-0.5 rounded font-bold uppercase">
            SOURCE: SIMULATED
          </span>
          <Link
            href="/production/machines"
            className="text-xs text-slate-400 hover:text-white underline underline-offset-2"
          >
            Back to Machine Floor
          </Link>
        </div>
      </div>

      {/* Header & Global Simulator Controls Toolbar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Activity className="h-6 w-6 text-teal-400" />
            <h1 className="text-xl font-bold text-white">
              Weaving Loom Telemetry & Signal Simulator
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-signal telemetry simulation for industrial weaving and knitting machines.
          </p>
        </div>

        {/* Global Controls: Speed, Auto-Simulation & Pause */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Prominent Start Auto-Simulation Walkthrough Button */}
          <button
            type="button"
            onClick={isAutoSimRunning ? handleToggleAutoSimPause : handleStartAutoSim}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md transition-all ${
              isAutoSimRunning
                ? isAutoSimPaused
                  ? 'bg-amber-600 hover:bg-amber-500 text-white ring-2 ring-amber-400/50'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400/50'
                : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500 text-white ring-2 ring-teal-400/40 shadow-lg shadow-teal-500/20'
            }`}
          >
            {isAutoSimRunning ? (
              isAutoSimPaused ? (
                <>
                  <Play className="h-4 w-4 fill-white" />
                  <span>Resume Simulation</span>
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4" />
                  <span>Pause Sim (Step {currentAutoIndex + 1}/10)</span>
                </>
              )
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-emerald-200 animate-spin" />
                <span>Start Simulation (Run All Scenarios)</span>
              </>
            )}
          </button>

          <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg p-1 text-xs">
            <span className="text-slate-400 px-2 font-medium">Speed:</span>
            {[1, 5, 10].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSpeedChange(s as 1 | 5 | 10)}
                className={`px-2.5 py-1 rounded font-mono font-bold transition-colors ${
                  globalSpeed === s
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleTogglePause}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
              isPaused
                ? 'bg-amber-600/20 text-amber-300 border-amber-600 hover:bg-amber-600/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
          >
            {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            <span>{isPaused ? 'Resume Sim' : 'Pause Sim'}</span>
          </button>

          <button
            type="button"
            onClick={fetchTelemetry}
            className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-750 text-slate-300"
            title="Refresh Telemetry"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Target Loom Selection Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <span className="text-xs text-slate-400 font-medium mr-1">Target Loom:</span>
        {telemetries.map((m) => {
          const isSelected = m.machine_id === selectedMachine?.machine_id;
          const stateCfg = STATE_CONFIG[m.operating_state] || STATE_CONFIG.IDLE;
          return (
            <button
              key={m.machine_id}
              type="button"
              onClick={() => setSelectedMachineId(m.machine_id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all ${
                isSelected
                  ? 'bg-slate-800 text-white border-teal-500 shadow-sm ring-1 ring-teal-500/50'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800/80 hover:text-slate-200'
              }`}
            >
              <span>{m.machine_code.split(' ')[0]}</span>
              <span className={`h-2 w-2 rounded-full ${m.operating_state === 'RUNNING' ? 'bg-emerald-400 animate-pulse' : m.operating_state === 'STOPPED' ? 'bg-rose-500' : 'bg-slate-500'}`} />
              <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${stateCfg.badge}`}>
                {m.operating_state}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Machine Telemetry Overview */}
      {selectedMachine && (
        <div className="space-y-6">
          {/* Main Telemetry & State Dashboard */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
                  {selectedMachine.process_type} Line • Industrial Loom Telemetry
                </span>
                <h2 className="text-lg font-bold text-white mt-0.5">
                  {selectedMachine.machine_code}
                </h2>
              </div>

              <div className="flex items-center gap-2.5">
                <span className={`px-3 py-1 rounded-lg border text-xs font-mono font-bold ${STATE_CONFIG[selectedMachine.operating_state]?.badge}`}>
                  STATE: {selectedMachine.operating_state}
                </span>
                <span className="text-xs bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-lg font-mono">
                  Order: <strong className="text-teal-300">{selectedMachine.active_order_no || 'Unassigned'}</strong>
                </span>
              </div>
            </div>

            {/* 8 Simulated Hardware Signal Tiles (Section 2) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {/* 1. Motor State */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Motor State</span>
                  <Power className={`h-3.5 w-3.5 ${selectedMachine.motor_state === 'ON' ? 'text-emerald-400' : 'text-slate-600'}`} />
                </div>
                <div className="mt-2">
                  <span className={`text-base font-bold font-mono ${selectedMachine.motor_state === 'ON' ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {selectedMachine.motor_state}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Main Drive</p>
                </div>
              </div>

              {/* 2. Machine RPM */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Loom RPM</span>
                  <Gauge className="h-3.5 w-3.5 text-teal-400" />
                </div>
                <div className="mt-2">
                  <span className="text-base font-bold font-mono text-teal-300">
                    {Math.round(selectedMachine.rpm)}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Rated: {selectedMachine.config.rated_rpm}</p>
                </div>
              </div>

              {/* 3. Vibration RMS */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Vibration</span>
                  <Activity className="h-3.5 w-3.5 text-amber-400" />
                </div>
                <div className="mt-2">
                  <span className={`text-base font-bold font-mono ${selectedMachine.vibration_rms >= selectedMachine.config.vibration_critical_threshold ? 'text-red-400' : selectedMachine.vibration_rms >= selectedMachine.config.vibration_warning_threshold ? 'text-amber-400' : 'text-slate-200'}`}>
                    {selectedMachine.vibration_rms}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">mm/s RMS</p>
                </div>
              </div>

              {/* 4. Motor Temperature */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Motor Temp</span>
                  <Thermometer className="h-3.5 w-3.5 text-rose-400" />
                </div>
                <div className="mt-2">
                  <span className={`text-base font-bold font-mono ${selectedMachine.motor_temp_c >= selectedMachine.config.temp_critical_threshold ? 'text-red-400' : selectedMachine.motor_temp_c >= selectedMachine.config.temp_warning_threshold ? 'text-amber-400' : 'text-slate-200'}`}>
                    {selectedMachine.motor_temp_c.toFixed(1)}°C
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Max: {selectedMachine.config.temp_critical_threshold}°C</p>
                </div>
              </div>

              {/* 5. Production Counter */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Counter</span>
                  <Layers className="h-3.5 w-3.5 text-sky-400" />
                </div>
                <div className="mt-2">
                  <span className="text-base font-bold font-mono text-sky-300">
                    {Math.round(selectedMachine.cumulative_counter_meters).toLocaleString()}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">meters cumulative</p>
                </div>
              </div>

              {/* 6. Power / Current */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Power / Load</span>
                  <Zap className="h-3.5 w-3.5 text-yellow-400" />
                </div>
                <div className="mt-2">
                  <span className="text-base font-bold font-mono text-yellow-300">
                    {selectedMachine.power_kw} kW
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">{selectedMachine.current_amps} A</p>
                </div>
              </div>

              {/* 7. Emergency Stop */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>E-Stop Relay</span>
                  <ShieldAlert className={`h-3.5 w-3.5 ${selectedMachine.e_stop_active ? 'text-red-500' : 'text-slate-600'}`} />
                </div>
                <div className="mt-2">
                  <span className={`text-base font-bold font-mono ${selectedMachine.e_stop_active ? 'text-red-400' : 'text-slate-400'}`}>
                    {selectedMachine.e_stop_active ? 'TRIPPED' : 'READY'}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Safety circuit</p>
                </div>
              </div>

              {/* 8. Sensor Comms */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Gateway Link</span>
                  {selectedMachine.sensor_comm_status === 'CONNECTED' ? (
                    <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <WifiOff className="h-3.5 w-3.5 text-red-400" />
                  )}
                </div>
                <div className="mt-2">
                  <span className={`text-xs font-bold font-mono ${selectedMachine.sensor_comm_status === 'CONNECTED' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {selectedMachine.sensor_comm_status}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Telemetry link</p>
                </div>
              </div>
            </div>

            {/* Calculated Output & Progress Section (Section 4) */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Work Order Target Progress</span>
                <div className="mt-1.5 flex items-center justify-between text-sm font-mono font-bold text-white">
                  <span>{selectedMachine.produced_quantity.toLocaleString()} m produced</span>
                  <span className="text-teal-400">{orderProgressPercent}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
                  <div
                    className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${orderProgressPercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 font-mono">
                  Target: {selectedMachine.target_quantity.toLocaleString()} m • Remaining:{' '}
                  {Math.max(0, selectedMachine.target_quantity - selectedMachine.produced_quantity).toLocaleString()} m
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Production Output Rate (Calculated)</span>
                <p className="text-sm font-mono font-bold text-slate-200 mt-1">
                  {selectedMachine.operating_state === 'RUNNING' ? '15.6 meters / hour' : '0.0 meters / hour (Paused/Stopped)'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Formula: (RPM: {Math.round(selectedMachine.rpm)} ÷ {selectedMachine.config.picks_per_cm * 100} picks/m) × 60m/hr
                </p>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  Fractional buffer: {selectedMachine.fractional_meters_buffer.toFixed(3)} m
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Downtime & Timestamp Tracking</span>
                <p className="text-sm font-mono font-bold text-slate-200 mt-1">
                  Total Downtime: {Math.round(selectedMachine.total_downtime_seconds / 60)} mins
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Last Output Record:{' '}
                  {selectedMachine.last_output_persisted_at
                    ? new Date(selectedMachine.last_output_persisted_at).toLocaleTimeString()
                    : 'None yet'}
                </p>
              </div>
            </div>

            {/* Active Warnings Panel (Section 6) */}
            {selectedMachine.active_warnings.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" /> Active Sensor Warnings & State Alerts
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedMachine.active_warnings.map((w) => (
                    <div
                      key={w.id}
                      className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                        w.level === 'CRITICAL'
                          ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                          : 'bg-amber-950/40 border-amber-800 text-amber-300'
                      }`}
                    >
                      <AlertOctagon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-mono text-[11px] uppercase">{w.code}</strong>
                        <p className="text-slate-300 text-xs mt-0.5">{w.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Feedback Toast */}
          {feedback && (
            <div
              className={`p-3.5 rounded-lg text-xs font-semibold flex items-center justify-between ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                  : 'bg-rose-950/60 text-rose-300 border border-rose-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>{feedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          {/* 10 Realistic Event Scenarios Panel & Auto-Simulation Controller (Section 5) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-5">
            {/* Header & Simulation Control Station */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-teal-400" />
                  <h3 className="text-base font-bold text-white">
                    Hardware Event Scenarios (1-Click & Auto-Run Simulation)
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Run all 10 realistic factory scenarios sequentially or trigger individual events to observe telemetry and machine output changes.
                </p>
              </div>

              {/* Start / Pause / Stop Simulation Controls */}
              <div className="flex items-center gap-2.5">
                {!isAutoSimRunning ? (
                  <button
                    type="button"
                    onClick={handleStartAutoSim}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-teal-500/20 ring-2 ring-teal-400/30 flex items-center gap-2 transition-all"
                  >
                    <Play className="h-4 w-4 fill-white" />
                    <span>Start Simulation (Run All Scenarios)</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleAutoSimPause}
                      className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                        isAutoSimPaused
                          ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                    >
                      {isAutoSimPaused ? <Play className="h-3.5 w-3.5 fill-white" /> : <Pause className="h-3.5 w-3.5" />}
                      <span>{isAutoSimPaused ? 'Resume' : 'Pause'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePrevAutoStep}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs"
                      title="Previous Scenario"
                    >
                      <SkipBack className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleNextAutoStep}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs"
                      title="Next Scenario"
                    >
                      <SkipForward className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleStopAutoSim}
                      className="px-3 py-2 bg-rose-600/80 hover:bg-rose-600 text-white border border-rose-500 rounded-lg text-xs font-bold flex items-center gap-1.5"
                    >
                      <Square className="h-3 w-3 fill-white" />
                      <span>Stop Simulation</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Active Auto-Simulation Progress Monitor HUD */}
            {isAutoSimRunning && (
              <div className="bg-slate-950/90 border border-teal-500/40 rounded-xl p-4 space-y-3 ring-1 ring-teal-500/20 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
                    </span>
                    <span className="text-xs font-bold text-teal-400 uppercase tracking-wider font-mono">
                      Running Auto-Simulation: Step {currentAutoIndex + 1} of 10
                    </span>
                    <span className="text-xs font-mono bg-teal-950 text-teal-300 border border-teal-800 px-2 py-0.5 rounded font-bold">
                      {autoScenarios[currentAutoIndex]?.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    {/* Step duration controller */}
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                      <span>Pace:</span>
                      {[3, 5, 8].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setAutoStepDuration(d)}
                          className={`px-1.5 py-0.5 rounded font-mono font-bold ${
                            autoStepDuration === d
                              ? 'bg-teal-600 text-white'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {d}s
                        </button>
                      ))}
                    </div>

                    <span className="font-mono text-teal-300 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded">
                      Next in: <strong>{autoStepSecondsLeft}s</strong>
                    </span>
                  </div>
                </div>

                {/* Animated Countdown Progress Bar */}
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-teal-500 to-emerald-400 h-2 rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.round(((autoStepDuration - autoStepSecondsLeft) / autoStepDuration) * 100)}%`,
                    }}
                  />
                </div>

                {/* Scenario details & Impact on Machine Output */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-400 font-medium block">Active Scenario Action:</span>
                    <p className="text-slate-200 mt-0.5 font-medium">
                      {autoScenarios[currentAutoIndex]?.description}
                    </p>
                  </div>

                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-teal-400 font-medium flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Machine Output Impact:
                      </span>
                      {autoSimTotalMeters > 0 && (
                        <span className="text-[10px] font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800 px-1.5 py-0.2 rounded">
                          +{autoSimTotalMeters}m Total in Run
                        </span>
                      )}
                    </div>
                    <p className="text-teal-200 font-mono text-[11px] mt-0.5">
                      {autoScenarios[currentAutoIndex]?.impactOnOutput}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 10 Scenarios Grid with active highlight */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {autoScenarios.map((s, idx) => {
                const isActive = isAutoSimRunning && currentAutoIndex === idx;
                return (
                  <button
                    key={s.scenario}
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleTriggerScenario(s.scenario)}
                    className={`p-3 rounded-lg text-left text-xs transition-all relative flex flex-col justify-between ${
                      isActive
                        ? 'bg-slate-800 border-2 border-teal-400 ring-2 ring-teal-400/40 shadow-lg shadow-teal-500/25 scale-[1.02]'
                        : 'bg-slate-800/80 hover:bg-slate-750 border border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-slate-100">{s.title}</span>
                        {isActive && (
                          <span className="text-[9px] font-mono font-bold bg-teal-400 text-slate-950 px-1 py-0.2 rounded uppercase animate-pulse">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                        {s.description}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-1.5 border-t border-slate-700/60 flex items-center justify-between text-[10px] font-mono">
                      <span className={s.badgeColor.split(' ')[0]}>
                        {s.metersToAdd > 0 ? `+${s.metersToAdd}m output` : 'Output paused'}
                      </span>
                      <span className="text-slate-500">Step {s.stepNumber}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-time Hardware Signals Stream Ledger (Section 2) */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white">
                  Live Sensor Signal Telemetry Stream (Simulated Hardware Packets)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {selectedMachine.recent_signals.length} Signals Generated
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Signal Name</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Simulated Value</th>
                    <th className="py-2 px-3">Source</th>
                    <th className="py-2 px-3">Signal Quality</th>
                    <th className="py-2 px-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {selectedMachine.recent_signals.map((sig) => (
                    <tr key={sig.signal_type} className="hover:bg-slate-850/50">
                      <td className="py-2 px-3 text-white font-sans font-medium">{sig.signal_name}</td>
                      <td className="py-2 px-3 text-teal-400 text-[11px]">{sig.signal_type}</td>
                      <td className="py-2 px-3 font-bold text-slate-100">
                        {String(sig.value)} {sig.unit}
                      </td>
                      <td className="py-2 px-3">
                        <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px] border border-slate-700">
                          {sig.signal_source}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            sig.quality === 'CRITICAL'
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : sig.quality === 'WARNING'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : sig.quality === 'UNCERTAIN'
                              ? 'bg-slate-800 text-slate-400 border border-slate-700'
                              : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          }`}
                        >
                          {sig.quality}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-400 text-right text-[11px]">
                        {new Date(sig.simulated_timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
