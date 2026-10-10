'use client';

import React, { useState, useMemo } from 'react';
import {
  Scan,
  Package,
  Layers,
  Search,
  Sparkles,
} from 'lucide-react';
import { YarnBatch } from '@/lib/types';

export interface RackDefinition {
  id: string;
  name: string;
  zone: string;
  zoneTitle: string;
  yarnType: 'Cotton' | 'Polyester' | 'Blend';
  capacityKg: number;
  x: number;
  y: number;
  width: number;
  height: number;
  arrowTarget: { x: number; y: number };
}

// Full-width warehouse grid: 4 Columns × 2 Rows = 8 Storage Blocks
// Col 0: Zone A · Cotton (x: 40, center: 167)
// Col 1: Zone B · Polyester (x: 335, center: 462)
// Col 2: Zone C · Blends (x: 630, center: 757)
// Col 3: Zone D · Specialty & QC (x: 925, center: 1052)
// Row 1: y: 110, height: 185
// Central Forklift Transit Aisle: y: 298 to 386 (88px clearance)
// Row 2: y: 390, height: 185
export const WAREHOUSE_RACKS: RackDefinition[] = [
  // Zone A: Cotton
  {
    id: 'Rack A1',
    name: 'Block A1',
    zone: 'ZONE A',
    zoneTitle: 'Combed Cotton · Natural / White',
    yarnType: 'Cotton',
    capacityKg: 3000,
    x: 40,
    y: 110,
    width: 255,
    height: 185,
    arrowTarget: { x: 167, y: 108 },
  },
  {
    id: 'Rack A2',
    name: 'Block A2',
    zone: 'ZONE A',
    zoneTitle: 'Carded Cotton · Dyed / Teal',
    yarnType: 'Cotton',
    capacityKg: 3000,
    x: 40,
    y: 390,
    width: 255,
    height: 185,
    arrowTarget: { x: 167, y: 388 },
  },

  // Zone B: Polyester
  {
    id: 'Rack B1',
    name: 'Block B1',
    zone: 'ZONE B',
    zoneTitle: 'Polyester Filament · Navy Blue',
    yarnType: 'Polyester',
    capacityKg: 2500,
    x: 335,
    y: 110,
    width: 255,
    height: 185,
    arrowTarget: { x: 462, y: 108 },
  },
  {
    id: 'Rack B2',
    name: 'Block B2',
    zone: 'ZONE B',
    zoneTitle: 'Low-Torque Polyester · Virgin White',
    yarnType: 'Polyester',
    capacityKg: 2500,
    x: 335,
    y: 390,
    width: 255,
    height: 185,
    arrowTarget: { x: 462, y: 388 },
  },

  // Zone C: Blends
  {
    id: 'Rack C1',
    name: 'Block C1',
    zone: 'ZONE C',
    zoneTitle: 'Poly-Cotton Blend · Charcoal Grey',
    yarnType: 'Blend',
    capacityKg: 2000,
    x: 630,
    y: 110,
    width: 255,
    height: 185,
    arrowTarget: { x: 757, y: 108 },
  },
  {
    id: 'Rack C2',
    name: 'Block C2',
    zone: 'ZONE C',
    zoneTitle: 'Cotton-Poly Blend · Oatmeal Heather',
    yarnType: 'Blend',
    capacityKg: 2000,
    x: 630,
    y: 390,
    width: 255,
    height: 185,
    arrowTarget: { x: 757, y: 388 },
  },

  // Zone D: Specialty & QC Quarantine
  {
    id: 'Rack D1',
    name: 'Block D1',
    zone: 'ZONE D',
    zoneTitle: 'Specialty Blend · Flax Linen Melange',
    yarnType: 'Blend',
    capacityKg: 2000,
    x: 925,
    y: 110,
    width: 255,
    height: 185,
    arrowTarget: { x: 1052, y: 108 },
  },
  {
    id: 'Rack D2',
    name: 'Block D2',
    zone: 'ZONE D',
    zoneTitle: 'Raw Greige Cotton · QC Quarantine Bay',
    yarnType: 'Cotton',
    capacityKg: 2000,
    x: 925,
    y: 390,
    width: 255,
    height: 185,
    arrowTarget: { x: 1052, y: 388 },
  },
];

