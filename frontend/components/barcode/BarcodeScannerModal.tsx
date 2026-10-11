'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Scan,
  Search,
  X,
  AlertCircle,
  PlusCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { YarnBatch } from '@/lib/types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchFound: (batch: YarnBatch) => void;
  onRegisterNew: (scannedCode?: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onBatchFound,
  onRegisterNew,
}) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setBarcodeInput('');
      setErrorMessage(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) {
      setErrorMessage('Please enter a barcode value.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const batch = await api.getBatchByBarcode(code);
      onBatchFound(batch);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || `No batch found for barcode "${code}".`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
              <Scan className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Enter Yarn Batch Barcode</h3>
              <p className="text-xs text-slate-500">Manual Barcode Lookup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Manual Barcode Form */}
        <form onSubmit={handleLookup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Barcode / Lot Code
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="Enter barcode manually (e.g. VAS-QR-Y050)..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="w-full px-4 py-3 text-base font-mono border-2 border-teal-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-100 bg-teal-50/20"
                autoFocus
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Press Enter or click Lookup Batch to search</p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !barcodeInput.trim()}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Search className="h-3.5 w-3.5" />
              <span>{loading ? 'Searching...' : 'Lookup Batch'}</span>
            </button>
          </div>
        </form>

        {/* Unknown Barcode Error Banner with "Register New Batch" option */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-lg text-rose-900 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Unrecognized Barcode</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <div className="pt-1 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRegisterNew(barcodeInput);
                }}
                className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Register as New Batch</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
