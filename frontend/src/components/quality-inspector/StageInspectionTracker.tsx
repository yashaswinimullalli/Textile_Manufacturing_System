'use client';

import React, { useReducer, useCallback } from 'react';
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
} from 'lucide-react';

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
interface YarnRoll { code: string; name: string; weight: string; color: string; customer: string; orderRef: string; }

// ─── 50 Yarn Types ────────────────────────────────────────────────────────────
const YARN_ROLLS: YarnRoll[] = [
  { code: 'YRN-001', name: '100% Combed Cotton', weight: '40s Ne', color: 'Natural White', customer: 'Arvind Ltd', orderRef: 'ORD-2026-001' },
  { code: 'YRN-002', name: 'Raw Indigo Denim', weight: '7 Oz', color: 'Indigo Blue', customer: "Levi's India", orderRef: 'ORD-2026-002' },
  { code: 'YRN-003', name: 'Mulberry Silk Chiffon', weight: '8mm', color: 'Pearl', customer: 'Raymond Luxury', orderRef: 'ORD-2026-003' },
  { code: 'YRN-004', name: 'Pure Organic Linen', weight: '40 GSM', color: 'Ecru', customer: 'Fab India', orderRef: 'ORD-2026-004' },
  { code: 'YRN-005', name: 'Cotton Twill 240 GSM', weight: '240 GSM', color: 'Off White', customer: 'Pantaloons', orderRef: 'ORD-2026-005' },
  { code: 'YRN-006', name: 'Poly-Cotton Poplin', weight: '110 GSM', color: 'Sky Blue', customer: 'Van Heusen', orderRef: 'ORD-2026-006' },
  { code: 'YRN-007', name: 'Modal Satin Blend', weight: '130 GSM', color: 'Ivory', customer: 'H&M India', orderRef: 'ORD-2026-007' },
  { code: 'YRN-008', name: 'Oxford Weave Cotton', weight: '170 GSM', color: 'Classic White', customer: 'Allen Solly', orderRef: 'ORD-2026-008' },
  { code: 'YRN-009', name: 'Bamboo Jersey Knit', weight: '180 GSM', color: 'Charcoal', customer: 'Westside', orderRef: 'ORD-2026-009' },
  { code: 'YRN-010', name: 'Viscose Georgette', weight: '60 GSM', color: 'Blush Pink', customer: 'W for Woman', orderRef: 'ORD-2026-010' },
  { code: 'YRN-011', name: 'Tencel Lyocell', weight: '145 GSM', color: 'Sage Green', customer: 'Forest Essentials', orderRef: 'ORD-2026-011' },
  { code: 'YRN-012', name: 'Merino Wool Crepe', weight: '190 GSM', color: 'Camel', customer: 'Manyavar', orderRef: 'ORD-2026-012' },
  { code: 'YRN-013', name: 'Dupion Silk', weight: '60mm', color: 'Gold', customer: 'Kalyan Silks', orderRef: 'ORD-2026-013' },
  { code: 'YRN-014', name: 'Canvas Duck Cotton', weight: '380 GSM', color: 'Khaki', customer: 'Woodland', orderRef: 'ORD-2026-014' },
  { code: 'YRN-015', name: 'Flannel Brushed Cotton', weight: '200 GSM', color: 'Red Check', customer: 'Blackberrys', orderRef: 'ORD-2026-015' },
  { code: 'YRN-016', name: 'Linen Viscose Blend', weight: '135 GSM', color: 'Stone', customer: 'Biba', orderRef: 'ORD-2026-016' },
  { code: 'YRN-017', name: 'Cotton Lawn 60s', weight: '60 GSM', color: 'Floral Print', customer: 'Global Desi', orderRef: 'ORD-2026-017' },
  { code: 'YRN-018', name: 'Ripstop Nylon', weight: '70D', color: 'Olive Green', customer: 'Quechua', orderRef: 'ORD-2026-018' },
  { code: 'YRN-019', name: 'Jacquard Brocade', weight: '250 GSM', color: 'Deep Red', customer: 'Sabyasachi', orderRef: 'ORD-2026-019' },
  { code: 'YRN-020', name: 'Dobby Voile Cotton', weight: '65 GSM', color: 'Light Blue', customer: 'Libas', orderRef: 'ORD-2026-020' },
  { code: 'YRN-021', name: 'Terry Towel Loop', weight: '450 GSM', color: 'White', customer: 'Trident Towels', orderRef: 'ORD-2026-021' },
  { code: 'YRN-022', name: 'Herringbone Wool', weight: '280 GSM', color: 'Charcoal Grey', customer: 'Park Avenue', orderRef: 'ORD-2026-022' },
  { code: 'YRN-023', name: 'Pique Polo Knit', weight: '200 GSM', color: 'Navy Blue', customer: 'Louis Philippe', orderRef: 'ORD-2026-023' },
  { code: 'YRN-024', name: 'Seersucker Stripe', weight: '100 GSM', color: 'Blue White Stripe', customer: 'Arrow', orderRef: 'ORD-2026-024' },
  { code: 'YRN-025', name: 'Rib Knit 1x1', weight: '160 GSM', color: 'Black', customer: 'Zara India', orderRef: 'ORD-2026-025' },
  { code: 'YRN-026', name: 'Velvet Crushed', weight: '350 GSM', color: 'Royal Purple', customer: 'Ritu Kumar', orderRef: 'ORD-2026-026' },
  { code: 'YRN-027', name: 'Muslin Unbleached', weight: '80 GSM', color: 'Natural', customer: 'Fabrics Empire', orderRef: 'ORD-2026-027' },
  { code: 'YRN-028', name: 'Chambray Light', weight: '120 GSM', color: 'Light Denim', customer: 'DNMX', orderRef: 'ORD-2026-028' },
  { code: 'YRN-029', name: 'Ottoman Rib Weave', weight: '220 GSM', color: 'Forest Green', customer: 'Aurelia', orderRef: 'ORD-2026-029' },
  { code: 'YRN-030', name: 'Organza Silk', weight: '30mm', color: 'Champagne', customer: 'Anita Dongre', orderRef: 'ORD-2026-030' },
  { code: 'YRN-031', name: 'Corduroy 14W', weight: '310 GSM', color: 'Tan Brown', customer: 'Pepe Jeans', orderRef: 'ORD-2026-031' },
  { code: 'YRN-032', name: 'Stretch Denim 2%', weight: '310 GSM', color: 'Dark Wash', customer: 'Wrangler India', orderRef: 'ORD-2026-032' },
  { code: 'YRN-033', name: 'Madras Cotton Check', weight: '110 GSM', color: 'Multicheck', customer: 'Celio India', orderRef: 'ORD-2026-033' },
  { code: 'YRN-034', name: 'Banarasi Silk Brocade', weight: '300 GSM', color: 'Magenta Gold', customer: 'Taneira', orderRef: 'ORD-2026-034' },
  { code: 'YRN-035', name: 'Supima Cotton 60s', weight: '145 GSM', color: 'White', customer: 'Arvind Ltd', orderRef: 'ORD-2026-035' },
  { code: 'YRN-036', name: 'French Terry Cotton', weight: '240 GSM', color: 'Melange Grey', customer: 'Proline', orderRef: 'ORD-2026-036' },
  { code: 'YRN-037', name: 'Silk Habotai', weight: '5mm', color: 'Baby Blue', customer: 'Soch', orderRef: 'ORD-2026-037' },
  { code: 'YRN-038', name: 'Neoprene Scuba', weight: '250 GSM', color: 'Black', customer: 'Nike India', orderRef: 'ORD-2026-038' },
  { code: 'YRN-039', name: 'Chanderi Silk Cotton', weight: '80 GSM', color: 'Mint Green', customer: 'Meena Bazaar', orderRef: 'ORD-2026-039' },
  { code: 'YRN-040', name: 'Tweed Wool Blend', weight: '360 GSM', color: 'Houndstooth', customer: 'Peter England', orderRef: 'ORD-2026-040' },
  { code: 'YRN-041', name: 'Interlock Double Knit', weight: '220 GSM', color: 'Ecru', customer: 'United Colors', orderRef: 'ORD-2026-041' },
  { code: 'YRN-042', name: 'Poly Taffeta', weight: '85 GSM', color: 'Electric Blue', customer: 'Shoppers Stop', orderRef: 'ORD-2026-042' },
  { code: 'YRN-043', name: 'Cotton Satin 300T', weight: '180 GSM', color: 'Cream', customer: 'Spread India', orderRef: 'ORD-2026-043' },
  { code: 'YRN-044', name: 'Georgette Crepe', weight: '75 GSM', color: 'Coral', customer: 'FabAlley', orderRef: 'ORD-2026-044' },
  { code: 'YRN-045', name: 'Denim Selvedge 14Oz', weight: '14 Oz', color: 'Raw Blue', customer: 'Flying Machine', orderRef: 'ORD-2026-045' },
  { code: 'YRN-046', name: 'Knitted Velour', weight: '280 GSM', color: 'Burgundy', customer: 'Monte Carlo', orderRef: 'ORD-2026-046' },
  { code: 'YRN-047', name: 'Linen Slub Yarn', weight: '155 GSM', color: 'Natural Slub', customer: 'Linen Club', orderRef: 'ORD-2026-047' },
  { code: 'YRN-048', name: 'Micro Modal', weight: '150 GSM', color: 'Soft Grey', customer: 'Jockey India', orderRef: 'ORD-2026-048' },
  { code: 'YRN-049', name: 'Fil Coupe Voile', weight: '55 GSM', color: 'Ivory', customer: 'Aza Fashions', orderRef: 'ORD-2026-049' },
  { code: 'YRN-050', name: 'Cotton Poplin Reactive', weight: '90 GSM', color: 'Sky Blue Print', customer: 'Myntra Private', orderRef: 'ORD-2026-050' },
];

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
  const [state, dispatch] = useReducer(reducer, {
    selectedRollCode: YARN_ROLLS[0].code,
    searchQuery: '',
    activeStageId: null,
    formDefects: [],
    formNotes: '',
    formInspector: 'Alex Kumar',
    stageData: { [YARN_ROLLS[0].code]: buildInitialStages() },
    successStage: null,
  });

  const clearSuccess = useCallback(() => {
    setTimeout(() => dispatch({ type: 'CLEAR_SUCCESS' }), 2000);
  }, []);

  if (state.successStage) clearSuccess();

  const filtered = YARN_ROLLS.filter((r) => {
    const q = state.searchQuery.toLowerCase();
    return r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || r.customer.toLowerCase().includes(q);
  });

  const selectedRoll = YARN_ROLLS.find((r) => r.code === state.selectedRollCode);
  const stages = state.stageData[state.selectedRollCode] ?? buildInitialStages();
  const allPassed = STAGES.every((s) => stages[s.id].status === 'passed');
  const anyRejected = STAGES.some((s) => stages[s.id].status === 'rejected');
  const anyRework = STAGES.some((s) => stages[s.id].status === 'rework');
  const completedCount = STAGES.filter((s) => stages[s.id].status === 'passed').length;
  const activeStage = STAGES.find((s) => s.id === state.activeStageId);

  return (
    <div className="font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ─── LEFT: 50 Yarn Rolls List ─────────────────────────────────── */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-1.5">50 Yarn Batches</p>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search code, name, customer…"
                value={state.searchQuery}
                onChange={(e) => dispatch({ type: 'SEARCH', q: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent placeholder-slate-400"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-[62vh] divide-y divide-slate-50">
            {filtered.map((roll) => {
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
                    <p className={`text-sm font-semibold truncate ${isSelected ? 'text-teal-800' : 'text-slate-800'}`}>{roll.name}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{roll.code} · {roll.customer}</p>
                  </div>
                  <div className="shrink-0">
                    {rej ? (
                      <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Rejected</span>
                    ) : rwork ? (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Rework</span>
                    ) : passed === 4 ? (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Ready</span>
                    ) : passed > 0 ? (
                      <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">{passed}/4</span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">Pending</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── RIGHT: Stage Roadmap ──────────────────────────────────────── */}
        <div className="lg:col-span-8 flex flex-col gap-5">

          {/* Roll Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs font-mono text-slate-400 mb-0.5">{selectedRoll?.code}</p>
                <h2 className="text-xl font-semibold text-slate-900">{selectedRoll?.name}</h2>
                <p className="text-sm text-slate-500 mt-1">{selectedRoll?.weight} · {selectedRoll?.color} · <span className="font-medium text-slate-700">{selectedRoll?.customer}</span></p>
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
          </div>

          {/* ─── Vertical Stage Roadmap Card ──────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-5 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
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
                              <p className={`text-sm font-semibold ${isActive ? stage.accentClass : 'text-slate-800'}`}>{stage.label}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{stage.description}</p>
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
                                    onClick={() => dispatch({ type: 'SUBMIT', decision: 'pass' })}
                                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition active:scale-95 cursor-pointer"
                                  >
                                    <Check className="w-5 h-5" />
                                    <span className="text-xs font-semibold">Pass</span>
                                    <span className="text-[10px] text-emerald-600">Good to proceed</span>
                                  </button>
                                  <button
                                    onClick={() => dispatch({ type: 'SUBMIT', decision: 'rework' })}
                                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition active:scale-95 cursor-pointer"
                                  >
                                    <RotateCcw className="w-5 h-5" />
                                    <span className="text-xs font-semibold">Rework</span>
                                    <span className="text-[10px] text-amber-600">Send back to fix</span>
                                  </button>
                                  <button
                                    onClick={() => dispatch({ type: 'SUBMIT', decision: 'reject' })}
                                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition active:scale-95 cursor-pointer"
                                  >
                                    <X className="w-5 h-5" />
                                    <span className="text-xs font-semibold">Reject</span>
                                    <span className="text-[10px] text-red-600">Cannot proceed</span>
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
                                            <span className={`font-semibold capitalize ${rec.decision === 'pass' ? 'text-emerald-700' : rec.decision === 'rework' ? 'text-amber-700' : 'text-red-700'}`}>
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
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Fabric Journey at a Glance</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STAGES.map((stage) => {
                const s = stages[stage.id];
                return (
                  <div key={stage.id} className={`rounded-xl border p-3 text-center ${statusColors(s.status)}`}>
                    <div className="flex justify-center mb-1.5">{statusIcon(s.status)}</div>
                    <p className="text-xs font-semibold text-slate-700">{stage.label}</p>
                    <p className={`text-[11px] mt-0.5 font-medium ${s.status === 'passed' ? 'text-emerald-600' : s.status === 'rework' ? 'text-amber-600' : s.status === 'rejected' ? 'text-red-600' : 'text-slate-400'}`}>
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
            {!anyRejected && !allPassed && (
              <div className="mt-3 flex items-start gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Data shown is session-only. No database connected — records are not permanently saved.</span>
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
