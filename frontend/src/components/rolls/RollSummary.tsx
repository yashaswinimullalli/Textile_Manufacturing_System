'use client';

import React from 'react';
import Link from 'next/link';
import { RollDetailResponse } from '@/types/factory';
import { formatDate, getStatusBadgeClass, getFriendlyStatusLabel } from '@/lib/formatters';
import DispatchEligibility from '../dispatch/DispatchEligibility';
import { 
  Package, 
  Factory, 
  Layers, 
  ShieldCheck, 
  ArrowRight, 
  RotateCcw,
  Sparkles,
  Calendar,
  User,
  Hash,
  CheckCircle2
} from 'lucide-react';

interface RollSummaryProps {
  data: RollDetailResponse;
  onRefresh?: () => void;
  basePath?: string;
}

export default function RollSummary({ data, onRefresh, basePath = '' }: RollSummaryProps) {
  const { roll, order, latest_inspection, dispatch_eligibility } = data;

  const canInspect = roll.operational_status !== 'DISPATCHED';

  return (
    <div className="space-y-6">
      {/* Top Banner / Fabric Passport Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase font-black tracking-widest text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Fabric Passport
              </span>
              <span className={`px-3.5 py-1 rounded-full text-xs font-black border ${getStatusBadgeClass(roll.operational_status)}`}>
                {getFriendlyStatusLabel(roll.operational_status)}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2 font-mono flex items-center gap-3">
              {roll.roll_code}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
              Fabric Type: <strong className="text-slate-900">{roll.fabric_type}</strong> • Total Length: <strong className="text-slate-900">{roll.produced_quantity} {roll.unit}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {canInspect && (
              <Link
                href={`${basePath}/rolls/${roll.roll_code}/inspect`}
                className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-xl shadow-blue-600/30 transition hover:scale-105"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {roll.operational_status === 'REWORK_REQUIRED' ? 'Start Reinspection Check' : 'Start Quality Check'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-3.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                title="Refresh Roll Data"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Live Dispatch Gate Status Card */}
        <div>
          <DispatchEligibility eligibility={dispatch_eligibility} roll={roll} />
        </div>

        {/* 3 Clear Context Cards for Factory Floor Workers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Order Details */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-slate-900 text-xs font-black uppercase tracking-wider">
              <Package className="w-4 h-4 text-blue-600" />
              <span>1. Customer & Order</span>
            </div>
            {order ? (
              <div className="text-xs space-y-2 pt-1 font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-500">Buyer / Customer:</span>
                  <span className="font-bold text-slate-900">{order.customer_reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Order Number:</span>
                  <span className="font-mono font-bold text-slate-800">{order.order_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Volume:</span>
                  <span className="font-bold text-slate-800">{order.target_quantity} {order.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Shipping Deadline:</span>
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {order.due_date}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Order information not linked.</p>
            )}
          </div>

          {/* Production Origin */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-slate-900 text-xs font-black uppercase tracking-wider">
              <Factory className="w-4 h-4 text-indigo-600" />
              <span>2. Loom Machine & Shift</span>
            </div>
            <div className="text-xs space-y-2 pt-1 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">Weaving Loom:</span>
                <span className="font-bold text-slate-900">{roll.machine_id || 'Not recorded'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Working Shift:</span>
                <span className="font-bold text-slate-800">{roll.shift || 'Not recorded'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Loom Operator:</span>
                <span className="font-bold text-slate-800">{roll.operator_name || 'Not recorded'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Manufactured On:</span>
                <span className="font-bold text-slate-800">{formatDate(roll.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Material & Cloth Length */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-slate-900 text-xs font-black uppercase tracking-wider">
              <Layers className="w-4 h-4 text-teal-600" />
              <span>3. Fabric & Available Meters</span>
            </div>
            <div className="text-xs space-y-2 pt-1 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">Yarn Lot / Batch:</span>
                <span className="font-mono font-bold text-slate-900">{roll.yarn_batch || 'Not recorded'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Woven:</span>
                <span className="font-bold text-slate-900">{roll.produced_quantity} {roll.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Already Shipped:</span>
                <span className="font-bold text-slate-700">{roll.dispatched_quantity || 0} {roll.unit}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-700 font-bold">Available in Mill:</span>
                <span className="font-black text-blue-700 text-sm">{roll.remaining_quantity || 0} {roll.unit}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
