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
  LayoutGrid,
  List,
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

  // View mode & layout
  const [viewMode, setViewMode] = useState<'registry' | 'history'>('registry');
  const [layoutMode, setLayoutMode] = useState<'cards' | 'table'>('cards');
  const [statusFilter, setStatusFilter] = useState('ALL');
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
    const status = b.inspection_status || 'PENDING_INSPECTION';
    if (statusFilter !== 'ALL' && status !== statusFilter) return false;
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
                <h1 className="text-2xl font-bold text-slate-900">Yarn Inspection</h1>
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

      {/* YARN INSPECTION & QC REGISTRY */}
      {viewMode === 'registry' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs space-y-5 p-5">
          {/* Filter & Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-60">
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium"
              >
                <option value="ALL">All QC Statuses ({batches.length})</option>
                <option value="PENDING_INSPECTION">Pending Inspection ({pendingBatches.length})</option>
                <option value="ON_HOLD">On Hold / Quarantine ({onHoldBatches.length})</option>
                <option value="PASSED">Passed & Released ({passedBatches.length})</option>
                <option value="REJECTED">Rejected ({rejectedBatches.length})</option>
              </select>

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

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 hidden sm:inline">
                Showing {filteredAllBatches.length} of {batches.length} lots
              </span>

              {/* View Layout Toggle */}
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                <button
                  type="button"
                  onClick={() => setLayoutMode('cards')}
                  title="Card Format View"
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${
                    layoutMode === 'cards'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('table')}
                  title="Table Format View"
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${
                    layoutMode === 'table'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                  <span>Table</span>
                </button>
              </div>

              <button
                onClick={() => setViewMode('history')}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <History className="h-3.5 w-3.5 text-teal-600" />
                <span>Audit Trail Log ({inspections.length})</span>
              </button>
            </div>
          </div>

          {/* CARD FORMAT (DEFAULT) */}
          {layoutMode === 'cards' && (
            <div>
              {filteredAllBatches.length === 0 ? (
                <div className="bg-slate-50/70 rounded-xl border border-dashed border-slate-300 p-12 text-center space-y-2">
                  <Boxes className="h-8 w-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">No yarn batches found</p>
                  <p className="text-xs text-slate-500">
                    Try adjusting your search query, QC status, or yarn type filters.
                  </p>
                  {(searchQuery || statusFilter !== 'ALL' || yarnTypeFilter !== 'ALL') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('ALL');
                        setYarnTypeFilter('ALL');
                      }}
                      className="mt-2 px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredAllBatches.map((b) => {
                    const status = b.inspection_status || 'PENDING_INSPECTION';
                    const isPassed = status === 'PASSED';
                    const isPending = status === 'PENDING_INSPECTION';
                    const isOnHold = status === 'ON_HOLD';
                    const isRejected = status === 'REJECTED';

                    return (
                      <div
                        key={b.id}
                        className={`bg-white rounded-xl border shadow-xs hover:shadow-md hover:border-slate-300 transition-all p-4 flex flex-col justify-between ${
                          isOnHold
                            ? 'border-amber-300 ring-1 ring-amber-100'
                            : isPending
                            ? 'border-amber-200 ring-1 ring-amber-50'
                            : 'border-slate-200'
                        }`}
                      >
                        <div>
                          {/* Top row: Batch ID & QC Status */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h4 className="font-mono font-bold text-sm text-slate-900">
                                {b.batch_code}
                              </h4>
                              <span className="text-[11px] font-mono text-slate-400">
                                {b.barcode}
                              </span>
                            </div>

                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                isPassed
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : isPending
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : isOnHold
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {isPassed && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                              {isPending && <Clock className="h-3 w-3 text-amber-600" />}
                              {isOnHold && <AlertTriangle className="h-3 w-3 text-amber-600" />}
                              {isRejected && <XCircle className="h-3 w-3 text-rose-600" />}
                              <span>{isPending ? 'Pending' : status.replace('_', ' ')}</span>
                            </span>
                          </div>

                          {/* Yarn & Supplier info */}
                          <div className="space-y-1 mb-3">
                            <div className="text-xs font-semibold text-slate-800">
                              {b.yarn_type} • {b.colour}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center justify-between">
                              <span className="truncate pr-1">{b.supplier}</span>
                              {b.yarn_count_spec && (
                                <span className="font-mono text-slate-400 flex-shrink-0 text-[10px]">
                                  {b.yarn_count_spec}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quantity row */}
                          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-slate-400 text-[11px]">Quantity</span>
                            <div className="text-right font-mono">
                              {isPending ? (
                                <span className="font-bold text-amber-700">
                                  {b.quantity_received.toLocaleString()} {b.unit}
                                </span>
                              ) : isOnHold ? (
                                <div>
                                  <span className="font-bold text-amber-800">
                                    {(b.quantity_held || b.quantity_received).toLocaleString()} {b.unit}
                                  </span>
                                  <span className="text-[10px] text-amber-600 block font-sans">
                                    Under Quarantine
                                  </span>
                                </div>
                              ) : (
                                <div>
                                  <span className="font-bold text-emerald-700">
                                    {b.quantity_available.toLocaleString()} {b.unit}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block font-sans">
                                    Total: {b.quantity_received.toLocaleString()} {b.unit}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between gap-2">
                          <button
                            onClick={() => setHistoryBatch(b)}
                            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 py-1"
                          >
                            <History className="h-3.5 w-3.5" />
                            <span>History</span>
                          </button>

                          {isPending ? (
                            <button
                              onClick={() => {
                                setInspectingBatch(b);
                                setIsReinspectionMode(false);
                              }}
                              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                            >
                              <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
                              <span>Inspect</span>
                            </button>
                          ) : isOnHold ? (
                            <button
                              onClick={() => {
                                setInspectingBatch(b);
                                setIsReinspectionMode(true);
                              }}
                              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>Reinspect</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setInspectingBatch(b);
                                setIsReinspectionMode(true);
                              }}
                              className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-200"
                            >
                              <RotateCcw className="h-3 w-3 text-slate-400" />
                              <span>Reinspect</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TABLE FORMAT */}
          {layoutMode === 'table' && (
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
          )}
        </div>
      )}

      {/* AUDIT TRAIL LOG */}
      {viewMode === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode('registry')}
                className="px-2.5 py-1 text-xs font-semibold border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-1 transition-colors"
              >
                ← Back to Registry
              </button>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <History className="h-4 w-4 text-teal-600" />
                  Quality Inspection Audit Trail Log
                </h3>
                <p className="text-xs text-slate-500">
                  Official records of all initial inspections, laboratory reports, and authorized reinspections.
                </p>
              </div>
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
      {Boolean(inspectingBatch) && (
        <InspectionModal
          batch={inspectingBatch}
          isOpen={Boolean(inspectingBatch)}
          onClose={() => setInspectingBatch(null)}
          onSuccess={handleInspectionSuccess}
          isReinspection={isReinspectionMode}
        />
      )}

      {/* Inspection History Modal */}
      {Boolean(historyBatch) && (
        <InspectionHistoryModal
          batch={historyBatch}
          isOpen={Boolean(historyBatch)}
          onClose={() => setHistoryBatch(null)}
          onTriggerReinspection={(b) => {
            setInspectingBatch(b);
            setIsReinspectionMode(true);
          }}
        />
      )}
    </div>
  );
}