export const DEFAULT_RACK_BATCHES: Record<string, YarnBatch> = {
  'Rack A1': {
    id: 'batch-1',
    batch_code: 'YB-COT-2026-001',
    barcode: 'FTB-202610-001',
    yarn_type: 'Cotton',
    colour: 'Bleached White',
    supplier: 'Vardhman Textiles Ltd',
    quantity_received: 2500,
    quantity_available: 2150,
    quantity_approved: 2500,
    quantity_held: 0,
    quantity_rejected: 0,
    inspection_status: 'PASSED',
    yarn_count_spec: '30s Ne Combed Cotton',
    po_reference: 'PO-YARN-2026-081',
    certificate_reference: 'COA-VARDH-8812',
    unit: 'kg',
    reorder_threshold: 500,
    storage_location: 'Rack A1',
    received_at: '2026-10-01T08:30:00Z',
    created_at: '2026-10-01T08:30:00Z',
  },
  'Rack A2': {
    id: 'batch-4',
    batch_code: 'YB-COT-2026-004',
    barcode: 'FTB-202610-004',
    yarn_type: 'Cotton',
    colour: 'Teal Green #04',
    supplier: 'Nahars Spinning Mills',
    quantity_received: 1500,
    quantity_available: 180, // Low stock & pending audit
    quantity_approved: 180,
    quantity_held: 0,
    quantity_rejected: 0,
    inspection_status: 'PENDING_INSPECTION',
    yarn_count_spec: '40s Ne Carded Cotton',
    po_reference: 'PO-YARN-2026-099',
    unit: 'kg',
    reorder_threshold: 350,
    storage_location: 'Rack A2',
    received_at: '2026-10-06T11:45:00Z',
    created_at: '2026-10-06T11:45:00Z',
  },
  'Rack B1': {
    id: 'batch-2',
    batch_code: 'YB-POLY-2026-014',
    barcode: 'FTB-202610-014',
    yarn_type: 'Polyester',
    colour: 'Navy Blue #19',
    supplier: 'Reliance Industries Yarn Div',
    quantity_received: 1800,
    quantity_available: 350, // Low stock
    quantity_approved: 1800,
    quantity_held: 0,
    quantity_rejected: 0,
    inspection_status: 'PASSED',
    yarn_count_spec: '150D / 48F Polyester Filament',
    po_reference: 'PO-YARN-2026-088',
    certificate_reference: 'RIL-COA-NY-0912',
    unit: 'kg',
    reorder_threshold: 400,
    storage_location: 'Rack B1',
    received_at: '2026-10-03T10:15:00Z',
    created_at: '2026-10-03T10:15:00Z',
  },
  'Rack B2': {
    id: 'batch-5',
    batch_code: 'YB-POLY-2026-022',
    barcode: 'FTB-202610-022',
    yarn_type: 'Polyester',
    colour: 'Bright White',
    supplier: 'Reliance Industries Yarn Div',
    quantity_received: 2000,
    quantity_available: 1650,
    quantity_approved: 2000,
    quantity_held: 0,
    quantity_rejected: 0,
    inspection_status: 'PASSED',
    yarn_count_spec: '75D / 36F Low Torque Poly',
    po_reference: 'PO-YARN-2026-105',
    unit: 'kg',
    reorder_threshold: 400,
    storage_location: 'Rack B2',
    received_at: '2026-10-07T09:00:00Z',
    created_at: '2026-10-07T09:00:00Z',
  },
  'Rack C1': {
    id: 'batch-3',
    batch_code: 'YB-BLD-2026-008',
    barcode: 'FTB-202610-008',
    yarn_type: 'Blend',
    colour: 'Charcoal Grey',
    supplier: 'Arvind Mills Yarn Hub',
    quantity_received: 1200,
    quantity_available: 210, // Low stock
    quantity_approved: 210,
    quantity_held: 990,
    quantity_rejected: 0,
    inspection_status: 'ON_HOLD',
    yarn_count_spec: '24s Ne 65/35 Poly-Cotton',
    po_reference: 'PO-YARN-2026-092',
    certificate_reference: 'ARV-BLD-2026-44',
    unit: 'kg',
    reorder_threshold: 300,
    storage_location: 'Rack C1',
    received_at: '2026-10-05T14:00:00Z',
    created_at: '2026-10-05T14:00:00Z',
  },
  'Rack C2': {
    id: 'batch-6',
    batch_code: 'YB-BLD-2026-015',
    barcode: 'FTB-202610-015',
    yarn_type: 'Blend',
    colour: 'Oatmeal Heather',
    supplier: 'Arvind Mills Yarn Hub',
    quantity_received: 1000,
    quantity_available: 850,
    quantity_approved: 1000,
    quantity_held: 0,
    quantity_rejected: 0,
    inspection_status: 'PASSED',
    yarn_count_spec: '30s Ne 50/50 Cotton-Poly',
    po_reference: 'PO-YARN-2026-112',
    unit: 'kg',
    reorder_threshold: 250,
    storage_location: 'Rack C2',
    received_at: '2026-10-08T13:30:00Z',
    created_at: '2026-10-08T13:30:00Z',
  },
  'Rack D1': {
    id: 'batch-7',
    batch_code: 'YB-SPEC-2026-031',
    barcode: 'FTB-202610-031',
    yarn_type: 'Blend',
    colour: 'Natural Flax Melange',
    supplier: 'Grasim Industries Ltd',
    quantity_received: 1500,
    quantity_available: 1350, // 1,350 kg!
    quantity_approved: 1500,
    quantity_held: 0,
    quantity_rejected: 0,
    inspection_status: 'PASSED',
    yarn_count_spec: '20s Ne Linen-Cotton Blend',
    po_reference: 'PO-YARN-2026-120',
    unit: 'kg',
    reorder_threshold: 300,
    storage_location: 'Rack D1',
    received_at: '2026-10-09T08:00:00Z',
    created_at: '2026-10-09T08:00:00Z',
  },
  'Rack D2': {
    id: 'batch-8',
    batch_code: 'YB-RAW-2026-045',
    barcode: 'FTB-202610-045',
    yarn_type: 'Cotton',
    colour: 'Raw Greige Cotton',
    supplier: 'Nahar Industrial Hub',
    quantity_received: 1200,
    quantity_available: 160, // 160 kg (Low Stock, threshold 400 kg)
    quantity_approved: 160,
    quantity_held: 0,
    quantity_rejected: 0,
    inspection_status: 'PENDING_INSPECTION',
    yarn_count_spec: '16s Ne Open End Cotton',
    po_reference: 'PO-YARN-2026-135',
    unit: 'kg',
    reorder_threshold: 400,
    storage_location: 'Rack D2',
    received_at: '2026-10-09T14:20:00Z',
    created_at: '2026-10-09T14:20:00Z',
  },
};

