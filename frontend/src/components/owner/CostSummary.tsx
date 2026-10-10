'use client';

import React, { useState } from 'react';
import { CostRecord } from '@/types/factory';
import { formatCurrency, formatDate } from '@/lib/formatters';
import AddCostModal from './AddCostModal';
import { 
  IndianRupee, 
  PlusCircle, 
  Layers, 
  Users, 
  Cpu, 
  RefreshCw, 
  Truck,
  CheckCircle2,
  AlertCircle,
  Receipt,
  FileCheck
} from 'lucide-react';

interface CostSummaryProps {
  costs: CostRecord[];
  aggregated: {
    total_recorded: number;
    total_estimated: number;
    grand_total: number;
    currency: string;
    by_category: Record<string, number>;
  };
  onRefresh?: () => void;
}

export default function CostSummary({ costs, aggregated, onRefresh }: CostSummaryProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string | null>(null);

  const filteredCosts = selectedFilterCategory 
    ? costs.filter(c => c.category === selectedFilterCategory)
    : costs;

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'material':
        return { label: 'Yarn & Raw Cotton', icon: <Layers className="w-4 h-4 text-blue-600" />, badge: 'bg-blue-50 text-blue-700' };
      case 'labour':
        return { label: 'Weaver & Floor Wages', icon: <Users className="w-4 h-4 text-indigo-600" />, badge: 'bg-indigo-50 text-indigo-700' };
      case 'machine/overhead':
        return { label: 'Loom Power & Mill Electricity', icon: <Cpu className="w-4 h-4 text-teal-600" />, badge: 'bg-teal-50 text-teal-700' };
      case 'rework':
        return { label: 'Washing & Scouring Repair', icon: <RefreshCw className="w-4 h-4 text-amber-600" />, badge: 'bg-amber-50 text-amber-700' };
      case 'transport':
        return { label: 'Truck Freight & Delivery', icon: <Truck className="w-4 h-4 text-purple-600" />, badge: 'bg-purple-50 text-purple-700' };
      default:
        return { label: category, icon: <IndianRupee className="w-4 h-4 text-slate-600" />, badge: 'bg-slate-50 text-slate-700' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Confirmed Recorded Costs */}
        <div 
          onClick={() => setSelectedFilterCategory(null)}
          className="bg-white p-6 rounded-3xl border-2 border-emerald-200 shadow-sm cursor-pointer hover:border-emerald-400 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
              Confirmed Paid Bills
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-slate-900 tracking-tight">
            {formatCurrency(aggregated.total_recorded, aggregated.currency)}
          </div>
          <p className="mt-1 text-xs font-bold text-slate-700">Backed by real supplier invoices & wages</p>
          <p className="text-[11px] text-slate-500">Official accounting entries in mill ledger</p>
        </div>

        {/* Estimated Exposure */}
        <div className="bg-white p-6 rounded-3xl border-2 border-amber-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-amber-800">
              Estimated Repair Costs
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-amber-600 tracking-tight">
            {formatCurrency(aggregated.total_estimated, aggregated.currency)}
          </div>
          <p className="mt-1 text-xs font-bold text-slate-700">Estimated cost to wash / repair flawed rolls</p>
          <p className="text-[11px] text-slate-500">Pending final supplier bill or invoice</p>
        </div>

        {/* Grand Total */}
        <div className="bg-gradient-to-tr from-purple-900 to-indigo-900 p-6 rounded-3xl text-white shadow-xl flex flex-col justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-purple-200 block">
              Total Production Expense
            </span>
            <div className="text-3xl font-black tracking-tight mt-2">
              {formatCurrency(aggregated.grand_total, aggregated.currency)}
            </div>
            <p className="text-xs text-purple-200 mt-1">Confirmed bills + estimated repair allowance</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 inline-flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl bg-purple-500 hover:bg-purple-400 text-white font-black text-xs shadow-lg transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Enter New Expense Bill</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-2">
        <span className="text-xs font-black text-slate-700 mr-1">Filter by type:</span>
        <button
          onClick={() => setSelectedFilterCategory(null)}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            selectedFilterCategory === null ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          All Expenses ({costs.length})
        </button>
        {Object.entries(aggregated.by_category).map(([cat, total]) => {
          const info = getCategoryInfo(cat);
          return (
            <button
              key={cat}
              onClick={() => setSelectedFilterCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                selectedFilterCategory === cat 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {info.icon}
              <span>{info.label}: {formatCurrency(total, aggregated.currency)}</span>
            </button>
          );
        })}
      </div>

      {/* Itemized Cost Records Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-purple-600" />
              Itemized Production Cost Ledger
            </h2>
            <p className="text-xs text-slate-500">
              Verified expense entries linked to customer orders with purchase order & voucher numbers
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-full">
            Showing {filteredCosts.length} bills
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Bill / Voucher ID</th>
                <th className="py-3.5 px-4">Buyer Order</th>
                <th className="py-3.5 px-4">Expense Category</th>
                <th className="py-3.5 px-4">Source Receipt #</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Date Recorded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCosts.map((c) => {
                const info = getCategoryInfo(c.category);
                return (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-4 font-mono font-bold text-slate-900">
                      {c.id}
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-700">
                      {c.order_id}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${info.badge}`}>
                        {info.icon}
                        <span>{info.label}</span>
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-slate-600">
                      {c.source_reference}
                    </td>
                    <td className="py-4 px-4 font-black text-slate-900 text-sm">
                      {formatCurrency(c.amount, c.currency)}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        c.is_estimated ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {c.is_estimated ? 'Estimated' : 'Confirmed Bill'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-500 font-medium">
                      {formatDate(c.recorded_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Cost Voucher Modal */}
      <AddCostModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
}
