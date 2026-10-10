'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Boxes,
  PlusCircle,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import { YarnType } from '@/lib/types';

export default function ReceiveYarnPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    batch_code: '',
    yarn_type: 'Cotton' as YarnType,
    yarn_count_spec: '30s Ne',
    po_reference: '',
    certificate_reference: '',
    colour: '',
    supplier: '',
    quantity_received: '',
    unit: 'kg',
    reorder_threshold: '250',
    received_at: new Date().toISOString().slice(0, 16), // current datetime local
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ batch_code: string; qty: number; batchId?: string } | null>(null);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.batch_code.trim()) {
      errs.batch_code = 'Batch / Lot ID is required.';
    } else if (formData.batch_code.trim().length < 3) {
      errs.batch_code = 'Batch ID must be at least 3 characters.';
    }

    if (!formData.colour.trim()) {
      errs.colour = 'Colour specification is required.';
    }

    if (!formData.supplier.trim()) {
      errs.supplier = 'Supplier name is required.';
    }

    const qty = parseFloat(formData.quantity_received);
    if (!formData.quantity_received || isNaN(qty) || qty <= 0) {
      errs.quantity_received = 'Quantity must be a positive number greater than 0.';
    }

    const threshold = parseFloat(formData.reorder_threshold);
    if (!formData.reorder_threshold || isNaN(threshold) || threshold < 0) {
      errs.reorder_threshold = 'Reorder threshold must be 0 or greater.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});

    try {
      const res = await api.receiveYarnBatch({
        batch_code: formData.batch_code.trim().toUpperCase(),
        yarn_type: formData.yarn_type,
        yarn_count_spec: formData.yarn_count_spec.trim() || undefined,
        po_reference: formData.po_reference.trim() || undefined,
        certificate_reference: formData.certificate_reference.trim() || undefined,
        colour: formData.colour.trim(),
        supplier: formData.supplier.trim(),
        quantity_received: parseFloat(formData.quantity_received),
        unit: formData.unit.trim() || 'kg',
        reorder_threshold: parseFloat(formData.reorder_threshold) || 100,
        received_at: new Date(formData.received_at).toISOString(),
      });

      setSuccessInfo({
        batch_code: res.batch.batch_code,
        qty: res.batch.quantity_received,
        batchId: res.batch.id,
      });

      // Reset form
      setFormData({
        batch_code: '',
        yarn_type: 'Cotton',
        yarn_count_spec: '30s Ne',
        po_reference: '',
        certificate_reference: '',
        colour: '',
        supplier: '',
        quantity_received: '',
        unit: 'kg',
        reorder_threshold: '250',
        received_at: new Date().toISOString().slice(0, 16),
      });
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to save yarn batch. Please verify inputs.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Title & Back Nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/storekeeper/inventory"
            className="p-2 border border-slate-300 rounded-lg hover:bg-white text-slate-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Receive Raw Yarn Batch</h1>
            <p className="text-xs text-slate-500">
              Formally log incoming yarn lots into warehouse inventory with audit history.
            </p>
          </div>
        </div>

        <Link
          href="/storekeeper/stock-movements"
          className="text-xs text-teal-700 font-semibold hover:underline"
        >
          View Movement Ledger →
        </Link>
      </div>

      {/* Success Notification Banner */}
      {successInfo && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Batch Successfully Received!</p>
              <p className="text-xs mt-0.5 text-emerald-800">
                Batch <span className="font-mono font-semibold">{successInfo.batch_code}</span> ({successInfo.qty.toLocaleString()} kg) is registered in inventory.
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  QC STATUS: PENDING INSPECTION
                </span>
                <span className="text-[11px] text-emerald-700">Available to issue: <strong>0 kg</strong> (gated until QC approval)</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/quality/inspections"
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-semibold whitespace-nowrap shadow-sm flex items-center gap-1"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Inspect Batch Now</span>
            </Link>
            <Link
              href="/storekeeper/inventory"
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-semibold whitespace-nowrap shadow-sm"
            >
              View Inventory
            </Link>
          </div>
        </div>
      )}

      {/* Backend / Global Error Banner */}
      {errors.form && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
          <p className="text-sm font-medium">{errors.form}</p>
        </div>
      )}

      {/* Receiving Form Card */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">Yarn Specifications</h2>
          <p className="text-xs text-slate-400">All fields are validated against inventory constraints.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Batch Code */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Batch / Lot ID <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. YB-COT-2026-092"
              value={formData.batch_code}
              onChange={(e) => setFormData({ ...formData, batch_code: e.target.value })}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 font-mono ${
                errors.batch_code
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-300 focus:ring-teal-500'
              }`}
            />
            {errors.batch_code && (
              <p className="text-xs text-rose-600 mt-1">{errors.batch_code}</p>
            )}
          </div>

          {/* Yarn Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Yarn Fiber Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.yarn_type}
              onChange={(e) => setFormData({ ...formData, yarn_type: e.target.value as YarnType })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="Cotton">Cotton (Natural Staple)</option>
              <option value="Polyester">Polyester (Synthetic Filament)</option>
              <option value="Blend">Blend (PC / Cotton-Rich)</option>
            </select>
          </div>

          {/* Colour */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Colour / Shade Description <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Bleached White / Navy #19"
              value={formData.colour}
              onChange={(e) => setFormData({ ...formData, colour: e.target.value })}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                errors.colour
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-300 focus:ring-teal-500'
              }`}
            />
            {errors.colour && (
              <p className="text-xs text-rose-600 mt-1">{errors.colour}</p>
            )}
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Supplier / Mill Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Vardhman Textiles Ltd"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                errors.supplier
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-300 focus:ring-teal-500'
              }`}
            />
            {errors.supplier && (
              <p className="text-xs text-rose-600 mt-1">{errors.supplier}</p>
            )}
          </div>

          {/* Quantity Received */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quantity Received <span className="text-rose-500">*</span>
            </label>
            <div className="flex rounded-lg shadow-sm">
              <input
                type="number"
                step="any"
                placeholder="2500"
                value={formData.quantity_received}
                onChange={(e) => setFormData({ ...formData, quantity_received: e.target.value })}
                className={`flex-1 px-3 py-2 text-sm border rounded-l-lg focus:outline-none focus:ring-2 font-mono ${
                  errors.quantity_received
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:ring-teal-500'
                }`}
              />
              <span className="inline-flex items-center px-3 rounded-r-lg border border-l-0 border-slate-300 bg-slate-50 text-slate-600 text-xs font-semibold">
                kg
              </span>
            </div>
            {errors.quantity_received && (
              <p className="text-xs text-rose-600 mt-1">{errors.quantity_received}</p>
            )}
          </div>

          {/* Reorder Threshold */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Low-Stock Reorder Threshold (kg) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              placeholder="300"
              value={formData.reorder_threshold}
              onChange={(e) => setFormData({ ...formData, reorder_threshold: e.target.value })}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 font-mono ${
                errors.reorder_threshold
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-300 focus:ring-teal-500'
              }`}
            />
            {errors.reorder_threshold && (
              <p className="text-xs text-rose-600 mt-1">{errors.reorder_threshold}</p>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              Triggers warning when available quantity falls below this amount.
            </p>
          </div>

          {/* Received At */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Received Date & Time
            </label>
            <input
              type="datetime-local"
              value={formData.received_at}
              onChange={(e) => setFormData({ ...formData, received_at: e.target.value })}
              className="w-full md:w-1/2 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
          </div>
        </div>

        {/* Quality & Commercial Specifications Section */}
        <div className="border-t border-slate-100 pt-4 space-y-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              <span>Quality Inspection Baseline & Commercial References</span>
            </h2>
            <p className="text-xs text-slate-400">
              Recorded for the incoming Quality Inspector to verify against physical and laboratory tests.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ordered Yarn Count Spec
              </label>
              <input
                type="text"
                placeholder="e.g. 30s Ne (or 150D/48F)"
                value={formData.yarn_count_spec}
                onChange={(e) => setFormData({ ...formData, yarn_count_spec: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">Expected count for QC test bench</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Purchase Order (PO) Ref
              </label>
              <input
                type="text"
                placeholder="e.g. PO-2026-8812"
                value={formData.po_reference}
                onChange={(e) => setFormData({ ...formData, po_reference: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">Commercial procurement reference</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supplier CoA / Mill Cert #
              </label>
              <input
                type="text"
                placeholder="e.g. COA-VARD-9901"
                value={formData.certificate_reference}
                onChange={(e) => setFormData({ ...formData, certificate_reference: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">Certificate of Analysis / Test Report</p>
            </div>
          </div>
        </div>

        {/* Quality Gating Protocol & Audit Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-start gap-3 text-xs text-amber-900">
          <ShieldCheck className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p>
            <strong>Incoming QC Gating Rule:</strong> Newly received yarn is quarantined with status <code>PENDING_INSPECTION</code>. Available-to-issue quantity is set to <strong>0 kg</strong>. Uninspected, on-hold, or rejected yarn cannot be issued to production machines until formally inspected and passed by Quality Control.
          </p>
        </div>

        {/* Submit Actions */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <Link
            href="/storekeeper/inventory"
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{submitting ? 'Recording Batch...' : 'Confirm Yarn Receipt'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
