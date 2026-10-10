'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Square,
  Wrench,
  Clock,
  User,
  PlusCircle,
  RotateCcw,
  X,
  AlertOctagon,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Machine, ProductionOrder, MachineStatus } from '@/lib/types';

interface MachineSlotConfig {
  prefix: string;
  defaultCode: string;
  defaultName: string;
  processType: 'Weaving' | 'Knitting';
  // Position percentages on 1376x600 floor canvas
  cardLeft: number;
  cardTop: number;
  cardWidth: number;
  hotspotLeft: number;
  hotspotTop: number;
  hotspotWidth: number;
  hotspotHeight: number;
}

const MACHINE_SLOTS: MachineSlotConfig[] = [
  {
    prefix: 'M-01',
    defaultCode: 'M-01',
    defaultName: 'Picanol Airjet Loom',
    processType: 'Weaving',
    cardLeft: 13.5,
    cardTop: 2.5,
    cardWidth: 17.5,
    hotspotLeft: 8.5,
    hotspotTop: 20.0,
    hotspotWidth: 26.0,
    hotspotHeight: 33.0,
  },
  {
    prefix: 'M-02',
    defaultCode: 'M-02',
    defaultName: 'Toyota JAT810 Loom',
    processType: 'Weaving',
    cardLeft: 41.5,
    cardTop: 2.5,
    cardWidth: 17.5,
    hotspotLeft: 36.5,
    hotspotTop: 20.0,
    hotspotWidth: 26.0,
    hotspotHeight: 33.0,
  },
  {
    prefix: 'M-03',
    defaultCode: 'M-03',
    defaultName: 'Dornier Rapier Loom',
    processType: 'Weaving',
    cardLeft: 69.5,
    cardTop: 2.5,
    cardWidth: 17.5,
    hotspotLeft: 65.0,
    hotspotTop: 20.0,
    hotspotWidth: 26.0,
    hotspotHeight: 33.0,
  },
  {
    prefix: 'M-04',
    defaultCode: 'M-04',
    defaultName: 'Mayer & Cie Circular Knit',
    processType: 'Knitting',
    cardLeft: 27.0,
    cardTop: 43.5,
    cardWidth: 16.5,
    hotspotLeft: 18.0,
    hotspotTop: 52.0,
    hotspotWidth: 28.0,
    hotspotHeight: 45.0,
  },
  {
    prefix: 'M-05',
    defaultCode: 'M-05',
    defaultName: 'Santoni Seamless Knit',
    processType: 'Knitting',
    cardLeft: 61.5,
    cardTop: 43.5,
    cardWidth: 16.5,
    hotspotLeft: 56.0,
    hotspotTop: 52.0,
    hotspotWidth: 28.0,
    hotspotHeight: 45.0,
  },
];

interface InteractiveMachineFloorSceneProps {
  machines: Machine[];
  orders: ProductionOrder[];
  selectedMachine: Machine | null;
  onSelectMachine: (machine: Machine | null) => void;
  inactivityInterval: number;
  onAssignClick: (machine: Machine) => void;
  onRecordOutputClick: (machine: Machine) => void;
  onReportStopClick: (machine: Machine) => void;
  onResumeClick: (machine: Machine) => void;
  onMaintenanceClick: (machine: Machine) => void;
  onConfirmPossibleStoppageClick: (machine: Machine) => void;
  onClearFlagClick: (orderId: string, orderNo?: string) => void;
  searchQuery?: string;
  statusFilter?: string;
}

