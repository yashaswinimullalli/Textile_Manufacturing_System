'use client';

import React from 'react';
import { 
  FileText, 
  Truck, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Building2,
  Printer,
  ChevronRight
} from 'lucide-react';

const trucksManifest = [
  {
    truckNo: 'KA-04-E-8821',
    carrier: 'VRL Logistics',
    driver: 'M. Anand',
    sealNo: 'SEAL-9941',
    destination: 'Arvind Lifestyle, Bangalore Hub',
    rollsLoaded: 16,
    targetRolls: 16,
    status: 'Ready for Gate Pass',
    rolls: [
      { code: 'ROLL-001', fabric: 'Cotton Twill 240 GSM', meters: 200, stamp: 'PASSED' },
      { code: 'ROLL-002', fabric: 'Cotton Twill 240 GSM', meters: 180, stamp: 'PASSED' },
      { code: 'ROLL-003', fabric: 'Cotton Twill 240 GSM', meters: 200, stamp: 'PASSED' },
      { code: 'ROLL-004', fabric: 'Cotton Twill 240 GSM', meters: 200, stamp: 'PASSED' },
    ]
  },
  {
    truckNo: 'MH-12-Q-4491',
    carrier: 'SafeX Freight',
    driver: 'Rajesh G',
    sealNo: 'SEAL-9942',
    destination: 'Raymond Luxury, Mumbai Terminal',
    rollsLoaded: 14,
    targetRolls: 16,
    status: 'Loading in Progress',
    rolls: [
      { code: 'ROLL-011', fabric: 'Raw Indigo Denim', meters: 180, stamp: 'PASSED' },
      { code: 'ROLL-012', fabric: 'Raw Indigo Denim', meters: 190, stamp: 'PASSED' },
      { code: 'ROLL-013', fabric: 'Raw Indigo Denim', meters: 200, stamp: 'PASSED' },
    ]
  },
  {
    truckNo: 'DL-01-T-7733',
    carrier: 'GATI KWE Fast',
    driver: 'S. Rawat',
    sealNo: 'SEAL-9943',
    destination: 'Fabindia Retail, Delhi Warehouse',
    rollsLoaded: 12,
    targetRolls: 12,
    status: 'Ready for Gate Pass',
    rolls: [
      { code: 'ROLL-021', fabric: 'Pure Organic Linen', meters: 150, stamp: 'PASSED' },
      { code: 'ROLL-023', fabric: 'Pure Organic Linen', meters: 160, stamp: 'PASSED' },
      { code: 'ROLL-024', fabric: 'Pure Organic Linen', meters: 150, stamp: 'PASSED' },
    ]
  }
];

export default function ShippingManifestPage() {
  return (
    <div className="space-y-6 font-sans">
      
      {/* ─── 4 Concise 2-3 Word Summary Cards ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-slate-400">Active Trucks</div>
          <div className="text-3xl font-black text-slate-900 mt-1">3 Carriers</div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">Bay 1, 2, 3</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-emerald-600">Loaded Rolls</div>
          <div className="text-3xl font-black text-emerald-600 mt-1">42 Staged</div>
          <div className="text-[11px] font-bold text-emerald-700 mt-1">100% Inspected</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-amber-600">Pending Load</div>
          <div className="text-3xl font-black text-amber-600 mt-1">2 Remaining</div>
          <div className="text-[11px] font-bold text-amber-700 mt-1">MH-12 Truck</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-blue-600">Container Seals</div>
          <div className="text-3xl font-black text-blue-600 mt-1">Tamper Safe</div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">Digital Signed</div>
        </div>

      </div>

      {/* ─── Active Truck Consignments ───────────────────────────────────────── */}
      <div className="space-y-6">
        {trucksManifest.map((truck) => {
          const isComplete = truck.rollsLoaded === truck.targetRolls;

          return (
            <div key={truck.truckNo} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
              
              {/* Truck Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black font-mono text-slate-900">{truck.truckNo}</span>
                      <span className="text-xs font-bold text-slate-500">({truck.carrier})</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-600 mt-0.5">
                      Destination: <strong className="text-purple-700">{truck.destination}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                    isComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {truck.status}
                  </span>
                  <button 
                    onClick={() => window.print()}
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress & Seal Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Container Seal</span>
                  <span className="font-mono font-black text-slate-900">{truck.sealNo}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Assigned Driver</span>
                  <span className="font-bold text-slate-900">{truck.driver}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Verified Rolls</span>
                  <span className="font-bold text-slate-900">{truck.rollsLoaded} / {truck.targetRolls}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Safety Gate</span>
                  <span className="font-black text-emerald-600">Zero-Defect Pass</span>
                </div>
              </div>

              {/* Verified Staged Rolls Table */}
              <div>
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
                  Sample Barcodes Loaded on Board
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {truck.rolls.map((r) => (
                    <div key={r.code} className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-mono font-black text-slate-900">{r.code}</div>
                        <div className="text-[10px] text-slate-500">{r.fabric} • {r.meters}m</div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-black">
                        {r.stamp}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
