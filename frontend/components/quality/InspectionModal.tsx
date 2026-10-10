'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText,
  FlaskConical,
  Eye,
  Camera,
  Layers,
  Sparkles,
  Calendar,
  User,
  Info,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  YarnBatch,
  QualityInspection,
  InspectionDisposition,
  SpecCheckItem,
  PackagingCondition,
  ContaminationObserved,
  VisualQuality,
  SpecCheckResult,
} from '@/lib/types';

interface InspectionModalProps {
  batch: YarnBatch | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedBatch: YarnBatch, message: string) => void;
  isReinspection?: boolean;
}

// Configurable standard laboratory test templates based on yarn type
const getDefaultSpecChecksForType = (yarnType: string): SpecCheckItem[] => {
  switch (yarnType) {
    case 'Cotton':
      return [
        { id: 'c1', test_name: 'Yarn Count / Linear Density', expected_spec: '30s Ne ± 1.5%', actual_value: '30.1', unit: 'Ne', result: 'Pass', is_mandatory: true, remarks: 'Calibrated wrap reel + analytical balance' },
        { id: 'c2', test_name: 'Single Yarn Tensile Strength', expected_spec: '> 280 cN', actual_value: '295', unit: 'cN', result: 'Pass', is_mandatory: true, remarks: 'Uster Tensorapid 4 tested' },
        { id: 'c3', test_name: 'Yarn Evenness (CVm %)', expected_spec: '< 13.5%', actual_value: '12.2', unit: 'CVm %', result: 'Pass', is_mandatory: true, remarks: 'Uster Tester 5 capacitive measurement' },
        { id: 'c4', test_name: 'Twist per Inch (TPI)', expected_spec: '21.5 ± 1.0', actual_value: '21.6', unit: 'TPI', result: 'Pass', is_mandatory: false, remarks: 'Electronic twist tester verification' },
      ];
    case 'Polyester':
      return [
        { id: 'p1', test_name: 'Denier / Filament Count', expected_spec: '150D / 48F ± 2%', actual_value: '149.8', unit: 'Denier', result: 'Pass', is_mandatory: true, remarks: 'Wrap reel denier check' },
        { id: 'p2', test_name: 'Tenacity (g/den)', expected_spec: '> 4.2 g/d', actual_value: '4.5', unit: 'g/d', result: 'Pass', is_mandatory: true, remarks: 'Constant rate of elongation test' },
        { id: 'p3', test_name: 'Elongation at Break %', expected_spec: '18.0 - 24.0%', actual_value: '21.4', unit: '%', result: 'Pass', is_mandatory: true, remarks: 'Tensile elongation test' },
        { id: 'p4', test_name: 'Boiling Water Shrinkage', expected_spec: '< 6.5%', actual_value: '5.2', unit: '%', result: 'Pass', is_mandatory: false, remarks: 'Thermal shrinkage 30 min boiling' },
      ];
    case 'Blend':
    default:
      return [
        { id: 'b1', test_name: 'Yarn Count / Linear Density', expected_spec: '24s Ne Blend ± 2%', actual_value: '23.9', unit: 'Ne', result: 'Pass', is_mandatory: true, remarks: 'Linear density verification' },
        { id: 'b2', test_name: 'Blend Composition Ratio', expected_spec: '65/35 Poly-Cotton ± 2%', actual_value: '64.9/35.1', unit: '%', result: 'Pass', is_mandatory: true, remarks: 'Chemical dissolution analysis (ISO 1833)' },
        { id: 'b3', test_name: 'Spectrophotometer Delta-E', expected_spec: 'Delta-E < 0.8 dE', actual_value: '0.6', unit: 'dE', result: 'Pass', is_mandatory: true, remarks: 'D65 illuminant, 10 deg observer' },
        { id: 'b4', test_name: 'Single Yarn Strength', expected_spec: '> 250 cN', actual_value: '268', unit: 'cN', result: 'Pass', is_mandatory: true, remarks: 'Single yarn breaking force' },
      ];
  }
};

