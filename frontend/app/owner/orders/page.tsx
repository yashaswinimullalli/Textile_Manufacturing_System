'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { OwnerOrderProgress } from '@/types/factory';
import OrderProgressTable from '@/components/owner/OrderProgressTable';
import LoadingState from '@/components/shared/LoadingState';
import ErrorState from '@/components/shared/ErrorState';
import { Package, RefreshCw, TrendingUp } from 'lucide-react';

export default function OwnerOrdersPage() {
  const [orders, setOrders] = useState<OwnerOrderProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getOwnerOrders();
      setOrders(res.orders || []);
    } catch (err: any) {
      setError(err.message || 'Could not load orders.');
    } finally {
      setIsLoading(false);
    }
  };

  // Aggregate stats
  const delayedCount = orders.filter(o => o.status === 'DELAYED').length;
  const completedCount = orders.filter(o => o.status === 'COMPLETED').length;
  const totalRejected = orders.reduce((sum, o) => sum + o.rejected_quantity, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <Package className="w-5 h-5 text-amber-600" />
            <h1 className="text-xl font-black text-slate-900">Order Progress</h1>
          </div>
          <p className="text-sm text-slate-500">
            Customer order fulfillment, inspection progress, and delivery status.
          </p>
        </div>
        <button onClick={loadOrders} className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 transition">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Summary Row */}
      {!isLoading && orders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Orders</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{orders.length}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-wider text-amber-600">Delayed</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{delayedCount}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Completed</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{completedCount}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-wider text-rose-600">Total Rejected (m)</div>
            <div className="text-2xl font-black text-rose-600 mt-1">{totalRejected}</div>
          </div>
        </div>
      )}

      {isLoading ? (
        <LoadingState message="Loading order progress data..." />
      ) : error ? (
        <ErrorState title="Could Not Load Orders" message={error} onRetry={loadOrders} />
      ) : (
        <OrderProgressTable orders={orders} />
      )}
    </div>
  );
}
