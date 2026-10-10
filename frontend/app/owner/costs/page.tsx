'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { CostRecord } from '@/types/factory';
import CostSummary from '@/components/owner/CostSummary';
import LoadingState from '@/components/shared/LoadingState';
import ErrorState from '@/components/shared/ErrorState';
import { IndianRupee, RefreshCw, Filter } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

export default function OwnerCostsPage() {
  const [costData, setCostData] = useState<{ costs: CostRecord[]; aggregated: any } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    loadCosts();
  }, [orderFilter, categoryFilter]);

  const loadCosts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getOwnerCosts({
        orderId: orderFilter || undefined,
        category: categoryFilter || undefined
      });
      setCostData(res);
    } catch (err: any) {
      setError(err.message || 'Could not load costs.');
    } finally {
      setIsLoading(false);
    }
  };

  const totalRecorded = costData?.aggregated?.total_recorded || 0;
  const totalEstimated = costData?.aggregated?.total_estimated || 0;
  const currency = costData?.costs?.[0]?.currency || 'INR';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <IndianRupee className="w-5 h-5 text-purple-600" />
            <h1 className="text-xl font-black text-slate-900">Costs & Expenses</h1>
          </div>
          <p className="text-sm text-slate-500">
            Recorded rework costs, rejected material losses, and quality-related expenses.
          </p>
        </div>
        <button onClick={loadCosts} className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 transition">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Cost Overview */}
      {!isLoading && costData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-5">
            <div className="text-[11px] font-black uppercase tracking-wider text-purple-700 mb-2">Confirmed Costs</div>
            <div className="text-3xl font-black text-purple-800">{formatCurrency(totalRecorded, currency)}</div>
            <div className="text-xs text-purple-600 mt-1 font-medium">Verified invoices & labor logs</div>
          </div>
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5">
            <div className="text-[11px] font-black uppercase tracking-wider text-amber-700 mb-2">Estimated Exposure</div>
            <div className="text-3xl font-black text-amber-700">{formatCurrency(totalEstimated, currency)}</div>
            <div className="text-xs text-amber-600 mt-1 font-medium">Projected rework & repair costs</div>
          </div>
          <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl p-5">
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">Total Exposure</div>
            <div className="text-3xl font-black text-white">{formatCurrency(totalRecorded + totalEstimated, currency)}</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Confirmed + estimated combined</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-500">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>
        <select
          value={orderFilter}
          onChange={e => setOrderFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
        >
          <option value="">All Orders</option>
          <option value="ORD-101">ORD-101 (Acme Apparel)</option>
          <option value="ORD-102">ORD-102 (Global Denim)</option>
          <option value="ORD-103">ORD-103 (Nordic Uniforms)</option>
        </select>

        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
        >
          <option value="">All Categories</option>
          <option value="material">Material</option>
          <option value="labour">Labour</option>
          <option value="rework">Rework</option>
          <option value="machine/overhead">Machine / Overhead</option>
          <option value="transport">Transport</option>
        </select>

        {(orderFilter || categoryFilter) && (
          <button
            onClick={() => { setOrderFilter(''); setCategoryFilter(''); }}
            className="text-xs text-blue-600 hover:underline font-bold"
          >
            Reset filters
          </button>
        )}
      </div>

      {isLoading ? (
        <LoadingState message="Loading cost records..." />
      ) : error ? (
        <ErrorState title="Could Not Load Costs" message={error} onRetry={loadCosts} />
      ) : costData ? (
        <CostSummary costs={costData.costs} aggregated={costData.aggregated} onRefresh={loadCosts} />
      ) : null}
    </div>
  );
}
