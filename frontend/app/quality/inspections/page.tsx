'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Search,
  Scan,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  History,
  Layers,
  FlaskConical,
  Eye,
  Filter,
  RefreshCw,
  PlusCircle,
  Boxes,
  ArrowRight,
  RotateCcw,
  Clock,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  YarnBatch,
  QualityInspection,
  InspectionDisposition,
} from '@/lib/types';
import { InspectionModal } from '@/components/quality/InspectionModal';
import { InspectionHistoryModal } from '@/components/quality/InspectionHistoryModal';

export default function QualityInspectionsPage() {
  const [batches, setBatches] = useState<YarnBatch[]>([]);
  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [loading, setLoading] = useState(true);

  // Active workstation tab
  const [activeTab, setActiveTab] = useState<'pending' | 'on_hold' | 'all' | 'history'>('pending');

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [yarnTypeFilter, setYarnTypeFilter] = useState('ALL');

  // Barcode / Batch Scan quick search
  const [scanInput, setScanInput] = useState('');

  // Modals state
  const [inspectingBatch, setInspectingBatch] = useState<YarnBatch | null>(null);
  const [isReinspectionMode, setIsReinspectionMode] = useState(false);
  const [historyBatch, setHistoryBatch] = useState<YarnBatch | null>(null);

  // Notification feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [batchList, inspList] = await Promise.all([
        api.getYarnBatches(),
        api.getQualityInspections(),
      ]);
      setBatches(batchList);
      setInspections(inspList);
    } catch (err) {
      console.error('Failed to load quality data', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);
  }, []);

  // Quick Barcode / Batch Lookup
  const handleBarcodeLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = scanInput.trim();
    if (!clean) return;

    try {
      const found = await api.getBatchByBarcode(clean);
      setScanInput('');
      setInspectingBatch(found);
      setIsReinspectionMode(Boolean(found.inspection_status && found.inspection_status !== 'PENDING_INSPECTION'));
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || `No batch found for "${clean}".` });
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleInspectionSuccess = (updatedBatch: YarnBatch, message: string) => {
    setFeedback({ type: 'success', message });
    loadData(true);
    setTimeout(() => setFeedback(null), 6000);
  };

  // Filtered views
  const pendingBatches = batches.filter(
    (b) => !b.inspection_status || b.inspection_status === 'PENDING_INSPECTION'
  );
  const onHoldBatches = batches.filter((b) => b.inspection_status === 'ON_HOLD');
  const passedBatches = batches.filter((b) => b.inspection_status === 'PASSED');
  const rejectedBatches = batches.filter((b) => b.inspection_status === 'REJECTED');

  const filteredAllBatches = batches.filter((b) => {
    if (yarnTypeFilter !== 'ALL' && b.yarn_type !== yarnTypeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.batch_code.toLowerCase().includes(q) ||
        b.barcode.toLowerCase().includes(q) ||
        b.supplier.toLowerCase().includes(q) ||
        b.colour.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalReceivedKg = batches.reduce((sum, b) => sum + b.quantity_received, 0);
  const totalApprovedKg = batches.reduce((sum, b) => sum + (b.quantity_approved || 0), 0);
  const totalHeldKg = batches.reduce((sum, b) => sum + (b.quantity_held || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">Incoming Yarn Quality Inspection</h1>
                <span className="bg-teal-100 text-teal-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  Plant QC Workstation
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manual visual inspection checklists, ASTM/ISO laboratory verification, and release disposition.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Barcode Quick Scan Bar */}
          <form onSubmit={handleBarcodeLookup} className="relative flex items-center">
            <Scan className="h-4 w-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder="Scan Barcode / Batch ID..."
              className="pl-9 pr-20 py-2 text-xs border border-slate-300 rounded-lg w-56 sm:w-64 focus:ring-1 focus:ring-teal-500 font-mono shadow-xs"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-2.5 py-1 bg-slate-900 text-white rounded text-[11px] font-semibold hover:bg-slate-800"
            >
              Inspect
            </button>
          </form>

          <Link
            href="/storekeeper/inventory"
            className="px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Boxes className="h-3.5 w-3.5 text-teal-600" />
            <span>Storekeeper Warehouse</span>
          </Link>

          <button
            onClick={() => loadData(false)}
            className="p-2 border border-slate-300 rounded-lg hover:bg-white text-slate-600 shadow-xs"
            title="Refresh records"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-500 hover:text-slate-800">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Pending Inspection */}
        <div
          onClick={() => setActiveTab('pending')}
          className={`bg-white rounded-xl border p-4 shadow-xs cursor-pointer transition-all hover:shadow ${
            activeTab === 'pending' ? 'ring-2 ring-amber-400 border-amber-300 bg-amber-50/20' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending Inspection</span>
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{pendingBatches.length}</span>
            <span className="text-xs text-slate-500">deliveries queued</span>
          </div>
          <span className="text-[11px] text-amber-800 mt-1 block">
            Blocked from weaving lines until cleared
          </span>
        </div>

        {/* On Hold / Quarantine */}
        <div
          onClick={() => setActiveTab('on_hold')}
          className={`bg-white rounded-xl border p-4 shadow-xs cursor-pointer transition-all hover:shadow ${
            activeTab === 'on_hold' ? 'ring-2 ring-amber-400 border-amber-300 bg-amber-50/20' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">On Hold (Quarantine)</span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{onHoldBatches.length}</span>
            <span className="text-xs text-slate-500">lots in lab review</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {totalHeldKg.toLocaleString()} kg under quarantine
          </span>
        </div>

        {/* Passed & Released */}
        <div
          onClick={() => setActiveTab('all')}
          className="bg-white rounded-xl border p-4 shadow-xs cursor-pointer transition-all hover:shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Passed & Released</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{passedBatches.length}</span>
            <span className="text-xs text-slate-500">batches approved</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
            {totalApprovedKg.toLocaleString()} kg approved for production
          </span>
        </div>

        {/* Rejected */}
        <div
          onClick={() => setActiveTab('all')}
          className="bg-white rounded-xl border p-4 shadow-xs cursor-pointer transition-all hover:shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Rejected Lots</span>
            <XCircle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{rejectedBatches.length}</span>
            <span className="text-xs text-slate-500">quarantined for RTV</span>
          </div>
          <span className="text-[11px] text-rose-700 mt-1 block">
            Production issue prohibited
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Pending Inspection Queue ({pendingBatches.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('on_hold')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'on_hold'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>On Hold & Quarantine ({onHoldBatches.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'all'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Boxes className="h-4 w-4" />
            <span>All Batches & QC Registry ({batches.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Audit Trail Log ({inspections.length})</span>
          </button>
        </div>

        <span className="text-xs text-slate-400 font-mono hidden sm:inline">
          Surat Unit 02 • Quality Assurance Division
        </span>
      </div>

      {/* TAB 1: PENDING INSPECTION QUEUE */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <span>
                <strong>Gate Receiving Rule:</strong> All raw yarn batches are held at <strong>0 kg available</strong> until an authorized inspector records physical observations and laboratory test clearance.
              </span>
            </div>
            <span className="text-[11px] font-mono text-amber-800 font-bold">
              {pendingBatches.length} Deliveries Awaiting Check
            </span>
          </div>

          {pendingBatches.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Inspection Queue Clear</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                All delivered yarn batches have been inspected and released or placed in quarantine.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingBatches.map((b) => (
                <div
                  key={b.id}
                  className="bg-white rounded-xl border border-amber-200 shadow-xs p-5 flex flex-col justify-between hover:shadow transition-shadow ring-1 ring-amber-100"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Pending Inspection
                        </span>
                        <h3 className="text-base font-bold text-slate-900 mt-1">{b.batch_code}</h3>
                      </div>
                      <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                        {b.barcode}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Supplier:</span>
                        <span className="font-semibold text-slate-900">{b.supplier}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Yarn Type & Spec:</span>
                        <span className="font-semibold text-slate-900">
                          {b.yarn_type} ({b.yarn_count_spec || b.colour})
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Received Quantity:</span>
                        <span className="font-bold text-amber-700 font-mono">
                          {b.quantity_received.toLocaleString()} {b.unit}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Delivery Date:</span>
                        <span className="text-slate-800">{new Date(b.received_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setHistoryBatch(b);
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    >
                      <History className="h-3.5 w-3.5" />
                      <span>History</span>
                    </button>

                    <button
                      onClick={() => {
                        setInspectingBatch(b);
                        setIsReinspectionMode(false);
                      }}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors ring-2 ring-teal-500/30"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
                      <span>Conduct Inspection →</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ON HOLD & QUARANTINE */}
      {activeTab === 'on_hold' && (
        <div className="space-y-4">
          <div className="p-3 bg-amber-50/70 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <span>
                <strong>Quarantine Protocol:</strong> These batches have reported visual or laboratory test deviations and are blocked from production issue. Reinspection is permitted after corrective sorting or supplier clarification.
              </span>
            </div>
            <span className="text-[11px] font-mono text-amber-800 font-bold">
              {onHoldBatches.length} Lots Quarantined
            </span>
          </div>

          {onHoldBatches.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Zero Lots on Hold</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No yarn batches are currently detained in the quality quarantine zone.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {onHoldBatches.map((b) => (
                <div
                  key={b.id}
                  className="bg-white rounded-xl border border-amber-300 shadow-xs p-5 flex flex-col justify-between hover:shadow transition-shadow ring-1 ring-amber-200"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                          Quarantined (On Hold)
                        </span>
                        <h3 className="text-base font-bold text-slate-900 mt-1">{b.batch_code}</h3>
                      </div>
                      <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                        {b.barcode}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Supplier:</span>
                        <span className="font-semibold text-slate-900">{b.supplier}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Yarn Spec:</span>
                        <span className="font-semibold text-slate-900">{b.yarn_type} ({b.colour})</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Quarantined Quantity:</span>
                        <span className="font-bold text-amber-800 font-mono">
                          {(b.quantity_held || b.quantity_received).toLocaleString()} {b.unit}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Production Available:</span>
                        <span className="font-mono text-rose-700 font-bold">0 kg (Blocked)</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                    <button
                      onClick={() => setHistoryBatch(b)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    >
                      <History className="h-3.5 w-3.5" />
                      <span>Audit Trail</span>
                    </button>

                    <button
                      onClick={() => {
                        setInspectingBatch(b);
                        setIsReinspectionMode(true);
                      }}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reinspect Lot →</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ALL BATCHES & QC REGISTRY */}
      {activeTab === 'all' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-5">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter lot ID, barcode, supplier..."
                  className="pl-9 pr-3 py-1.5 text-xs border rounded-lg w-full focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <select
                value={yarnTypeFilter}
                onChange={(e) => setYarnTypeFilter(e.target.value)}
                className="text-xs border rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
              >
                <option value="ALL">All Yarn Types</option>
                <option value="Cotton">Cotton</option>
                <option value="Polyester">Polyester</option>
                <option value="Blend">Blend</option>
              </select>
            </div>

            <span className="text-xs text-slate-500">
              Showing {filteredAllBatches.length} of {batches.length} raw yarn lots
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                <tr>
                  <th className="py-3 px-3">Batch / Lot ID</th>
                  <th className="py-3 px-3">Barcode</th>
                  <th className="py-3 px-3">Supplier</th>
                  <th className="py-3 px-3">Yarn Details</th>
                  <th className="py-3 px-3">Total Received</th>
                  <th className="py-3 px-3">QC Status</th>
                  <th className="py-3 px-3">Approved / Available</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAllBatches.map((b) => {
                  const status = b.inspection_status || 'PENDING_INSPECTION';
                  const isPassed = status === 'PASSED';
                  const isPending = status === 'PENDING_INSPECTION';
                  const isOnHold = status === 'ON_HOLD';
                  const isRejected = status === 'REJECTED';

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-bold text-slate-900 font-mono">
                        {b.batch_code}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">{b.barcode}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{b.supplier}</td>
                      <td className="py-3 px-3 text-slate-600">
                        {b.yarn_type} • {b.colour}
                        {b.yarn_count_spec && (
                          <span className="block text-[11px] text-slate-400 font-mono">
                            {b.yarn_count_spec}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 font-mono">
                        {b.quantity_received.toLocaleString()} {b.unit}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            isPassed
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : isPending
                              ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                              : isOnHold
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : isRejected
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-sky-100 text-sky-800 border border-sky-300'
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span
                          className={`font-bold ${
                            b.quantity_available > 0 ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          {b.quantity_available.toLocaleString()} {b.unit}
                        </span>
                        {b.quantity_held ? (
                          <span className="block text-[10px] text-amber-700 font-medium">
                            {b.quantity_held}kg Held
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setHistoryBatch(b)}
                            className="px-2.5 py-1 border rounded text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            History
                          </button>
                          <button
                            onClick={() => {
                              setInspectingBatch(b);
                              setIsReinspectionMode(!isPending);
                            }}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-bold transition-colors shadow-xs"
                          >
                            {isPending ? 'Inspect' : 'Reinspect'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL LOG */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="h-4 w-4 text-teal-600" />
                Quality Inspection Audit Trail Log
              </h3>
              <p className="text-xs text-slate-500">
                Official records of all initial inspections, laboratory reports, and authorized reinspections.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500 font-semibold">
              {inspections.length} Total Reports Recorded
            </span>
          </div>

          <div className="space-y-3">
            {inspections.map((insp) => (
              <div
                key={insp.id}
                className="p-4 border rounded-xl hover:bg-slate-50/40 transition-colors space-y-2.5 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-7 w-7 rounded-lg bg-slate-900 text-teal-300 font-mono font-bold flex items-center justify-center text-xs">
                      #{insp.inspection_number}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{insp.batch_code}</span>
                        <span className="text-slate-400 font-mono">({insp.barcode})</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            insp.decision === 'PASSED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : insp.decision === 'ON_HOLD'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : insp.decision === 'PARTIALLY_ACCEPTED'
                              ? 'bg-sky-100 text-sky-800 border border-sky-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {insp.decision}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                          {insp.stage}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        Inspector: <strong>{insp.inspector_name}</strong> •{' '}
                        {new Date(insp.inspection_date).toLocaleString()} • Supplier: {insp.supplier}
                      </span>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-[11px] text-slate-400 block">Released for Weaving</span>
                    <span className="text-sm font-bold text-emerald-700">
                      +{insp.quantity_approved.toLocaleString()} kg
                    </span>
                  </div>
                </div>

                {/* Checklist Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Packaging</span>
                    <span className="font-semibold text-slate-800">{insp.packaging_condition}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Contamination</span>
                    <span className="font-semibold text-slate-800">{insp.visible_contamination}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Colour Match</span>
                    <span className="font-semibold text-slate-800">{insp.colour_consistency}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Appearance</span>
                    <span className="font-semibold text-slate-800">{insp.yarn_appearance}</span>
                  </div>
                </div>

                {insp.decision_reason && (
                  <p className="text-[11px] text-slate-600 italic border-l-2 border-teal-500 pl-2">
                    &quot;{insp.decision_reason}&quot;
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inspection Modal */}
      <InspectionModal
        batch={inspectingBatch}
        isOpen={Boolean(inspectingBatch)}
        onClose={() => setInspectingBatch(null)}
        onSuccess={handleInspectionSuccess}
        isReinspection={isReinspectionMode}
      />

      {/* Inspection History Modal */}
      <InspectionHistoryModal
        batch={historyBatch}
        isOpen={Boolean(historyBatch)}
        onClose={() => setHistoryBatch(null)}
        onTriggerReinspection={(b) => {
          setInspectingBatch(b);
          setIsReinspectionMode(true);
        }}
      />
    </div>
  );
}
