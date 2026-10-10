'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  ShieldCheck,
  Calendar,
  User,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  RotateCcw,
  Check,
  Eye,
  FlaskConical,
} from 'lucide-react';
import { api } from '@/lib/api';
import { YarnBatch, QualityInspection } from '@/lib/types';

interface InspectionHistoryModalProps {
  batch: YarnBatch | null;
  isOpen: boolean;
  onClose: () => void;
  onTriggerReinspection: (batch: YarnBatch) => void;
}

export const InspectionHistoryModal: React.FC<InspectionHistoryModalProps> = ({
  batch,
  isOpen,
  onClose,
  onTriggerReinspection,
}) => {
  const [history, setHistory] = useState<QualityInspection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (batch && isOpen) {
      setLoading(true);
      api
        .getBatchInspectionHistory(batch.id)
        .then((data) => setHistory(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [batch, isOpen]);

  if (!isOpen || !batch) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-400">
              <History className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Quality Inspection Audit Trail</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-900/60 text-teal-300 border border-teal-700 font-mono">
                  {batch.batch_code}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Immutable chronological log of inspections, laboratory measurements, and decision changes.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Batch Quick Context */}
          <div className="bg-slate-50 border rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Supplier</span>
              <span className="font-bold text-slate-900">{batch.supplier}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Yarn Type</span>
              <span className="font-bold text-slate-900">{batch.yarn_type}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Received Quantity</span>
              <span className="font-bold text-slate-900">
                {batch.quantity_received.toLocaleString()} {batch.unit}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Current Status</span>
              <span className="font-bold text-teal-700">{batch.inspection_status || 'PENDING_INSPECTION'}</span>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Loading quality audit history...
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed rounded-xl space-y-2">
              <ShieldCheck className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">No inspections recorded yet</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                This batch is currently awaiting initial quality inspection and has zero approved stock available.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item, idx) => (
                <div
                  key={item.id}
                  className="border border-slate-200 rounded-xl p-4.5 bg-white shadow-xs space-y-3"
                >
                  {/* Top Bar */}
                  <div className="flex items-start justify-between border-b pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-slate-900 text-teal-300 font-mono text-xs flex items-center justify-center font-bold">
                        #{item.inspection_number}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {item.stage === 'INITIAL' ? 'Initial Receiving Inspection' : 'Authorized Reinspection'}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              item.decision === 'PASSED'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : item.decision === 'ON_HOLD'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : item.decision === 'PARTIALLY_ACCEPTED'
                                ? 'bg-sky-100 text-sky-800 border border-sky-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {item.decision}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <User className="h-3 w-3" /> {item.inspector_name} •{' '}
                          <Calendar className="h-3 w-3" /> {new Date(item.inspection_date).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="text-right text-xs">
                      <span className="text-slate-400 block text-[11px]">Approved Released</span>
                      <span className="font-bold text-emerald-700 font-mono">
                        {item.quantity_approved.toLocaleString()} {batch.unit}
                      </span>
                    </div>
                  </div>

                  {/* Reinspection Reason if applicable */}
                  {item.reinspection_reason && (
                    <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900">
                      <span className="font-bold">Reinspection Justification:</span> {item.reinspection_reason}
                    </div>
                  )}

                  {/* Visual Checks Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Packaging</span>
                      <span className="font-semibold text-slate-800">{item.packaging_condition}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Contamination</span>
                      <span className="font-semibold text-slate-800">{item.visible_contamination}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Colour Match</span>
                      <span className="font-semibold text-slate-800">{item.colour_consistency}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Appearance</span>
                      <span className="font-semibold text-slate-800">{item.yarn_appearance}</span>
                    </div>
                  </div>

                  {/* Lab Checks */}
                  {item.spec_checks && item.spec_checks.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-600 block uppercase tracking-wider">
                        Laboratory Measurements:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {item.spec_checks.map((sc) => (
                          <div
                            key={sc.id}
                            className="p-2 border rounded-md flex items-center justify-between bg-white text-xs"
                          >
                            <div>
                              <span className="font-semibold text-slate-900 block">{sc.test_name}</span>
                              <span className="text-[11px] text-slate-500 font-mono">
                                Measured: {sc.actual_value || 'N/A'} {sc.unit} (Spec: {sc.expected_spec})
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                sc.result === 'Pass'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : sc.result === 'Fail'
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {sc.result}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Remarks */}
                  {item.decision_reason && (
                    <div className="text-xs text-slate-600 italic border-t pt-2">
                      &quot;{item.decision_reason}&quot;
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600 hover:bg-white"
          >
            Close History
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onTriggerReinspection(batch);
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5 text-teal-400" />
            <span>Reinspect Batch (New Stage)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
