'use client';

import React, { useReducer, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Check,
  X,
  RefreshCw,
  Search,
  Circle,
  Layers,
  Boxes,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { api } from '@/lib/api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type StageId = 'spinning' | 'weaving' | 'dyeing' | 'final';
export type InspectionStatus = 'not_started' | 'in_progress' | 'passed' | 'rework' | 'rejected';
export type Decision = 'pass' | 'rework' | 'reject';

interface StageDefect { id: string; label: string; }
interface InspectionRecord {
  id: string; stageId: StageId; rollCode: string;
  decision: Decision; defects: string[]; notes: string;
  inspector: string; date: string;
}
interface StageInspection { stageId: StageId; status: InspectionStatus; records: InspectionRecord[]; }
export interface YarnRoll {
  code: string;
  name: string;
  weight: string;
  color: string;
  customer: string;
  orderRef: string;
  barcode?: string;
  status?: string;
  type?: 'FABRIC_ROLL' | 'YARN_BATCH';
}

// ─── Stage Definitions ────────────────────────────────────────────────────────
const STAGES: { id: StageId; seq: number; label: string; description: string; defects: StageDefect[]; accentClass: string; lightBg: string; }[] = [
  {
    id: 'spinning', seq: 1, label: 'Spinning',
    description: 'Check yarn quality, consistency, and spinning defects.',
    defects: [
      { id: 'thick_thin', label: 'Thick / Thin Yarn' },
      { id: 'neps', label: 'Neps & Knots' },
      { id: 'hairiness', label: 'Excessive Hairiness' },
      { id: 'uneven_twist', label: 'Uneven Twist' },
      { id: 'breakage', label: 'Yarn Breakage' },
    ],
    accentClass: 'text-violet-700', lightBg: 'bg-violet-50 border-violet-200',
  },
  {
    id: 'weaving', seq: 2, label: 'Weaving',
    description: 'Check fabric construction, broken threads, and weaving defects.',
    defects: [
      { id: 'broken_thread', label: 'Broken / Missing Thread' },
      { id: 'uneven_weave', label: 'Uneven Weave' },
      { id: 'selvedge_curl', label: 'Selvedge Curl' },
      { id: 'weft_tension', label: 'Weft Tension Slack' },
      { id: 'reed_mark', label: 'Reed / Loom Mark' },
    ],
    accentClass: 'text-sky-700', lightBg: 'bg-sky-50 border-sky-200',
  },
  {
    id: 'dyeing', seq: 3, label: 'Dyeing',
    description: 'Check colour consistency, uneven dyeing, and stains.',
    defects: [
      { id: 'uneven_dye', label: 'Uneven Dye / Shade Var.' },
      { id: 'stain', label: 'Oil / Chemical Stain' },
      { id: 'colour_bleed', label: 'Colour Bleed' },
      { id: 'crease_mark', label: 'Crease / Rope Mark' },
      { id: 'wrong_colour', label: 'Wrong Colour vs. Spec' },
    ],
    accentClass: 'text-teal-700', lightBg: 'bg-teal-50 border-teal-200',
  },
  {
    id: 'final', seq: 4, label: 'Final Inspection',
    description: 'Overall quality, customer spec check, and dispatch readiness.',
    defects: [
      { id: 'hole', label: 'Hole / Tear' },
      { id: 'contamination', label: 'Foreign Contamination' },
      { id: 'width_issue', label: 'Width / Measurement Off' },
      { id: 'pilling', label: 'Pilling / Surface Fuzz' },
      { id: 'dispatch_block', label: 'Dispatch Block (Critical)' },
    ],
    accentClass: 'text-emerald-700', lightBg: 'bg-emerald-50 border-emerald-200',
  },
];

// ─── Status helpers ───────────────────────────────────────────────────────────
function statusLabel(s: InspectionStatus) {
  const map: Record<InspectionStatus, string> = {
    not_started: 'Not Started', in_progress: 'In Progress',
    passed: 'Passed', rework: 'Rework Required', rejected: 'Rejected',
  };
  return map[s];
}

function statusColors(s: InspectionStatus) {
  if (s === 'passed') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (s === 'rework') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (s === 'rejected') return 'bg-red-50 text-red-700 border-red-200';
  if (s === 'in_progress') return 'bg-sky-50 text-sky-700 border-sky-200';
  return 'bg-slate-50 text-slate-500 border-slate-200';
}

function statusIcon(s: InspectionStatus) {
  if (s === 'passed') return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
  if (s === 'rework') return <AlertTriangle className="w-4 h-4 text-amber-600" />;
  if (s === 'rejected') return <XCircle className="w-4 h-4 text-red-600" />;
  if (s === 'in_progress') return <RefreshCw className="w-4 h-4 text-sky-600 animate-spin" />;
  return <Circle className="w-4 h-4 text-slate-400" />;
}

function dotClass(s: InspectionStatus) {
  if (s === 'passed') return 'bg-emerald-500 ring-4 ring-emerald-100';
  if (s === 'rework') return 'bg-amber-400 ring-4 ring-amber-100';
  if (s === 'rejected') return 'bg-red-500 ring-4 ring-red-100';
  if (s === 'in_progress') return 'bg-sky-400 ring-4 ring-sky-100 animate-pulse';
  return 'bg-slate-200 ring-4 ring-slate-50';
}

// ─── State management ─────────────────────────────────────────────────────────
type State = {
  selectedRollCode: string;
  searchQuery: string;
  activeStageId: StageId | null;
  formDefects: string[];
  formNotes: string;
  formInspector: string;
  stageData: Record<string, Record<StageId, StageInspection>>;
  successStage: StageId | null;
};

type Action =
  | { type: 'SELECT_ROLL'; code: string }
  | { type: 'SEARCH'; q: string }
  | { type: 'OPEN_STAGE'; stageId: StageId }
  | { type: 'CLOSE_STAGE' }
  | { type: 'TOGGLE_DEFECT'; defectId: string }
  | { type: 'SET_NOTES'; notes: string }
  | { type: 'SET_INSPECTOR'; name: string }
  | { type: 'SUBMIT'; decision: Decision }
  | { type: 'CLEAR_SUCCESS' };

function buildInitialStages(): Record<StageId, StageInspection> {
  return {
    spinning: { stageId: 'spinning', status: 'not_started', records: [] },
    weaving: { stageId: 'weaving', status: 'not_started', records: [] },
    dyeing: { stageId: 'dyeing', status: 'not_started', records: [] },
    final: { stageId: 'final', status: 'not_started', records: [] },
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SELECT_ROLL':
      return {
        ...state,
        selectedRollCode: action.code,
        activeStageId: null,
        formDefects: [],
        formNotes: '',
        successStage: null,
        stageData: state.stageData[action.code]
          ? state.stageData
          : { ...state.stageData, [action.code]: buildInitialStages() },
      };
    case 'SEARCH':
      return { ...state, searchQuery: action.q };
    case 'OPEN_STAGE':
      return { ...state, activeStageId: action.stageId, formDefects: [], formNotes: '' };
    case 'CLOSE_STAGE':
      return { ...state, activeStageId: null };
    case 'TOGGLE_DEFECT': {
      const already = state.formDefects.includes(action.defectId);
      return {
        ...state,
        formDefects: already
          ? state.formDefects.filter((d) => d !== action.defectId)
          : [...state.formDefects, action.defectId],
      };
    }
    case 'SET_NOTES':
      return { ...state, formNotes: action.notes };
    case 'SET_INSPECTOR':
      return { ...state, formInspector: action.name };
    case 'SUBMIT': {
      const { selectedRollCode, activeStageId, formDefects, formNotes, formInspector } = state;
      if (!activeStageId || !selectedRollCode) return state;
      const record: InspectionRecord = {
        id: `REC-${Date.now()}`,
        stageId: activeStageId,
        rollCode: selectedRollCode,
        decision: action.decision,
        defects: formDefects,
        notes: formNotes.trim() || '(No notes)',
        inspector: formInspector.trim() || 'Floor Inspector',
        date: new Date().toISOString(),
      };
      const newStatus: InspectionStatus =
        action.decision === 'pass' ? 'passed' : action.decision === 'rework' ? 'rework' : 'rejected';
      const existing = state.stageData[selectedRollCode] ?? buildInitialStages();
      const prevStage = existing[activeStageId];
      return {
        ...state,
        activeStageId: null,
        formDefects: [],
        formNotes: '',
        successStage: activeStageId,
        stageData: {
          ...state.stageData,
          [selectedRollCode]: {
            ...existing,
            [activeStageId]: {
              ...prevStage,
              status: newStatus,
              records: [...prevStage.records, record],
            },
          },
        },
      };
    }
    case 'CLEAR_SUCCESS':
      return { ...state, successStage: null };
    default:
      return state;
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StageInspectionTracker() {
  const [yarnRolls, setYarnRolls] = useState<YarnRoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'FABRIC_ROLL' | 'YARN_BATCH'>('ALL');
  const [savingToDb, setSavingToDb] = useState(false);
  const [dbSaveMessage, setDbSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [state, dispatch] = useReducer(reducer, {
    selectedRollCode: '',
    searchQuery: '',
    activeStageId: null,
    formDefects: [],
    formNotes: '',
    formInspector: 'Alex Kumar',
    stageData: {},
    successStage: null,
  });

  // Load live yarn batches & fabric rolls from PostgreSQL database
  useEffect(() => {
    let isMounted = true;
    const loadDatabaseData = async () => {
      setLoading(true);
      try {
        const [batchesRes, rollsRes, ordersRes] = await Promise.all([
          api.getYarnBatches().catch(() => ({ data: [] })),
          api.getFabricRolls().catch(() => ({ data: [], rolls: [] })),
          api.getProductionOrders().catch(() => ({ data: [] })),
        ]);

        if (!isMounted) return;

        const batches = (batchesRes as any)?.data || (Array.isArray(batchesRes) ? batchesRes : []);
        const rawRolls = (rollsRes as any)?.rolls || (rollsRes as any)?.data || (Array.isArray(rollsRes) ? rollsRes : []);
        const orders = (ordersRes as any)?.data || (Array.isArray(ordersRes) ? ordersRes : []);

        const mappedRolls: YarnRoll[] = rawRolls.map((r: any) => ({
          code: r.roll_id || r.roll_code,
          name: `${r.fabric_type || 'Cotton'} Fabric Roll`,
          weight: `${r.weight || r.produced_quantity || 500} ${r.unit || 'm'}`,
          color: 'Finished Weave',
          customer: r.customer_name || r.customer || 'Retail Client',
          orderRef: r.order_number || r.order_no || `Order #${r.production_order_id || 'PO'}`,
          barcode: r.qr_code || r.roll_id,
          status: r.qc_status || 'PENDING',
          type: 'FABRIC_ROLL',
        }));

        // Only include raw materials that have been scanned & taken into the Storekeeper Inventory dashboard!
        const takenBatches = batches.filter((b: any) => b.intake_scanned === true);

        const mappedBatches: YarnRoll[] = takenBatches.map((b: any, idx: number) => {
          const matchingOrder = orders[idx % (orders.length || 1)];
          return {
            code: b.batch_code,
            name: `${b.yarn_type} Yarn · ${b.colour}`,
            weight: `${b.available_quantity || b.quantity_available || b.received_quantity || 100} ${b.unit || 'kg'}`,
            color: b.colour,
            customer: b.supplier_name || b.supplier || 'Plant Inventory',
            orderRef: b.po_reference || (matchingOrder ? matchingOrder.order_no || matchingOrder.order_number : 'Inventory Batch'),
            barcode: b.barcode_id || b.barcode,
            status: b.qc_status || b.inspection_status || 'PENDING',
            type: 'YARN_BATCH',
          };
        });

        // Combined dynamic list: Fabric Rolls from production input orders + Yarn Batches taken by storekeeper
        const dynamicList: YarnRoll[] = [...mappedRolls, ...mappedBatches];

        setYarnRolls(dynamicList);
        if (dynamicList.length > 0) {
          dispatch({ type: 'SELECT_ROLL', code: dynamicList[0].code });
        }
      } catch (err) {
        console.error('Failed to load database items for inspection:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDatabaseData();
    return () => { isMounted = false; };
  }, []);

  const clearSuccess = useCallback(() => {
    setTimeout(() => dispatch({ type: 'CLEAR_SUCCESS' }), 2000);
  }, []);

  if (state.successStage) clearSuccess();

  const filtered = yarnRolls.filter((r) => {
    const q = state.searchQuery.toLowerCase();
    const matchCategory =
      categoryFilter === 'ALL' ||
      (categoryFilter === 'FABRIC_ROLL' && r.type === 'FABRIC_ROLL') ||
      (categoryFilter === 'YARN_BATCH' && r.type === 'YARN_BATCH');
    const matchText =
      r.code.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      r.customer.toLowerCase().includes(q);
    return matchCategory && matchText;
  });

  const selectedRoll = yarnRolls.find((r) => r.code === state.selectedRollCode) || yarnRolls[0];
  const stages = (state.selectedRollCode ? state.stageData[state.selectedRollCode] : null) ?? buildInitialStages();
  const allPassed = STAGES.every((s) => stages[s.id].status === 'passed') || selectedRoll?.status === 'APPROVED';
  const anyRejected = STAGES.some((s) => stages[s.id].status === 'rejected') || selectedRoll?.status === 'REJECTED';
  const anyRework = STAGES.some((s) => stages[s.id].status === 'rework') || selectedRoll?.status === 'REINSPECTION';
  const completedCount = allPassed ? 4 : STAGES.filter((s) => stages[s.id].status === 'passed').length;
  const activeStage = STAGES.find((s) => s.id === state.activeStageId);

  // ─── Database-backed Inspection Decision Submission ──────────────────────
  const handleSaveDecision = async (decision: Decision) => {
    const { activeStageId, formDefects, formNotes, formInspector } = state;
    if (!activeStageId || !selectedRoll) return;

    // 1. Dispatch UI update
    dispatch({ type: 'SUBMIT', decision });

    // 2. Persist to PostgreSQL Database!
    setSavingToDb(true);
    setDbSaveMessage(null);
    try {
      const isFabricRoll = selectedRoll.code.startsWith('ROLL-') || selectedRoll.type === 'FABRIC_ROLL';
      if (isFabricRoll) {
        const disposition = decision === 'pass' ? 'APPROVED' : (decision === 'rework' ? 'REINSPECTION' : 'REJECTED');
        await api.recordFabricInspection(selectedRoll.code, {
          disposition,
          decision,
          defect_type: formDefects.join(', ') || `${activeStage?.label} Stage Inspection`,
          defect_count: formDefects.length,
          remarks: `[Stage: ${activeStage?.label}] ${formNotes || 'Passed inspection'}`,
          notes: formNotes,
          inspector_name: formInspector,
        });

        // Update local list status
        setYarnRolls((prev) =>
          prev.map((r) =>
            r.code === selectedRoll.code ? { ...r, status: disposition } : r
          )
        );

        setDbSaveMessage({
          type: 'success',
          text: `Saved in PostgreSQL: Roll ${selectedRoll.code} marked "${disposition}". ${decision === 'pass' ? 'Cleared for Dispatch Gate!' : 'Sent to Quarantine.'}`,
        });
      } else {
        const disposition = decision === 'pass' ? 'PASSED' : (decision === 'rework' ? 'ON_HOLD' : 'REJECTED');
        await api.recordRawMaterialInspection(selectedRoll.code, {
          disposition,
          decision: disposition,
          defects: formDefects.join(', '),
          remarks: `[Stage: ${activeStage?.label}] ${formNotes}`,
          inspector_name: formInspector,
          quantity_approved: 100,
        });

        setYarnRolls((prev) =>
          prev.map((r) =>
            r.code === selectedRoll.code ? { ...r, status: disposition } : r
          )
        );

        setDbSaveMessage({
          type: 'success',
          text: `Saved in PostgreSQL: Yarn batch ${selectedRoll.code} status updated to "${disposition}".`,
        });
      }
    } catch (err: any) {
      console.warn('Database inspection save:', err);
      setDbSaveMessage({
        type: 'error',
        text: `Inspection recorded locally. Database note: ${err.message || 'Saved in queue'}`,
      });
    } finally {
      setSavingToDb(false);
    }
  };

  const rollsCount = yarnRolls.filter((r) => r.type === 'FABRIC_ROLL').length;
  const batchesCount = yarnRolls.filter((r) => r.type === 'YARN_BATCH').length;

  return (
    <div className="font-sans">
      {/* Feedback banner */}
      {dbSaveMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-4 p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 ${
            dbSaveMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{dbSaveMessage.text}</span>
          </div>
          <button
            onClick={() => setDbSaveMessage(null)}
            className="text-slate-400 hover:text-slate-600 text-xs px-2 py-0.5"
          >
            ✕
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ─── LEFT: Live Database Items (Rolls & Yarn) ───────────────────── */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-serif text-slate-800 tracking-tight font-semibold">
                {loading ? 'Connecting to Database...' : `${yarnRolls.length} Items (Live Database)`}
              </p>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full border border-teal-200">
                PostgreSQL Sync
              </span>
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-[11px] font-medium text-slate-600">
              <button
                type="button"
                onClick={() => setCategoryFilter('ALL')}
                className={`flex-1 py-1 rounded-md transition text-center ${
                  categoryFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'hover:text-slate-900'
                }`}
              >
                All ({yarnRolls.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('FABRIC_ROLL')}
                className={`flex-1 py-1 rounded-md transition text-center ${
                  categoryFilter === 'FABRIC_ROLL' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'hover:text-slate-900'
                }`}
              >
                Rolls ({rollsCount})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('YARN_BATCH')}
                className={`flex-1 py-1 rounded-md transition text-center ${
                  categoryFilter === 'YARN_BATCH' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'hover:text-slate-900'
                }`}
              >
                Yarn ({batchesCount})
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search code, name, customer…"
                value={state.searchQuery}
                onChange={(e) => dispatch({ type: 'SEARCH', q: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent placeholder-slate-400"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-[62vh] divide-y divide-slate-50">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-teal-600" />
                <span>Loading PostgreSQL yarn batches...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                {yarnRolls.length === 0
                  ? 'No yarn batches currently registered in database. Receive yarn in Storekeeper inventory to begin inspection.'
                  : 'No matching yarn batches found.'}
              </div>
            ) : (
              filtered.map((roll) => {
              const rollStages = state.stageData[roll.code] ?? buildInitialStages();
              const passed = STAGES.filter((s) => rollStages[s.id].status === 'passed').length;
              const rej = STAGES.some((s) => rollStages[s.id].status === 'rejected');
              const rwork = STAGES.some((s) => rollStages[s.id].status === 'rework');
              const isSelected = roll.code === state.selectedRollCode;
              return (
                <button
                  key={roll.code}
                  onClick={() => dispatch({ type: 'SELECT_ROLL', code: roll.code })}
                  className={`w-full text-left px-4 py-3 transition-colors flex items-center justify-between gap-3 ${
                    isSelected ? 'bg-teal-50 border-l-2 border-teal-500' : 'hover:bg-slate-50 border-l-2 border-transparent'
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`text-base font-serif truncate ${isSelected ? 'text-teal-800' : 'text-slate-800'}`}>{roll.name}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{roll.code} · {roll.customer}</p>
                  </div>
                  <div className="shrink-0">
                    {rej ? (
                      <span className="text-[10px] font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Rejected</span>
                    ) : rwork ? (
                      <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Rework</span>
                    ) : passed === 4 ? (
                      <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Ready</span>
                    ) : passed > 0 ? (
                      <span className="text-[10px] font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">{passed}/4</span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">Pending</span>
                    )}
                  </div>
                </button>
              );
            }))}
          </div>
        </div>

        {/* ─── RIGHT: Stage Roadmap ──────────────────────────────────────── */}
        <div className="lg:col-span-8 flex flex-col gap-5">

          {/* Roll Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs font-mono text-slate-400 mb-0.5">{selectedRoll?.code}</p>
                <h2 className="text-2xl font-serif text-slate-900 tracking-tight">{selectedRoll?.name}</h2>
                <p className="text-sm text-slate-500 mt-1 font-sans">{selectedRoll?.weight} · {selectedRoll?.color} · <span className="font-medium text-slate-700">{selectedRoll?.customer}</span></p>
                <p className="text-xs text-slate-400 font-mono mt-1">Order: {selectedRoll?.orderRef}</p>
              </div>
              <div className="shrink-0">
                {anyRejected ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full">
                    <XCircle className="w-4 h-4" /> Rejected — Not Shippable
                  </span>
                ) : allPassed ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                    <CheckCircle2 className="w-4 h-4" /> Ready for Dispatch
                  </span>
                ) : anyRework ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                    <AlertTriangle className="w-4 h-4" /> Rework Required
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
                    <Clock className="w-4 h-4" /> {completedCount}/4 Stages Done
                  </span>
                )}
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span>Quality Journey</span>
                <span>{completedCount} of 4 stages passed</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-teal-500 rounded-full"
                  animate={{ width: `${(completedCount / 4) * 100}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Clearance for Dispatch Gate Link */}
            {allPassed && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 flex-wrap"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-900">Cleared for Vehicle Loading in Database</p>
                    <p className="text-[11px] text-emerald-700">QC Status is APPROVED. Barcode can now be scanned at Dispatch Dock.</p>
                  </div>
                </div>
                <a
                  href="/dispatch"
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition"
                >
                  <span>Go to Dispatch Gate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </motion.div>
            )}
          </div>

          {/* ─── Vertical Stage Roadmap Card ──────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-lg font-serif text-slate-800 mb-5 flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-600" />
              Manufacturing Stage Journey
            </h3>
            <div className="relative">
              {/* Vertical line background */}
              <div className="absolute left-[18px] top-6 bottom-6 w-0.5 bg-slate-100" aria-hidden />
              {/* Vertical animated line */}
              <motion.div
                className="absolute left-[18px] top-6 bottom-6 w-0.5 bg-teal-500 origin-top"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: Math.min(completedCount / (STAGES.length - 1), 1) }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                aria-hidden
              />
              <div className="space-y-3">
                {STAGES.map((stage, idx) => {
                  const stageInsp = stages[stage.id];
                  const isActive = state.activeStageId === stage.id;
                  const lastRec = stageInsp.records[stageInsp.records.length - 1];
                  const isLocked = idx > 0 && stages[STAGES[idx - 1].id].status !== 'passed';
                  return (
                    <motion.div
                      key={stage.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.06, duration: 0.2 }}
                      className={`relative pl-12 ${isLocked ? 'opacity-50' : ''}`}
                    >
                      {/* Stage dot */}
                      <div className={`absolute left-2.5 top-4 w-5 h-5 rounded-full z-10 transition-all duration-300 ${dotClass(stageInsp.status)}`} />

                      <div className={`rounded-xl border transition-all duration-200 ${isActive ? `${stage.lightBg} shadow-sm` : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                        {/* Stage header */}
                        <button
                          disabled={isLocked}
                          onClick={() => isActive ? dispatch({ type: 'CLOSE_STAGE' }) : dispatch({ type: 'OPEN_STAGE', stageId: stage.id })}
                          className="w-full text-left px-4 py-3 flex items-center justify-between gap-3"
                          aria-expanded={isActive}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs font-mono text-slate-400 shrink-0">{String(stage.seq).padStart(2, '0')}</span>
                            <div className="min-w-0">
                              <p className={`text-base font-serif ${isActive ? stage.accentClass : 'text-slate-800'}`}>{stage.label}</p>
                              <p className="text-xs text-slate-500 mt-0.5 font-sans">{stage.description}</p>
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-medium border px-2 py-0.5 rounded-full ${statusColors(stageInsp.status)}`}>
                              {statusIcon(stageInsp.status)}
                              {statusLabel(stageInsp.status)}
                            </span>
                            {isLocked ? <span className="text-[10px] text-slate-400 hidden sm:block">Pass prev. stage first</span> : isActive ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </div>
                        </button>

                        {/* Collapsed last record */}
                        {!isActive && lastRec && (
                          <div className="px-4 pb-3 border-t border-slate-100">
                            <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap mt-2">
                              <span>Last: <span className={`font-medium capitalize ${lastRec.decision === 'pass' ? 'text-emerald-700' : lastRec.decision === 'rework' ? 'text-amber-700' : 'text-red-700'}`}>{lastRec.decision}</span></span>
                              {lastRec.defects.length > 0 && <span>{lastRec.defects.length} defect{lastRec.defects.length > 1 ? 's' : ''}</span>}
                              <span>By {lastRec.inspector}</span>
                              <span>{new Date(lastRec.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                            </div>
                          </div>
                        )}

                        {/* Expanded form */}
                        <AnimatePresence>
                          {isActive && activeStage && (
                            <motion.div
                              key="form"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 pt-2 border-t border-slate-200/60 space-y-4">
                                {/* Inspector */}
                                <div>
                                  <label className="block text-xs font-medium text-slate-600 mb-1">Inspector</label>
                                  <input
                                    type="text"
                                    value={state.formInspector}
                                    onChange={(e) => dispatch({ type: 'SET_INSPECTOR', name: e.target.value })}
                                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                                    placeholder="Inspector name"
                                  />
                                </div>

                                {/* Defects */}
                                <div>
                                  <label className="block text-xs font-medium text-slate-600 mb-2">
                                    Defects found <span className="text-slate-400 font-normal">(select all that apply)</span>
                                  </label>
                                  <div className="flex flex-wrap gap-2">
                                    {activeStage.defects.map((d) => {
                                      const sel = state.formDefects.includes(d.id);
                                      return (
                                        <button
                                          key={d.id}
                                          type="button"
                                          onClick={() => dispatch({ type: 'TOGGLE_DEFECT', defectId: d.id })}
                                          className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer ${sel ? 'bg-red-50 border-red-300 text-red-700 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}
                                        >
                                          {sel && '✕ '}{d.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Notes */}
                                <div>
                                  <label className="block text-xs font-medium text-slate-600 mb-1">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
                                  <textarea
                                    value={state.formNotes}
                                    onChange={(e) => dispatch({ type: 'SET_NOTES', notes: e.target.value })}
                                    rows={2}
                                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                                    placeholder="Any notes about this stage inspection…"
                                  />
                                </div>

                                {/* Decision buttons */}
                                <div className="grid grid-cols-3 gap-2">
                                  <button
                                    type="button"
                                    disabled={savingToDb}
                                    onClick={() => handleSaveDecision('pass')}
                                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition active:scale-95 cursor-pointer disabled:opacity-50"
                                  >
                                    {savingToDb ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                    <span className="text-xs font-semibold">Pass & Clear</span>
                                    <span className="text-[10px] text-emerald-600">Save to PostgreSQL</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={savingToDb}
                                    onClick={() => handleSaveDecision('rework')}
                                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition active:scale-95 cursor-pointer disabled:opacity-50"
                                  >
                                    <RotateCcw className="w-5 h-5" />
                                    <span className="text-xs font-semibold">Rework</span>
                                    <span className="text-[10px] text-amber-600">Hold for correction</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={savingToDb}
                                    onClick={() => handleSaveDecision('reject')}
                                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition active:scale-95 cursor-pointer disabled:opacity-50"
                                  >
                                    <X className="w-5 h-5" />
                                    <span className="text-xs font-semibold">Reject</span>
                                    <span className="text-[10px] text-red-600">Lock in Quarantine</span>
                                  </button>
                                </div>

                                {/* Prior records accordion */}
                                {stageInsp.records.length > 0 && (
                                  <details className="group">
                                    <summary className="text-xs font-medium text-slate-500 cursor-pointer list-none flex items-center gap-1 hover:text-slate-700 select-none">
                                      <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform" />
                                      {stageInsp.records.length} previous record{stageInsp.records.length > 1 ? 's' : ''}
                                    </summary>
                                    <div className="mt-2 space-y-2">
                                      {stageInsp.records.map((rec) => (
                                        <div key={rec.id} className="text-xs bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                                          <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <span className={`font-medium capitalize ${rec.decision === 'pass' ? 'text-emerald-700' : rec.decision === 'rework' ? 'text-amber-700' : 'text-red-700'}`}>
                                              {rec.decision}
                                            </span>
                                            <span className="text-slate-400">{new Date(rec.date).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                          </div>
                                          {rec.defects.length > 0 && <p className="text-slate-500 mt-1">Defects: {rec.defects.join(', ')}</p>}
                                          <p className="text-slate-400 mt-0.5 italic">{rec.notes} — {rec.inspector}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </details>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ─── Journey Summary ──────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-lg font-serif text-slate-800 mb-4 tracking-tight">Fabric Journey at a Glance</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STAGES.map((stage) => {
                const s = stages[stage.id];
                return (
                  <div key={stage.id} className={`rounded-xl border p-3 text-center ${statusColors(s.status)}`}>
                    <div className="flex justify-center mb-1.5">{statusIcon(s.status)}</div>
                    <p className="text-sm font-serif text-slate-700">{stage.label}</p>
                    <p className={`text-[11px] mt-0.5 font-sans font-medium ${s.status === 'passed' ? 'text-emerald-600' : s.status === 'rework' ? 'text-amber-600' : s.status === 'rejected' ? 'text-red-600' : 'text-slate-400'}`}>
                      {statusLabel(s.status)}
                    </p>
                    {s.records.length > 0 && (
                      <p className="text-[10px] text-slate-400 mt-0.5">{s.records.length} record{s.records.length > 1 ? 's' : ''}</p>
                    )}
                  </div>
                );
              })}
            </div>
            {anyRejected && (
              <div className="mt-3 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>This roll has a rejected stage and <strong>must not be dispatched.</strong></span>
              </div>
            )}
            {allPassed && (
              <div className="mt-3 flex items-start gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span>All 4 stages passed. This roll is <strong>eligible for dispatch.</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Success Toast ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {state.successStage && (
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white border border-emerald-300 shadow-xl rounded-2xl px-5 py-3"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-medium text-slate-800">
              Recorded for <strong className="text-emerald-700">{STAGES.find((s) => s.id === state.successStage)?.label}</strong>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
