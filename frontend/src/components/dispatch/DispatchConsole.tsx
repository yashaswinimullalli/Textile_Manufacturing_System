'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api-client';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Truck, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Zap,
  Lock,
  PackageCheck,
  Ban
} from 'lucide-react';

export default function DispatchConsole() {
  const [testRollCode, setTestRollCode] = useState('ROLL-008');
  const [dispatchQuantity, setDispatchQuantity] = useState<number | string>('');
  const [destination, setDestination] = useState('Rotterdam Textile Hub, Dock 4');
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [dispatchSuccess, setDispatchSuccess] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const demoScenarios = [
    { 
      code: 'ROLL-008', 
      title: 'Roll with Oil Stains', 
      statusBadge: 'On Hold for Rework',
      expected: 'Blocked: Needs washing before check' 
    },
    { 
      code: 'ROLL-009', 
      title: 'Brand New Roll', 
      statusBadge: 'Never Inspected',
      expected: 'Blocked: Must be checked first' 
    },
    { 
      code: 'ROLL-010', 
      title: 'Torn Fabric', 
      statusBadge: 'Scrapped (Reject)',
      expected: 'Blocked: Permanent scrap' 
    },
    { 
      code: 'ROLL-001', 
      title: 'Approved Clean Roll', 
      statusBadge: 'Passed Inspection',
      expected: 'Approved: Ready to load truck' 
    },
    { 
      code: 'ROLL-002', 
      title: 'Already Shipped Roll', 
      statusBadge: 'Already Left Mill',
      expected: 'Blocked: No meters remaining' 
    }
  ];

  const handleValidate = async (codeToTest?: string) => {
    const code = (codeToTest || testRollCode).trim().toUpperCase();
    if (!code) return;

    try {
      setIsLoading(true);
      setErrorMessage(null);
      setDispatchSuccess(null);
      const res = await api.validateDispatch(code);
      setValidationResult(res.results[0]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Validation check failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteDispatch = async () => {
    const code = testRollCode.trim().toUpperCase();
    if (!code) return;

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await api.executeDispatch({
        roll_code: code,
        quantity: dispatchQuantity ? Number(dispatchQuantity) : undefined,
        destination
      });
      setDispatchSuccess(res);
      const updatedVal = await api.validateDispatch(code);
      setValidationResult(updatedVal.results[0]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Server rejected shipping attempt');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold mb-3">
            <Truck className="w-3.5 h-3.5 text-amber-400" />
            <span>Factory Safety Rule #1 • Anti-Mistake Shipping Gate</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Shipping & Dispatch Gate
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            In our textile mill, no truck driver can pick up a roll unless our server checks that it has passed quality inspection, has no pending oil stains or tears, and has available meters.
          </p>
        </div>
      </div>

      {/* 5 One-Click Test Buttons */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-1">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              Try a Sample Roll (Click to test the gate)
            </h3>
            <p className="text-xs text-slate-500">
              See how the safety gate automatically catches bad rolls in real-time
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-400">1-Click Test</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {demoScenarios.map(sc => {
            const isSelected = testRollCode === sc.code;
            return (
              <button
                key={sc.code}
                type="button"
                onClick={() => {
                  setTestRollCode(sc.code);
                  handleValidate(sc.code);
                }}
                className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-400/30'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-black text-xs">{sc.code}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-700 border border-slate-200'
                  }`}>
                    {sc.statusBadge}
                  </span>
                </div>
                <div className={`text-xs font-bold ${isSelected ? 'text-slate-100' : 'text-slate-900'}`}>
                  {sc.title}
                </div>
                <div className={`text-[11px] mt-1 font-medium ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  {sc.expected}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Checker & Live Gate Result */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Enter Any Fabric Roll Number to Check
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={testRollCode}
              onChange={(e) => setTestRollCode(e.target.value.toUpperCase())}
              placeholder="e.g. ROLL-008"
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 uppercase focus:bg-white"
            />
            <button
              onClick={() => handleValidate()}
              disabled={isLoading}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition shadow-md shadow-blue-600/25 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Checking...' : 'Check Roll Now'}
            </button>
          </div>
        </div>

        {/* Big Visual Traffic Light Box */}
        {validationResult && (
          <div className={`p-6 rounded-3xl border-2 transition-all shadow-md ${
            validationResult.eligible
              ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
              : 'bg-rose-50 border-rose-400 text-rose-950'
          }`}>
            <div className="flex items-start space-x-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                validationResult.eligible 
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-4 ring-emerald-300' 
                  : 'bg-rose-600 text-white shadow-rose-600/30 ring-4 ring-rose-300'
              }`}>
                {validationResult.eligible ? <CheckCircle2 className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    validationResult.eligible ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                  }`}>
                    {validationResult.eligible ? 'APPROVED TO SHIP' : 'STOP: LOADING FORBIDDEN'}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-600">{validationResult.roll_code}</span>
                </div>

                <h4 className="text-base font-black mt-2">
                  {validationResult.eligible 
                    ? 'Roll is Verified Safe & Ready to Load' 
                    : 'This Roll Cannot Be Loaded onto Any Truck'}
                </h4>

                <p className="text-xs font-bold mt-1 text-slate-800 leading-relaxed bg-white/80 p-3 rounded-xl border border-current/20">
                  Reason: {validationResult.reason}
                </p>

                <div className="mt-3 text-xs flex flex-wrap gap-4 text-slate-700 font-medium">
                  <span>Mill Health Status: <strong className="font-mono font-bold text-slate-900">{validationResult.operational_status}</strong></span>
                  <span>Latest Inspection: <strong className="font-mono font-bold text-slate-900">{validationResult.latest_decision}</strong></span>
                  <span>Available Meters: <strong className="text-slate-900">{validationResult.remaining_quantity}m</strong></span>
                </div>
              </div>
            </div>

            {/* If Eligible: 1-Click Load Action */}
            {validationResult.eligible && (
              <div className="mt-6 pt-5 border-t border-emerald-300 bg-white/90 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <PackageCheck className="w-4 h-4 text-emerald-600" />
                    Load Onto Delivery Truck Now
                  </h5>
                  <span className="text-xs font-bold text-emerald-800">
                    Max Available: {validationResult.remaining_quantity}m
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Meters to Load onto Truck
                    </label>
                    <input
                      type="number"
                      max={validationResult.remaining_quantity}
                      placeholder={`e.g. ${validationResult.remaining_quantity}`}
                      value={dispatchQuantity}
                      onChange={(e) => setDispatchQuantity(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Delivery Destination
                    </label>
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleExecuteDispatch}
                    disabled={isLoading}
                    className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition flex items-center space-x-2 cursor-pointer"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Print Shipping Slip & Release Roll</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Server Block Rejection Error */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-xs text-rose-900 font-bold">
            <span className="block text-sm font-black mb-1">Shipping Gate Rejection:</span>
            {errorMessage}
          </div>
        )}

        {/* Success Confirmation Slip */}
        {dispatchSuccess && (
          <div className="p-6 rounded-3xl bg-emerald-50 border-2 border-emerald-300 text-xs text-emerald-950 space-y-2">
            <div className="flex items-center space-x-2 font-black text-sm text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Fabric Roll Successfully Loaded & Released!</span>
            </div>
            <p className="font-medium text-slate-700">
              Waybill Number: <code className="font-mono font-bold text-slate-900">{dispatchSuccess.dispatch.tracking_ref}</code> • 
              Dispatched: <strong className="font-black text-slate-900">{dispatchSuccess.dispatch.quantity}m</strong> to {dispatchSuccess.dispatch.destination}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
