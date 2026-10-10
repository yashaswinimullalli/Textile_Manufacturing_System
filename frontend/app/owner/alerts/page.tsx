'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Alert, AlertSeverity, AlertStatus } from '@/types/factory';
import AlertList from '@/components/owner/AlertList';
import LoadingState from '@/components/shared/LoadingState';
import ErrorState from '@/components/shared/ErrorState';
import { AlertOctagon, Filter, RefreshCw } from 'lucide-react';

export default function OwnerAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('OPEN');

  useEffect(() => {
    loadAlerts();
  }, [severityFilter, statusFilter]);

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getAlerts({
        severity: severityFilter || undefined,
        status: statusFilter || undefined
      });
      setAlerts(res.alerts || []);
    } catch (err: any) {
      setError(err.message || 'Could not load alerts.');
    } finally {
      setIsLoading(false);
    }
  };

  const openCount = alerts.filter(a => a.status === 'OPEN').length;
  const highCount = alerts.filter(a => a.severity === 'HIGH' && a.status !== 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center space-x-2 mb-1">
          <AlertOctagon className="w-5 h-5 text-rose-600" />
          <h1 className="text-xl font-medium text-slate-900">Alerts & Issues</h1>
        </div>
        <p className="text-sm text-slate-500">
          Quality issues and production problems requiring your decision.
        </p>
      </div>

      {/* Summary Chips */}
      <div className="flex flex-wrap gap-3">
        <div className="px-4 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-800">
          HIGH: {highCount} Open
        </div>
        <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-medium text-amber-800">
          PENDING: {openCount} Open
        </div>
        <div className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
          {alerts.length} Showing
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center space-x-2 text-xs font-medium text-slate-500">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open Only</option>
          <option value="ACKNOWLEDGED">In Progress</option>
          <option value="RESOLVED">Resolved</option>
        </select>

        <select
          value={severityFilter}
          onChange={e => setSeverityFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
        >
          <option value="">All Priorities</option>
          <option value="HIGH">High Priority</option>
          <option value="MEDIUM">Medium Priority</option>
          <option value="LOW">Low Priority</option>
          <option value="INFO">Info Only</option>
        </select>

        {(statusFilter !== 'OPEN' || severityFilter) && (
          <button
            onClick={() => { setSeverityFilter(''); setStatusFilter('OPEN'); }}
            className="text-xs text-blue-600 hover:underline font-medium"
          >
            Reset filters
          </button>
        )}

        <button
          onClick={loadAlerts}
          className="ml-auto p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Alert List */}
      {isLoading ? (
        <LoadingState message="Fetching quality alerts..." />
      ) : error ? (
        <ErrorState title="Could Not Load Alerts" message={error} onRetry={loadAlerts} />
      ) : (
        <AlertList alerts={alerts} onAlertUpdated={loadAlerts} />
      )}
    </div>
  );
}
