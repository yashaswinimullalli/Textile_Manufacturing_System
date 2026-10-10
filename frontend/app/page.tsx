'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Boxes,
  Layers,
  ArrowRight,
  ShieldAlert,
  Clock,
  PlusCircle,
  Activity,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { SupervisorDashboardMetrics } from '@/lib/types';
import { StatCard } from '@/components/ui/StatCard';
import { AlertBanner } from '@/components/ui/AlertBanner';

export default function HomePage() {
  const [metrics, setMetrics] = useState<SupervisorDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.getDashboardMetrics();
        setMetrics(data);
      } catch (err) {
        console.error('Failed to load portal metrics', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-xl p-6 text-white shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
              Factory Operations Command
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">FabricTrace Operations Portal</h1>
            <p className="mt-1 text-sm text-slate-300 max-w-2xl">
              Unified yarn inventory, production progress tracking, machine event logging, and downtime audit for textile manufacturing.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <span>Supervisor Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/storekeeper/receive-yarn"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4 text-teal-400" />
              <span>Receive Yarn</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Critical Inactivity Warning if detected (Point 5) */}
      {metrics?.possible_stoppages && metrics.possible_stoppages.length > 0 && (
        <AlertBanner
          type="warning"
          title="Possible Stoppage — Confirmation Required"
          message={`Machine ${metrics.possible_stoppages[0].machine_code} has had no recorded output for ${metrics.possible_stoppages[0].minutes_inactive} minutes. Note: This indicates an unverified dormancy interval, NOT a confirmed breakdown. Physical confirmation required.`}
          actionText="Inspect & Verify Machine"
          onAction={() => {
            window.location.href = '/production/machines';
          }}
        />
      )}

      {/* Top Level Operational Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Orders"
          value={loading ? '...' : metrics?.active_orders_count || 0}
          subtitle="Orders currently in production"
          icon={<ClipboardList className="h-5 w-5" />}
          variant="teal"
        />
        <StatCard
          title="Running Machines"
          value={loading ? '...' : `${metrics?.running_machines_count || 0} / 5`}
          subtitle={`${metrics?.stopped_machines_count || 0} machines currently stopped`}
          icon={<Activity className="h-5 w-5" />}
          variant={metrics && metrics.stopped_machines_count > 0 ? 'warning' : 'teal'}
        />
        <StatCard
          title="Recorded Downtime"
          value={loading ? '...' : `${metrics?.total_downtime_minutes || 0} min`}
          subtitle="Total shift stoppage duration"
          icon={<Clock className="h-5 w-5" />}
          variant="default"
        />
        <StatCard
          title="Low-Stock Batches"
          value={loading ? '...' : metrics?.low_stock_batch_count || 0}
          subtitle="Yarn batches below reorder threshold"
          icon={<Boxes className="h-5 w-5" />}
          variant={metrics && metrics.low_stock_batch_count > 0 ? 'danger' : 'default'}
        />
      </div>

      {/* Role Navigation Split Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Module A: Storekeeper Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:border-teal-400 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-teal-50 text-teal-700 rounded-lg">
                <Boxes className="h-6 w-6" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
                Module A
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Storekeeper — Yarn Inventory</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Record incoming raw yarn batches, track available stock in kg, audit transactions with immutable stock movement logs, and verify yarn sufficiency for production orders.
            </p>

            <div className="mt-4 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
                <span>Receive Yarn Batch with safe ledger transactions</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
                <span>Configurable low-stock reorder thresholds</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
                <span>Material availability checker for planned orders</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <Link
              href="/storekeeper/inventory"
              className="text-sm font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1.5"
            >
              <span>Open Yarn Inventory</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/storekeeper/receive-yarn"
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-medium shadow-sm transition-colors"
            >
              + Receive Batch
            </Link>
          </div>
        </div>

        {/* Module B: Production Supervisor Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:border-sky-400 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-sky-50 text-sky-700 rounded-lg">
                <Layers className="h-6 w-6" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
                Module B
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Production Supervisor — Orders & Machines</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Manage fabric work orders, assign weaving looms and shifts, log production output increments, record timestamped machine events, and run the demo stoppage simulator.
            </p>

            <div className="mt-4 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sky-600" />
                <span>Target vs. produced quantity tracking with deadline flags</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sky-600" />
                <span>Machine event timeline & demo stoppage simulator</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sky-600" />
                <span>Inactivity stoppage warning (&gt;60m missing output)</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <Link
              href="/production/orders"
              className="text-sm font-semibold text-sky-700 hover:text-sky-900 flex items-center gap-1.5"
            >
              <span>View Production Orders</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/production/machine-events"
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Activity className="h-3.5 w-3.5 text-teal-400" />
              <span>Demo Simulator</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
