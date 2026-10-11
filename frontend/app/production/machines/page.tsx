'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Cpu,
  ClipboardList,
  Layers,
  Activity,
  PlusCircle,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Plus,
  Play,
  Square,
  AlertTriangle,
  AlertOctagon,
  Clock,
  HelpCircle,
  ShieldAlert,
  Wrench,
  Info,
  Check,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Machine, ProductionOrder, MachineStatus, ProductionRecord, MachineTelemetry, SimulationScenario, YarnBatch } from '@/lib/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { InteractiveMachineFloorScene } from '@/components/machines/InteractiveMachineFloorScene';

export default function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [yarnBatches, setYarnBatches] = useState<YarnBatch[]>([]);
  const [telemetries, setTelemetries] = useState<MachineTelemetry[]>([]);
  const [loading, setLoading] = useState(true);

  // Status Filter Tab
  const [statusFilter, setStatusFilter] = useState<'ALL' | MachineStatus | 'Possible Stoppage'>('ALL');

  // Search Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Machine for Floor Inspection Drawer
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

  // Configured Inactivity Interval for Possible Stoppage (Point 5)
  const [inactivityInterval, setInactivityInterval] = useState<number>(30);

  // Assignment Modal State (Point 2)
  const [assigningMachine, setAssigningMachine] = useState<Machine | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedShift, setSelectedShift] = useState('Morning (06:00 - 14:00)');
  const [operatorName, setOperatorName] = useState('');

  // Record Output Modal State (Point 2)
  const [outputMachine, setOutputMachine] = useState<Machine | null>(null);
  const [producedQuantity, setProducedQuantity] = useState('');
  const [recordError, setRecordError] = useState<string | null>(null);

  // Report Stoppage Modal State (Direct Card Action)
  const [stoppingMachine, setStoppingMachine] = useState<Machine | null>(null);
  const [stoppageReason, setStoppageReason] = useState('Warp yarn breakage detected on beam');

  // Confirmation Required Modal State (Point 5: "possible stoppage — confirmation required, not a confirmed breakdown")
  const [confirmingMachine, setConfirmingMachine] = useState<Machine | null>(null);
  const [confirmReason, setConfirmReason] = useState('Floor check confirmed inactivity');
  const [actionProcessing, setActionProcessing] = useState(false);

  const [notification, setNotification] = useState<string | null>(null);

  const loadData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [machs, ords, recs, tels, bts] = await Promise.all([
        api.getMachines(),
        api.getOrders(),
        api.getProductionRecords(),
        api.getAllSimulationMachines().catch(() => [] as MachineTelemetry[]),
        api.getYarnBatches().catch(() => [] as YarnBatch[]),
      ]);
      setMachines(machs);
      setOrders(ords);
      setRecords(recs);
      if (bts && bts.length > 0) {
        setYarnBatches(bts);
      }
      if (tels && tels.length > 0) {
        setTelemetries(tels);
      }
      setSelectedMachine((prev) => {
        if (!prev) return null;
        return machs.find((m) => m.id === prev.id) || null;
      });
    } catch (err) {
      console.error('Failed to load machine data', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handleAssignBatchMachines = async (machineIds: string[]) => {
    try {
      const res = await api.assignBatchMachines({ machine_ids: machineIds });
      setNotification(`⚡ Successfully assigned ${res.count} machines in bay to production orders.`);
      loadData(false);
    } catch (err: any) {
      alert(err.message || 'Failed to assign batch machines');
    }
  };

  useEffect(() => {
    loadData(false);
    const interval = setInterval(() => loadData(true), 1500);
    return () => clearInterval(interval);
  }, []);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningMachine || !selectedOrderId) return;

    try {
      await api.assignMachine(assigningMachine.id, {
        order_id: selectedOrderId,
        shift: selectedShift,
        operator_name: operatorName || 'Floor Operator',
      });

      setNotification(`Machine ${assigningMachine.machine_code} assigned successfully to shift.`);
      setAssigningMachine(null);
      setSelectedOrderId('');
      setOperatorName('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to assign machine');
    }
  };

  const handleRecordOutputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecordError(null);
    if (!outputMachine || !outputMachine.active_order_id) return;

    const qty = parseFloat(producedQuantity);
    if (isNaN(qty) || qty <= 0) {
      setRecordError('Production quantity must be a positive number.');
      return;
    }

    try {
      await api.recordProductionOutput(outputMachine.active_order_id, {
        machine_id: outputMachine.id,
        quantity_produced: qty,
      });

      setNotification(`Recorded +${qty.toLocaleString()} meters produced on ${outputMachine.machine_code}.`);
      setOutputMachine(null);
      setProducedQuantity('');
      loadData();
    } catch (err: any) {
      setRecordError(err.message || 'Failed to record output');
    }
  };

  // Direct Card Action: Operator reports stoppage / downtime on a running machine
  const handleReportStoppageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stoppingMachine) return;
    setActionProcessing(true);

    try {
      await api.recordMachineEvent(stoppingMachine.id, {
        event_type: 'Stopped',
        reason: stoppageReason || 'Floor stoppage logged by operator',
        order_id: stoppingMachine.active_order_id,
      });

      setNotification(
        `Machine ${stoppingMachine.machine_code} marked as Stopped. Active order ${stoppingMachine.active_order_no || ''} flagged for review.`
      );
      setStoppingMachine(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to log stoppage');
    } finally {
      setActionProcessing(false);
    }
  };

  // Direct Card Action: Resume a stopped machine
  const handleResumeMachine = async (machine: Machine) => {
    setActionProcessing(true);
    try {
      await api.recordMachineEvent(machine.id, {
        event_type: 'Resumed',
        reason: 'Floor operator resumed loom operation',
        order_id: machine.active_order_id,
      });

      setNotification(`Machine ${machine.machine_code} resumed to Running status.`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to resume machine');
    } finally {
      setActionProcessing(false);
    }
  };

  // Direct Card Action: Set Maintenance -> Idle or Idle -> Maintenance
  const handleToggleMaintenance = async (machine: Machine, targetStatus: 'Maintenance' | 'Idle') => {
    setActionProcessing(true);
    try {
      await api.recordMachineEvent(machine.id, {
        event_type: targetStatus === 'Maintenance' ? 'Maintenance' : 'Resumed',
        reason: targetStatus === 'Maintenance' ? 'Scheduled preventative maintenance' : 'Service complete, loom ready for work',
      });

      setNotification(`Machine ${machine.machine_code} status updated to ${targetStatus}.`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update machine status');
    } finally {
      setActionProcessing(false);
    }
  };

  // Clear review flag for an order directly from the machine card
  const handleClearFlag = async (orderId: string, orderNo: string) => {
    try {
      await api.clearOrderFlag(orderId);
      setNotification(`Review flag for ${orderNo} cleared successfully.`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to clear review flag');
    }
  };

  // Handle Point 5 Confirmations: Confirm Breakdown, Confirm Stoppage, or Declare Still Running
  const handleResolvePossibleStoppage = async (outcome: 'Breakdown' | 'Stoppage' | 'Running') => {
    if (!confirmingMachine) return;
    setActionProcessing(true);

    try {
      if (outcome === 'Breakdown') {
        await api.recordMachineEvent(confirmingMachine.id, {
          event_type: 'Breakdown Reported',
          reason: confirmReason || 'Confirmed breakdown following possible stoppage alert',
          order_id: confirmingMachine.active_order_id,
        });
        setNotification(`Breakdown confirmed for ${confirmingMachine.machine_code}. Affected order flagged for review.`);
      } else if (outcome === 'Stoppage') {
        await api.recordMachineEvent(confirmingMachine.id, {
          event_type: 'Stopped',
          reason: confirmReason || 'Confirmed stoppage following inactivity alert',
          order_id: confirmingMachine.active_order_id,
        });
        setNotification(`Stoppage confirmed for ${confirmingMachine.machine_code}. Affected order flagged for review.`);
      } else if (outcome === 'Running') {
        // Operator confirmed still running: record minimal token output to reset activity timestamp
        if (confirmingMachine.active_order_id) {
          await api.recordProductionOutput(confirmingMachine.active_order_id, {
            machine_id: confirmingMachine.id,
            quantity_produced: 10,
          });
        }
        setNotification(`Confirmation received: ${confirmingMachine.machine_code} is actively running. Timestamp refreshed.`);
      }

      setConfirmingMachine(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setActionProcessing(false);
    }
  };

  const handleSimulateScenario = async (machineId: string, scenario: SimulationScenario) => {
    try {
      await api.triggerSimulationScenario(machineId, scenario);
      const updatedTelemetries = await api.getAllSimulationMachines().catch(() => []);
      if (updatedTelemetries.length > 0) {
        setTelemetries(updatedTelemetries);
      }
      loadData(true);
      setNotification(`Simulated signal: ${scenario.replace('_', ' ')} sent to machine.`);
    } catch (err: any) {
      console.error('Failed to trigger simulation scenario', err);
    }
  };

  // Identify machines that exceed configured interval without output
  const nowMs = Date.now();
  const possibleStoppageMachines = machines.filter((m) => {
    if (m.current_status !== 'Running' || !m.last_output_time) return false;
    const elapsedMinutes = Math.round((nowMs - new Date(m.last_output_time).getTime()) / (1000 * 60));
    return elapsedMinutes >= inactivityInterval;
  });

  const warningCount =
    possibleStoppageMachines.length + machines.filter((m) => m.current_status === 'Stopped').length;

  // Filter machines based on selected tab
  const filteredMachines = machines.filter((m) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'Possible Stoppage') {
      return possibleStoppageMachines.some((p) => p.id === m.id);
    }
    return m.current_status === statusFilter;
  });

  // Calculate total meters produced by each machine from records and live simulation state
  const getMachineTotalOutput = (machineId: string) => {
    const fromRecords = records
      .filter((r) => r.machine_id === machineId)
      .reduce((sum, r) => sum + r.quantity_produced, 0);
    const mach = machines.find((m) => m.id === machineId);
    return Math.max(fromRecords, (mach as any)?.produced_quantity || 0);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Bar matching reference */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 sm:px-5 sm:py-3.5 rounded-xl border border-slate-200/90 shadow-xs">
        {/* Left: Title & Section Switcher */}
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Machine Floor
          </h1>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <Link
              href="/production/orders"
              className="px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors flex items-center gap-1.5"
            >
              <ClipboardList className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">Orders</span>
            </Link>
            <span className="px-2.5 py-1 rounded-md bg-white text-slate-900 font-bold shadow-2xs flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-teal-600" />
              <span>Floor</span>
            </span>
          </div>
        </div>

        {/* Center: Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search machine, loom or order..."
            className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Right: Alert Interval Selector + Event Simulator + Refresh */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-slate-600 font-medium hidden sm:inline">Alert:</span>
            <select
              value={inactivityInterval}
              onChange={(e) => setInactivityInterval(parseInt(e.target.value, 10))}
              className="font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer text-xs"
            >
              <option value={15}>15 mins</option>
              <option value={30}>30 mins</option>
              <option value={45}>45 mins</option>
              <option value={60}>60 mins</option>
              <option value={90}>90 mins</option>
            </select>
          </div>

          <Link
            href="/production/machine-events"
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Activity className="h-3.5 w-3.5 text-teal-400" />
            <span>Event Simulator</span>
          </Link>

          <button
            onClick={() => loadData(false)}
            className="p-1.5 border border-slate-200 bg-slate-50 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors shadow-xs"
            title="Refresh machines"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-700 hover:text-emerald-900 font-bold p-0.5">
            ✕
          </button>
        </div>
      )}


      {/* Interactive Factory Floor Visual Scene */}
      <InteractiveMachineFloorScene
        machines={machines}
        orders={orders}
        batches={yarnBatches}
        telemetries={telemetries}
        onSimulateScenario={handleSimulateScenario}
        selectedMachine={selectedMachine}
        onSelectMachine={setSelectedMachine}
        inactivityInterval={inactivityInterval}
        onAssignBatchMachines={handleAssignBatchMachines}
        onAssignClick={(m) => {
          setAssigningMachine(m);
          setSelectedOrderId(m.active_order_id || (orders[0]?.id ?? ''));
          setSelectedShift(m.current_shift || 'Morning (06:00 - 14:00)');
          setOperatorName(m.assigned_operator || '');
        }}
        onRecordOutputClick={(m) => {
          setOutputMachine(m);
          setProducedQuantity('');
          setRecordError(null);
        }}
        onReportStopClick={(m) => {
          setStoppingMachine(m);
          setStoppageReason('Warp yarn breakage detected on beam');
        }}
        onResumeClick={(m) => handleResumeMachine(m)}
        onMaintenanceClick={(m) =>
          handleToggleMaintenance(m, m.current_status === 'Maintenance' ? 'Idle' : 'Maintenance')
        }
        onConfirmPossibleStoppageClick={(m) => {
          setConfirmingMachine(m);
          setConfirmReason('Floor check confirmed inactivity');
        }}
        onClearFlagClick={(orderId, orderNo) => handleClearFlag(orderId, orderNo || '')}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
      />

      {/* Live Production Output Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-3.5 px-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-900">Live Production Output</h2>
            <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono font-medium">
              {records.length} Entries
            </span>
          </div>
          <span className="text-xs text-slate-500">
            Real-time fabric output logged across all weaving & knitting machines
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Recorded At</th>
                <th className="py-2.5 px-4">Machine</th>
                <th className="py-2.5 px-4">PRODUCTION ORDER</th>
                <th className="py-2.5 px-4 text-right">Output Produced</th>
                <th className="py-2.5 px-4">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {loading && records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                    <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-1.5 text-teal-600" />
                    <span>Loading production output records...</span>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 font-sans">
                    No production output recorded yet. Use the "Log Output" button on any active machine.
                  </td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 text-slate-500">
                      {new Date(rec.recorded_at).toLocaleTimeString()} ({new Date(rec.recorded_at).toLocaleDateString()})
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-800">
                      {rec.machine_code || 'Loom'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">
                      {rec.order_no || 'Work Order'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-teal-700">
                      +{rec.quantity_produced.toLocaleString()} m
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 font-sans">
                      {rec.operator_name || 'Floor Operator'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Point 5: Possible Stoppage Confirmation Modal */}
      {confirmingMachine && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-amber-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Confirm Possible Stoppage</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {confirmingMachine.machine_code} • Order: {confirmingMachine.active_order_no || 'None'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmingMachine(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
              <p className="font-semibold">Confirmation Required Before Declaring Breakdown</p>
              <p className="mt-1 text-slate-700 leading-relaxed">
                This loom had no output recorded for over {inactivityInterval} minutes. Is this a confirmed physical breakdown, an idle stoppage, or is the loom running without output logs?
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Operator Remark / Reason:
              </label>
              <input
                type="text"
                value={confirmReason}
                onChange={(e) => setConfirmReason(e.target.value)}
                placeholder="e.g. Warp beam replacement or mechanical issue"
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Floor Verdict:
              </label>

              {/* Action 1: Confirm Breakdown */}
              <button
                type="button"
                disabled={actionProcessing}
                onClick={() => handleResolvePossibleStoppage('Breakdown')}
                className="w-full p-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-900 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <AlertOctagon className="h-4 w-4 text-rose-600" />
                  <span>Confirm Breakdown (Report Breakdown Event)</span>
                </span>
                <span className="text-[10px] bg-rose-200 px-1.5 py-0.5 rounded text-rose-900 font-bold">Flags Order</span>
              </button>

              {/* Action 2: Confirm Stoppage */}
              <button
                type="button"
                disabled={actionProcessing}
                onClick={() => handleResolvePossibleStoppage('Stoppage')}
                className="w-full p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span>Confirm Stoppage (Log Stopped Event)</span>
                </span>
                <span className="text-[10px] bg-amber-200 px-1.5 py-0.5 rounded text-amber-900 font-bold">Flags Order</span>
              </button>

              {/* Action 3: Still Running (False Alarm) */}
              <button
                type="button"
                disabled={actionProcessing}
                onClick={() => handleResolvePossibleStoppage('Running')}
                className="w-full p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>False Alarm — Loom Is Actively Running</span>
                </span>
                <span className="text-[10px] bg-emerald-200 px-1.5 py-0.5 rounded text-emerald-900 font-bold">Resets Timer</span>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setConfirmingMachine(null)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Stoppage Modal (Direct Card Action) */}
      {stoppingMachine && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <form
            onSubmit={handleReportStoppageSubmit}
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Square className="h-5 w-5 text-rose-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Report Loom Stoppage / Downtime</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {stoppingMachine.machine_code} • {stoppingMachine.active_order_no || 'No active order'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStoppingMachine(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 space-y-1">
              <p className="font-semibold">Review Flag Trigger</p>
              <p className="text-slate-700 leading-relaxed">
                Stopping this loom will halt production and <strong>automatically flag active work order {stoppingMachine.active_order_no} for review</strong> so supervisors can reschedule.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select Common Stoppage Reason:
              </label>
              <div className="grid grid-cols-1 gap-1.5 mb-2">
                {[
                  'Warp yarn breakage detected on beam',
                  'Weft insertion fault / nozzle issue',
                  'Mechanical motor / lubrication alarm',
                  'Quality flaw detected on fabric roll',
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setStoppageReason(reason)}
                    className={`text-left p-2 rounded border text-xs transition-colors ${
                      stoppageReason === reason
                        ? 'border-rose-400 bg-rose-50 text-rose-900 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Or Custom Remark:
              </label>
              <input
                type="text"
                value={stoppageReason}
                onChange={(e) => setStoppageReason(e.target.value)}
                placeholder="Enter specific downtime description..."
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStoppingMachine(null)}
                className="px-3 py-2 text-xs text-slate-600 hover:text-slate-900 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionProcessing}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5"
              >
                <Square className="h-3.5 w-3.5" />
                <span>Confirm Stoppage & Flag Order</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Record Output Modal (Point 2) */}
      {outputMachine && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <form
            onSubmit={handleRecordOutputSubmit}
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Production Output</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {outputMachine.machine_code} • {outputMachine.active_order_no}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOutputMachine(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {recordError && (
              <p className="text-xs text-rose-600 font-medium bg-rose-50 p-2 rounded border border-rose-200">
                {recordError}
              </p>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fabric Meters Produced in this Run <span className="text-rose-500">*</span>
              </label>
              <div className="flex rounded-lg shadow-sm">
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 250"
                  value={producedQuantity}
                  onChange={(e) => setProducedQuantity(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border rounded-l-lg font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
                <span className="inline-flex items-center px-3 rounded-r-lg border border-l-0 border-slate-300 bg-slate-50 text-slate-600 text-xs font-semibold">
                  meters
                </span>
              </div>

              {/* Quick Increment Presets */}
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[11px] text-slate-400">Presets:</span>
                {[50, 100, 250, 500].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setProducedQuantity(preset.toString())}
                    className="px-2 py-0.5 text-[11px] font-mono font-semibold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded text-slate-700 transition-colors"
                  >
                    +{preset}m
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-slate-400 mt-2">
                Updates work order completion progress, adds an entry to the live output log, and refreshes loom activity timestamp.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOutputMachine(null)}
                className="px-3 py-2 text-xs text-slate-600 hover:text-slate-900 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Confirm Output</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assign Machine Modal (Point 2) */}
      {assigningMachine && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <form
            onSubmit={handleAssignSubmit}
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Assign Machine & Shift</h3>
                <p className="text-xs text-slate-500 font-mono">{assigningMachine.machine_code}</p>
              </div>
              <button
                type="button"
                onClick={() => setAssigningMachine(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Production Order <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  required
                >
                  <option value="">-- Choose Work Order --</option>
                  {orders
                    .filter((o) => o.status !== 'Completed')
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.order_no} — {o.customer_reference} ({o.fabric_type})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shift Assignment
                </label>
                <select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="Morning (06:00 - 14:00)">Morning (06:00 - 14:00)</option>
                  <option value="Evening (14:00 - 22:00)">Evening (14:00 - 22:00)</option>
                  <option value="Night (22:00 - 06:00)">Night (22:00 - 06:00)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Operator Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Patel"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAssigningMachine(null)}
                className="px-3 py-2 text-xs text-slate-600 hover:text-slate-900 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                Save Assignment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
