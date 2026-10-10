'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Alert, AlertStatus, AlertSeverity } from '@/types/factory';
import { api } from '@/lib/api-client';
import { formatDate } from '@/lib/formatters';
import { 
  AlertOctagon, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  HelpCircle,
  Lightbulb
} from 'lucide-react';

interface AlertListProps {
  alerts: Alert[];
  onAlertUpdated?: () => void;
}

export default function AlertList({ alerts, onAlertUpdated }: AlertListProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleQuickAcknowledge = async (alertId: string) => {
    try {
      setUpdatingId(alertId);
      await api.updateAlertStatus(alertId, 'ACKNOWLEDGED', 'Seen by Owner');
      if (onAlertUpdated) onAlertUpdated();
    } catch (err: any) {
      alert(`Could not update alert: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    const note = prompt('What action was taken to solve this problem?', 'Replacement scheduled and team notified');
    if (!note) return;

    try {
      setUpdatingId(alertId);
      await api.updateAlertStatus(alertId, 'RESOLVED', note);
      if (onAlertUpdated) onAlertUpdated();
    } catch (err: any) {
      alert(`Could not resolve alert: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'LOW':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-900 border-slate-300';
    }
  };

  if (!alerts || alerts.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-900">No Active Quality Issues</h3>
        <p className="text-xs text-slate-500 mt-1">All fabric rolls and customer orders are running normally.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <h2 className="text-lg font-black text-slate-900">
            Actionable Production Alerts
          </h2>
          <p className="text-xs text-slate-500">
            Issues identified in the mill that need an owner or manager decision
          </p>
        </div>
        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3.5 py-1.5 rounded-full self-start">
          {alerts.length} Total Alerts Logged
        </span>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => {
          const isHigh = alert.severity === 'HIGH';
          const isUpdating = updatingId === alert.id;
          const isResolved = alert.status === 'RESOLVED';

          return (
            <div
              key={alert.id}
              className={`p-6 rounded-3xl border-2 transition-all ${
                isResolved
                  ? 'bg-slate-50/70 border-slate-200 opacity-60'
                  : isHigh
                    ? 'bg-rose-50/50 border-rose-300 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${
                    isHigh ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {isHigh ? <AlertOctagon className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getSeverityBadge(alert.severity)}`}>
                        {alert.severity === 'HIGH' ? 'HIGH PRIORITY' : alert.severity === 'MEDIUM' ? 'MEDIUM' : 'INFO'}
                      </span>
                      <h3 className="text-sm font-black text-slate-900">{alert.title}</h3>
                      <span className="text-[11px] font-mono font-bold text-slate-400">({alert.id})</span>
                    </div>

                    <p className="text-xs text-slate-800 leading-relaxed font-bold">
                      {alert.reason}
                    </p>

                    {/* What should I do? Box - Super friendly for non-technical users */}
                    {alert.suggested_action && (
                      <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-start space-x-2 text-xs">
                        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-800">Recommended Action: </span>
                          <span className="text-slate-600 font-medium">{alert.suggested_action}</span>
                        </div>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 font-medium">
                      <span>Affected: <strong className="text-slate-800">{alert.source_record_id}</strong></span>
                      <span>Order: <strong className="text-slate-800">{alert.order_id}</strong></span>
                      <span>Assigned To: <strong className="text-slate-800">{alert.assigned_to}</strong></span>
                      <span>Reported: <strong className="text-slate-700">{formatDate(alert.created_at)}</strong></span>
                    </div>

                    {alert.resolution_notes && (
                      <div className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 font-medium">
                        Solution noted: {alert.resolution_notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex flex-wrap items-center gap-2 self-end lg:self-start shrink-0 pt-2 lg:pt-0">
                  {alert.source_record_type === 'roll' && (
                    <Link
                      href={`/rolls/${alert.source_record_id}`}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
                    >
                      <span>Open Roll Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  {alert.status === 'OPEN' && (
                    <button
                      onClick={() => handleQuickAcknowledge(alert.id)}
                      disabled={isUpdating}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition"
                    >
                      Mark Seen
                    </button>
                  )}

                  {!isResolved && (
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      disabled={isUpdating}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
                    >
                      Mark Solved
                    </button>
                  )}

                  <span className={`px-3 py-1 rounded-full text-xs font-black ${
                    isResolved
                      ? 'bg-emerald-100 text-emerald-800'
                      : alert.status === 'ACKNOWLEDGED'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                  }`}>
                    {isResolved ? 'Solved' : alert.status === 'ACKNOWLEDGED' ? 'In Progress' : 'Open'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
