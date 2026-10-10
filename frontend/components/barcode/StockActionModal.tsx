'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Printer,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import { YarnBatch, ProductionOrder } from '@/lib/types';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface StockActionModalProps {
  batch: YarnBatch | null;
  isOpen: boolean;
  onClose: () => void;
  onTransactionSuccess: (updatedBatch: YarnBatch, message: string) => void;
  onOpenLabelPrint?: (batch: YarnBatch) => void;
}

export const StockActionModal: React.FC<StockActionModalProps> = ({
  batch,
  isOpen,
  onClose,
  onTransactionSuccess,
  onOpenLabelPrint,
}) => {
  const [activeAction, setActiveAction] = useState<'ISSUE' | 'RECEIPT'>('ISSUE');
  const [quantity, setQuantity] = useState('');
  const [reference, setReference] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [orders, setOrders] = useState<ProductionOrder[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getOrders().then(setOrders).catch(console.error);
      setQuantity('');
      setReference('');
      setSelectedOrderId('');
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen || !batch) return null;

  const currentAvailable = batch.quantity_available;
  const numQty = parseFloat(quantity) || 0;
  const projectedBalance =
    activeAction === 'ISSUE' ? currentAvailable - numQty : currentAvailable + numQty;

  const qcStatus = batch.inspection_status || 'PENDING_INSPECTION';
  const isQualityBlocked =
    activeAction === 'ISSUE' &&
    (qcStatus === 'PENDING_INSPECTION' || qcStatus === 'ON_HOLD' || qcStatus === 'REJECTED');

  const isInsufficient = activeAction === 'ISSUE' && numQty > currentAvailable;
  const isInvalidQty = !quantity || numQty <= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isQualityBlocked) {
      setErrorMsg(
        `Quality Restriction: Cannot issue yarn lot ${batch.batch_code} because its quality status is ${qcStatus}. Please inspect and approve this batch first.`
      );
      return;
    }

    if (isInvalidQty) {
      setErrorMsg('Please specify a positive quantity greater than 0.');
      return;
    }

    if (isInsufficient) {
      setErrorMsg(
        `Cannot issue ${numQty.toLocaleString()} kg. Exceeds available inventory of ${currentAvailable.toLocaleString()} kg.`
      );
      return;
    }

    setSubmitting(true);

    try {
      const selectedOrder = orders.find((o) => o.id === selectedOrderId);
      const res = await api.recordStockTransaction({
        batch_id: batch.id,
        movement_type: activeAction,
        quantity: numQty,
        reference:
          reference.trim() ||
          (activeAction === 'ISSUE'
            ? `Issued to ${selectedOrder?.order_no || 'Production Line'}`
            : `Floor replenishment for ${batch.batch_code}`),
        order_id: activeAction === 'ISSUE' && selectedOrderId ? selectedOrderId : undefined,
      });

      const successNotice =
        activeAction === 'ISSUE'
          ? `Successfully issued ${numQty.toLocaleString()} kg from batch ${batch.batch_code}. Remaining stock: ${res.batch.quantity_available.toLocaleString()} kg.`
          : `Successfully received +${numQty.toLocaleString()} kg for batch ${batch.batch_code}. New total stock: ${res.batch.quantity_available.toLocaleString()} kg.`;

      onTransactionSuccess(res.batch, successNotice);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Database transaction failed. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-800">
                {batch.barcode}
              </span>
              <StatusBadge
                status={batch.quantity_available <= batch.reorder_threshold ? 'Low Stock' : 'In Stock'}
                size="sm"
              />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">{batch.batch_code}</h3>
            <p className="text-xs text-slate-500">
              {batch.yarn_type} ({batch.colour}) • Supplier: {batch.supplier}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Balance Display */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase text-slate-500 block">
              Current Available Stock:
            </span>
            <span className="text-xl font-bold font-mono text-slate-900">
              {currentAvailable.toLocaleString()} {batch.unit}
            </span>
          </div>

          {onOpenLabelPrint && (
            <button
              type="button"
              onClick={() => onOpenLabelPrint(batch)}
              className="text-xs text-slate-700 hover:text-teal-700 flex items-center gap-1 font-semibold border border-slate-300 bg-white px-2.5 py-1.5 rounded-md shadow-sm transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Label</span>
            </button>
          )}
        </div>

        {/* Action Toggle (Issue vs Receive) */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveAction('ISSUE')}
            className={`py-2 rounded-md flex items-center justify-center gap-1.5 transition-colors ${
              activeAction === 'ISSUE'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>Issue Stock to Production</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveAction('RECEIPT')}
            className={`py-2 rounded-md flex items-center justify-center gap-1.5 transition-colors ${
              activeAction === 'RECEIPT'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <ArrowDownLeft className="h-4 w-4" />
            <span>Receive Additional Stock</span>
          </button>
        </div>

        {/* Quality Restriction Alert if lot is unapproved or held */}
        {isQualityBlocked && (
          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs space-y-1.5 animate-in fade-in">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldAlert className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <span>Quality Inspection Restriction ({qcStatus})</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              This lot is currently marked <strong>{qcStatus}</strong>. Incoming textile yarn must pass physical inspection and laboratory verification before it can be issued to production looms.
            </p>
            <div className="pt-1">
              <Link
                href="/quality/inspections"
                onClick={onClose}
                className="text-[11px] font-bold text-teal-800 hover:underline flex items-center gap-1"
              >
                Go to Quality Inspection Workstation →
              </Link>
            </div>
          </div>
        )}

        {/* Database / Validation Error Banner */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-900 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Transaction Rejected</p>
              <p className="mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Transaction Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {activeAction === 'ISSUE' ? 'Quantity to Issue (kg)' : 'Quantity Received (kg)'}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 250"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-lg font-mono focus:outline-none focus:ring-2 ${
                isInsufficient
                  ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                  : 'border-slate-300 focus:ring-teal-500'
              }`}
              required
            />
          </div>

          {/* If Issue: Target Production Order */}
          {activeAction === 'ISSUE' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Production Order (Optional Reference)
              </label>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="">-- Floor Stock / Unassigned --</option>
                {orders
                  .filter((o) => o.status !== 'Completed')
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.order_no} — {o.customer_reference} ({o.fabric_type})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Reference / Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Audit Reference / Notes
            </label>
            <input
              type="text"
              placeholder={
                activeAction === 'ISSUE'
                  ? 'e.g. Issued to Weaving Line 2 for Twill run'
                  : 'e.g. Additional replenishment delivery note #401'
              }
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Projected Balance Preview */}
          {numQty > 0 && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                isInsufficient
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <span>Projected Balance After Transaction:</span>
              <span className="font-mono font-bold text-sm">
                {projectedBalance.toLocaleString()} {batch.unit}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || isInvalidQty || isInsufficient || isQualityBlocked}
              className={`px-5 py-2.5 rounded-lg text-xs font-semibold text-white shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 ${
                activeAction === 'ISSUE'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-teal-600 hover:bg-teal-700'
              }`}
            >
              {activeAction === 'ISSUE' ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownLeft className="h-4 w-4" />
              )}
              <span>
                {submitting
                  ? 'Executing Transaction...'
                  : activeAction === 'ISSUE'
                  ? 'Confirm Stock Issue'
                  : 'Confirm Stock Receipt'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