export const InspectionModal: React.FC<InspectionModalProps> = ({
  batch,
  isOpen,
  onClose,
  onSuccess,
  isReinspection = false,
}) => {
  if (!isOpen || !batch) return null;

  // Visual inspection state
  const [packagingCondition, setPackagingCondition] = useState<PackagingCondition>('Acceptable');
  const [visibleContamination, setVisibleContamination] = useState<ContaminationObserved>('Not observed');
  const [colourConsistency, setColourConsistency] = useState<VisualQuality>('Acceptable');
  const [yarnAppearance, setYarnAppearance] = useState<VisualQuality>('Acceptable');
  const [visualRemarks, setVisualRemarks] = useState('');
  const [defectDescription, setDefectDescription] = useState('');
  const [inspectorName, setInspectorName] = useState('Priya Sharma (Quality Inspector)');

  // Laboratory / Specification checks
  const [specChecks, setSpecChecks] = useState<SpecCheckItem[]>([]);
  const [supplierCertRef, setSupplierCertRef] = useState(batch.certificate_reference || 'COA-' + batch.batch_code.slice(-6));

  // Disposition & quantity state
  const [decision, setDecision] = useState<InspectionDisposition>(
    isReinspection ? 'PASSED' : (batch.inspection_status === 'ON_HOLD' ? 'ON_HOLD' : 'PASSED')
  );
  const [qtyApproved, setQtyApproved] = useState<string>(String(batch.quantity_received));
  const [qtyHeld, setQtyHeld] = useState<string>('0');
  const [qtyRejected, setQtyRejected] = useState<string>('0');
  const [decisionReason, setDecisionReason] = useState('');
  const [reinspectionReason, setReinspectionReason] = useState(
    isReinspection ? 'Reinspected following supplier laboratory test certificate receipt' : ''
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize checks when batch changes
  useEffect(() => {
    if (batch) {
      setSpecChecks(getDefaultSpecChecksForType(batch.yarn_type));
      setQtyApproved(String(batch.quantity_received));
      setQtyHeld('0');
      setQtyRejected('0');
      setDecision(batch.inspection_status === 'ON_HOLD' ? 'ON_HOLD' : 'PASSED');
      setDecisionReason('Incoming inspection completed according to factory quality assurance manual.');
    }
  }, [batch]);

  // Adjust quantities automatically when disposition switches
  const handleDecisionChange = (newDecision: InspectionDisposition) => {
    setDecision(newDecision);
    const total = batch.quantity_received;

    if (newDecision === 'PASSED') {
      setQtyApproved(String(total));
      setQtyHeld('0');
      setQtyRejected('0');
      setDecisionReason('All visual and laboratory criteria satisfy acceptable quality levels (AQL 1.5). Released for production.');
    } else if (newDecision === 'ON_HOLD') {
      setQtyApproved('0');
      setQtyHeld(String(total));
      setQtyRejected('0');
      setDecisionReason('Batch held in quarantine pending shade confirmation / further laboratory testing.');
    } else if (newDecision === 'REJECTED') {
      setQtyApproved('0');
      setQtyHeld('0');
      setQtyRejected(String(total));
      setDecisionReason('Failed incoming specifications. Quarantined for return to supplier (RTV).');
    } else if (newDecision === 'PARTIALLY_ACCEPTED') {
      // Default to 80% approved, 20% held/rejected
      const splitApproved = Math.round(total * 0.8);
      const splitHeld = total - splitApproved;
      setQtyApproved(String(splitApproved));
      setQtyHeld(String(splitHeld));
      setQtyRejected('0');
      setDecisionReason(`Approved conforming quantity (${splitApproved} kg). Remainder held for sorting.`);
    }
  };

  // Spec check result toggle
  const handleSpecResultChange = (id: string, result: SpecCheckResult) => {
    setSpecChecks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, result } : item))
    );
  };

  const handleSpecValueChange = (id: string, value: string) => {
    setSpecChecks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, actual_value: value } : item))
    );
  };

  // Check if mandatory tests prevent "PASSED"
  const failedMandatoryCheck = specChecks.find(
    (c) => c.is_mandatory && (c.result === 'Fail' || c.result === 'Not Tested')
  );
  const visualIssuePresent =
    packagingCondition === 'Damaged' || visibleContamination === 'Observed';

  const isPassedBlocked = Boolean(failedMandatoryCheck || visualIssuePresent);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!inspectorName.trim()) {
      setErrorMessage('Inspector name / ID is required.');
      return;
    }

    const appNum = parseFloat(qtyApproved) || 0;
    const heldNum = parseFloat(qtyHeld) || 0;
    const rejNum = parseFloat(qtyRejected) || 0;
    const totalInput = appNum + heldNum + rejNum;

    if (Math.abs(totalInput - batch.quantity_received) > 0.1) {
      setErrorMessage(
        `Quantity balance mismatch: Approved (${appNum}) + Held (${heldNum}) + Rejected (${rejNum}) = ${totalInput} kg, but received total is ${batch.quantity_received} kg.`
      );
      return;
    }

    if (decision === 'PASSED' && isPassedBlocked) {
      setErrorMessage(
        failedMandatoryCheck
          ? `Cannot approve batch as PASSED: Mandatory test "${failedMandatoryCheck.test_name}" is marked ${failedMandatoryCheck.result}. Please select ON_HOLD or REJECTED.`
          : 'Cannot approve batch as PASSED while visible contamination or damaged packaging is recorded.'
      );
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.recordQualityInspection(batch.id, {
        inspector_name: inspectorName.trim(),
        packaging_condition: packagingCondition,
        visible_contamination: visibleContamination,
        colour_consistency: colourConsistency,
        yarn_appearance: yarnAppearance,
        visual_remarks: visualRemarks.trim(),
        defect_description: defectDescription.trim(),
        spec_checks: specChecks,
        supplier_cert_ref: supplierCertRef.trim(),
        decision,
        quantity_approved: appNum,
        quantity_held: heldNum,
        quantity_rejected: rejNum,
        decision_reason: decisionReason.trim(),
        reinspection_reason: isReinspection ? reinspectionReason.trim() : undefined,
        stage: isReinspection ? 'REINSPECTION' : 'INITIAL',
      });

      onSuccess(res.batch, `Quality inspection recorded successfully. Disposition: ${decision}`);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit quality inspection');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">
                  {isReinspection ? 'Incoming Yarn Reinspection' : 'Incoming Raw Material Quality Inspection'}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-900/60 text-teal-300 border border-teal-700 font-mono">
                  {batch.batch_code}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Visual inspection checklist, specification verification, and inventory release disposition.
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs font-semibold flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Validation Alert</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Section A: Batch Information Card (Read-Only Context) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-teal-600" />
                Section A — Batch Receiving Record
              </span>
              <span className="text-xs font-mono font-semibold bg-white border px-2 py-0.5 rounded text-slate-700">
                Barcode: {batch.barcode}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Supplier</span>
                <span className="font-bold text-slate-900">{batch.supplier}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Yarn Type</span>
                <span className="font-bold text-slate-900">{batch.yarn_type}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Colour Specification</span>
                <span className="font-bold text-slate-900">{batch.colour}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Received Quantity</span>
                <span className="font-bold text-teal-700 text-sm">
                  {batch.quantity_received.toLocaleString()} {batch.unit}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">PO Reference</span>
                <span className="font-medium text-slate-800">{batch.po_reference || 'PO-2026-RAW'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Yarn Count Specification</span>
                <span className="font-medium text-slate-800">{batch.yarn_count_spec || 'Standard Lot Spec'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Current QC Status</span>
                <span className="font-bold text-slate-800">{batch.inspection_status || 'PENDING_INSPECTION'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Receiving Date</span>
                <span className="font-medium text-slate-800">
                  {new Date(batch.received_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Section B: Human Visual Observations */}
          <div className="border border-slate-200 rounded-xl p-4.5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2.5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Eye className="h-4 w-4 text-teal-600" />
                Section B — Visual & Packaging Inspection
              </h3>
              <span className="text-[11px] text-slate-400 italic">
                Manual observations recorded by QC inspector
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Packaging Condition */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  1. Packaging & Pallet Condition
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPackagingCondition('Acceptable')}
                    className={`py-2 px-3 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      packagingCondition === 'Acceptable'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-400'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Acceptable
                  </button>
                  <button
                    type="button"
                    onClick={() => setPackagingCondition('Damaged')}
                    className={`py-2 px-3 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      packagingCondition === 'Damaged'
                        ? 'bg-rose-50 border-rose-500 text-rose-800 ring-1 ring-rose-400'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <XCircle className="h-3.5 w-3.5 text-rose-600" />
                    Damaged / Wet
                  </button>
                </div>
              </div>

              {/* Visible Contamination */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  2. Visible Foreign Fiber / Oil Contamination
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVisibleContamination('Not observed')}
                    className={`py-2 px-3 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      visibleContamination === 'Not observed'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-400'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Not Observed
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibleContamination('Observed')}
                    className={`py-2 px-3 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      visibleContamination === 'Observed'
                        ? 'bg-rose-50 border-rose-500 text-rose-800 ring-1 ring-rose-400'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                    Observed (Defect)
                  </button>
                </div>
              </div>

              {/* Colour Consistency */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  3. Colour & Shade Consistency
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setColourConsistency('Acceptable')}
                    className={`py-2 px-3 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      colourConsistency === 'Acceptable'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-400'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Acceptable
                  </button>
                  <button
                    type="button"
                    onClick={() => setColourConsistency('Issue found')}
                    className={`py-2 px-3 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      colourConsistency === 'Issue found'
                        ? 'bg-amber-50 border-amber-500 text-amber-800 ring-1 ring-amber-400'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    Issue Found
                  </button>
                </div>
              </div>

              {/* Yarn Appearance */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  4. Cone Wind & Surface Appearance
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setYarnAppearance('Acceptable')}
                    className={`py-2 px-3 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      yarnAppearance === 'Acceptable'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-400'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Acceptable
                  </button>
                  <button
                    type="button"
                    onClick={() => setYarnAppearance('Issue found')}
                    className={`py-2 px-3 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      yarnAppearance === 'Issue found'
                        ? 'bg-amber-50 border-amber-500 text-amber-800 ring-1 ring-amber-400'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    Slubs / Loops Found
                  </button>
                </div>
              </div>
            </div>

            {/* Visual Remarks & Defect Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  General Remarks / Packaging Notes
                </label>
                <input
                  type="text"
                  value={visualRemarks}
                  onChange={(e) => setVisualRemarks(e.target.value)}
                  placeholder="e.g. Cones sealed in PE film, lot batch tags verified"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Defect Description (if any)
                </label>
                <input
                  type="text"
                  value={defectDescription}
                  onChange={(e) => setDefectDescription(e.target.value)}
                  placeholder="e.g. Minor oil stains on top layer of cone pallet 2"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section C: Specification & Laboratory Checks */}
          <div className="border border-slate-200 rounded-xl p-4.5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-teal-600" />
                  Section C — Specification & Laboratory Verification
                </h3>
                <p className="text-[11px] text-slate-500">
                  Applicable testing requirements configured for <strong>{batch.yarn_type}</strong> yarn.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">COA / Report Ref:</span>
                <input
                  type="text"
                  value={supplierCertRef}
                  onChange={(e) => setSupplierCertRef(e.target.value)}
                  placeholder="Supplier Test Certificate #"
                  className="text-xs font-mono px-2.5 py-1 border rounded-md w-40 bg-white"
                />
              </div>
            </div>

            {/* Tests Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                  <tr>
                    <th className="py-2.5 px-3">Test / Quality Parameter</th>
                    <th className="py-2.5 px-3">Standard Specification</th>
                    <th className="py-2.5 px-3 w-32">Measured Value</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3">Test Outcome</th>
                    <th className="py-2.5 px-3">Requirement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {specChecks.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {item.test_name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {item.expected_spec}
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={String(item.actual_value || '')}
                          onChange={(e) => handleSpecValueChange(item.id, e.target.value)}
                          placeholder="Measured"
                          className="w-full px-2 py-1 text-xs font-mono border rounded bg-white focus:ring-1 focus:ring-teal-500"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{item.unit}</td>
                      <td className="py-2.5 px-3">
                        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-[11px]">
                          <button
                            type="button"
                            onClick={() => handleSpecResultChange(item.id, 'Pass')}
                            className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                              item.result === 'Pass'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-emerald-700'
                            }`}
                          >
                            Pass
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSpecResultChange(item.id, 'Fail')}
                            className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                              item.result === 'Fail'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-rose-700'
                            }`}
                          >
                            Fail
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSpecResultChange(item.id, 'Not Tested')}
                            className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                              item.result === 'Not Tested'
                                ? 'bg-slate-600 text-white shadow-xs'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            N/T
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        {item.is_mandatory ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                            Mandatory
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            Optional
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Validation Notice if Mandatory Test Failed */}
            {failedMandatoryCheck && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <span>
                  Mandatory check <strong>{failedMandatoryCheck.test_name}</strong> is currently marked <strong>{failedMandatoryCheck.result}</strong>. This batch cannot be marked PASSED until resolved.
                </span>
              </div>
            )}
          </div>

          {/* Section D: Inspection Disposition & Inventory Release */}
          <div className="border-2 border-teal-600/30 bg-teal-50/20 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-teal-200/60 pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-teal-700" />
                  Section D — Quality Disposition & Inventory Allocation
                </h3>
                <p className="text-[11px] text-slate-500">
                  Select decision to determine inventory release eligibility for weaving lines.
                </p>
              </div>
            </div>

            {/* Disposition Selector Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <button
                type="button"
                onClick={() => handleDecisionChange('PASSED')}
                disabled={isPassedBlocked}
                className={`p-3 rounded-xl border text-left transition-all ${
                  decision === 'PASSED'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                    : isPassedBlocked
                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                    : 'bg-white border-slate-200 text-slate-800 hover:border-emerald-400 hover:bg-emerald-50/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">PASSED</span>
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <p className={`text-[11px] leading-tight ${decision === 'PASSED' ? 'text-emerald-100' : 'text-slate-500'}`}>
                  Release full quantity for production issue.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleDecisionChange('ON_HOLD')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  decision === 'ON_HOLD'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-300'
                    : 'bg-white border-slate-200 text-slate-800 hover:border-amber-400 hover:bg-amber-50/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">ON HOLD</span>
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <p className={`text-[11px] leading-tight ${decision === 'ON_HOLD' ? 'text-amber-100' : 'text-slate-500'}`}>
                  Quarantine batch pending lab confirmation.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleDecisionChange('PARTIALLY_ACCEPTED')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  decision === 'PARTIALLY_ACCEPTED'
                    ? 'bg-sky-600 text-white border-sky-600 shadow-md ring-2 ring-sky-300'
                    : 'bg-white border-slate-200 text-slate-800 hover:border-sky-400 hover:bg-sky-50/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">PARTIAL ACCEPT</span>
                  <Layers className="h-4 w-4" />
                </div>
                <p className={`text-[11px] leading-tight ${decision === 'PARTIALLY_ACCEPTED' ? 'text-sky-100' : 'text-slate-500'}`}>
                  Release accepted portion, hold remainder.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleDecisionChange('REJECTED')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  decision === 'REJECTED'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-300'
                    : 'bg-white border-slate-200 text-slate-800 hover:border-rose-400 hover:bg-rose-50/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">REJECTED</span>
                  <XCircle className="h-4 w-4" />
                </div>
                <p className={`text-[11px] leading-tight ${decision === 'REJECTED' ? 'text-rose-100' : 'text-slate-500'}`}>
                  Block entirely from production issue.
                </p>
              </button>
            </div>

            {/* Quantity Breakdown Inputs */}
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700 block mb-2">
                Quantity Allocation Breakdown ({batch.unit}) — Total: {batch.quantity_received.toLocaleString()} {batch.unit}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-emerald-700 font-semibold block mb-1">
                    Approved (Available for Issue)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max={batch.quantity_received}
                    value={qtyApproved}
                    onChange={(e) => setQtyApproved(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-mono font-bold text-slate-900 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-amber-700 font-semibold block mb-1">
                    Held in Quarantine
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max={batch.quantity_received}
                    value={qtyHeld}
                    onChange={(e) => setQtyHeld(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-mono font-bold text-slate-900 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-rose-700 font-semibold block mb-1">
                    Rejected Quantity
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max={batch.quantity_received}
                    value={qtyRejected}
                    onChange={(e) => setQtyRejected(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-mono font-bold text-slate-900 focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* Decision Reason & Inspector Sign-off */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Formal Decision Justification / Notes
                </label>
                <textarea
                  rows={2}
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  placeholder="State technical justification for this disposition decision..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Quality Inspector Signature / Identity
                </label>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-semibold focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                {isReinspection && (
                  <div className="mt-2">
                    <label className="font-semibold text-slate-700 block mb-1">
                      Reason for Reinspection
                    </label>
                    <input
                      type="text"
                      value={reinspectionReason}
                      onChange={(e) => setReinspectionReason(e.target.value)}
                      placeholder="e.g. Corrective cone sorting complete, resampled pallet 3"
                      className="w-full px-3 py-1.5 border rounded-lg text-xs"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-2 ring-2 ring-teal-500/30"
            >
              <ShieldCheck className="h-4 w-4 text-teal-400" />
              <span>{submitting ? 'Submitting & Updating Stock...' : 'Save Inspection Decision'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
