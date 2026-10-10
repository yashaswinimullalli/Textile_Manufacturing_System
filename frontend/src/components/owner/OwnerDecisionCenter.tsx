'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { 
  OwnerSummaryResponse, 
  Alert, 
  OwnerOrderProgress, 
  QualityTrendsResponse, 
  CostRecord 
} from '@/types/factory';
import { formatCurrency, formatQuantity } from '@/lib/formatters';
import AlertList from './AlertList';
import OrderProgressTable from './OrderProgressTable';
import QualityTrendCharts from './QualityTrendCharts';
import CostSummary from './CostSummary';
import LoadingState from '../shared/LoadingState';
import { 
  BarChart3, 
  AlertOctagon, 
  Clock, 
  IndianRupee, 
  ShieldAlert, 
  TrendingUp, 
  Package, 
  HelpCircle,
  Sparkles
} from 'lucide-react';

export default function OwnerDecisionCenter() {
  const [summary, setSummary] = useState<OwnerSummaryResponse | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [orders, setOrders] = useState<OwnerOrderProgress[]>([]);
  const [trends, setTrends] = useState<QualityTrendsResponse | null>(null);
  const [costData, setCostData] = useState<{ costs: CostRecord[]; aggregated: any } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'alerts' | 'orders' | 'trends' | 'costs'>('alerts');

  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [orderFilter, setOrderFilter] = useState<string>('');

  useEffect(() => {
    loadAllData();
  }, [severityFilter, orderFilter]);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      const [sumRes, alertsRes, ordersRes, trendsRes, costsRes] = await Promise.all([
        api.getOwnerSummary(),
        api.getAlerts({ severity: severityFilter || undefined }),
        api.getOwnerOrders(),
        api.getQualityTrends(),
        api.getOwnerCosts({ orderId: orderFilter || undefined })
      ]);

      setSummary(sumRes);
      setAlerts(alertsRes.alerts || []);
      setOrders(ordersRes.orders || []);
      setTrends(trendsRes);
      setCostData(costsRes);
    } catch (err) {
      console.error('Error loading Owner dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setSeverityFilter('');
    setOrderFilter('');
  };

  return (
    <div className="space-y-8">
      {/* Top Banner - Friendly and Clear */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold mb-3">
            <BarChart3 className="w-3.5 h-3.5 text-purple-300" />
            <span>Factory Owner & Accounts Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Mill Decision Centre
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Real-time pulse of your factory: see which customer orders are in danger, what fabric is locked on hold, how many rolls passed inspection, and what the mill is spending.
          </p>
        </div>
      </div>

      {/* 4 Big Color-Coded KPI Cards - Non-Technical & Easy to Read */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Urgent Problems */}
          <div 
            onClick={() => setActiveTab('alerts')}
            className={`p-6 rounded-3xl border-2 transition-all cursor-pointer shadow-sm ${
              activeTab === 'alerts' 
                ? 'bg-rose-50 border-rose-400 ring-4 ring-rose-400/20' 
                : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-rose-700">Urgent Issues</span>
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                <AlertOctagon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-black text-rose-600 tracking-tight">
              {summary.metrics.urgent_alerts.value}
            </div>
            <p className="text-xs font-bold text-slate-700 mt-1">
              Issues needing your immediate call
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              e.g. Scrapped rolls in open buyer orders
            </p>
          </div>

          {/* Card 2: Orders With Problems */}
          <div 
            onClick={() => setActiveTab('orders')}
            className={`p-6 rounded-3xl border-2 transition-all cursor-pointer shadow-sm ${
              activeTab === 'orders' 
                ? 'bg-amber-50 border-amber-400 ring-4 ring-amber-400/20' 
                : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-700">Orders With Problems</span>
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-black text-amber-600 tracking-tight">
              {summary.metrics.orders_at_risk.value}
            </div>
            <p className="text-xs font-bold text-slate-700 mt-1">
              Customer orders facing delivery risk
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Approaching due date or missing clean fabric
            </p>
          </div>

          {/* Card 3: Fabric Locked in Mill */}
          <div 
            onClick={() => setActiveTab('trends')}
            className={`p-6 rounded-3xl border-2 transition-all cursor-pointer shadow-sm ${
              activeTab === 'trends' 
                ? 'bg-blue-50 border-blue-400 ring-4 ring-blue-400/20' 
                : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-blue-700">Fabric on Hold</span>
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-black text-slate-900 tracking-tight">
              {summary.metrics.quarantine_quantity.value} {summary.metrics.quarantine_quantity.unit}
            </div>
            <p className="text-xs font-bold text-slate-700 mt-1">
              Locked meters (cannot be shipped)
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {summary.metrics.quarantine_quantity.rejected}m scrap • {summary.metrics.quarantine_quantity.rework}m waiting repair
            </p>
          </div>

          {/* Card 4: Confirmed Mill Costs */}
          <div 
            onClick={() => setActiveTab('costs')}
            className={`p-6 rounded-3xl border-2 transition-all cursor-pointer shadow-sm ${
              activeTab === 'costs' 
                ? 'bg-purple-50 border-purple-400 ring-4 ring-purple-400/20' 
                : 'bg-white border-slate-200 hover:border-purple-300 hover:bg-purple-50/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-purple-700">Logged Production Costs</span>
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-black text-purple-700 tracking-tight">
              {formatCurrency(summary.metrics.financial_exposure.recorded_total, summary.metrics.financial_exposure.currency)}
            </div>
            <p className="text-xs font-bold text-slate-700 mt-1">
              Confirmed invoices & labor logs
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              +{formatCurrency(summary.metrics.financial_exposure.estimated_total, summary.metrics.financial_exposure.currency)} estimated repair exposure
            </p>
          </div>
        </div>
      )}

      {/* Navigation Filter Bar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Tabs with Non-Technical Labels */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'alerts' 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <span>1. Urgent Alerts ({alerts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'orders' 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Package className="w-4 h-4 text-blue-400" />
            <span>2. Buyer Orders & Progress</span>
          </button>

          <button
            onClick={() => setActiveTab('trends')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'trends' 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>3. Quality Rates & Top Flaws</span>
          </button>

          <button
            onClick={() => setActiveTab('costs')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'costs' 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <IndianRupee className="w-4 h-4 text-purple-400" />
            <span>4. Mill Expenses & Invoices</span>
          </button>
        </div>

        {/* Quick Filter */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
          >
            <option value="">All Priorities</option>
            <option value="HIGH">High Priority Only</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="INFO">Informational</option>
          </select>

          <select
            value={orderFilter}
            onChange={(e) => setOrderFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
          >
            <option value="">All Orders</option>
            <option value="ORD-101">ORD-101 (Acme Apparel)</option>
            <option value="ORD-102">ORD-102 (Global Denim)</option>
            <option value="ORD-103">ORD-103 (Nordic Uniforms)</option>
          </select>

          {(severityFilter || orderFilter) && (
            <button
              onClick={clearFilters}
              className="text-xs text-blue-600 hover:underline font-bold px-2"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Content */}
      {isLoading ? (
        <LoadingState message="Connecting to mill database & calculating numbers..." />
      ) : (
        <div>
          {activeTab === 'alerts' && (
            <AlertList alerts={alerts} onAlertUpdated={loadAllData} />
          )}

          {activeTab === 'orders' && (
            <OrderProgressTable orders={orders} />
          )}

          {activeTab === 'trends' && trends && (
            <QualityTrendCharts data={trends} />
          )}

          {activeTab === 'costs' && costData && (
            <CostSummary
              costs={costData.costs}
              aggregated={costData.aggregated}
              onRefresh={loadAllData}
            />
          )}
        </div>
      )}
    </div>
  );
}