export function InteractiveMachineFloorScene({
  machines,
  orders,
  selectedMachine,
  onSelectMachine,
  inactivityInterval,
  onAssignClick,
  onRecordOutputClick,
  onReportStopClick,
  onResumeClick,
  onMaintenanceClick,
  onConfirmPossibleStoppageClick,
  onClearFlagClick,
  searchQuery = '',
  statusFilter = 'ALL',
}: InteractiveMachineFloorSceneProps) {
  const [hoveredSlotPrefix, setHoveredSlotPrefix] = useState<string | null>(null);

  // Close inspector on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedMachine) {
        onSelectMachine(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMachine, onSelectMachine]);

  // Helper to match machines to slots
  const getMachineForSlot = (slot: MachineSlotConfig): Machine | undefined => {
    return machines.find(
      (m) =>
        m.machine_code.toUpperCase().includes(slot.prefix) ||
        m.id.toLowerCase().includes(slot.prefix.toLowerCase())
    );
  };

  // Helper to check possible stoppage
  const isMachineDormant = (m: Machine): boolean => {
    if (m.current_status !== 'Running' || !m.last_output_time) return false;
    const diffMinutes = Math.floor(
      (Date.now() - new Date(m.last_output_time).getTime()) / (1000 * 60)
    );
    return diffMinutes > inactivityInterval;
  };

  const getDormantMinutes = (m: Machine): number => {
    if (!m.last_output_time) return inactivityInterval;
    return Math.floor((Date.now() - new Date(m.last_output_time).getTime()) / (1000 * 60));
  };

  // Helper to get effective status
  const getEffectiveStatus = (m: Machine): MachineStatus | 'Possible Stoppage' => {
    if (isMachineDormant(m)) return 'Possible Stoppage';
    return m.current_status;
  };

  // Active order lookup
  const getActiveOrderForMachine = (m: Machine): ProductionOrder | undefined => {
    if (!m.active_order_id && !m.active_order_no) return undefined;
    return orders.find(
      (o) => o.id === m.active_order_id || o.order_no === m.active_order_no
    );
  };

  // Get consistent styling for status
  const getStatusStyles = (status: MachineStatus | 'Possible Stoppage') => {
    switch (status) {
      case 'Running':
        return {
          badge: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500',
          ring: 'ring-emerald-400 bg-emerald-400/10',
          border: 'border-emerald-300',
        };
      case 'Possible Stoppage':
        return {
          badge: 'bg-amber-50 text-amber-900 border-amber-300',
          dot: 'bg-amber-500',
          ring: 'ring-amber-400 bg-amber-400/15',
          border: 'border-amber-400',
        };
      case 'Stopped':
        return {
          badge: 'bg-rose-50 text-rose-900 border-rose-300',
          dot: 'bg-rose-500',
          ring: 'ring-rose-400 bg-rose-400/15',
          border: 'border-rose-400',
        };
      case 'Idle':
        return {
          badge: 'bg-slate-100 text-slate-800 border-slate-300',
          dot: 'bg-slate-400',
          ring: 'ring-slate-300 bg-slate-300/10',
          border: 'border-slate-300',
        };
      case 'Maintenance':
        return {
          badge: 'bg-purple-50 text-purple-900 border-purple-300',
          dot: 'bg-purple-500',
          ring: 'ring-purple-400 bg-purple-400/15',
          border: 'border-purple-300',
        };
      default:
        return {
          badge: 'bg-slate-100 text-slate-700 border-slate-300',
          dot: 'bg-slate-400',
          ring: 'ring-slate-400 bg-slate-400/10',
          border: 'border-slate-300',
        };
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-300 shadow-xl bg-slate-900 select-none">
      {/* Visual Canvas Container with exact 1376:600 aspect ratio */}
      <div className="relative w-full aspect-[1376/600] min-h-[380px] sm:min-h-[460px] overflow-hidden">
        {/* Crisp Factory Floor Background Image with NO dark overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/factory_floor_scene.jpg"
            alt="VASTRA Interactive Textile Factory Floor"
            fill
            priority
            className="object-cover object-center pointer-events-none"
          />
        </div>

        {/* 5 Interactive Machine Hotspots & Compact Dynamic Overlay Panels */}
        {MACHINE_SLOTS.map((slot) => {
          const machine = getMachineForSlot(slot);
          if (!machine) return null;

          const effectiveStatus = getEffectiveStatus(machine);
          const isSelected = selectedMachine?.id === machine.id;
          const isHovered = hoveredSlotPrefix === slot.prefix;
          const activeOrder = getActiveOrderForMachine(machine);
          const dormantMinutes = getDormantMinutes(machine);

          // Calculate progress if order assigned
          const targetQty = activeOrder?.target_quantity || 0;
          const producedQty = activeOrder?.produced_quantity || 0;
          const progressPercent =
            targetQty > 0 ? Math.min(100, Math.round((producedQty / targetQty) * 100)) : 0;

          // Check if order flagged for review
          const isFlagged = Boolean(activeOrder?.is_flagged_for_review);

          const styles = getStatusStyles(effectiveStatus);

          // Machine name formatting
          const nameParts = machine.machine_code.split('(');
          const codeShort = nameParts[0]?.trim() || slot.defaultCode;
          const nameShort = nameParts[1]?.replace(')', '').trim() || slot.defaultName;

          // Search and filter checking
          const matchesSearch =
            !searchQuery ||
            machine.machine_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            activeOrder?.order_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
            machine.assigned_operator?.toLowerCase().includes(searchQuery.toLowerCase());

          const matchesStatus =
            statusFilter === 'ALL' ||
            effectiveStatus === statusFilter ||
            (statusFilter === 'Running' && effectiveStatus === 'Running') ||
            (statusFilter === 'Possible Stoppage' && effectiveStatus === 'Possible Stoppage') ||
            (statusFilter === 'Stopped' && effectiveStatus === 'Stopped') ||
            (statusFilter === 'Idle' && effectiveStatus === 'Idle') ||
            (statusFilter === 'Maintenance' && effectiveStatus === 'Maintenance');

          const isDimmed = !matchesSearch || !matchesStatus;

          return (
            <React.Fragment key={slot.prefix}>
              {/* 1. Physical Machine Hotspot: Click to select, hover to highlight */}
              <div
                style={{
                  left: `${slot.hotspotLeft}%`,
                  top: `${slot.hotspotTop}%`,
                  width: `${slot.hotspotWidth}%`,
                  height: `${slot.hotspotHeight}%`,
                }}
                onClick={() => onSelectMachine(machine)}
                onMouseEnter={() => setHoveredSlotPrefix(slot.prefix)}
                onMouseLeave={() => setHoveredSlotPrefix(null)}
                className={`absolute z-10 cursor-pointer transition-all duration-200 rounded-xl pointer-events-auto ${
                  isSelected
                    ? 'ring-2 ring-teal-400 bg-teal-400/10 shadow-lg shadow-teal-500/20'
                    : isHovered
                    ? `${styles.ring} ring-1 shadow-md`
                    : ''
                }`}
                title={`Click to inspect ${machine.machine_code}`}
              >
                {/* Active machine beacon tag on floor */}
                {isSelected && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/90 border border-teal-400 text-teal-300 text-[10px] font-mono font-bold shadow-lg">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-ping" />
                    <span>Selected</span>
                  </div>
                )}
              </div>

              {/* 2. Compact Machine Information Panel: Positioned cleanly without covering machine */}
              <div
                style={{
                  left: `${slot.cardLeft}%`,
                  top: `${slot.cardTop}%`,
                  width: `${slot.cardWidth}%`,
                }}
                onClick={() => onSelectMachine(machine)}
                onMouseEnter={() => setHoveredSlotPrefix(slot.prefix)}
                onMouseLeave={() => setHoveredSlotPrefix(null)}
                className={`absolute z-20 cursor-pointer transition-all duration-200 pointer-events-auto ${
                  isDimmed ? 'opacity-30 grayscale' : 'opacity-100'
                } ${
                  isSelected
                    ? 'ring-2 ring-teal-500 shadow-xl scale-[1.02]'
                    : isHovered
                    ? 'shadow-lg scale-[1.01]'
                    : 'shadow-md'
                } rounded-xl`}
              >
                <div className="bg-white/95 hover:bg-white backdrop-blur-md rounded-xl p-2 sm:p-2.5 border border-slate-200 shadow-sm flex flex-col justify-between transition-colors">
                  {/* Top: Status Badge + Process Division */}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${styles.badge}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${styles.dot} ${
                          effectiveStatus === 'Running' || effectiveStatus === 'Possible Stoppage'
                            ? 'animate-pulse'
                            : ''
                        }`}
                      />
                      <span>{effectiveStatus}</span>
                    </span>

                    <span className="text-[9px] font-mono text-slate-400 hidden sm:inline">
                      {machine.process_type}
                    </span>
                  </div>

                  {/* Middle: Machine Code & Name */}
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs tracking-tight flex items-center justify-between">
                      <span>{codeShort}</span>
                      {isSelected && (
                        <span className="text-[9px] text-teal-600 font-bold bg-teal-50 px-1 py-0.2 rounded border border-teal-200">
                          Active
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5" title={nameShort}>
                      {nameShort}
                    </p>
                  </div>

                  {/* Bottom: Dynamic Context Line (Progress, Alert, or State notice) */}
                  <div className="mt-1.5 pt-1 border-t border-slate-100">
                    {effectiveStatus === 'Possible Stoppage' ? (
                      <div className="flex items-center gap-1 text-[9px] text-amber-700 font-semibold truncate">
                        <AlertTriangle className="h-2.5 w-2.5 text-amber-600 shrink-0" />
                        <span className="truncate">
                          No output for {dormantMinutes} min — confirmation required
                        </span>
                      </div>
                    ) : effectiveStatus === 'Stopped' ? (
                      <div className="flex items-center justify-between text-[9px] text-rose-700 font-medium truncate">
                        <span className="truncate">
                          {activeOrder ? `Order ${activeOrder.order_no}` : 'Loom Stopped'}
                        </span>
                        <span className="text-rose-600 font-bold ml-1 shrink-0">Review</span>
                      </div>
                    ) : effectiveStatus === 'Maintenance' ? (
                      <div className="text-[9px] text-purple-700 font-medium truncate">
                        Scheduled overhaul
                      </div>
                    ) : effectiveStatus === 'Idle' ? (
                      <div className="text-[9px] text-slate-500 font-medium truncate flex items-center justify-between">
                        <span>Ready for assignment</span>
                        <ChevronRight className="h-2.5 w-2.5 text-slate-400" />
                      </div>
                    ) : activeOrder && targetQty > 0 ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between text-[9px] font-mono">
                          <span className="text-slate-600 font-semibold truncate">
                            {producedQty.toLocaleString()} / {targetQty.toLocaleString()} m
                          </span>
                          <span className="text-teal-700 font-bold ml-1">{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                          <div
                            className="bg-teal-500 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-[9px] text-slate-400">
                        Operational Loom
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {/* Backdrop overlay when inspector drawer is open (click outside to dismiss) */}
        {selectedMachine && (
          <div
            onClick={() => onSelectMachine(null)}
            className="absolute inset-0 z-25 bg-slate-950/20 backdrop-blur-[1px] cursor-pointer transition-opacity"
            title="Click to dismiss machine inspector"
          />
        )}

        {/* Slide-over Machine Detail Inspector Drawer (Anchored to right side) */}
        {selectedMachine && (
          <div className="absolute inset-y-0 right-0 z-30 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-md text-white border-l border-slate-700/80 shadow-2xl p-4 sm:p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            {(() => {
              const activeOrder = getActiveOrderForMachine(selectedMachine);
              const effectiveStatus = getEffectiveStatus(selectedMachine);
              const isDormant = isMachineDormant(selectedMachine);
              const dormantMinutes = getDormantMinutes(selectedMachine);
              const statusStyles = getStatusStyles(effectiveStatus);

              return (
                <div className="space-y-4">
                  {/* Drawer Header */}
                  <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${statusStyles.dot} animate-pulse`} />
                        <h4 className="font-mono font-bold text-sm text-slate-100">
                          {selectedMachine.machine_code}
                        </h4>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {selectedMachine.process_type} Division • {selectedMachine.current_shift || 'Shift A'}
                      </span>
                    </div>

                    <button
                      onClick={() => onSelectMachine(null)}
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Close inspector (Esc)"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center justify-between bg-slate-800/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400">Status:</span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusStyles.badge}`}
                    >
                      {effectiveStatus}
                    </span>
                  </div>

                  {/* Possible Stoppage Alert Banner */}
                  {isDormant && (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        <span>Possible Stoppage Alert</span>
                      </div>
                      <p className="text-[11px] text-amber-200/90 leading-snug">
                        No output recorded for <strong>{dormantMinutes} minutes</strong> (alert threshold: {inactivityInterval}m).
                        Requires confirmation: verify whether physical breakdown or idle stoppage occurred.
                      </p>
                      <button
                        onClick={() => onConfirmPossibleStoppageClick(selectedMachine)}
                        className="w-full py-1.5 px-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-xs transition-colors flex items-center justify-center gap-1"
                      >
                        <Clock className="h-3.5 w-3.5" />
                        <span>Resolve / Floor Check →</span>
                      </button>
                    </div>
                  )}

                  {/* Active Production Order */}
                  {activeOrder ? (
                    <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/80 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Work Order:</span>
                        <span className="font-mono font-bold text-teal-400">
                          {activeOrder.order_no}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-300">
                        <span>Customer:</span>
                        <span className="font-medium truncate max-w-[170px]">
                          {activeOrder.customer_reference}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-300">
                        <span>Fabric:</span>
                        <span className="truncate max-w-[170px]">{activeOrder.fabric_type}</span>
                      </div>

                      <div className="pt-2 border-t border-slate-700/60 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-400">Progress:</span>
                          <span>
                            {activeOrder.produced_quantity.toLocaleString()} /{' '}
                            {activeOrder.target_quantity.toLocaleString()} m (
                            {Math.min(
                              100,
                              Math.round(
                                (activeOrder.produced_quantity / activeOrder.target_quantity) * 100
                              )
                            )}
                            %)
                          </span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-teal-400 h-1.5 rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round(
                                  (activeOrder.produced_quantity / activeOrder.target_quantity) * 100
                                )
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      {activeOrder.is_flagged_for_review && (
                        <div className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-300 flex items-center justify-between">
                          <span className="truncate">
                            Flagged: {activeOrder.flag_reason || 'Downtime review'}
                          </span>
                          <button
                            onClick={() => onClearFlagClick(activeOrder.id, activeOrder.order_no)}
                            className="text-[10px] underline ml-2 text-rose-200 hover:text-white"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-800 text-xs text-slate-400 text-center">
                      No active production order assigned.
                    </div>
                  )}

                  {/* Operator & Output Timestamp */}
                  <div className="space-y-1.5 text-xs text-slate-300 bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Operator:</span>
                      <span className="font-medium text-slate-200">
                        {selectedMachine.assigned_operator || 'Unassigned'}
                      </span>
                    </div>

                    {selectedMachine.last_output_time && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Last Output Logged:</span>
                        <span className="font-mono text-[11px] text-slate-300">
                          {new Date(selectedMachine.last_output_time).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Operational Action Buttons */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Machine Operations
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {selectedMachine.current_status === 'Running' ? (
                        <>
                          <button
                            onClick={() => onRecordOutputClick(selectedMachine)}
                            className="px-3 py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                          >
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span>Log Output</span>
                          </button>

                          <button
                            onClick={() => onReportStopClick(selectedMachine)}
                            className="px-3 py-2 bg-rose-600/90 hover:bg-rose-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <Square className="h-3.5 w-3.5" />
                            <span>Stop Loom</span>
                          </button>
                        </>
                      ) : selectedMachine.current_status === 'Stopped' ? (
                        <button
                          onClick={() => onResumeClick(selectedMachine)}
                          className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-1 col-span-2"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Resume Loom Operation</span>
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => onAssignClick(selectedMachine)}
                            className="px-3 py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <Layers className="h-3.5 w-3.5" />
                            <span>Assign Order</span>
                          </button>

                          <button
                            onClick={() => onMaintenanceClick(selectedMachine)}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-1"
                          >
                            <Wrench className="h-3.5 w-3.5" />
                            <span>Maintenance</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Accessible Mobile/Small Screen Quick Machine Selection Bar */}
      <div className="md:hidden p-2.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-[10px] text-slate-400 font-mono shrink-0">Looms:</span>
        {MACHINE_SLOTS.map((slot) => {
          const machine = getMachineForSlot(slot);
          if (!machine) return null;
          const status = getEffectiveStatus(machine);
          const isSelected = selectedMachine?.id === machine.id;
          const styles = getStatusStyles(status);

          return (
            <button
              key={slot.prefix}
              onClick={() => onSelectMachine(machine)}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] shrink-0 flex items-center gap-1.5 transition-all ${
                isSelected
                  ? 'bg-teal-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
              <span>{slot.defaultCode}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
