'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Roll, DecisionType, DefectType } from '@/types/factory';
import { api } from '@/lib/api-client';
import { CONTROLLED_DEFECT_TYPES, validateInspectionForm } from '@/lib/validations';
import DecisionSelector from './DecisionSelector';
import ConfirmDialog from '../shared/ConfirmDialog';
import { 
  CheckCircle2, 
  AlertTriangle, 
  FileCheck, 
  ArrowLeft,
  Calendar,
  User,
  Scissors,
  Check,
  ShieldCheck,
  HelpCircle,
  AlertOctagon
} from 'lucide-react';

interface InspectionFormProps {
  roll: Roll;
  priorInspectionId?: string | null;
  onSuccess?: () => void;
  successRedirectPath?: string;
  backPath?: string;
}

export default function InspectionForm({ roll, priorInspectionId, onSuccess, successRedirectPath, backPath }: InspectionFormProps) {
  const router = useRouter();

  const [decision, setDecision] = useState<DecisionType>('PASS');
  const [defectType, setDefectType] = useState<DefectType>('none');
  const [affectedQuantity, setAffectedQuantity] = useState<number | string>(0);
  const [severity, setSeverity] = useState<'none' | 'low' | 'medium' | 'high' | 'critical'>('none');
  const [location, setLocation] = useState('Full roll');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [receiptData, setReceiptData] = useState<any | null>(null);

  const handleDecisionChange = (newDecision: DecisionType) => {
    setDecision(newDecision);
    if (newDecision === 'PASS') {
      setDefectType('none');
      setAffectedQuantity(0);
      setSeverity('none');
    } else {
      if (defectType === 'none') {
        setDefectType('stain/oil');
      }
      if (Number(affectedQuantity) <= 0) {
        setAffectedQuantity(10);
      }
      if (severity === 'none') {
        setSeverity('medium');
      }
    }
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateInspectionForm({
      decision,
      defect_type: defectType,
      affected_quantity: affectedQuantity,
      severity,
      location,
      notes
    }, roll.produced_quantity);

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    setFormErrors({});
    setShowConfirmModal(true);
  };

  const handleExecuteSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        decision,
        defect_type: defectType,
        affected_quantity: Number(affectedQuantity),
        severity,
        location,
        notes,
        photo_url: photoUrl,
        prior_inspection_id: priorInspectionId
      };

      const res = await api.createInspection(roll.roll_code, payload);
      setShowConfirmModal(false);
      setReceiptData(res.receipt);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(`Could not save inspection: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const affectedNum = Number(affectedQuantity) || 0;
  const cleanMeters = Math.max(0, roll.produced_quantity - affectedNum);
  const affectedPct = Math.min(100, (affectedNum / roll.produced_quantity) * 100);

  // Success Receipt State
  if (receiptData) {
    const isPass = receiptData.decision === 'PASS';
    const isRework = receiptData.decision === 'REWORK';

    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-2xl max-w-2xl mx-auto text-center animate-in zoom-in-95 duration-200">
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 ${
          isPass ? 'bg-emerald-100 text-emerald-600' : isRework ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
        }`}>
          {isPass ? <CheckCircle2 className="w-10 h-10" /> : isRework ? <AlertTriangle className="w-10 h-10" /> : <AlertOctagon className="w-10 h-10" />}
        </div>

        <span className={`text-xs font-medium uppercase tracking-widest px-3 py-1 rounded-full ${
          isPass ? 'bg-emerald-50 text-emerald-700' : isRework ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
        }`}>
          Quality Check Saved Successfully
        </span>

        <h2 className="text-3xl font-serif tracking-tight text-slate-900 mt-2">
          {receiptData.roll_code}: {isPass ? 'APPROVED (PASS)' : isRework ? 'NEEDS REPAIR (REWORK)' : 'SCRAPPED (REJECT)'}
        </h2>
        
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Official Inspection Slip ID: <code className="font-mono font-medium text-slate-800">{receiptData.inspection_id}</code>
        </p>

        {/* Clear Non-Technical Explanation Box */}
        <div className={`mt-6 p-6 rounded-2xl text-left border ${
          isPass ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-amber-50/70 border-amber-200 text-amber-950'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-current/10">
            <span className="text-xs font-medium uppercase tracking-wider">Can this roll leave the factory?</span>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
              isPass ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}>
              {isPass ? 'YES — READY TO SHIP' : 'NO — SHIPPING BLOCKED'}
            </span>
          </div>

          <div className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600 font-medium">Inspector Name:</span>
              <span className="font-medium text-slate-900">{receiptData.inspector}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-medium">Time Recorded:</span>
              <span className="font-medium text-slate-900">{new Date(receiptData.timestamp).toLocaleString()}</span>
            </div>
            <div className="pt-2">
              <span className="font-medium block mb-1">What happens now?</span>
              <p className="bg-white p-3 rounded-xl border border-slate-200 font-medium text-slate-800">
                {receiptData.next_action}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => router.push(successRedirectPath || `/rolls/${roll.roll_code}`)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-lg shadow-blue-600/25 transition"
          >
            View Roll Status & Timeline
          </button>
          <button
            onClick={() => router.push('/quality')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition"
          >
            Check Another Roll
          </button>
        </div>
      </div>
    );
  }

  // Active Form State
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl max-w-3xl mx-auto space-y-8">
      {/* Header with Roll Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
        <div>
          <button
            onClick={() => router.push(backPath || '/')}
            className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Roll Details</span>
          </button>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-serif tracking-tight text-slate-900 tracking-tight">
              Quality Inspection Form
            </h1>
            <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 font-mono font-medium text-sm border border-blue-200">
              {roll.roll_code}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Fabric: <strong className="text-slate-800">{roll.fabric_type}</strong> • Total Roll Length: <strong className="text-slate-800">{roll.produced_quantity} {roll.unit}</strong>
          </p>
        </div>

        {priorInspectionId && (
          <div className="px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs shadow-sm">
            <span className="font-medium block flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Reinspection Check
            </span>
            <span className="text-[11px] text-amber-800">Checking this roll again after repair/wash</span>
          </div>
        )}
      </div>

      <form onSubmit={handlePreSubmit} className="space-y-8">
        {/* Step 1: Decision Selector */}
        <DecisionSelector
          value={decision}
          onChange={handleDecisionChange}
          disabled={isSubmitting}
        />
        {formErrors.decision && (
          <p className="text-xs text-rose-600 font-medium">{formErrors.decision}</p>
        )}

        {/* Step 2: Flaw Details (Only shown if defects found) */}
        {decision !== 'PASS' ? (
          <div className="p-6 rounded-3xl bg-amber-50/50 border-2 border-amber-200 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-900">
                  Step 2: Tell us about the flaw
                </h3>
                <p className="text-xs text-slate-600">
                  What is wrong with the fabric and how many meters are affected?
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                Flaw Details Required
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Flaw Type */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-700 mb-2">
                  What kind of flaw is it? <span className="text-rose-500">*</span>
                </label>
                <select
                  value={defectType}
                  onChange={(e) => setDefectType(e.target.value as DefectType)}
                  className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                >
                  {CONTROLLED_DEFECT_TYPES.filter(d => d.value !== 'none').map(d => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
                {formErrors.defect_type && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium">{formErrors.defect_type}</p>
                )}
              </div>

              {/* Damaged Meters */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-700">
                    How many meters are damaged? <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-medium text-slate-500">
                    Max: {roll.produced_quantity} {roll.unit}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={roll.produced_quantity}
                    step="0.5"
                    value={affectedQuantity}
                    onChange={(e) => setAffectedQuantity(e.target.value)}
                    className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                  <span className="absolute right-4 top-3 text-xs font-medium text-slate-400">
                    meters
                  </span>
                </div>
                {formErrors.affected_quantity && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium">{formErrors.affected_quantity}</p>
                )}
              </div>
            </div>

            {/* Visual Roll Meter Bar - Very intuitive for non-technical users */}
            <div className="bg-white p-4 rounded-2xl border border-amber-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-rose-700 flex items-center gap-1">
                  <Scissors className="w-3.5 h-3.5" />
                  Damaged: {affectedNum} meters ({affectedPct.toFixed(0)}% of roll)
                </span>
                <span className="text-emerald-700">
                  Clean / Usable: {cleanMeters} meters
                </span>
              </div>
              <div className="w-full bg-emerald-500 h-4 rounded-full overflow-hidden flex shadow-inner">
                <div
                  className="h-full bg-rose-500 transition-all duration-300"
                  style={{ width: `${affectedPct}%` }}
                  title={`${affectedNum}m damaged`}
                ></div>
              </div>
              <p className="text-[11px] text-slate-500 text-center">
                Flawed section: {affectedNum}m • Clean cloth: {cleanMeters}m
              </p>
            </div>

            {/* Flaw Position & Severity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-700 mb-1.5">
                  How severe is the damage?
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                >
                  <option value="low">Low — Minor flaw, easy to clean</option>
                  <option value="medium">Medium — Needs proper scouring / chemical wash</option>
                  <option value="high">High — Deep flaw, extensive repair required</option>
                  <option value="critical">Critical — Cannot be fixed (Scrap cloth)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-700 mb-1.5">
                  Where is it on the cloth?
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Near edge, meters 35 to 50"
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-3xl bg-emerald-50/60 border border-emerald-200 flex items-start space-x-3.5">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-emerald-900">
                Fabric Approved as 100% Clean
              </h3>
              <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                All {roll.produced_quantity} {roll.unit} meet mill standards with zero recorded defects. Once saved, this roll can be loaded onto customer delivery trucks.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Inspector Notes */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-700 mb-2">
            Step 3: Notes & Instructions for the floor
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              decision === 'PASS' 
                ? 'e.g. Clean roll, uniform weave tension and consistent color.'
                : 'e.g. Send to wash section for chemical spot removal, then re-inspect.'
            }
            className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        {/* System Stamp Info */}
        <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-slate-500" />
            <span>Inspector: <strong className="text-slate-800">Alex Kumar (Senior Inspector)</strong></span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>Time Stamp: <strong className="text-slate-800">Recorded by server on save</strong></span>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-2 flex items-center justify-end space-x-3">
          <button
            onClick={() => router.push(backPath || '/')}
            disabled={isSubmitting}
            className="px-5 py-3 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-8 py-3.5 rounded-2xl text-xs font-medium text-white shadow-xl transition cursor-pointer disabled:opacity-50 ${
              decision === 'PASS' 
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30 ring-2 ring-emerald-400/30'
                : decision === 'REWORK'
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30 ring-2 ring-amber-400/30'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30 ring-2 ring-rose-400/30'
            }`}
          >
            Review & Save Inspection Outcome
          </button>
        </div>
      </form>

      {/* Confirmation Dialog with Plain Language */}
      <ConfirmDialog
        isOpen={showConfirmModal}
        title="Confirm Your Quality Decision"
        description={`You are about to save an official quality record for roll ${roll.roll_code} with decision: ${decision}. This record will be permanently saved into the mill log.`}
        consequence={
          decision === 'PASS'
            ? 'This roll will be UNLOCKED and approved for shipping to the customer.'
            : decision === 'REWORK'
              ? 'This roll will be LOCKED. No truck can load it until the fabric is fixed and re-inspected.'
              : 'This roll will be PERMANENTLY SCRAPPED. It can never be shipped.'
        }
        confirmText={isSubmitting ? 'Saving...' : 'Yes, Save This Decision'}
        isDestructive={decision === 'REJECT'}
        isLoading={isSubmitting}
        onConfirm={handleExecuteSubmit}
        onCancel={() => setShowConfirmModal(false)}
      />
    </div>
  );
}
