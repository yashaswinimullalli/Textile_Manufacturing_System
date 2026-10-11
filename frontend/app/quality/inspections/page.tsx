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
  FileText,
  User,
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
        api.getYarnBatches({ intake_scanned: true }),
        api.getQualityInspections(),
      ]);
      // Only include raw materials that have been taken/scanned via barcode into the Storekeeper dashboard
      const scannedBatches = batchList.filter((b) => b.intake_scanned === true);
      setBatches(scannedBatches);
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

    setSearchQuery(clean);

    try {
      const found = await api.getBatchByBarcode(clean);
      setInspectingBatch(found);
      setIsReinspectionMode(Boolean(found.inspection_status && found.inspection_status !== 'PENDING_INSPECTION'));
    } catch (err: any) {
      const local = batches.find(
        (b) =>
          b.barcode?.toLowerCase() === clean.toLowerCase() ||
          b.batch_code?.toLowerCase() === clean.toLowerCase()
      );
      if (local) {
        setInspectingBatch(local);
        setIsReinspectionMode(Boolean(local.inspection_status && local.inspection_status !== 'PENDING_INSPECTION'));
      } else {
        setFeedback({ type: 'error', message: err.message || `No batch found for barcode "${clean}".` });
        setTimeout(() => setFeedback(null), 5000);
      }
    }
  };

  const handleInspectionSuccess = (updatedBatch: YarnBatch, message: string) => {
    setFeedback({ type: 'success', message });
    loadData(true);
    setTimeout(() => setFeedback(null), 6000);
  };

  // Active barcode query: syncs either from top scan bar or search box
  const activeBarcode = (searchQuery || scanInput).trim().toLowerCase();

  // Filtered views
  const pendingBatches = batches.filter(
    (b) => !b.inspection_status || b.inspection_status === 'PENDING_INSPECTION'
  );
  const onHoldBatches = batches.filter((b) => b.inspection_status === 'ON_HOLD');
  const passedBatches = batches.filter((b) => b.inspection_status === 'PASSED');
  const rejectedBatches = batches.filter((b) => b.inspection_status === 'REJECTED');

  // Display all batches in-taken into the system; filter by activeBarcode if provided
  const filteredAllBatches = React.useMemo(() => {
    let list = [...batches];

    if (activeBarcode) {
      list = list.filter((b) => {
        const matchBarcode = b.barcode?.toLowerCase().includes(activeBarcode);
        const matchBatchCode = b.batch_code?.toLowerCase().includes(activeBarcode);
        const matchSupplier = b.supplier?.toLowerCase().includes(activeBarcode);
        const matchColour = b.colour?.toLowerCase().includes(activeBarcode);
        const matchId = String(b.id).toLowerCase() === activeBarcode;
        return matchBarcode || matchBatchCode || matchSupplier || matchColour || matchId;
      });
    }

    if (yarnTypeFilter !== 'ALL') {
      list = list.filter((b) => b.yarn_type === yarnTypeFilter);
    }
    if (statusFilter !== 'ALL') {
      list = list.filter((b) => (b.inspection_status || 'PENDING_INSPECTION') === statusFilter);
    }

    return list;
  }, [batches, activeBarcode, yarnTypeFilter, statusFilter]);

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
                <h1 className="text-2xl font-bold text-slate-900">Yarn Inspection & Quality Reports</h1>
                <span className="bg-teal-100 text-teal-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {activeBarcode ? `${filteredAllBatches.length} Matched` : `${filteredAllBatches.length} In-Taken Lots`}
                </span>
                {pendingBatches.length > 0 && (
                  <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {pendingBatches.length} Pending Inspector Review
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Official physical inspection checklists, ASTM/ISO laboratory verification, and certified quality release reports.
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

          {pendingBatches.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setInspectingBatch(pendingBatches[0]);
                setIsReinspectionMode(false);
              }}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Inspect Next Pending ({pendingBatches[0].batch_code})</span>
            </button>
          )}

          <Link
            href="/storekeeper/inventory"
            className="px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Boxes className="h-3.5 w-3.5 text-teal-600" />
            <span>Inventory Warehouse</span>
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

      {/* Quick Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">In-Taken Lots</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-slate-900 font-mono">{batches.length}</span>
            <span className="text-[11px] text-slate-400 font-medium">In Warehouse</span>
          </div>
        </div>

        <div className={`bg-white rounded-xl border p-3.5 shadow-xs ${pendingBatches.length > 0 ? 'border-amber-300 ring-1 ring-amber-100 bg-amber-50/20' : 'border-slate-200'}`}>
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">Needs Inspection</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-amber-800 font-mono">{pendingBatches.length}</span>
            {pendingBatches.length > 0 ? (
              <span className="text-[10px] text-amber-600 font-bold bg-amber-100 px-1.5 py-0.5 rounded">Action Req.</span>
            ) : (
              <span className="text-[10px] text-emerald-600 font-bold">All Checked</span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">Passed & Released</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-emerald-800 font-mono">{passedBatches.length}</span>
            <span className="text-[11px] text-emerald-600 font-medium font-mono">{totalApprovedKg.toLocaleString()} kg</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">On Hold / Quarantined</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-amber-700 font-mono">{onHoldBatches.length}</span>
            <span className="text-[11px] text-slate-400 font-medium">Under Review</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider block">Official Reports</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-teal-900 font-mono">{inspections.length}</span>
            <button
              onClick={() => setViewMode(viewMode === 'history' ? 'registry' : 'history')}
              className="text-[11px] text-teal-600 hover:text-teal-800 font-bold hover:underline"
            >
              {viewMode === 'history' ? '← Registry' : 'Audit Trail →'}
            </button>
          </div>
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
              <div className="relative w-64">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter barcode or lot ID..."
                  className="pl-9 pr-7 py-1.5 text-xs border rounded-lg w-full focus:ring-1 focus:ring-teal-500 font-mono"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setScanInput('');
                    }}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    title="Clear"
                  >
                    ✕
                  </button>
                )}
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium"
              >
                <option value="ALL">All QC Statuses</option>
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
                {activeBarcode
                  ? `Showing ${filteredAllBatches.length} matched lot${filteredAllBatches.length === 1 ? '' : 's'}`
                  : `Showing ${filteredAllBatches.length} in-taken lot${filteredAllBatches.length === 1 ? '' : 's'}`}
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
              {batches.length === 0 ? (
                <div className="bg-slate-50/70 rounded-xl border border-dashed border-slate-300 p-12 text-center space-y-3">
                  <div className="p-3 bg-teal-50 text-teal-700 w-12 h-12 rounded-xl mx-auto flex items-center justify-center">
                    <Boxes className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">No Raw Materials In-Taken in Warehouse</p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Incoming raw materials must first be scanned and in-taken by the Storekeeper in the Inventory Warehouse dashboard before quality inspection can be performed.
                  </p>
                  <Link
                    href="/storekeeper/inventory"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 shadow-xs mt-2"
                  >
                    <Boxes className="h-3.5 w-3.5 text-teal-400" />
                    <span>Go to Storekeeper Inventory</span>
                  </Link>
                </div>
              ) : filteredAllBatches.length === 0 ? (
                <div className="bg-slate-50/70 rounded-xl border border-dashed border-slate-300 p-12 text-center space-y-2">
                  <Boxes className="h-8 w-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">No yarn batches matched your search / filters</p>
                  <p className="text-xs text-slate-500">
                    Verify the barcode or clear the current filters.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setScanInput('');
                      setStatusFilter('ALL');
                      setYarnTypeFilter('ALL');
                    }}
                    className="mt-2 px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs"
                  >
                    Clear Search & Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                  {filteredAllBatches.map((b) => {
                    const status = b.inspection_status || 'PENDING_INSPECTION';
                    const isPassed = status === 'PASSED';
                    const isPending = status === 'PENDING_INSPECTION';
                    const isOnHold = status === 'ON_HOLD';
                    const isRejected = status === 'REJECTED';

                    // Find latest inspection report for this batch
                    const batchInspections = inspections
                      .filter(
                        (i) =>
                          String(i.batch_id) === String(b.id) ||
                          (i.batch_code && b.batch_code && i.batch_code.toLowerCase() === b.batch_code.toLowerCase()) ||
                          (i.barcode && b.barcode && i.barcode.toLowerCase() === b.barcode.toLowerCase())
                      )
                      .sort(
                        (x, y) =>
                          new Date(y.created_at || y.inspection_date).getTime() -
                          new Date(x.created_at || x.inspection_date).getTime()
                      );
                    const latestInsp = batchInspections[0];

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
                        <div className="space-y-3">
                          {/* Top row: Batch ID & QC Status */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-mono font-bold text-sm text-slate-900">
                                  {b.batch_code}
                                </h4>
                                {b.intake_scanned && (
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                                    In-Taken
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                                Barcode: <strong className="text-slate-600">{b.barcode}</strong>
                              </span>
                            </div>

                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
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
                              <span>{isPending ? 'Pending Inspection' : status.replace('_', ' ')}</span>
                            </span>
                          </div>

                          {/* Yarn & Supplier info */}
                          <div className="space-y-1 bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                            <div className="text-xs font-bold text-slate-800">
                              {b.yarn_type} • {b.colour}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center justify-between">
                              <span className="truncate pr-1">Supplier: <strong>{b.supplier}</strong></span>
                              {b.yarn_count_spec && (
                                <span className="font-mono text-slate-500 flex-shrink-0 text-[10px]">
                                  {b.yarn_count_spec}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/60 font-mono">
                              <span>Received: <strong>{b.quantity_received.toLocaleString()} {b.unit}</strong></span>
                              <span className={b.quantity_available > 0 ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                                Available: {b.quantity_available.toLocaleString()} {b.unit}
                              </span>
                            </div>
                          </div>

                          {/* INSPECTION REPORT CONTAINER */}
                          {latestInsp ? (
                            <div className="p-3 rounded-lg bg-teal-50/40 border border-teal-200/80 text-xs space-y-2">
                              <div className="flex items-center justify-between border-b border-teal-200/60 pb-1.5">
                                <span className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px]">
                                  <FileText className="h-3.5 w-3.5 text-teal-600" />
                                  Inspection Report #{latestInsp.inspection_number || 1}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {new Date(latestInsp.created_at || latestInsp.inspection_date).toLocaleDateString()}
                                </span>
                              </div>

                              <div className="text-[11px] text-slate-700 flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3 text-slate-400" />
                                  <span>Inspector: <strong>{latestInsp.inspector_name}</strong></span>
                                </div>
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                    latestInsp.decision === 'PASSED'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : latestInsp.decision === 'ON_HOLD'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {latestInsp.decision}
                                </span>
                              </div>

                              {/* Physical Inspection Checklist Results */}
                              <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-white/90 p-2 rounded border border-teal-100">
                                <div>
                                  <span className="text-slate-400">Packaging:</span>{' '}
                                  <span className="font-semibold text-slate-700">{latestInsp.packaging_condition}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Contamination:</span>{' '}
                                  <span className="font-semibold text-slate-700">{latestInsp.visible_contamination}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Colour Match:</span>{' '}
                                  <span className="font-semibold text-slate-700">{latestInsp.colour_consistency}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Appearance:</span>{' '}
                                  <span className="font-semibold text-slate-700">{latestInsp.yarn_appearance}</span>
                                </div>
                              </div>

                              {/* Stock Disposition Row */}
                              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-teal-100">
                                <span className="text-slate-500">Released Stock:</span>
                                <span className="font-mono font-bold text-emerald-700">
                                  +{latestInsp.quantity_approved.toLocaleString()} {b.unit}
                                </span>
                              </div>

                              {(latestInsp.visual_remarks || latestInsp.decision_reason) && (
                                <p className="text-[10px] text-slate-600 italic border-l-2 border-teal-500 pl-1.5 truncate">
                                  &ldquo;{latestInsp.visual_remarks || latestInsp.decision_reason}&rdquo;
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 text-xs space-y-2">
                              <div className="flex items-center justify-between border-b border-amber-200/60 pb-1.5">
                                <span className="font-bold text-amber-900 flex items-center gap-1.5 text-[11px]">
                                  <Clock className="h-3.5 w-3.5 text-amber-600" />
                                  Inspection Report: Pending
                                </span>
                                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                                  In Quarantine
                                </span>
                              </div>

                              <p className="text-[11px] text-amber-800 leading-relaxed">
                                Raw material is in intake staging. Physical checklists and laboratory testing must be conducted by a certified inspector before release.
                              </p>

                              <div className="text-[10px] text-amber-700 bg-white/70 p-1.5 rounded border border-amber-200 flex items-center justify-between font-mono">
                                <span>Awaiting Inspection:</span>
                                <span className="font-bold">{b.quantity_received.toLocaleString()} {b.unit}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Card Actions */}
                        <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setHistoryBatch(b)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                            title="View Full Inspection Report & History"
                          >
                            <FileText className="h-3.5 w-3.5 text-teal-600" />
                            <span>View Report</span>
                          </button>

                          {isPending ? (
                            <button
                              type="button"
                              onClick={() => {
                                setInspectingBatch(b);
                                setIsReinspectionMode(false);
                              }}
                              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                              title="Take detailed inspection by inspector"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              <span>Take Detailed Inspection</span>
                            </button>
                          ) : isOnHold ? (
                            <button
                              type="button"
                              onClick={() => {
                                setInspectingBatch(b);
                                setIsReinspectionMode(true);
                              }}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                              title="Reinspect held batch"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>Take Reinspection</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setInspectingBatch(b);
                                setIsReinspectionMode(true);
                              }}
                              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                              title="Reinspect or update inspection by inspector"
                            >
                              <RotateCcw className="h-3 w-3 text-teal-400" />
                              <span>Reinspect Lot</span>
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
                    <th className="py-3 px-3">Latest Inspection Report</th>
                    <th className="py-3 px-3">Approved / Available</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batches.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        <Boxes className="h-6 w-6 mx-auto mb-2 text-slate-400" />
                        <p className="font-semibold text-slate-700">No Raw Materials In-Taken in Warehouse</p>
                        <p className="text-xs text-slate-400 mt-1">Please in-take raw materials via barcode in Storekeeper Inventory first.</p>
                      </td>
                    </tr>
                  ) : filteredAllBatches.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        No batch found matching "{activeBarcode}".
                      </td>
                    </tr>
                  ) : (
                    filteredAllBatches.map((b) => {
                      const status = b.inspection_status || 'PENDING_INSPECTION';
                      const isPassed = status === 'PASSED';
                      const isPending = status === 'PENDING_INSPECTION';
                      const isOnHold = status === 'ON_HOLD';
                      const isRejected = status === 'REJECTED';

                      const batchInspections = inspections
                        .filter(
                          (i) =>
                            String(i.batch_id) === String(b.id) ||
                            (i.batch_code && b.batch_code && i.batch_code.toLowerCase() === b.batch_code.toLowerCase()) ||
                            (i.barcode && b.barcode && i.barcode.toLowerCase() === b.barcode.toLowerCase())
                        )
                        .sort(
                          (x, y) =>
                            new Date(y.created_at || y.inspection_date).getTime() -
                            new Date(x.created_at || x.inspection_date).getTime()
                        );
                      const latestInsp = batchInspections[0];

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
                          <td className="py-3 px-3">
                            {latestInsp ? (
                              <div className="space-y-0.5">
                                <span className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                                  <FileText className="h-3 w-3 text-teal-600" />
                                  Report #{latestInsp.inspection_number || 1} • {latestInsp.decision}
                                </span>
                                <span className="text-[10px] text-slate-500 block">
                                  By {latestInsp.inspector_name} • {new Date(latestInsp.created_at || latestInsp.inspection_date).toLocaleDateString()}
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                <Clock className="h-3 w-3 text-amber-500" />
                                Awaiting Inspector Check
                              </span>
                            )}
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
                                type="button"
                                onClick={() => setHistoryBatch(b)}
                                className="px-2.5 py-1 border border-slate-200 rounded text-[11px] font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-1 transition-colors"
                              >
                                <FileText className="h-3 w-3 text-teal-600" />
                                <span>Report</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setInspectingBatch(b);
                                  setIsReinspectionMode(!isPending);
                                }}
                                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors shadow-xs flex items-center gap-1 ${
                                  isPending
                                    ? 'bg-teal-600 hover:bg-teal-700 text-white'
                                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                                }`}
                              >
                                {isPending ? (
                                  <>
                                    <ShieldCheck className="h-3 w-3" />
                                    <span>Take Inspection</span>
                                  </>
                                ) : (
                                  <>
                                    <RotateCcw className="h-3 w-3 text-teal-400" />
                                    <span>Reinspect</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
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
