'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ClipboardList,
  PlusCircle,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Calendar,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '@/lib/api';
import { OrderStatus } from '@/lib/types';

export default function NewOrderPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    order_no: '',
    customer_reference: '',
    fabric_type: '',
    target_quantity: '',
    required_yarn_quantity: '',
    due_date: '',
    status: 'Planned' as OrderStatus,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.order_no.trim()) {
      errs.order_no = 'Order number is required.';
    } else if (formData.order_no.trim().length < 3) {
      errs.order_no = 'Order number must be at least 3 characters.';
    }

    if (!formData.customer_reference.trim()) {
      errs.customer_reference = 'Customer / Reference is required.';
    }

    if (!formData.fabric_type.trim()) {
      errs.fabric_type = 'Fabric specification is required.';
    }

    const targetQty = parseFloat(formData.target_quantity);
    if (!formData.target_quantity || isNaN(targetQty) || targetQty <= 0) {
      errs.target_quantity = 'Target production quantity must be greater than 0.';
    }

    const yarnQty = parseFloat(formData.required_yarn_quantity);
    if (!formData.required_yarn_quantity || isNaN(yarnQty) || yarnQty < 0) {
      errs.required_yarn_quantity = 'Required yarn quantity cannot be negative.';
    }

    if (!formData.due_date) {
      errs.due_date = 'Production due date is required.';
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
      const created = await api.createOrder({
        order_no: formData.order_no.trim().toUpperCase(),
        customer_reference: formData.customer_reference.trim(),
        fabric_type: formData.fabric_type.trim(),
        target_quantity: parseFloat(formData.target_quantity),
        required_yarn_quantity: parseFloat(formData.required_yarn_quantity) || 0,
        due_date: formData.due_date,
        status: formData.status,
      });

      setSuccessMsg(`Order ${created.order_no} created successfully.`);
      setTimeout(() => {
        router.push('/production/orders');
      }, 1200);
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to create production order.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/production/orders"
          className="p-2 border border-slate-300 rounded-lg hover:bg-white text-slate-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create Production Order</h1>
          <p className="text-xs text-slate-500">
            Define fabric target specifications, deadlines, and raw material demand.
          </p>
        </div>
      </div>

      {/* Excel / CSV Import Tip Banner */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="h-5 w-5 text-teal-600 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-teal-950">Have a client order manifest spreadsheet?</p>
            <p className="text-[11px] text-teal-800">You can upload bulk orders using Excel (.xlsx, .xls) or CSV on the orders page.</p>
          </div>
        </div>
        <Link
          href="/production/orders"
          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 flex-shrink-0 ml-3"
        >
          <span>Upload Excel/CSV</span>
        </Link>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-semibold">{successMsg} Redirecting to order registry...</p>
        </div>
      )}

      {/* Form Error Banner */}
      {errors.form && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
          <p className="text-sm font-medium">{errors.form}</p>
        </div>
      )}

      {/* Create Order Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">Order Information</h2>
          <p className="text-xs text-slate-400">Order numbers are unique across the factory.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Order Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Order Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. PO-2026-104"
              value={formData.order_no}
              onChange={(e) => setFormData({ ...formData, order_no: e.target.value })}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 font-mono ${
                errors.order_no
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-300 focus:ring-teal-500'
              }`}
            />
            {errors.order_no && <p className="text-xs text-rose-600 mt-1">{errors.order_no}</p>}
          </div>

          {/* Customer Reference */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer / Reference <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Zara Denim Summer Collection"
              value={formData.customer_reference}
              onChange={(e) => setFormData({ ...formData, customer_reference: e.target.value })}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                errors.customer_reference
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-300 focus:ring-teal-500'
              }`}
            />
            {errors.customer_reference && (
              <p className="text-xs text-rose-600 mt-1">{errors.customer_reference}</p>
            )}
          </div>

          {/* Fabric Type */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fabric Type / Construction <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 100% Cotton Plain Weave 160 GSM, 60x60 Count"
              value={formData.fabric_type}
              onChange={(e) => setFormData({ ...formData, fabric_type: e.target.value })}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                errors.fabric_type
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-300 focus:ring-teal-500'
              }`}
            />
            {errors.fabric_type && (
              <p className="text-xs text-rose-600 mt-1">{errors.fabric_type}</p>
            )}
          </div>

          {/* Target Production Quantity */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Fabric Output (meters) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              placeholder="5000"
              value={formData.target_quantity}
              onChange={(e) => setFormData({ ...formData, target_quantity: e.target.value })}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 font-mono ${
                errors.target_quantity
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-300 focus:ring-teal-500'
              }`}
            />
            {errors.target_quantity && (
              <p className="text-xs text-rose-600 mt-1">{errors.target_quantity}</p>
            )}
          </div>

          {/* Required Yarn Quantity */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Required Yarn Material (kg) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              placeholder="2200"
              value={formData.required_yarn_quantity}
              onChange={(e) => setFormData({ ...formData, required_yarn_quantity: e.target.value })}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 font-mono ${
                errors.required_yarn_quantity
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-300 focus:ring-teal-500'
              }`}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Manual MVP requirement entry for storekeeper availability checks.
            </p>
            {errors.required_yarn_quantity && (
              <p className="text-xs text-rose-600 mt-1">{errors.required_yarn_quantity}</p>
            )}
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Production Due Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 font-mono ${
                errors.due_date
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-300 focus:ring-teal-500'
              }`}
            />
            {errors.due_date && <p className="text-xs text-rose-600 mt-1">{errors.due_date}</p>}
          </div>

          {/* Initial Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Initial Order Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as OrderStatus })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="Planned">Planned</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <Link
            href="/production/orders"
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
            <span>{submitting ? 'Creating Order...' : 'Confirm Order Creation'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
