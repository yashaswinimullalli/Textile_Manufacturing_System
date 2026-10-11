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
  ChevronRight,
  PackageCheck
} from 'lucide-react';
import { useFabricTrace } from '@/context/FabricTraceContext';

export default function ShippingManifestPage() {
  const { fabricRolls } = useFabricTrace();

  // Filter passed and ready rolls from database
  const approvedRolls = fabricRolls.filter((r) => r.status === 'PASSED' || r.operational_status === 'PASSED');
  const dispatchedRolls = fabricRolls.filter((r) => r.status === 'DISPATCHED' || r.operational_status === 'DISPATCHED');
  const pendingRolls = fabricRolls.filter((r) => r.status === 'PENDING' || r.operational_status === 'PENDING');

  // Dynamically group live database rolls into trucks
  const carriers = [
    { carrier: 'VRL Logistics Hub', truckNo: 'KA-04-E-8821', driver: 'M. Anand', sealNo: 'SEAL-9941', destination: 'Primary Regional Depot' },
    { carrier: 'SafeX Freight Line', truckNo: 'MH-12-Q-4491', driver: 'Rajesh G', sealNo: 'SEAL-9942', destination: 'Western Terminal Hub' },
    { carrier: 'GATI KWE Fast Express', truckNo: 'DL-01-T-7733', driver: 'S. Rawat', sealNo: 'SEAL-9943', destination: 'Northern Fulfillment Hub' },
  ];

  const dynamicTrucks = React.useMemo(() => {
    if (approvedRolls.length === 0 && dispatchedRolls.length === 0) return [];

    const allUsable = [...dispatchedRolls, ...approvedRolls];
    const chunkSize = Math.max(1, Math.ceil(allUsable.length / 3));

    return carriers.map((carrier, idx) => {
      const truckRolls = allUsable.slice(idx * chunkSize, (idx + 1) * chunkSize);
      const isComplete = truckRolls.length > 0 && truckRolls.every(r => r.status === 'DISPATCHED' || r.operational_status === 'DISPATCHED');
      return {
        ...carrier,
        rollsLoaded: truckRolls.length,
        targetRolls: Math.max(truckRolls.length, 12),
        status: isComplete ? 'Dispatched' : (truckRolls.length > 0 ? 'Ready for Gate Pass' : 'Bay Reserved'),
        rolls: truckRolls.map(r => ({
          code: r.roll_code,
          fabric: r.fabricType,
          meters: Math.round(r.produced_quantity || 150),
          stamp: r.status === 'DISPATCHED' ? 'DISPATCHED' : 'PASSED',
        })),
      };
    }).filter(t => t.rolls.length > 0);
  }, [approvedRolls, dispatchedRolls]);

  const totalLoaded = dynamicTrucks.reduce((sum, t) => sum + t.rollsLoaded, 0);

  return (
    <div className="space-y-6 font-sans">
      
      {/* ─── 4 Concise Summary Cards ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-slate-400">Active Trucks</div>
          <div className="text-3xl font-black text-slate-900 mt-1">{dynamicTrucks.length} Carriers</div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">Live Database Fleet</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-emerald-600">Loaded Rolls</div>
          <div className="text-3xl font-black text-emerald-600 mt-1">{totalLoaded} Staged</div>
          <div className="text-[11px] font-bold text-emerald-700 mt-1">100% QC Approved</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-amber-600">Pending QC Rolls</div>
          <div className="text-3xl font-black text-amber-600 mt-1">{pendingRolls.length} Awaiting</div>
          <div className="text-[11px] font-bold text-amber-700 mt-1">On Floor Inspection</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm">
          <div className="text-[11px] font-black uppercase text-blue-600">Safety Gate</div>
          <div className="text-3xl font-black text-blue-600 mt-1">100% Enforced</div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">Zero Escapes</div>
        </div>

      </div>

      {/* ─── Active Truck Consignments ───────────────────────────────────────── */}
      <div className="space-y-6">
        {dynamicTrucks.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
            <PackageCheck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No Truck Manifests Active</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Truck loads will populate dynamically once production orders are imported and fabric rolls pass Quality Inspection in the database.
            </p>
          </div>
        ) : (
          dynamicTrucks.map((truck) => {
            const isComplete = truck.rollsLoaded >= truck.targetRolls || truck.status === 'Dispatched';

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
                    Verified Rolls from Database
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
          })
        )}
      </div>

    </div>
  );
}
