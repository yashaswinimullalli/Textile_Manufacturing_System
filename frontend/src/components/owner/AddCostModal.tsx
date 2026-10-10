'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api-client';
import { CostCategory } from '@/types/factory';
import { X, IndianRupee, PlusCircle, Receipt } from 'lucide-react';

interface AddCostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddCostModal({ isOpen, onClose, onSuccess }: AddCostModalProps) {
  const [orderId, setOrderId] = useState('ORD-101');
  const [category, setCategory] = useState<CostCategory>('rework');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [sourceReference, setSourceReference] = useState('RWK-VOUCHER-01');
  const [isEstimated, setIsEstimated] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await api.addCostRecord({
        order_id: orderId,
        category,
        amount: Number(amount),
        currency,
        source_reference: sourceReference,
        is_estimated: isEstimated,
        notes
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not record expense bill.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Enter Mill Production Expense</h3>
              <p className="text-xs text-slate-500">Log a supplier bill, worker timesheet, or repair voucher</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Buyer Order
              </label>
              <select
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="ORD-101">ORD-101 (Acme Apparel)</option>
                <option value="ORD-102">ORD-102 (Global Denim)</option>
                <option value="ORD-103">ORD-103 (Nordic Uniforms)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Expense Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CostCategory)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="material">Yarn & Raw Cotton</option>
                <option value="labour">Weaver Shift Wages</option>
                <option value="machine/overhead">Loom Power & Electricity</option>
                <option value="rework">Chemical Wash / Repair</option>
                <option value="transport">Truck Freight & Delivery</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Amount (₹ INR)
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="e.g. 5000.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Receipt / PO Number
              </label>
              <input
                type="text"
                placeholder="e.g. PO-8821 or TS-04"
                value={sourceReference}
                onChange={(e) => setSourceReference(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Is this an estimated cost?</span>
              <span className="text-[11px] text-slate-600">Uncheck if you have a real paper bill or receipt in hand</span>
            </div>
            <input
              type="checkbox"
              checked={isEstimated}
              onChange={(e) => setIsEstimated(e.target.checked)}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Description / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Chemical washing and spot cleaning bath for Roll 008"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
            />
          </div>

          {error && <p className="text-xs text-rose-600 font-bold">{error}</p>}

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/25 cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : 'Save Expense Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
