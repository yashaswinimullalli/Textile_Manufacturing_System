'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Cpu,
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
} from 'lucide-react';
import { api } from '@/lib/api';
import { Machine, ProductionOrder, MachineStatus, ProductionRecord } from '@/lib/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AlertBanner } from '@/components/ui/AlertBanner';

export default function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Status Filter Tab
  const [statusFilter, setStatusFilter] = useState<'ALL' | MachineStatus | 'Possible Stoppage'>('ALL');

  // Configured Inactivity Interval for Possible Stoppage (Point 5)
  const [inactivityInterval, setInactivityInterval] = useState<number>(30);

  // Status Guide Collapse Toggle
  const [showGuide, setShowGuide] = useState(true);

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
      const [machs, ords, recs] = await Promise.all([
        api.getMachines(),
        api.getOrders(),
        api.getProductionRecords(),
      ]);
      setMachines(machs);
      setOrders(ords);
      setRecords(recs);
    } catch (err) {
      console.error('Failed to load machine data', err);
    } finally {
      if (!isBackground) setLoading(false);
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

  // Identify machines that exceed configured interval without output
  const nowMs = Date.now();
  const possibleStoppageMachines = machines.filter((m) => {
    if (m.current_status !== 'Running' || !m.last_output_time) return false;
    const elapsedMinutes = Math.round((nowMs - new Date(m.last_output_time).getTime()) / (1000 * 60));
    return elapsedMinutes >= inactivityInterval;
  });

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Machine Floor & Output</h1>
            <span className="bg-teal-100 text-teal-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {machines.length} Total Machines
            </span>
            {possibleStoppageMachines.length > 0 && (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-600" />
                {possibleStoppageMachines.length} Possible Stoppage(s)
              </span>
            )}
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs bg-slate-900 text-teal-300 px-2.5 py-0.5 rounded-full font-mono font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Sync Active
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Assign weaving looms to work orders, record production output, log downtime events, and track inactivity thresholds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Configured Inactivity Interval Selector (Point 5) */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-xs text-xs">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-slate-600 font-medium">Stoppage Alert Interval:</span>
            <select
              value={inactivityInterval}
              onChange={(e) => setInactivityInterval(parseInt(e.target.value, 10))}
              className="font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
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
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
          >
            <Activity className="h-4 w-4 text-teal-400" />
            <span>Event Simulator</span>
          </Link>
          <button
            onClick={() => loadData(false)}
            className="p-2 border border-slate-300 rounded-lg hover:bg-white text-slate-600"
            title="Refresh machines"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Status & Review Clarification Guide Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white rounded-xl p-4 shadow-sm border border-slate-700">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowGuide(!showGuide)}>
          <div className="flex items-center gap-2.5">
            <Info className="h-5 w-5 text-teal-400 flex-shrink-0" />
            <h2 className="text-sm font-bold text-slate-100">
              Floor Operations Guide: Machine Statuses & Review Flag Triggers
            </h2>
          </div>
          <button type="button" className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-medium">
            <span>{showGuide ? 'Hide details' : 'Show details'}</span>
            {showGuide ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        {showGuide && (
          <div className="mt-3 pt-3 border-t border-slate-700/80 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
              <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span> Running
              </span>
              <p className="text-slate-300 mt-1 leading-relaxed">
                Actively producing fabric. Output is regularly logged. If order is flagged due to a separate partner loom, the running loom continues uninterrupted.
              </p>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
              <span className="inline-flex items-center gap-1 font-bold text-amber-400">
                <AlertTriangle className="h-3 w-3 text-amber-400" /> Possible Stoppage
              </span>
              <p className="text-slate-300 mt-1 leading-relaxed">
                Running status, but no output logged for &gt;{inactivityInterval} mins. <em>Requires confirmation</em> from floor staff before declaring a breakdown.
              </p>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
              <span className="inline-flex items-center gap-1 font-bold text-rose-400">
                <Square className="h-3 w-3 text-rose-400" /> Stopped / Breakdown
              </span>
              <p className="text-slate-300 mt-1 leading-relaxed">
                Loom halted by operator or breakdown. <strong>Automatically flags active work order for review</strong> to alert production planning of downtime risk.
              </p>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
              <span className="inline-flex items-center gap-1 font-bold text-sky-400">
                <Wrench className="h-3 w-3 text-sky-400" /> Idle vs Maintenance
              </span>
              <p className="text-slate-300 mt-1 leading-relaxed">
                <strong>Idle:</strong> Healthy loom waiting for order. <strong>Maintenance:</strong> Offline for preventative servicing or scheduled overhaul.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Possible Stoppage Global Warning Banner (Point 5) */}
      {possibleStoppageMachines.length > 0 && (
        <AlertBanner
          type="warning"
          title={`Possible Stoppage — Confirmation Required (${possibleStoppageMachines.length} Loom)`}
          message={`No output has been recorded for over ${inactivityInterval} minutes on: ${possibleStoppageMachines
            .map((m) => m.machine_code.split(' ')[0])
            .join(', ')}. Note: This is an unverified dormancy warning, not a confirmed breakdown. Confirmation from line staff is required.`}
          actionText="Review First Loom"
          onAction={() => setConfirmingMachine(possibleStoppageMachines[0])}
        />
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Machines ({machines.length})
          </button>
          <button
            onClick={() => setStatusFilter('Running')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              statusFilter === 'Running'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            Running ({machines.filter((m) => m.current_status === 'Running').length})
          </button>
          <button
            onClick={() => setStatusFilter('Possible Stoppage')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              statusFilter === 'Possible Stoppage'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-amber-50 hover:text-amber-700'
            }`}
          >
            <AlertTriangle className="h-3 w-3" />
            Possible Stoppage ({possibleStoppageMachines.length})
          </button>
          <button
            onClick={() => setStatusFilter('Stopped')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              statusFilter === 'Stopped'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-rose-50 hover:text-rose-700'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
            Stopped ({machines.filter((m) => m.current_status === 'Stopped').length})
          </button>
          <button
            onClick={() => setStatusFilter('Idle')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              statusFilter === 'Idle'
                ? 'bg-slate-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Idle ({machines.filter((m) => m.current_status === 'Idle').length})
          </button>
          <button
            onClick={() => setStatusFilter('Maintenance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              statusFilter === 'Maintenance'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-purple-50 hover:text-purple-700'
            }`}
          >
            Maintenance ({machines.filter((m) => m.current_status === 'Maintenance').length})
          </button>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing {filteredMachines.length} of {machines.length} looms
        </span>
      </div>

      {/* Machines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMachines.map((m) => {
          const isRunning = m.current_status === 'Running';
          const isStopped = ['Stopped', 'Breakdown Reported', 'Maintenance'].includes(m.current_status);
          const isIdle = m.current_status === 'Idle';
          const isMaintenance = m.current_status === 'Maintenance';

          const minutesSinceLastOutput = m.last_output_time
            ? Math.round((nowMs - new Date(m.last_output_time).getTime()) / (1000 * 60))
            : null;

          // Point 5: Check if no new output recorded for configured interval
          const isPossibleStoppage =
            isRunning && minutesSinceLastOutput !== null && minutesSinceLastOutput >= inactivityInterval;

          // Find active order details
          const activeOrder = orders.find((o) => o.id === m.active_order_id);
          const orderProgressPercent =
            activeOrder && activeOrder.target_quantity > 0
              ? Math.min(100, Math.round((activeOrder.produced_quantity / activeOrder.target_quantity) * 100))
              : 0;

          // Check if this machine's order has a review flag
          const isOrderFlagged = activeOrder?.is_flagged_for_review;
          const loomOutputTotal = getMachineTotalOutput(m.id);

          return (
            <div
              key={m.id}
              className={`bg-white rounded-xl border p-5 shadow-sm transition-all hover:shadow flex flex-col justify-between ${
                isPossibleStoppage
                  ? 'border-amber-300 ring-2 ring-amber-200'
                  : m.current_status === 'Stopped'
                  ? 'border-rose-300 ring-1 ring-rose-200'
                  : isMaintenance
                  ? 'border-purple-200 bg-purple-50/20'
                  : isIdle
                  ? 'border-slate-200 bg-slate-50/30'
                  : 'border-slate-200'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {m.process_type} Line
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">{m.machine_code}</h3>
                  </div>
                  <StatusBadge status={m.current_status} pulse={isRunning && !isPossibleStoppage} />
                </div>

                {/* Section 6: State-Aware No Output Detected Warning */}
                {isPossibleStoppage && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs space-y-1.5 shadow-xs">
                    <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                      <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                      <span>No Output Detected — Verify Production</span>
                    </div>
                    <p className="text-amber-800 text-[11px] leading-relaxed">
                      Loom marked <strong>Running</strong>, but no output recorded for <strong>{minutesSinceLastOutput} mins</strong> (threshold {inactivityInterval}m).
                      <span className="italic block mt-0.5 text-amber-700">Requires confirmation from line staff before declaring breakdown.</span>
                    </p>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setConfirmingMachine(m)}
                        className="w-full py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                        <span>Verify & Confirm Stoppage</span>
                      </button>
                    </div>
                  </div>
                )}


                {/* Review Flag Notice on Card */}
                {isOrderFlagged && activeOrder && (
                  <div
                    className={`mt-3 p-2.5 rounded-lg border text-xs space-y-1 ${
                      m.current_status === 'Stopped'
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        <AlertOctagon className="h-3.5 w-3.5 text-rose-600 flex-shrink-0" />
                        <span>Order {activeOrder.order_no} Flagged for Review</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleClearFlag(activeOrder.id, activeOrder.order_no)}
                        className="text-[10px] bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-semibold transition-colors"
                        title="Clear review flag"
                      >
                        Clear Flag
                      </button>
                    </div>
                    <p className="text-[11px] leading-snug">
                      {m.current_status === 'Stopped' ? (
                        <>
                          <strong>Loom Downtime Impact:</strong> {activeOrder.flag_reason || 'Loom stopped during run.'}
                        </>
                      ) : (
                        <>
                          <strong>Loom is Running normally:</strong> Work order flagged due to co-assigned partner loom downtime.
                        </>
                      )}
                    </p>
                  </div>
                )}

                {/* Details list */}
                <div className="mt-4 space-y-2.5 text-xs border-t border-slate-100 pt-3">
                  {/* Active Work Order & Progress */}
                  <div>
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span>Active Work Order:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {m.active_order_no || 'Unassigned (Idle)'}
                      </span>
                    </div>

                    {activeOrder && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1.5 mt-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-600">
                          <span className="truncate">{activeOrder.customer_reference}</span>
                          <span className="font-mono font-semibold text-slate-800">
                            {activeOrder.produced_quantity.toLocaleString()} / {activeOrder.target_quantity.toLocaleString()} m
                          </span>
                        </div>
                        {/* Order Progress Bar */}
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-teal-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${orderProgressPercent}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>{activeOrder.fabric_type}</span>
                          <span>{orderProgressPercent}% completed</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Floor Operator & Shift */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Floor Operator:</span>
                    <span className="font-medium text-slate-700">
                      {m.assigned_operator || 'Not assigned'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Assigned Shift:</span>
                    <span className="font-medium text-slate-700">
                      {m.current_shift || 'General'}
                    </span>
                  </div>

                  {/* Output metrics */}
                  <div className="flex items-center justify-between text-slate-500">
                    <span>This Loom Output Logged:</span>
                    <span className="font-mono font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded text-[11px]">
                      +{loomOutputTotal.toLocaleString()} meters
                    </span>
                  </div>

                  {m.last_output_time && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Last Output Logged:</span>
                      <span className="font-mono">
                        {new Date(m.last_output_time).toLocaleTimeString()} ({minutesSinceLastOutput}m ago)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-2">
                  {/* Primary Output or Resume Action */}
                  {isRunning && m.active_order_id && (
                    <button
                      type="button"
                      onClick={() => {
                        setOutputMachine(m);
                        setProducedQuantity('100');
                        setRecordError(null);
                      }}
                      className="flex-1 py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Record Output</span>
                    </button>
                  )}

                  {m.current_status === 'Stopped' && (
                    <button
                      type="button"
                      disabled={actionProcessing}
                      onClick={() => handleResumeMachine(m)}
                      className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>Resume Loom</span>
                    </button>
                  )}

                  {isMaintenance && (
                    <button
                      type="button"
                      disabled={actionProcessing}
                      onClick={() => handleToggleMaintenance(m, 'Idle')}
                      className="flex-1 py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Service Done (Set Idle)</span>
                    </button>
                  )}

                  {isIdle && (
                    <button
                      type="button"
                      onClick={() => {
                        setAssigningMachine(m);
                        setSelectedOrderId(orders[0]?.id ?? '');
                        setOperatorName('');
                      }}
                      className="flex-1 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <UserCheck className="h-3.5 w-3.5 text-teal-400" />
                      <span>Assign Order</span>
                    </button>
                  )}

                  {/* Secondary Stoppage / Downtime Button for Running Looms */}
                  {isRunning && (
                    <button
                      type="button"
                      onClick={() => {
                        setStoppingMachine(m);
                        setStoppageReason('Warp yarn breakage detected on beam');
                      }}
                      className="py-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                      title="Report stoppage / downtime incident"
                    >
                      <Square className="h-3 w-3 text-rose-600" />
                      <span>Report Stop</span>
                    </button>
                  )}

                  {/* If stopped but has active order, can also record output to resume */}
                  {m.current_status === 'Stopped' && m.active_order_id && (
                    <button
                      type="button"
                      onClick={() => {
                        setOutputMachine(m);
                        setProducedQuantity('50');
                        setRecordError(null);
                      }}
                      className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                      title="Log output and resume"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Output</span>
                    </button>
                  )}
                </div>

                {/* Secondary: Reassign or Maintenance Toggle */}
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAssigningMachine(m);
                      setSelectedOrderId(m.active_order_id || (orders[0]?.id ?? ''));
                      setOperatorName(m.assigned_operator || '');
                    }}
                    className="text-slate-500 hover:text-slate-800 font-medium underline-offset-2 hover:underline"
                  >
                    {m.active_order_id ? 'Reassign Order' : 'Assign to Work Order'}
                  </button>

                  {isIdle && (
                    <button
                      type="button"
                      onClick={() => handleToggleMaintenance(m, 'Maintenance')}
                      className="text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
                    >
                      <Wrench className="h-3 w-3" />
                      <span>Schedule Maintenance</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Production Output Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-900">Live Production Output & Run Logs</h2>
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
                <th className="py-2.5 px-4">Loom / Machine</th>
                <th className="py-2.5 px-4">Production Order</th>
                <th className="py-2.5 px-4 text-right">Output Produced</th>
                <th className="py-2.5 px-4">Logged By / Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 font-sans">
                    No production output recorded yet. Use the "Record Output" button on any active machine.
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