interface YarnWarehouseSceneProps {
  batches: YarnBatch[];
  selectedBatch: YarnBatch | null;
  onSelectBatch: (batch: YarnBatch | null) => void;
  selectedRackId: string | null;
  onSelectRack: (rackId: string | null) => void;
  onScanBarcodeClick: () => void;
  onReceiveClick?: (batch: YarnBatch) => void;
  onIssueClick?: (batch: YarnBatch) => void;
  onInspectClick?: (batch: YarnBatch) => void;
  onPrintLabelClick?: (batch: YarnBatch) => void;
  onRegisterBatchClick: () => void;
}

export function YarnWarehouseScene({
  batches,
  selectedBatch,
  onSelectBatch,
  selectedRackId,
  onSelectRack,
  onScanBarcodeClick,
  onRegisterBatchClick,
}: YarnWarehouseSceneProps) {
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const [hoveredRack, setHoveredRack] = useState<string | null>(null);

  // Group batches by rack/block
  const rackBatchesMap = useMemo(() => {
    const map = new Map<string, YarnBatch[]>();
    WAREHOUSE_RACKS.forEach((r) => map.set(r.id, []));

    batches.forEach((b) => {
      const loc = b.storage_location?.trim();
      if (loc && map.has(loc)) {
        map.get(loc)?.push(b);
      } else {
        // Fallback mapping by yarn type
        if (b.yarn_type === 'Cotton') {
          if (b.colour.toLowerCase().includes('teal') || b.inspection_status === 'PENDING_INSPECTION') {
            map.get('Rack A2')?.push(b);
          } else {
            map.get('Rack A1')?.push(b);
          }
        } else if (b.yarn_type === 'Polyester') {
          if (b.quantity_available <= b.reorder_threshold) {
            map.get('Rack B1')?.push(b);
          } else {
            map.get('Rack B2')?.push(b);
          }
        } else {
          if (b.inspection_status === 'ON_HOLD') {
            map.get('Rack C1')?.push(b);
          } else {
            map.get('Rack C2')?.push(b);
          }
        }
      }
    });

    // Ensure every rack has realistic batch stock if none mapped from incoming props
    WAREHOUSE_RACKS.forEach((r) => {
      const current = map.get(r.id) || [];
      if (current.length === 0 && DEFAULT_RACK_BATCHES[r.id]) {
        map.set(r.id, [DEFAULT_RACK_BATCHES[r.id]]);
      }
    });

    return map;
  }, [batches]);

  // Check if a rack has any low stock batches
  const getRackLowStockCount = (rackId: string) => {
    const list = rackBatchesMap.get(rackId) || [];
    return list.filter((b) => b.quantity_available <= b.reorder_threshold).length;
  };

  // Determine active rack: derived from selectedBatch or selectedRackId
  const activeRack = useMemo(() => {
    if (selectedBatch) {
      for (const rack of WAREHOUSE_RACKS) {
        const rackBatches = rackBatchesMap.get(rack.id) || [];
        if (rackBatches.some((b) => b.id === selectedBatch.id || b.batch_code === selectedBatch.batch_code)) {
          return rack;
        }
      }
    }
    if (selectedRackId) {
      return WAREHOUSE_RACKS.find((r) => r.id === selectedRackId) || null;
    }
    // Default to first rack with low stock if present, else Rack A1
    const lowStockRack = WAREHOUSE_RACKS.find((r) => getRackLowStockCount(r.id) > 0);
    return lowStockRack || WAREHOUSE_RACKS[0];
  }, [selectedBatch, selectedRackId, rackBatchesMap]);

  // Handle direct barcode search inside warehouse
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = barcodeSearch.trim().toLowerCase();
    if (!query) return;

    const matched = batches.find(
      (b) =>
        b.barcode.toLowerCase() === query ||
        b.batch_code.toLowerCase() === query ||
        b.colour.toLowerCase().includes(query)
    );

    if (matched) {
      onSelectBatch(matched);
      if (matched.storage_location) onSelectRack(matched.storage_location);
      setSearchFeedback(`Located: ${matched.batch_code} (${matched.storage_location || 'Assigned Block'})`);
      setTimeout(() => setSearchFeedback(null), 4000);
    } else {
      setSearchFeedback(`No batch matched "${barcodeSearch}". Try scanning.`);
      setTimeout(() => setSearchFeedback(null), 4000);
    }
  };

  // Total low stock count across all blocks
  const totalLowBlocks = WAREHOUSE_RACKS.filter((r) => getRackLowStockCount(r.id) > 0).length;

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
      {/* Top Warehouse Control Bar */}
      <div className="px-5 py-3 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        {/* Block Quick Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 font-medium mr-1 flex items-center gap-1 text-[11px]">
            <Layers className="h-3 w-3 text-slate-500" />
            <span>Storage Blocks:</span>
          </span>
          {WAREHOUSE_RACKS.map((rack) => {
            const isSelected = activeRack?.id === rack.id;
            const lowCount = getRackLowStockCount(rack.id);
            const batchCount = (rackBatchesMap.get(rack.id) || []).length;

            return (
              <button
                key={rack.id}
                onClick={() => {
                  onSelectRack(rack.id);
                  const first = (rackBatchesMap.get(rack.id) || [])[0];
                  if (first) onSelectBatch(first);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-yellow-400 text-slate-950 border-yellow-300 shadow-sm shadow-yellow-400/20 font-bold'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{rack.name}</span>
                <span
                  className={`text-[10px] px-1 rounded ${
                    isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {batchCount}
                </span>
                {lowCount > 0 && (
                  <span className="text-amber-400 font-bold text-[11px]" title="Low stock place">
                    ⬇
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Barcode Search */}
        <form onSubmit={handleBarcodeSubmit} className="relative">
          <input
            type="text"
            placeholder="Locate barcode / batch..."
            value={barcodeSearch}
            onChange={(e) => setBarcodeSearch(e.target.value)}
            className="w-56 sm:w-64 pl-8 pr-3 py-1.5 bg-slate-900/90 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition"
          />
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2" />
        </form>
      </div>

      {/* Legend status indicators sub-bar */}
      <div className="px-5 py-1.5 bg-slate-950/40 border-b border-slate-800/40 flex items-center justify-start gap-4 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="text-yellow-400 font-bold">⬇</span>
          <span>Yellow Arrow on Low Stock Places</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-yellow-400" />
          <span>Selected Block</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Normal Stock</span>
        </div>
      </div>

      {/* Search Feedback Message */}
      {searchFeedback && (
        <div className="px-5 py-2 bg-yellow-950/40 border-b border-yellow-700/50 text-yellow-200 text-xs flex items-center gap-2 animate-in fade-in">
          <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
          <span>{searchFeedback}</span>
        </div>
      )}

      {/* Full-Width Warehouse Visualization Arena */}
      <div className="p-4 sm:p-6 relative overflow-hidden flex items-center justify-center bg-gradient-to-b from-[#0B132B]/90 via-[#1C2541]/40 to-[#0B132B]">
        {/* Subtle Ambient Factory Glow */}
        <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(circle_at_20%_20%,rgba(13,148,136,0.15),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(234,179,8,0.12),transparent_50%)]" />

        {/* SVG Canvas - 1220 x 620 Wide Coordinate Space */}
        <svg
          viewBox="0 0 1220 620"
          className="w-full h-auto max-h-[640px] select-none filter drop-shadow-xl"
          style={{ minHeight: '440px' }}
        >
          <defs>
            {/* Warehouse Floor Pattern */}
            <pattern id="floor-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="40" height="40" fill="#0F172A" />
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1E293B" strokeWidth="0.8" strokeDasharray="3,3" />
            </pattern>

            {/* Steel Rack Metallic Gradients */}
            <linearGradient id="rack-post" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#64748B" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>

            <linearGradient id="beam-teal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14B8A6" />
              <stop offset="100%" stopColor="#0F766E" />
            </linearGradient>

            {/* Yarn Cone 3D Shading Gradients */}
            <linearGradient id="cone-white" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="40%" stopColor="#FFFFFF" />
              <stop offset="80%" stopColor="#F8FAFC" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>

            <linearGradient id="cone-navy" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1E3A8A" />
              <stop offset="40%" stopColor="#3B82F6" />
              <stop offset="80%" stopColor="#1D4ED8" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>

            <linearGradient id="cone-teal" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0F766E" />
              <stop offset="40%" stopColor="#2DD4BF" />
              <stop offset="80%" stopColor="#14B8A6" />
              <stop offset="100%" stopColor="#134E4A" />
            </linearGradient>

            <linearGradient id="cone-charcoal" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#374151" />
              <stop offset="40%" stopColor="#6B7280" />
              <stop offset="80%" stopColor="#4B5563" />
              <stop offset="100%" stopColor="#1F2937" />
            </linearGradient>

            <linearGradient id="cone-flax" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#D97706" />
              <stop offset="40%" stopColor="#FBBF24" />
              <stop offset="80%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>

            <linearGradient id="cone-greige" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#94A3B8" />
              <stop offset="40%" stopColor="#CBD5E1" />
              <stop offset="80%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#64748B" />
            </linearGradient>

            <linearGradient id="bobbin-core" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>

            <linearGradient id="wood-pallet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4A373" />
              <stop offset="100%" stopColor="#A97142" />
            </linearGradient>

            {/* Yellow Pointer Arrow Glow Filter */}
            <filter id="arrow-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Floor */}
          <rect width="1220" height="620" fill="url(#floor-grid)" rx="12" />

          {/* Warehouse Structural Perimeter Wall & Pillars */}
          <rect x="15" y="12" width="1190" height="596" fill="none" stroke="#334155" strokeWidth="1.5" rx="8" />

          {/* Four Storage Zone Overhead Banners */}
          {/* Zone A: Cotton (Col 0, center 167) */}
          <g transform="translate(167, 34)">
            <rect x="-85" y="-12" width="170" height="24" rx="4" fill="#0F172A" stroke="#0D9488" strokeWidth="1.5" />
            <text x="0" y="4" fill="#2DD4BF" fontSize="10.5" fontWeight="bold" textAnchor="middle" letterSpacing="1">
              ZONE A · COTTON
            </text>
          </g>

          {/* Zone B: Polyester (Col 1, center 462) */}
          <g transform="translate(462, 34)">
            <rect x="-85" y="-12" width="170" height="24" rx="4" fill="#0F172A" stroke="#0284C7" strokeWidth="1.5" />
            <text x="0" y="4" fill="#38BDF8" fontSize="10.5" fontWeight="bold" textAnchor="middle" letterSpacing="1">
              ZONE B · POLYESTER
            </text>
          </g>

          {/* Zone C: Blends (Col 2, center 757) */}
          <g transform="translate(757, 34)">
            <rect x="-85" y="-12" width="170" height="24" rx="4" fill="#0F172A" stroke="#8B5CF6" strokeWidth="1.5" />
            <text x="0" y="4" fill="#C084FC" fontSize="10.5" fontWeight="bold" textAnchor="middle" letterSpacing="1">
              ZONE C · BLENDS
            </text>
          </g>

          {/* Zone D: Specialty & QC (Col 3, center 1052) */}
          <g transform="translate(1052, 34)">
            <rect x="-95" y="-12" width="190" height="24" rx="4" fill="#0F172A" stroke="#F59E0B" strokeWidth="1.5" />
            <text x="0" y="4" fill="#FDE047" fontSize="10.5" fontWeight="bold" textAnchor="middle" letterSpacing="1">
              ZONE D · SPECIALTY & QC
            </text>
          </g>

          {/* Central Forklift & Pedestrian Transit Aisle (between Row 1 & Row 2) */}
          <rect x="25" y="306" width="1170" height="72" fill="#0B132B" opacity="0.9" rx="4" />
          <line x1="25" y1="306" x2="1195" y2="306" stroke="#EAB308" strokeWidth="1.5" strokeDasharray="8,6" opacity="0.6" />
          <line x1="25" y1="378" x2="1195" y2="378" stroke="#EAB308" strokeWidth="1.5" strokeDasharray="8,6" opacity="0.6" />
          <line x1="45" y1="342" x2="1175" y2="342" stroke="#10B981" strokeWidth="2" strokeDasharray="16,10" opacity="0.45" />
          <text x="610" y="346" fill="#94A3B8" fontSize="10" fontWeight="bold" textAnchor="middle" letterSpacing="2" opacity="0.7">
            MAIN TRANSIT AISLE · FORKLIFT & PALLET CLEARANCE 3.2M
          </text>

          {/* Render All 8 Warehouse Storage Blocks */}
          {WAREHOUSE_RACKS.map((rack) => {
            const isSelected = activeRack?.id === rack.id;
            const isHovered = hoveredRack === rack.id;
            const rackBatches = rackBatchesMap.get(rack.id) || [];
            const batch = rackBatches[0];
            const lowCount = getRackLowStockCount(rack.id);
            const isLow = lowCount > 0;
            const rackTotalQuantity = rackBatches.reduce((sum, b) => {
              const qty = b.quantity_available > 0 ? b.quantity_available : (b.quantity_held && b.quantity_held > 0 ? b.quantity_held : 210);
              return sum + qty;
            }, 0);

            // Palette gradient for yarn cones based on rack & yarn type
            let coneGradient = 'url(#cone-white)';
            if (rack.yarnType === 'Polyester') {
              coneGradient = rack.id === 'Rack B1' ? 'url(#cone-navy)' : 'url(#cone-white)';
            } else if (rack.yarnType === 'Blend') {
              coneGradient = rack.id === 'Rack D1' ? 'url(#cone-flax)' : 'url(#cone-charcoal)';
            } else if (rack.id === 'Rack A2') {
              coneGradient = 'url(#cone-teal)';
            } else if (rack.id === 'Rack D2') {
              coneGradient = 'url(#cone-greige)';
            }

            return (
              <g
                key={rack.id}
                onClick={() => {
                  onSelectRack(rack.id);
                  if (batch) onSelectBatch(batch);
                }}
                onMouseEnter={() => setHoveredRack(rack.id)}
                onMouseLeave={() => setHoveredRack(null)}
                className="cursor-pointer transition-all duration-300"
              >
                {/* Rack Floor Pad Base / Boundary */}
                <rect
                  x={rack.x}
                  y={rack.y}
                  width={rack.width}
                  height={rack.height}
                  rx="6"
                  fill={isSelected ? '#1E293B' : isHovered ? '#1E293B' : '#0F172A'}
                  stroke={isSelected ? '#FACC15' : isLow ? '#F59E0B' : '#334155'}
                  strokeWidth={isSelected ? '2.5' : '1.5'}
                  filter={isSelected ? 'drop-shadow(0 0 12px rgba(250, 204, 21, 0.45))' : undefined}
                  opacity={isSelected ? '1' : '0.88'}
                />

                {/* Rack Header Bar */}
                <g transform={`translate(${rack.x + 8}, ${rack.y + 8})`}>
                  <rect
                    x="0"
                    y="0"
                    width={rack.width - 16}
                    height="24"
                    rx="4"
                    fill={isSelected ? '#FEF08A' : isLow ? '#451A03' : '#1E293B'}
                    stroke={isSelected ? '#EAB308' : isLow ? '#D97706' : '#334155'}
                    strokeWidth="1"
                  />

                  {/* Left: Rack ID & Category */}
                  <text
                    x="10"
                    y="16"
                    fill={isSelected ? '#0F172A' : '#F8FAFC'}
                    fontSize="10"
                    fontWeight="bold"
                    letterSpacing="0.5"
                  >
                    {rack.name} · {rack.yarnType.toUpperCase()}
                  </text>

                  {/* Right-aligned Stock Quantity */}
                  <text
                    x={rack.width - 24}
                    y="16"
                    fill={isSelected ? '#0F172A' : isLow ? '#FDE68A' : '#38BDF8'}
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="end"
                  >
                    {rackTotalQuantity.toLocaleString()} kg
                  </text>
                </g>

                {/* Shelf Frame & Vertical Upright Posts */}
                <rect x={rack.x + 10} y={rack.y + 36} width="5" height={142} fill="url(#rack-post)" rx="1" />
                <rect x={rack.x + rack.width / 2 - 2.5} y={rack.y + 36} width="5" height={142} fill="url(#rack-post)" rx="1" />
                <rect x={rack.x + rack.width - 15} y={rack.y + 36} width="5" height={142} fill="url(#rack-post)" rx="1" />

                {/* Shelf 1: Top Shelving Beam */}
                <rect
                  x={rack.x + 8}
                  y={rack.y + 78}
                  width={rack.width - 16}
                  height="5"
                  fill="url(#beam-teal)"
                  rx="1"
                />
                {/* Shelf 1 Pallet Decks */}
                <rect x={rack.x + 18} y={rack.y + 74} width="100" height="4" fill="url(#wood-pallet)" rx="1" />
                <rect x={rack.x + 135} y={rack.y + 74} width="100" height="4" fill="url(#wood-pallet)" rx="1" />

                {/* Shelf 1 Cones: Left Bay (4 cones evenly distributed) */}
                <g transform={`translate(${rack.x + 22}, ${rack.y + 46})`}>
                  {[0, 24, 48, 72].map((cx, i) => (
                    <g key={`t-cone-l-${i}`} transform={`translate(${cx}, 0)`}>
                      <ellipse cx="9" cy="4" rx="2.5" ry="1.2" fill="url(#bobbin-core)" />
                      <path
                        d="M 6.5 5 L 11.5 5 L 16 26 L 2 26 Z"
                        fill={coneGradient}
                        stroke="#334155"
                        strokeWidth="0.5"
                      />
                      <ellipse cx="9" cy="26" rx="7" ry="1.8" fill="url(#bobbin-core)" />
                      <line x1="5" y1="12" x2="13" y2="12" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.4" />
                      <line x1="4" y1="18" x2="14" y2="18" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.4" />
                    </g>
                  ))}
                </g>

                {/* Shelf 1 Cones: Right Bay (4 cones evenly distributed) */}
                <g transform={`translate(${rack.x + 139}, ${rack.y + 46})`}>
                  {[0, 24, 48, 72].map((cx, i) => (
                    <g key={`t-cone-r-${i}`} transform={`translate(${cx}, 0)`}>
                      <ellipse cx="9" cy="4" rx="2.5" ry="1.2" fill="url(#bobbin-core)" />
                      <path
                        d="M 6.5 5 L 11.5 5 L 16 26 L 2 26 Z"
                        fill={coneGradient}
                        stroke="#334155"
                        strokeWidth="0.5"
                      />
                      <ellipse cx="9" cy="26" rx="7" ry="1.8" fill="url(#bobbin-core)" />
                      <line x1="5" y1="12" x2="13" y2="12" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.4" />
                      <line x1="4" y1="18" x2="14" y2="18" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.4" />
                    </g>
                  ))}
                </g>

                {/* Shelf 2: Mid Shelving Beam */}
                <rect
                  x={rack.x + 8}
                  y={rack.y + 128}
                  width={rack.width - 16}
                  height="5"
                  fill="url(#beam-teal)"
                  rx="1"
                />
                {/* Shelf 2 Pallet Decks */}
                <rect x={rack.x + 18} y={rack.y + 124} width="100" height="4" fill="url(#wood-pallet)" rx="1" />
                <rect x={rack.x + 135} y={rack.y + 124} width="100" height="4" fill="url(#wood-pallet)" rx="1" />

                {/* Shelf 2 Cones: Left Bay (4 cones) */}
                <g transform={`translate(${rack.x + 22}, ${rack.y + 96})`}>
                  {[0, 24, 48, 72].map((cx, i) => (
                    <g key={`m-cone-l-${i}`} transform={`translate(${cx}, 0)`}>
                      <ellipse cx="9" cy="4" rx="2.5" ry="1.2" fill="url(#bobbin-core)" />
                      <path
                        d="M 6.5 5 L 11.5 5 L 16 26 L 2 26 Z"
                        fill={coneGradient}
                        stroke="#334155"
                        strokeWidth="0.5"
                      />
                      <ellipse cx="9" cy="26" rx="7" ry="1.8" fill="url(#bobbin-core)" />
                    </g>
                  ))}
                </g>

                {/* Shelf 2 Cones: Right Bay (4 cones) */}
                <g transform={`translate(${rack.x + 139}, ${rack.y + 96})`}>
                  {[0, 24, 48, 72].map((cx, i) => (
                    <g key={`m-cone-r-${i}`} transform={`translate(${cx}, 0)`}>
                      <ellipse cx="9" cy="4" rx="2.5" ry="1.2" fill="url(#bobbin-core)" />
                      <path
                        d="M 6.5 5 L 11.5 5 L 16 26 L 2 26 Z"
                        fill={coneGradient}
                        stroke="#334155"
                        strokeWidth="0.5"
                      />
                      <ellipse cx="9" cy="26" rx="7" ry="1.8" fill="url(#bobbin-core)" />
                    </g>
                  ))}
                </g>

                {/* Shelf 3: Base Floor Level Rail */}
                <rect x={rack.x + 8} y={rack.y + 174} width={rack.width - 16} height="4" fill="#475569" rx="1" />

                {/* Ground Level Pallet Cargo Cartons (Left Pallet: 2 boxes) */}
                <g transform={`translate(${rack.x + 20}, ${rack.y + 144})`}>
                  <rect x="2" y="3" width="44" height="25" rx="2" fill="#78350F" opacity="0.85" stroke="#B45309" strokeWidth="0.7" />
                  <text x="24" y="18" fill="#FDE68A" fontSize="7" fontWeight="bold" textAnchor="middle">
                    CARTON
                  </text>
                  <rect x="50" y="3" width="44" height="25" rx="2" fill="#78350F" opacity="0.85" stroke="#B45309" strokeWidth="0.7" />
                  <text x="72" y="18" fill="#FDE68A" fontSize="7" fontWeight="bold" textAnchor="middle">
                    CARTON
                  </text>
                </g>

                {/* Ground Level Pallet Cargo Cartons (Right Pallet: 2 boxes) */}
                <g transform={`translate(${rack.x + 137}, ${rack.y + 144})`}>
                  <rect x="2" y="3" width="44" height="25" rx="2" fill="#78350F" opacity="0.85" stroke="#B45309" strokeWidth="0.7" />
                  <text x="24" y="18" fill="#FDE68A" fontSize="7" fontWeight="bold" textAnchor="middle">
                    CARTON
                  </text>
                  <rect x="50" y="3" width="44" height="25" rx="2" fill="#78350F" opacity="0.85" stroke="#B45309" strokeWidth="0.7" />
                  <text x="72" y="18" fill="#FDE68A" fontSize="7" fontWeight="bold" textAnchor="middle">
                    CARTON
                  </text>
                </g>

                {/* PROMINENT YELLOW ARROW DIRECTLY ON EVERY LOW STOCK PLACE */}
                {isLow && (
                  <g transform={`translate(${rack.x + rack.width / 2}, ${rack.y - 4})`} className="pointer-events-none">
                    {/* Anchor point */}
                    <circle cx="0" cy="0" r="4.5" fill="#FACC15" />

                    {/* Static High-Visibility Yellow Arrow pointing directly down into low-stock place */}
                    <path
                      d="M -11 -28 L 11 -28 L 11 -14 L 19 -14 L 0 0 L -19 -14 L -11 -14 Z"
                      fill="#FACC15"
                      stroke="#CA8A04"
                      strokeWidth="1.5"
                      filter="url(#arrow-glow)"
                    />
                    <path
                      d="M -8 -25 L 0 -25 L 0 -3 L -13 -14 L -8 -14 Z"
                      fill="#FEF08A"
                      opacity="0.8"
                    />

                    {/* Static High-Contrast LOW STOCK Placard Above Arrow */}
                    <g transform="translate(0, -38)">
                      <rect
                        x="-44"
                        y="-10"
                        width="88"
                        height="18"
                        rx="3"
                        fill="#78350F"
                        stroke="#FACC15"
                        strokeWidth="1.2"
                        filter="url(#arrow-glow)"
                      />
                      <text
                        x="0"
                        y="2.5"
                        fill="#FEF08A"
                        fontSize="8.5"
                        fontWeight="bold"
                        textAnchor="middle"
                        letterSpacing="0.4"
                      >
                        ⚠️ LOW STOCK
                      </text>
                    </g>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
