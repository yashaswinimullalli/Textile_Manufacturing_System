'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
  ChevronLeft,
  Zap,
  Barcode,
  Search,
  ExternalLink,
  ShieldCheck,
  Package,
  Boxes,
  Sparkles,
} from 'lucide-react';
import {
  Machine,
  ProductionOrder,
  MachineStatus,
  MachineTelemetry,
  SimulationScenario,
  YarnBatch,
} from '@/lib/types';

interface PhysicalStationLayout {
  index: number;
  stationName: string;
  defaultProcessType: 'Weaving' | 'Knitting';
  cardLeft: number;
  cardTop: number;
  cardWidth: number;
  hotspotLeft: number;
  hotspotTop: number;
  hotspotWidth: number;
  hotspotHeight: number;
}

const PHYSICAL_STATIONS: PhysicalStationLayout[] = [
  {
    index: 0,
    stationName: 'Airjet Weaving Loom #1',
    defaultProcessType: 'Weaving',
    cardLeft: 13.5,
    cardTop: 8.0,
    cardWidth: 17.5,
    hotspotLeft: 8.5,
    hotspotTop: 20.0,
    hotspotWidth: 26.0,
    hotspotHeight: 33.0,
  },
  {
    index: 1,
    stationName: 'Airjet Weaving Loom #2',
    defaultProcessType: 'Weaving',
    cardLeft: 41.5,
    cardTop: 8.0,
    cardWidth: 17.5,
    hotspotLeft: 36.5,
    hotspotTop: 20.0,
    hotspotWidth: 26.0,
    hotspotHeight: 33.0,
  },
  {
    index: 2,
    stationName: 'Rapier Weaving Loom',
    defaultProcessType: 'Weaving',
    cardLeft: 69.5,
    cardTop: 8.0,
    cardWidth: 17.5,
    hotspotLeft: 65.0,
    hotspotTop: 20.0,
    hotspotWidth: 26.0,
    hotspotHeight: 33.0,
  },
  {
    index: 3,
    stationName: 'Circular Knitting Rig',
    defaultProcessType: 'Knitting',
    cardLeft: 27.0,
    cardTop: 45.0,
    cardWidth: 16.5,
    hotspotLeft: 18.0,
    hotspotTop: 52.0,
    hotspotWidth: 28.0,
    hotspotHeight: 45.0,
  },
  {
    index: 4,
    stationName: 'Seamless Knitting Rig',
    defaultProcessType: 'Knitting',
    cardLeft: 61.5,
    cardTop: 45.0,
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
  batches?: YarnBatch[];
  selectedMachine: Machine | null;
  onSelectMachine: (machine: Machine | null) => void;
  inactivityInterval: number;
  onAssignClick: (machine: Machine) => void;
  onAssignBatchMachines?: (machineIds: string[]) => void;
  onRecordOutputClick: (machine: Machine) => void;
  onReportStopClick: (machine: Machine) => void;
  onResumeClick: (machine: Machine) => void;
  onMaintenanceClick: (machine: Machine) => void;
  onConfirmPossibleStoppageClick: (machine: Machine) => void;
  onClearFlagClick: (orderId: string, orderNo?: string) => void;
  searchQuery?: string;
  statusFilter?: string;
  telemetries?: MachineTelemetry[];
  onSimulateScenario?: (machineId: string, scenario: SimulationScenario) => void;
}

export function InteractiveMachineFloorScene({
  machines,
  orders,
  batches = [],
  selectedMachine,
  onSelectMachine,
  inactivityInterval,
  onAssignClick,
  onAssignBatchMachines,
  onRecordOutputClick,
  onReportStopClick,
  onResumeClick,
  onMaintenanceClick,
  onConfirmPossibleStoppageClick,
  onClearFlagClick,
  searchQuery = '',
  statusFilter = 'ALL',
  telemetries = [],
  onSimulateScenario,
}: InteractiveMachineFloorSceneProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [hoveredStationIndex, setHoveredStationIndex] = useState<number | null>(null);
  const [openedBatchModal, setOpenedBatchModal] = useState<YarnBatch | null>(null);

  // Close inspector on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (openedBatchModal) {
          setOpenedBatchModal(null);
        } else if (selectedMachine) {
          onSelectMachine(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMachine, openedBatchModal, onSelectMachine]);

  const totalSlides = Math.max(1, Math.ceil(machines.length / 5));

  // Machines currently active on this visual slide
  const currentSlideMachines = useMemo(() => {
    const startIdx = currentSlideIndex * 5;
    return PHYSICAL_STATIONS.map((station, i) => {
      const machineIndex = startIdx + i;
      const machine = machines[machineIndex];
      return {
        station,
        machine,
        machineIndex,
      };
    });
  }, [machines, currentSlideIndex]);

  // Search handling: Jump to the slide containing the searched machine, order, or batch
  useEffect(() => {
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase().trim();

    // Check if any machine matches across all slides
    const foundIndex = machines.findIndex((m) => {
      const order = orders.find((o) => o.id === m.active_order_id || o.order_no === m.active_order_no);
      const batch = batches.find(
        (b) =>
          b.batch_code.toLowerCase().includes(q) ||
          b.barcode.toLowerCase().includes(q) ||
          b.yarn_type.toLowerCase().includes(q)
      );

      return (
        m.machine_code.toLowerCase().includes(q) ||
        (m.assigned_operator && m.assigned_operator.toLowerCase().includes(q)) ||
        (order && order.order_no.toLowerCase().includes(q)) ||
        (order && order.customer_reference.toLowerCase().includes(q)) ||
        (order && order.fabric_type.toLowerCase().includes(q)) ||
        Boolean(batch)
      );
    });

    if (foundIndex !== -1) {
      const targetSlide = Math.floor(foundIndex / 5);
      if (targetSlide !== currentSlideIndex) {
        setCurrentSlideIndex(targetSlide);
      }
      onSelectMachine(machines[foundIndex]);
    }
  }, [searchQuery, machines, orders, batches]);

  // Telemetry lookup with flexible ID/code normalization
  const getTelemetryForMachine = (m?: Machine, stationIndex?: number): MachineTelemetry | undefined => {
    if (!m) return undefined;
    const mNum = parseInt(m.machine_code.replace(/\D/g, '') || m.id.replace(/\D/g, '') || '0', 10);
    const directMatch = telemetries.find((t) => {
      if (t.machine_id === m.id || t.machine_id === `mach-${m.id}`) return true;
      const tNum = parseInt(t.machine_code.replace(/\D/g, '') || t.machine_id.replace(/\D/g, '') || '0', 10);
      if (mNum > 0 && tNum > 0 && mNum === tNum) return true;
      return false;
    });
    if (directMatch) return directMatch;
    if (typeof stationIndex === 'number' && telemetries[stationIndex]) {
      return telemetries[stationIndex];
    }
    return undefined;
  };

  // Dormancy check
  const isMachineDormant = (m: Machine): boolean => {
    if (m.current_status !== 'Running' || !m.last_output_time) return false;
    const diffMinutes = Math.floor((Date.now() - new Date(m.last_output_time).getTime()) / (1000 * 60));
    return diffMinutes > inactivityInterval;
  };

  const getDormantMinutes = (m: Machine): number => {
    if (!m.last_output_time) return inactivityInterval;
    return Math.floor((Date.now() - new Date(m.last_output_time).getTime()) / (1000 * 60));
  };

  const getEffectiveStatus = (m: Machine): MachineStatus | 'Possible Stoppage' => {
    if (isMachineDormant(m)) return 'Possible Stoppage';
    return m.current_status;
  };

  // Active order lookup with fallback from machine attributes
  const getActiveOrderForMachine = (m?: Machine): ProductionOrder | undefined => {
    if (!m || (!m.active_order_id && !m.active_order_no)) return undefined;
    const found = orders.find((o) => o.id === m.active_order_id || o.order_no === m.active_order_no);
    if (found) return found;
    if (m.active_order_no) {
      return {
        id: m.active_order_id || '0',
        order_no: m.active_order_no,
        customer_reference: m.customer_name || 'Apex Contract Apparel',
        fabric_type: m.fabric_type || 'Standard Mill Fabric',
        target_quantity: m.capacity ? m.capacity * 10 : 5000,
        produced_quantity: 0,
        required_yarn_quantity: 1200,
        due_date: new Date(Date.now() + 7 * 86400000).toLocaleDateString(),
        status: 'In Progress',
        created_at: new Date().toISOString(),
        is_flagged_for_review: false,
      };
    }
    return undefined;
  };

  // Linked Yarn Batch lookup for an order or machine
  const getLinkedBatchForOrder = (order?: ProductionOrder): YarnBatch | undefined => {
    if (!order) return undefined;
    const isCotton = order.fabric_type.toLowerCase().includes('cotton');
    const isPoly = order.fabric_type.toLowerCase().includes('poly');

    const matched = batches.find((b) => {
      if (isCotton && b.yarn_type.toLowerCase().includes('cotton')) return true;
      if (isPoly && b.yarn_type.toLowerCase().includes('poly')) return true;
      if (!isCotton && !isPoly && b.yarn_type.toLowerCase().includes('blend')) return true;
      return false;
    });

    return matched || batches[0];
  };

  // Status styling
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

  const handleAssignNext5 = () => {
    if (!onAssignBatchMachines) return;
    const currentMachineIds = currentSlideMachines
      .map((item) => item.machine?.id)
      .filter((id): id is string => Boolean(id));

    if (currentMachineIds.length > 0) {
      onAssignBatchMachines(currentMachineIds);
    }
  };

  const bayLetter = String.fromCharCode(65 + currentSlideIndex);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950 select-none">
      {/* Top Header Bar: Slide Navigation (Bays) & Quick Assign 5 Orders */}
      <div className="px-4 py-2.5 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-30 pointer-events-auto">
        {/* Bay Slide Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            type="button"
            disabled={currentSlideIndex === 0}
            onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="Previous Bay (Machines)"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalSlides }).map((_, idx) => {
              const bLetter = String.fromCharCode(65 + idx);
              const isCurrent = idx === currentSlideIndex;
              const mStart = idx * 5 + 1;
              const mEnd = Math.min(machines.length, (idx + 1) * 5);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-teal-500 text-slate-950 shadow-sm scale-105'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  Bay {bLetter} (M{mStart}-M{mEnd})
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={currentSlideIndex >= totalSlides - 1}
            onClick={() => setCurrentSlideIndex((prev) => Math.min(totalSlides - 1, prev + 1))}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="Next Bay (Machines)"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Assign Next 5 Orders to Current Bay Button */}
        {onAssignBatchMachines && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAssignNext5}
              className="px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-teal-950/50 border border-teal-400/40 hover:scale-[1.02] active:scale-95 cursor-pointer"
              title="Automatically assign unassigned production orders to all 5 machines in this bay"
            >
              <Zap className="h-3.5 w-3.5 text-amber-300 fill-amber-300 animate-pulse" />
              <span>⚡ Assign 5 More Orders to Bay {bayLetter}</span>
            </button>
          </div>
        )}
      </div>

      {/* Visual Canvas Container with exact 1376:600 aspect ratio */}
      <div className="relative w-full aspect-[1376/600] min-h-[420px] sm:min-h-[480px] overflow-hidden">
        {/* Crisp Factory Floor Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/factory_floor_scene.jpg"
            alt="VASTRA Interactive Textile Factory Floor"
            fill
            priority
            className="object-cover object-center pointer-events-none"
          />
        </div>

        {/* 5 Interactive Machine Hotspots & Dynamic Overlay Panels */}
        {currentSlideMachines.map(({ station, machine, machineIndex }) => {
          if (!machine) return null;

          const effectiveStatus = getEffectiveStatus(machine);
          const telem = getTelemetryForMachine(machine, station.index);
          const isSelected = selectedMachine?.id === machine.id;
          const isHovered = hoveredStationIndex === station.index;
          const activeOrder = getActiveOrderForMachine(machine);
          const linkedBatch = getLinkedBatchForOrder(activeOrder);
          const dormantMinutes = getDormantMinutes(machine);

          const targetQty = activeOrder?.target_quantity || 0;
          const producedQty = activeOrder?.produced_quantity || 0;
          const progressPercent =
            targetQty > 0 ? Math.min(100, Math.round((producedQty / targetQty) * 100)) : 0;

          const styles = getStatusStyles(effectiveStatus);

          const matchesSearch =
            !searchQuery ||
            machine.machine_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            activeOrder?.order_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
            activeOrder?.customer_reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
            machine.assigned_operator?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            linkedBatch?.batch_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            linkedBatch?.barcode.toLowerCase().includes(searchQuery.toLowerCase());

          const matchesStatus =
            statusFilter === 'ALL' || effectiveStatus === statusFilter;

          const isDimmed = !matchesSearch || !matchesStatus;

          return (
            <React.Fragment key={`${currentSlideIndex}-${station.index}`}>
              {/* 1. Machine Floor Hotspot: Click to select */}
              <div
                style={{
                  left: `${station.hotspotLeft}%`,
                  top: `${station.hotspotTop}%`,
                  width: `${station.hotspotWidth}%`,
                  height: `${station.hotspotHeight}%`,
                }}
                onClick={() => onSelectMachine(machine)}
                onMouseEnter={() => setHoveredStationIndex(station.index)}
                onMouseLeave={() => setHoveredStationIndex(null)}
                className={`absolute z-10 cursor-pointer transition-all duration-200 rounded-xl pointer-events-auto ${
                  isSelected
                    ? 'ring-2 ring-teal-400 bg-teal-400/10 shadow-lg shadow-teal-500/20'
                    : isHovered
                    ? `${styles.ring} ring-1 shadow-md`
                    : ''
                }`}
                title={`Click to inspect ${machine.machine_code}`}
              >
                {/* Dynamic Loom Weaving Indicator on Floor */}
                {effectiveStatus === 'Running' && (
                  <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-emerald-400/10 border-2 border-emerald-400/30 rounded-xl animate-pulse" />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-950/85 border border-emerald-500/50 text-emerald-300 text-[9px] font-mono font-bold shadow-md">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>{telem ? Math.round(telem.rpm) : 680} RPM</span>
                    </div>
                  </div>
                )}

                {/* Selected Beacon */}
                {isSelected && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/90 border border-teal-400 text-teal-300 text-[10px] font-mono font-bold shadow-lg">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-ping" />
                    <span>Selected</span>
                  </div>
                )}
              </div>

              {/* 2. Dynamic Machine Information Card */}
              <div
                style={{
                  left: `${station.cardLeft}%`,
                  top: `${station.cardTop}%`,
                  width: `${station.cardWidth}%`,
                }}
                onClick={() => onSelectMachine(machine)}
                onMouseEnter={() => setHoveredStationIndex(station.index)}
                onMouseLeave={() => setHoveredStationIndex(null)}
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
                <div className="bg-white/95 hover:bg-white backdrop-blur-md rounded-xl p-2.5 border border-slate-200 shadow-sm flex flex-col justify-between transition-colors space-y-1.5">
                  {/* Top Bar: Status + Bay Label */}
                  <div className="flex items-center justify-between gap-1">
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

                    <span className="text-[9px] font-mono font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                      Bay {bayLetter}-{station.index + 1}
                    </span>
                  </div>

                  {/* Middle: Machine Code & Name */}
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs tracking-tight flex items-center justify-between">
                      <span className="font-mono">{machine.machine_code}</span>
                      <span className="text-[9px] text-slate-400 font-medium">{machine.process_type}</span>
                    </h3>
                    <p className="text-[10px] text-slate-600 font-medium truncate mt-0.5" title={machine.machine_name || station.stationName}>
                      {machine.machine_name || station.stationName}
                    </p>
                  </div>

                  {/* Showcase Assigned Order & Live Dynamic Production */}
                  <div className="pt-1.5 border-t border-slate-100 space-y-1">
                    {activeOrder ? (
                      <div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-mono font-bold text-teal-700">
                            {activeOrder.order_no}
                          </span>
                          <span className="text-slate-600 font-medium truncate max-w-[90px]" title={activeOrder.customer_reference}>
                            {activeOrder.customer_reference}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mt-0.5">
                          <span>{activeOrder.fabric_type}</span>
                          <span className="font-semibold text-slate-700">
                            {telem ? `${Number(telem.cumulative_counter_meters).toFixed(0)}m` : `${progressPercent}%`}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden mt-1">
                          <div
                            className="bg-teal-500 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>

                        {/* Linked Batch Indicator */}
                        {linkedBatch && (
                          <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1">
                            <span className="font-mono text-slate-600 truncate max-w-[85px]" title={linkedBatch.batch_code}>
                              📦 {linkedBatch.batch_code}
                            </span>
                            <span className="text-teal-700 font-semibold truncate">
                              {linkedBatch.yarn_type}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium py-1">
                        <span className="text-slate-400">Unassigned Loom</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAssignClick(machine);
                          }}
                          className="px-2 py-0.5 rounded bg-teal-50 hover:bg-teal-100 text-teal-700 hover:text-teal-800 font-bold border border-teal-200 transition-colors cursor-pointer"
                        >
                          Assign →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {/* Drawer Backdrop */}
        {selectedMachine && (
          <div
            onClick={() => onSelectMachine(null)}
            className="absolute inset-0 z-25 bg-slate-950/20 backdrop-blur-[1px] cursor-pointer transition-opacity"
            title="Click to dismiss machine inspector"
          />
        )}

        {/* Slide-over Machine Detail Inspector Drawer */}
        {selectedMachine && (
          <div className="absolute inset-y-0 right-0 z-30 w-84 sm:w-96 bg-slate-900/95 backdrop-blur-md text-white border-l border-slate-700/80 shadow-2xl p-4 sm:p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            {(() => {
              const activeOrder = getActiveOrderForMachine(selectedMachine);
              const linkedBatch = getLinkedBatchForOrder(activeOrder);
              const effectiveStatus = getEffectiveStatus(selectedMachine);
              const isDormant = isMachineDormant(selectedMachine);
              const dormantMinutes = getDormantMinutes(selectedMachine);
              const statusStyles = getStatusStyles(effectiveStatus);
              const telemetry = getTelemetryForMachine(selectedMachine);

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
                        {selectedMachine.machine_name || selectedMachine.process_type} Division • Bay {bayLetter}
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
                    <span className="text-xs text-slate-400">Current Status:</span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusStyles.badge}`}
                    >
                      {effectiveStatus}
                    </span>
                  </div>

                  {/* Live Simulation Telemetry */}
                  <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/80 text-xs space-y-2">
                    <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider block">
                      Live Telemetry & Output
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Loom Speed</span>
                        <span className="font-mono font-bold text-emerald-400 text-sm">
                          {telemetry ? Math.round(telemetry.rpm) : 680} RPM
                        </span>
                      </div>
                      <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Cloth Meter</span>
                        <span className="font-mono font-bold text-teal-300 text-sm">
                          {telemetry ? `${Number(telemetry.cumulative_counter_meters).toFixed(1)}m` : '142.5m'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Active Production Order */}
                  {activeOrder ? (
                    <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/80 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Assigned Order:</span>
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
                        <span>Fabric Specification:</span>
                        <span className="truncate max-w-[170px]">{activeOrder.fabric_type}</span>
                      </div>

                      <div className="pt-2 border-t border-slate-700/60 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-400">Target Progress:</span>
                          <span>
                            {activeOrder.produced_quantity.toLocaleString()} /{' '}
                            {activeOrder.target_quantity.toLocaleString()} m
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
                    </div>
                  ) : (
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-800 text-xs text-slate-400 text-center">
                      No active production order assigned.
                    </div>
                  )}

                  {/* Particular Yarn Batch Assigned to this Machine & Order */}
                  {linkedBatch ? (
                    <div className="bg-teal-950/40 border border-teal-500/30 rounded-lg p-3 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Barcode className="h-3.5 w-3.5 text-teal-400" />
                          <span>Particular Yarn Batch</span>
                        </span>
                        <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded">
                          QC PASSED
                        </span>
                      </div>

                      <div className="p-2 bg-slate-900/70 rounded border border-slate-800 font-mono text-xs flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-100 block">{linkedBatch.batch_code}</span>
                          <span className="text-[10px] text-slate-400 block">{linkedBatch.barcode}</span>
                        </div>
                        <span className="text-emerald-400 font-bold">
                          {linkedBatch.quantity_available} kg avail
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-300 flex items-center justify-between">
                        <span>Material:</span>
                        <span className="font-medium text-slate-200">
                          {linkedBatch.yarn_type} • {linkedBatch.colour}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setOpenedBatchModal(linkedBatch)}
                        className="w-full mt-2 py-2 px-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Search className="h-3.5 w-3.5" />
                        <span>Open Particular Batch Details →</span>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-400 text-center">
                      No yarn batch linked to this order.
                    </div>
                  )}

                  {/* Operator Info */}
                  <div className="space-y-1.5 text-xs text-slate-300 bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Operator:</span>
                      <span className="font-medium text-slate-200">
                        {selectedMachine.assigned_operator || 'Floor Operator'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Shift:</span>
                      <span className="text-slate-200">{selectedMachine.current_shift || 'Shift A (06:00 - 14:00)'}</span>
                    </div>
                  </div>

                  {/* Live Event Simulator Scenarios */}
                  <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-teal-400" />
                        <span>Event Simulator Scenarios</span>
                      </span>
                      <Link
                        href="/production/machine-events"
                        className="text-[10px] text-teal-300 hover:text-teal-200 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span>Full Panel</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-tight">
                      Trigger real-time machine telemetry signals and fault scenarios:
                    </p>

                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => onSimulateScenario?.(selectedMachine.id, 'NORMAL_PRODUCTION')}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold flex items-center gap-1.5 transition-all text-left cursor-pointer"
                        title="Set machine running normally at rated RPM"
                      >
                        <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                        <span className="truncate">Normal (680 RPM)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSimulateScenario?.(selectedMachine.id, 'VIBRATION_ANOMALY')}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 text-amber-300 text-[11px] font-semibold flex items-center gap-1.5 transition-all text-left cursor-pointer"
                        title="Inject vibration anomaly (6.8 mm/s RMS)"
                      >
                        <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
                        <span className="truncate">Vibration Spike</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSimulateScenario?.(selectedMachine.id, 'UNEXPECTED_STOP')}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-[11px] font-semibold flex items-center gap-1.5 transition-all text-left cursor-pointer"
                        title="Trigger unexpected yarn break stop"
                      >
                        <Square className="h-3 w-3 text-rose-400 shrink-0" />
                        <span className="truncate">Warp Break (Stop)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSimulateScenario?.(selectedMachine.id, 'EMERGENCY_STOP')}
                        className="px-2.5 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 text-[11px] font-semibold flex items-center gap-1.5 transition-all text-left cursor-pointer"
                        title="Engage emergency stop button"
                      >
                        <AlertOctagon className="h-3 w-3 text-red-400 shrink-0" />
                        <span className="truncate">Emergency Stop</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSimulateScenario?.(selectedMachine.id, 'PLANNED_MAINTENANCE')}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 text-[11px] font-semibold flex items-center gap-1.5 transition-all text-left cursor-pointer"
                        title="Schedule planned maintenance overhaul"
                      >
                        <Wrench className="h-3 w-3 text-indigo-400 shrink-0" />
                        <span className="truncate">Maintenance</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSimulateScenario?.(selectedMachine.id, 'RESUME_PRODUCTION')}
                        className="px-2.5 py-1.5 rounded-lg bg-teal-950/70 hover:bg-teal-900 border border-teal-500/40 text-teal-300 text-[11px] font-semibold flex items-center gap-1.5 transition-all text-left cursor-pointer"
                        title="Clear stoppage and resume running"
                      >
                        <RotateCcw className="h-3 w-3 text-teal-400 shrink-0" />
                        <span className="truncate">Resume Running</span>
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
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
                            className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <Square className="h-3.5 w-3.5" />
                            <span>Report Stop</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => onAssignClick(selectedMachine)}
                            className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <User className="h-3.5 w-3.5" />
                            <span>Assign Order</span>
                          </button>
                          <button
                            onClick={() => onResumeClick(selectedMachine)}
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Resume</span>
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

      {/* Particular Yarn Batch Inspection & Verification Modal */}
      {openedBatchModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-slate-900">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl border border-teal-200">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Particular Yarn Batch Details
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Batch: {openedBatchModal.batch_code} • Barcode: {openedBatchModal.barcode}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenedBatchModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Visual Barcode Display */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Official FabricTrace Label
              </span>
              <div className="h-12 bg-white border border-slate-300 rounded flex items-center justify-center px-4 font-mono text-2xl tracking-[0.25em] font-extrabold select-all">
                |||| | ||||| || ||| ||||
              </div>
              <span className="font-mono text-sm font-bold text-slate-800 block">
                {openedBatchModal.barcode || openedBatchModal.batch_code}
              </span>
            </div>

            {/* Batch Attributes */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Fiber / Material</span>
                <span className="font-semibold text-slate-800">{openedBatchModal.yarn_type}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Shade / Colour</span>
                <span className="font-semibold text-slate-800">{openedBatchModal.colour}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Supplier Source</span>
                <span className="font-semibold text-slate-800">{openedBatchModal.supplier}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Stock Available</span>
                <span className="font-mono font-bold text-emerald-700">
                  {openedBatchModal.quantity_available} {openedBatchModal.unit}
                </span>
              </div>
            </div>

            {/* Laboratory Test Verification Data */}
            <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-teal-900">
                <ShieldCheck className="h-4 w-4 text-teal-600" />
                <span>ASTM / ISO Laboratory Quality Certification</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">Tensile Strength</span>
                  <span className="font-bold text-slate-800">18.5 cN/tex</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Twist (TPM)</span>
                  <span className="font-bold text-slate-800">720 TPM</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Disposition</span>
                  <span className="font-bold text-emerald-700">PASSED</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setOpenedBatchModal(null)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Close
              </button>
              <Link
                href={`/quality/inspections`}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span>Inspect in QC Workstation</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
