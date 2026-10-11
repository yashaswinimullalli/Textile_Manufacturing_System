'use client';

import React, { useState } from 'react';
import {
  PlusCircle,
  X,
  AlertCircle,
  Barcode,
  Printer,
  CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { YarnBatch, YarnType } from '@/lib/types';
import { BarcodeLabel } from './BarcodeLabel';

interface RegisterNewBatchModalProps {
  isOpen: boolean;
  prefilledBarcode?: string;
  onClose: () => void;
  onSuccess: (batch: YarnBatch) => void;
}

export const RegisterNewBatchModal: React.FC<RegisterNewBatchModalProps> = ({
  isOpen,
  prefilledBarcode,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    barcode: prefilledBarcode || '',
    batch_code: '',
    yarn_type: 'Cotton' as YarnType,
    colour: 'Egyptian White',
    supplier: 'Al-Amal Cotton Mills',
    supplier_lot: '',
    quantity_received: '500',
    unit: 'kg',
    reorder_threshold: '100',
    autoIntake: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdBatch, setCreatedBatch] = useState<YarnBatch | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      const code = prefilledBarcode || `VAS-QR-Y${Math.floor(10 + Math.random() * 90)}`;
      const batchCode = code.replace('VAS-QR-', 'VAS-DEMO-');
      setFormData((prev) => ({
        ...prev,
        barcode: prefilledBarcode || prev.barcode || code,
        batch_code: prev.batch_code || batchCode,
      }));
      setErrorMessage(null);
    }
  }, [isOpen, prefilledBarcode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const qty = parseFloat(formData.quantity_received);
    if (!formData.quantity_received || isNaN(qty) || qty <= 0) {
      setErrorMessage('Received quantity must be a positive number greater than 0.');
      return;
    }

    if (!formData.colour.trim() || !formData.supplier.trim()) {
      setErrorMessage('Colour and supplier are required.');
      return;
    }

    const barcodeVal = formData.barcode.trim() || `VAS-QR-Y${Math.floor(10 + Math.random() * 90)}`;
    const batchCodeVal = formData.batch_code.trim() || barcodeVal.replace('VAS-QR-', 'VAS-DEMO-');

    setSubmitting(true);

    try {
      const res = await api.receiveYarnBatch({
        batch_code: batchCodeVal,
        barcode: barcodeVal,
        yarn_type: formData.yarn_type,
        colour: formData.colour.trim(),
        supplier: formData.supplier.trim(),
        quantity_received: qty,
        unit: formData.unit || 'kg',
        reorder_threshold: parseFloat(formData.reorder_threshold) || 100,
      });

      if (formData.autoIntake && res?.batch?.id) {
        await api.markBatchScanned(res.batch.id);
        res.batch.intake_scanned = true;
      }

      setCreatedBatch(res.batch);
      onSuccess(res.batch);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to register yarn batch');
    } finally {
      setSubmitting(false);
    }
  };

  // If batch was created, show the Barcode Label for instant verification & printing
  if (createdBatch) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
        <BarcodeLabel
          batch={createdBatch}
          onClose={() => {
            setCreatedBatch(null);
            onClose();
          }}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Register New Yarn Batch</h3>
              <p className="text-xs text-slate-500">Auto-Generates Unique Internal Code 128 Barcode</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-900 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Barcode ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. VAS-QR-Y07"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Batch Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. VAS-DEMO-Y07"
                value={formData.batch_code}
                onChange={(e) => setFormData({ ...formData, batch_code: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Yarn Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.yarn_type}
                onChange={(e) => setFormData({ ...formData, yarn_type: e.target.value as YarnType })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="Cotton">Cotton</option>
                <option value="Polyester">Polyester</option>
                <option value="Blend">Blend</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Colour Description <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Bleached White"
                value={formData.colour}
                onChange={(e) => setFormData({ ...formData, colour: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supplier / Mill Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Vardhman Textiles"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Received Quantity (kg) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                placeholder="500"
                value={formData.quantity_received}
                onChange={(e) => setFormData({ ...formData, quantity_received: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <input
              type="checkbox"
              id="autoIntake"
              checked={formData.autoIntake}
              onChange={(e) => setFormData({ ...formData, autoIntake: e.target.checked })}
              className="h-4 w-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
            />
            <label htmlFor="autoIntake" className="text-xs text-slate-700 cursor-pointer">
              <span className="font-semibold text-slate-900">Immediately in-take into active Dashboard</span>
              <span className="block text-[11px] text-slate-500">If unchecked, it goes to "Pending Incoming Batches" for barcode scanning.</span>
            </label>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1">
            <span className="font-semibold text-slate-800 block">Barcode Provisioning:</span>
            <p className="text-[11px] text-slate-500">
              FabricTrace will automatically generate an internal Code 128 barcode, record the initial stock movement, and display a print-ready barcode label.
            </p>
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5"
            >
              <Barcode className="h-4 w-4" />
              <span>{submitting ? 'Generating Barcode...' : 'Register Batch & Print Barcode'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
