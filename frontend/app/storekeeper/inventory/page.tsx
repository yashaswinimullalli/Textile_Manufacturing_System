'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Boxes,
  PlusCircle,
  Search,
  Filter,
  AlertTriangle,
  History,
  CheckCircle2,
  RefreshCw,
  Scan,
  Printer,
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import { YarnBatch, StockMovement } from '@/lib/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { BarcodeScannerModal } from '@/components/barcode/BarcodeScannerModal';
import { StockActionModal } from '@/components/barcode/StockActionModal';
import { RegisterNewBatchModal } from '@/components/barcode/RegisterNewBatchModal';
import { BarcodeLabel } from '@/components/barcode/BarcodeLabel';
import { InspectionModal } from '@/components/quality/InspectionModal';
import { YarnWarehouseScene } from '@/components/warehouse/YarnWarehouseScene';

export default function YarnInventoryPage() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'ledger'>('inventory');

  const [batches, setBatches] = useState<YarnBatch[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualBarcode, setManualBarcode] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Warehouse interactive selection state
  const [selectedBatch, setSelectedBatch] = useState<YarnBatch | null>(null);
  const [selectedRackId, setSelectedRackId] = useState<string | null>(null);

  // Barcode & Action Modals State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedBatchForAction, setSelectedBatchForAction] = useState<YarnBatch | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [unrecognizedCode, setUnrecognizedCode] = useState<string | undefined>();
  const [labelBatch, setLabelBatch] = useState<YarnBatch | null>(null);
  const [inspectingBatch, setInspectingBatch] = useState<YarnBatch | null>(null);

  // Transaction Feedback Banner
  const [transactionSuccess, setTransactionSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [batchData, movementData] = await Promise.all([
        api.getYarnBatches({
          yarn_type: typeFilter,
          low_stock: lowStockOnly,
        }),
        api.getStockMovements(),
      ]);
      setBatches(batchData);
      setMovements(movementData);
    } catch (err) {
      console.error('Failed to load storekeeper data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [typeFilter, lowStockOnly]);

  // Filtered displayed batches: ONLY display when barcode number is manually given
  const displayedBatches = React.useMemo(() => {
    const query = manualBarcode.trim().toLowerCase();
    if (!query) {
      // Do NOT display batch rows when barcode is not provided
      return [];
    }

    return batches.filter((b) => {
      const matchBarcode = b.barcode?.toLowerCase().includes(query);
      const matchBatchCode = b.batch_code?.toLowerCase().includes(query);
      const matchId = String(b.id).toLowerCase() === query;
      const matchType = typeFilter === 'ALL' || b.yarn_type === typeFilter;
      const matchLowStock = !lowStockOnly || b.quantity_available <= b.reorder_threshold;

      return (matchBarcode || matchBatchCode || matchId) && matchType && matchLowStock;
    });
  }, [batches, manualBarcode, typeFilter, lowStockOnly]);

  // Synchronize selection when barcode is entered or cleared
  useEffect(() => {
    if (displayedBatches.length > 0) {
      setSelectedBatch((prev) => {
        if (prev && displayedBatches.some((b) => b.id === prev.id)) return prev;
        return displayedBatches[0];
      });
      if (displayedBatches[0].storage_location) {
        setSelectedRackId(displayedBatches[0].storage_location);
      }
    } else if (!manualBarcode.trim()) {
      setSelectedBatch(null);
      setSelectedRackId(null);
    }
  }, [displayedBatches, manualBarcode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (displayedBatches.length > 0) {
      setSelectedBatch(displayedBatches[0]);
      if (displayedBatches[0].storage_location) {
        setSelectedRackId(displayedBatches[0].storage_location);
      }
    }
  };

  // Called after confirmed stock receipt or issue
  const handleTransactionSuccess = (updatedBatch: YarnBatch, message: string) => {
    setTransactionSuccess(message);
    loadData(); // Automatically refreshes dashboard and table from database
    setTimeout(() => {
      setTransactionSuccess(null);
    }, 7000);
  };

  const lowStockCount = batches.filter(b => b.quantity_available <= b.reorder_threshold).length;
  const totalAvailableKg = batches.reduce((sum, b) => sum + b.quantity_available, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Yarn Warehouse</h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {manualBarcode.trim()
                ? `${displayedBatches.length} Batch${displayedBatches.length === 1 ? '' : 'es'} Displayed`
                : 'Enter Barcode to View'}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Storage locations · Stock tracking · Quality control
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Primary Action: Scan Barcode */}
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2 ring-2 ring-teal-500/50"
          >
            <Scan className="h-4 w-4 text-teal-400" />
            <span>Scan Barcode</span>
          </button>

          {/* Register New Batch */}
          <button
            type="button"
            onClick={() => {
              setUnrecognizedCode(undefined);
              setIsRegisterOpen(true);
            }}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Register Batch</span>
          </button>

          <button
            onClick={loadData}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600"
            title="Refresh records"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Transaction Success Alert */}
      {transactionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 shadow-sm flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Action Confirmed & Saved</p>
              <p className="text-xs text-emerald-800 mt-0.5">{transactionSuccess}</p>
            </div>
          </div>
          <button
            onClick={() => setTransactionSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* STAGE 2: Interactive Animated 2D/Isometric Yarn Warehouse Scene */}
      <YarnWarehouseScene
        batches={batches}
        selectedBatch={selectedBatch}
        onSelectBatch={(batch) => {
          setSelectedBatch(batch);
          if (batch) {
            setManualBarcode(batch.barcode);
            if (batch.storage_location) {
              setSelectedRackId(batch.storage_location);
            }
          }
        }}
        selectedRackId={selectedRackId}
        onSelectRack={(rackId) => {
          setSelectedRackId(rackId);
          const matched = batches.find((b) => b.storage_location === rackId);
          if (matched) {
            setSelectedBatch(matched);
            setManualBarcode(matched.barcode);
          }
        }}
        onScanBarcodeClick={() => setIsScannerOpen(true)}
        onReceiveClick={(batch) => setSelectedBatchForAction(batch)}
        onIssueClick={(batch) => setSelectedBatchForAction(batch)}
        onInspectClick={(batch) => setInspectingBatch(batch)}
        onPrintLabelClick={(batch) => setLabelBatch(batch)}
        onRegisterBatchClick={() => {
          setUnrecognizedCode(undefined);
          setIsRegisterOpen(true);
        }}
      />

      {/* Segment Switcher Tabs: Inventory vs Movement Ledger */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'inventory'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Boxes className="h-4 w-4" />
          <span>Yarn Batches & Stock ({displayedBatches.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'ledger'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Stock Movement Ledger ({movements.length})</span>
        </button>
      </div>

      {/* TAB 1: YARN INVENTORY TABLE */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 max-w-lg">
              <div className="relative flex-1">
                <Scan className="absolute left-3 top-2.5 h-4 w-4 text-teal-600" />
                <input
                  type="text"
                  placeholder="Enter Barcode ID manually (e.g. VAS-QR-Y050)..."
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono"
                />
                {manualBarcode && (
                  <button
                    type="button"
                    onClick={() => {
                      setManualBarcode('');
                      setSelectedBatch(null);
                      setSelectedRackId(null);
                    }}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold p-0.5"
                    title="Clear barcode"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Search className="h-4 w-4 text-teal-400" />
                <span>Find Batch</span>
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-3">
              {/* Yarn Type Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="ALL">All Yarn Types</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Polyester">Polyester</option>
                  <option value="Blend">Blend</option>
                </select>
              </div>

              {/* Toggle Low Stock checkbox button */}
              <button
                type="button"
                onClick={() => setLowStockOnly(!lowStockOnly)}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                  lowStockOnly
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                <span>Low Stock Only</span>
              </button>
            </div>
          </div>

            {/* Batches Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="py-3 px-4">Batch / Lot Code</th>
                    <th className="py-3 px-4">Storage Bay</th>
                    <th className="py-3 px-4">Barcode ID</th>
                    <th className="py-3 px-4">Yarn Type</th>
                    <th className="py-3 px-4">Colour</th>
                    <th className="py-3 px-4 text-center">QC Status</th>
                    <th className="py-3 px-4 text-right">Available Qty</th>
                    <th className="py-3 px-4 text-right">Threshold</th>
                    <th className="py-3 px-4 text-center">Stock Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-500 text-sm">
                        Loading inventory records...
                      </td>
                    </tr>
                  ) : !manualBarcode.trim() ? (
                    <tr>
                      <td colSpan={10} className="py-14 text-center">
                        <div className="max-w-md mx-auto flex flex-col items-center">
                          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 mb-3 shadow-xs">
                            <Scan className="h-6 w-6" />
                          </div>
                          <h3 className="text-sm font-bold text-slate-900">No Barcode Entered</h3>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            Yarn batch records are hidden. Please enter a barcode number in the field above or click <span className="font-semibold text-teal-700">Scan Barcode</span> to display batch details.
                          </p>
                          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setIsScannerOpen(true)}
                              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                            >
                              <Scan className="h-3.5 w-3.5 text-teal-400" />
                              <span>Scan Barcode</span>
                            </button>
                            <span className="text-[11px] text-slate-400">or try e.g. <span className="font-mono font-semibold text-slate-600">VAS-QR-Y050</span></span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : displayedBatches.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-500">
                        <div className="max-w-md mx-auto flex flex-col items-center">
                          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-3">
                            <AlertTriangle className="h-6 w-6" />
                          </div>
                          <h3 className="text-sm font-bold text-slate-900">No Yarn Batch Found</h3>
                          <p className="text-xs text-slate-500 mt-1">
                            No batch matches barcode <span className="font-mono font-bold text-slate-800">"{manualBarcode}"</span>.
                          </p>
                          <div className="mt-4 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setUnrecognizedCode(manualBarcode);
                                setIsRegisterOpen(true);
                              }}
                              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            >
                              <PlusCircle className="h-3.5 w-3.5" />
                              <span>Register New Batch</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setManualBarcode('');
                                setSelectedBatch(null);
                                setSelectedRackId(null);
                              }}
                              className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayedBatches.map((batch) => {
                      const isLow = batch.quantity_available <= batch.reorder_threshold;
                      const qc = batch.inspection_status || 'PENDING_INSPECTION';
                      const isQCPending = qc === 'PENDING_INSPECTION';
                      const isQCHeld = qc === 'ON_HOLD';
                      const isQCPassed = qc === 'PASSED';
                      const isQCRejected = qc === 'REJECTED';
                      const isSelected = selectedBatch?.id === batch.id;

                      return (
                        <tr
                          key={batch.id}
                          onClick={() => {
                            setSelectedBatch(batch);
                            if (batch.storage_location) {
                              setSelectedRackId(batch.storage_location);
                            }
                          }}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-yellow-50/90 font-medium border-l-4 border-l-yellow-400 shadow-xs'
                              : 'hover:bg-slate-50/80'
                          }`}
                          title="Click to locate on interactive warehouse map"
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              {isSelected && (
                                <span className="text-yellow-500 font-bold text-xs animate-pulse">▶</span>
                              )}
                              <span>{batch.batch_code}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded border border-slate-200">
                              {batch.storage_location || 'Rack A1'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-teal-800">
                            <span className="bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-semibold">
                              {batch.barcode}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-700">
                            {batch.yarn_type}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {batch.colour}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                  isQCPassed
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : isQCPending
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                                    : isQCHeld
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : isQCRejected
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : 'bg-sky-100 text-sky-800 border border-sky-300'
                                }`}
                              >
                                {qc === 'PENDING_INSPECTION' ? 'Pending QC' : qc}
                              </span>
                              {(isQCPending || isQCHeld) && (
                                <button
                                  type="button"
                                  onClick={() => setInspectingBatch(batch)}
                                  className="text-[10px] bg-amber-600 hover:bg-amber-700 text-white px-2 py-0.5 rounded font-semibold transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                                  title="Perform manual incoming inspection & record test results"
                                >
                                  <ShieldCheck className="h-3 w-3" />
                                  <span>Inspect</span>
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold">
                            <span className={isLow ? 'text-amber-700' : 'text-slate-900'}>
                              {batch.quantity_available.toLocaleString()}
                            </span>
                            <span className="text-xs font-normal text-slate-400 ml-1">{batch.unit}</span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-500 text-xs">
                            {batch.reorder_threshold.toLocaleString()} {batch.unit}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {isLow ? (
                              <StatusBadge status="Low Stock" size="sm" pulse />
                            ) : (
                              <StatusBadge status="In Stock" size="sm" />
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Quick Issue / Receive Button */}
                              <button
                                type="button"
                                onClick={() => setSelectedBatchForAction(batch)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                                title="Issue or Receive Stock"
                              >
                                <ArrowRightLeft className="h-3 w-3" />
                                <span>Transact</span>
                              </button>

                              {/* Print Label Button */}
                              <button
                                type="button"
                                onClick={() => setLabelBatch(batch)}
                                className="p-1.5 border border-slate-300 rounded hover:bg-white text-slate-600 transition-colors"
                                title="Print Barcode Label"
                              >
                                <Printer className="h-3.5 w-3.5" />
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
          </div>
        </div>
      )}

      {/* TAB 2: INTEGRATED STOCK MOVEMENTS LEDGER */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="bg-slate-900 text-white rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-500/20 text-teal-400 rounded-lg">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-teal-400">Append-Only Audit Ledger</p>
                <p className="text-xs text-slate-300 mt-0.5">
                  Permanent transaction history for all receipts, issues to work orders, and floor adjustments.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Batch Lot Code</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Quantity</th>
                    <th className="py-3 px-4">Audit Reference / Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                        Loading ledger entries...
                      </td>
                    </tr>
                  ) : movements.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 font-sans">
                        <History className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-medium text-slate-700">No stock movements recorded</p>
                      </td>
                    </tr>
                  ) : (
                    movements.map((mov) => {
                      const isReceipt = mov.movement_type === 'RECEIPT';
                      return (
                        <tr key={mov.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-4 text-slate-500 font-sans">
                            {new Date(mov.created_at).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {mov.batch_code || mov.batch_id}
                          </td>
                          <td className="py-3.5 px-4 font-sans">
                            <StatusBadge status={mov.movement_type} size="sm" />
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold">
                            <span
                              className={`inline-flex items-center gap-1 ${
                                isReceipt ? 'text-emerald-700' : 'text-blue-700'
                              }`}
                            >
                              {isReceipt ? (
                                <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <ArrowUpRight className="h-3.5 w-3.5 text-blue-600" />
                              )}
                              {isReceipt ? '+' : '-'}
                              {mov.quantity.toLocaleString()} kg
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-sans text-xs">
                            {mov.reference}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onBatchFound={(batch) => {
          setManualBarcode(batch.barcode);
          setSelectedBatch(batch);
          if (batch.storage_location) {
            setSelectedRackId(batch.storage_location);
          }
          setSelectedBatchForAction(batch);
        }}
        onRegisterNew={(code) => {
          setUnrecognizedCode(code);
          setIsRegisterOpen(true);
        }}
      />

      {/* Stock Transaction Action Modal (Issue vs Receive) */}
      <StockActionModal
        batch={selectedBatchForAction}
        isOpen={!!selectedBatchForAction}
        onClose={() => setSelectedBatchForAction(null)}
        onTransactionSuccess={handleTransactionSuccess}
        onOpenLabelPrint={(b) => {
          setSelectedBatchForAction(null);
          setLabelBatch(b);
        }}
      />

      {/* Register New Batch Modal */}
      <RegisterNewBatchModal
        isOpen={isRegisterOpen}
        prefilledBarcode={unrecognizedCode}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={(newBatch) => {
          setIsRegisterOpen(false);
          loadData();
          setTransactionSuccess(
            `New batch ${newBatch.batch_code} registered with Barcode ${newBatch.barcode} (${newBatch.quantity_available.toLocaleString()} kg).`
          );
        }}
      />

      {/* Print Barcode Label Modal */}
      {labelBatch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <BarcodeLabel batch={labelBatch} onClose={() => setLabelBatch(null)} />
        </div>
      )}

      {/* Direct Quality Inspection Modal */}
      {inspectingBatch && (
        <InspectionModal
          batch={inspectingBatch}
          isOpen={!!inspectingBatch}
          onClose={() => setInspectingBatch(null)}
          onSuccess={(updated, message) => {
            setTransactionSuccess(
              message || `Quality inspection confirmed for lot ${updated.batch_code}. Status: ${updated.inspection_status} (${(updated.quantity_approved || 0).toLocaleString()} kg released to stock).`
            );
            setInspectingBatch(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
