'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  PlusCircle,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  X,
  RefreshCw,
  Search,
  AlertOctagon,
  Cpu,
  ShieldAlert,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ProductionOrder, MaterialAvailability, Machine } from '@/lib/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import UploadOrdersModal from '@/components/orders/UploadOrdersModal';

export default function ProductionOrdersPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [onlyFlagged, setOnlyFlagged] = useState(false);

  // Material Availability Modal State
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [materialCheck, setMaterialCheck] = useState<MaterialAvailability | null>(null);
  const [checkingMaterial, setCheckingMaterial] = useState(false);

  // Review Flag Modal State (Point 4: backend calculates downtime and flags affected orders for review)
  const [reviewingOrder, setReviewingOrder] = useState<ProductionOrder | null>(null);
  const [clearingFlag, setClearingFlag] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Upload Orders (Excel / CSV) Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ords, machs] = await Promise.all([api.getOrders(), api.getMachines()]);
      setOrders(ords);
      setMachines(machs);
    } catch (err) {
      console.error('Failed to load production orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCheckMaterial = async (order: ProductionOrder) => {
    setSelectedOrder(order);
    setCheckingMaterial(true);
    try {
      const res = await api.checkMaterialAvailability(order.id);
      setMaterialCheck(res);
    } catch (err) {
      console.error('Failed to check material availability', err);
    } finally {
      setCheckingMaterial(false);
    }
  };

  const handleClearFlagSubmit = async (orderId: string) => {
    setClearingFlag(true);
    try {
      await api.clearOrderFlag(orderId);
      setToastMessage('Downtime review acknowledged and flag cleared.');
      setReviewingOrder(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to clear flag');
    } finally {
      setClearingFlag(false);
    }
  };

  const isApproachingDeadline = (dueDateStr: string, status: string) => {
    if (status === 'Completed') return false;
    const due = new Date(dueDateStr).getTime();
    const now = Date.now();
    const diffDays = (due - now) / (1000 * 60 * 60 * 24);
    return diffDays <= 5;
  };

  // Associate machine assignments dynamically if not cached on order
  const getAssignedMachinesText = (order: ProductionOrder) => {
    if (order.assigned_machine_code) return order.assigned_machine_code;
    const assigned = machines.filter((m) => m.active_order_id === order.id || m.active_order_no === order.order_no);
    if (assigned.length > 0) {
      return assigned.map((m) => m.machine_code.split(' ')[0]).join(', ');
    }
    return 'Unassigned';
  };

  const isDemoOrder = (o: ProductionOrder) =>
    o.order_no.toUpperCase().startsWith('VAS-DEMO-PO0') ||
    o.customer_reference.toLowerCase().startsWith('demo customer');

  const realOrders = orders.filter((o) => !isDemoOrder(o));
  const demoOrders = orders.filter(isDemoOrder);
  const [hideDemoOrders, setHideDemoOrders] = useState(true);

  const handlePurgeDemoOrders = async () => {
    if (!confirm(`Are you sure you want to remove ${demoOrders.length} default demo orders from the system?`)) return;
    try {
      const res = await api.deleteDemoOrders();
      setToastMessage(`Cleaned up ${res.count} default demo orders.`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to remove demo orders.');
    }
  };

  const handleClearAllOrders = async () => {
    if (!confirm('Are you sure you want to clear all production orders? The dashboard will stay clean until a new production CSV file is provided.')) return;
    try {
      const res = await api.deleteAllOrders();
      setToastMessage(`Cleaned up ${res.count} production orders. Database is clean.`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to remove orders.');
    }
  };

  const flaggedOrders = orders.filter((o) => o.is_flagged_for_review);

  const filteredOrders = orders.filter((o) => {
    // Hide demo orders if hideDemoOrders is true and (real orders exist OR user chose to hide them)
    if (hideDemoOrders && isDemoOrder(o)) return false;
    if (onlyFlagged && !o.is_flagged_for_review) return false;
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        o.order_no.toLowerCase().includes(q) ||
        o.customer_reference.toLowerCase().includes(q) ||
        o.fabric_type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Section Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Production Orders</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {realOrders.length > 0
                ? `${realOrders.length} client order(s) active in plant registry`
                : `${orders.length} total orders registered`}
            </p>
          </div>

          {/* Section Navigation Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-900 shadow-xs flex items-center gap-1.5">
              <ClipboardList className="h-3.5 w-3.5 text-teal-600" />
              <span>Production Orders</span>
            </span>
            <Link
              href="/production/machines"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors flex items-center gap-1.5"
            >
              <Cpu className="h-3.5 w-3.5 text-slate-500" />
              <span>Machine Floor</span>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {orders.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllOrders}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 border border-rose-200"
              title="Remove all orders until a new production CSV file is provided"
            >
              <span>Clear Orders ({orders.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Import Orders (CSV / Excel)</span>
          </button>

          <Link
            href="/production/orders/new"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 border border-slate-200"
            title="Create order manually"
          >
            <PlusCircle className="h-4 w-4 text-slate-500" />
            <span>Manual Entry</span>
          </Link>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by order #, customer, or fabric type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Demo Data Management */}
          {demoOrders.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setHideDemoOrders(!hideDemoOrders)}
                className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                  hideDemoOrders
                    ? 'bg-white text-slate-700 shadow-xs'
                    : 'bg-amber-100 text-amber-900'
                }`}
                title="Toggle default demo orders"
              >
                {hideDemoOrders ? 'Demo Hidden (50)' : 'Demo Shown (50)'}
              </button>
              <button
                type="button"
                onClick={handlePurgeDemoOrders}
                className="px-2 py-1 text-rose-700 hover:bg-rose-100 rounded font-semibold transition-colors"
                title="Delete default demo orders from database"
              >
                Clear Demo
              </button>
            </div>
          )}

          {/* Flagged Filter Toggle */}
          <button
            type="button"
            onClick={() => setOnlyFlagged(!onlyFlagged)}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
              onlyFlagged
                ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <AlertOctagon className={`h-3.5 w-3.5 ${onlyFlagged ? 'text-amber-600' : 'text-slate-400'}`} />
            <span>Flagged ({flaggedOrders.length})</span>
          </button>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="Planned">Planned</option>
            <option value="In Progress">In Progress</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
          </select>

          <button
            onClick={loadData}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600"
            title="Refresh orders"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer Reference</th>
                <th className="py-3 px-4">Fabric Type</th>
                <th className="py-3 px-4">Assigned Machine(s)</th>
                <th className="py-3 px-4 text-center">Progress (Output / Target)</th>
                <th className="py-3 px-4 text-right">Remaining</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-center">Status & Review Flags</th>
                <th className="py-3 px-4 text-center">Material Check</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    Loading production orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-500">
                    <ClipboardList className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                    <p className="font-bold text-slate-800 text-base">
                      No Production Orders Loaded
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      The database has been cleaned. Please import your client placed production order spreadsheet (.xlsx or .csv) to reflect data dynamically across Production, Machines, Quality Inspector, and Dispatch.
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowUploadModal(true)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-xs"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        <span>⚡ Import Orders Manifest (CSV / Excel)</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const percent = Math.min(100, Math.round((ord.produced_quantity / ord.target_quantity) * 100));
                  const remaining = Math.max(0, ord.target_quantity - ord.produced_quantity);
                  const isLateRisk = isApproachingDeadline(ord.due_date, ord.status);
                  const assignedMachines = getAssignedMachinesText(ord);

                  return (
                    <tr
                      key={ord.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        ord.is_flagged_for_review ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* Order # */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {ord.order_no}
                      </td>

                      {/* Customer Reference */}
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {ord.customer_reference}
                      </td>

                      {/* Fabric Type */}
                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                        {ord.fabric_type}
                      </td>

                      {/* Assigned Machine(s) (Point 2) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <Cpu className="h-3.5 w-3.5 text-slate-400" />
                          <span className={`text-xs font-mono ${assignedMachines === 'Unassigned' ? 'text-slate-400 italic' : 'font-semibold text-slate-800'}`}>
                            {assignedMachines}
                          </span>
                        </div>
                      </td>

                      {/* Progress */}
                      <td className="py-3.5 px-4 min-w-[170px]">
                        <div className="flex items-center justify-between text-xs font-mono mb-1">
                          <span className="font-semibold text-slate-800">{ord.produced_quantity.toLocaleString()} m</span>
                          <span className="text-slate-500">{percent}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              ord.status === 'Completed'
                                ? 'bg-emerald-500'
                                : percent > 50
                                ? 'bg-teal-500'
                                : 'bg-sky-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 text-right font-mono">
                          Target: {ord.target_quantity.toLocaleString()} m
                        </div>
                      </td>

                      {/* Remaining */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700">
                        {remaining.toLocaleString()} m
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Clock className={`h-3.5 w-3.5 ${isLateRisk ? 'text-amber-600' : 'text-slate-400'}`} />
                          <span className={isLateRisk ? 'text-amber-700 font-semibold' : 'text-slate-600'}>
                            {ord.due_date}
                          </span>
                        </div>
                        {isLateRisk && (
                          <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                            Approaching Due Date
                          </span>
                        )}
                      </td>

                      {/* Status & Review Flags (Point 4) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <StatusBadge status={ord.status} size="sm" />
                          {ord.is_flagged_for_review && (
                            <button
                              type="button"
                              onClick={() => setReviewingOrder(ord)}
                              className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-colors shadow-xs"
                              title="Click to review downtime impact and resolve flag"
                            >
                              <AlertOctagon className="h-3 w-3 text-amber-600" />
                              <span>Review Flag</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Material Check */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleCheckMaterial(ord)}
                          className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 mx-auto"
                        >
                          <Boxes className="h-3.5 w-3.5 text-teal-600" />
                          <span>Check Yarn</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Affected Order Flag Modal (Point 4) */}
      {reviewingOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertOctagon className="h-5 w-5 text-amber-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Downtime Review Required</h3>
                  <p className="text-xs text-slate-500 font-mono">Order: {reviewingOrder.order_no}</p>
                </div>
              </div>
              <button onClick={() => setReviewingOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-2">
              <div className="flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-900">Backend Stoppage Audit Triggered</p>
                  <p className="text-amber-800 mt-1 leading-relaxed">
                    {reviewingOrder.flag_reason || 'An assigned loom recorded downtime / stoppage event during active production run.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs border rounded-lg p-3 bg-slate-50 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer Reference:</span>
                <span className="font-semibold">{reviewingOrder.customer_reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fabric Specification:</span>
                <span className="font-semibold">{reviewingOrder.fabric_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Output:</span>
                <span className="font-mono">{reviewingOrder.target_quantity.toLocaleString()} meters</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Output:</span>
                <span className="font-mono">{reviewingOrder.produced_quantity.toLocaleString()} meters</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Production Deadline:</span>
                <span className="font-mono font-bold text-amber-700">{reviewingOrder.due_date}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Review line capacity, reassign idle looms if needed, and clear this flag once production planning adjustments are confirmed.
            </p>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReviewingOrder(null)}
                className="px-3.5 py-2 text-xs text-slate-600 hover:text-slate-900 font-medium"
              >
                Close
              </button>
              <button
                type="button"
                disabled={clearingFlag}
                onClick={() => handleClearFlagSubmit(reviewingOrder.id)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{clearingFlag ? 'Clearing...' : 'Acknowledge & Clear Review Flag'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Material Availability Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Boxes className="h-5 w-5 text-teal-600" />
                  <span>Yarn Availability Check</span>
                </h3>
                <p className="text-xs text-slate-500 font-mono">Order: {selectedOrder.order_no}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setMaterialCheck(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {checkingMaterial ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                Calculating current raw material balances across batches...
              </div>
            ) : materialCheck ? (
              <div className="space-y-4">
                {/* Result Status Banner */}
                <div
                  className={`p-4 rounded-lg border flex items-start gap-3 ${
                    materialCheck.is_sufficient
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  {materialCheck.is_sufficient ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold text-sm">
                      {materialCheck.is_sufficient
                        ? 'Material Ready — 100% Sufficient'
                        : 'Yarn Material Shortage Detected!'}
                    </p>
                    <p className="text-xs mt-0.5">
                      {materialCheck.is_sufficient
                        ? 'Warehouse inventory has sufficient yarn to fulfill this production order.'
                        : `A shortage of ${materialCheck.shortage_quantity.toLocaleString()} kg exists before weaving can begin.`}
                    </p>
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <p className="text-[11px] text-slate-500 uppercase font-semibold">Required</p>
                    <p className="text-base font-mono font-bold text-slate-900 mt-1">
                      {materialCheck.required_quantity.toLocaleString()} kg
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <p className="text-[11px] text-slate-500 uppercase font-semibold">Available</p>
                    <p className="text-base font-mono font-bold text-teal-700 mt-1">
                      {materialCheck.available_quantity.toLocaleString()} kg
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <p className="text-[11px] text-slate-500 uppercase font-semibold">Shortage</p>
                    <p className={`text-base font-mono font-bold mt-1 ${materialCheck.shortage_quantity > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                      {materialCheck.shortage_quantity.toLocaleString()} kg
                    </p>
                  </div>
                </div>

                {/* Recommended Batches */}
                {materialCheck.recommended_batches && materialCheck.recommended_batches.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      Matching Batches in Warehouse:
                    </p>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {materialCheck.recommended_batches.map((b) => (
                        <div
                          key={b.batch_code}
                          className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200 text-xs"
                        >
                          <span className="font-mono font-bold text-slate-800">{b.batch_code}</span>
                          <span className="text-slate-500">{b.yarn_type} ({b.colour})</span>
                          <span className="font-mono font-semibold text-teal-700">
                            {b.quantity_available.toLocaleString()} kg avail
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedOrder(null);
                  setMaterialCheck(null);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Close Check
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Orders (Excel / CSV) Modal */}
      <UploadOrdersModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        existingOrders={orders}
        onImportComplete={(count) => {
          setToastMessage(`Successfully imported ${count} order(s) from spreadsheet manifest.`);
          loadData();
        }}
      />
    </div>
  );
}
