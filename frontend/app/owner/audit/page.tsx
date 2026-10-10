'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { AuditEvent } from '@/types/factory';
import LoadingState from '@/components/shared/LoadingState';
import ErrorState from '@/components/shared/ErrorState';
import { formatDate } from '@/lib/formatters';
import {
  History,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
  Tag
} from 'lucide-react';

function AuditEventCard({ event }: { event: AuditEvent }) {
  const [expanded, setExpanded] = useState(false);

  const actionColor: Record<string, string> = {
    INSPECTION_CREATED: 'bg-blue-50 text-blue-700 border-blue-200',
    DISPATCH_EXECUTED: 'bg-purple-50 text-purple-700 border-purple-200',
    ALERT_UPDATED: 'bg-amber-50 text-amber-700 border-amber-200',
    COST_RECORDED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  const badgeClass = actionColor[event.action] || 'bg-slate-100 text-slate-700 border-slate-200';

  const roleLabel: Record<string, string> = {
    QUALITY_INSPECTOR: 'Inspector',
    OWNER: 'Owner',
    DISPATCH_OFFICER: 'Dispatch Officer',
    ADMIN: 'Admin'
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div
        className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/60 transition"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start sm:items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-900">{event.actor_name}</span>
              <span className="text-[10px] font-medium text-slate-500">{roleLabel[event.actor_role] || event.actor_role}</span>
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-medium uppercase border ${badgeClass}`}>
                {event.action.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
              <span className="text-xs text-slate-600 font-medium">
                <Tag className="w-3 h-3 inline mr-0.5 text-slate-400" />
                {event.entity_type}: <span className="font-mono font-medium">{event.entity_id}</span>
              </span>
              {event.reason && (
                <span className="text-[11px] text-slate-500 font-medium">"{event.reason}"</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <div className="text-right">
            <div className="text-[11px] text-slate-500 font-medium flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{formatDate(event.timestamp)}</span>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600 transition">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (event.before_json || event.after_json) && (
        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            {event.before_json && (
              <div>
                <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-2">Before</div>
                <pre className="bg-white border border-slate-200 rounded-xl p-3 text-[10px] text-slate-700 overflow-x-auto leading-relaxed">
                  {JSON.stringify(event.before_json, null, 2)}
                </pre>
              </div>
            )}
            {event.after_json && (
              <div>
                <div className="text-[10px] font-medium uppercase tracking-wider text-emerald-600 mb-2">After</div>
                <pre className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-[10px] text-slate-700 overflow-x-auto leading-relaxed">
                  {JSON.stringify(event.after_json, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OwnerAuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    loadAudit();
  }, [entityTypeFilter, actionFilter]);

  const loadAudit = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getAuditTrail({
        entityType: entityTypeFilter || undefined,
        action: actionFilter || undefined
      });
      setEvents(res.events || []);
    } catch (err: any) {
      setError(err.message || 'Could not load audit trail.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <History className="w-5 h-5 text-slate-700" />
            <h1 className="text-xl font-medium text-slate-900">Audit History</h1>
          </div>
          <p className="text-sm text-slate-500">
            Complete record of who performed what actions, when, and what changed.
          </p>
        </div>
        <button onClick={loadAudit} className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 transition">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center space-x-2 text-xs font-medium text-slate-500">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        <select
          value={entityTypeFilter}
          onChange={e => setEntityTypeFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
        >
          <option value="">All Records</option>
          <option value="roll">Roll Records</option>
          <option value="inspection">Inspection Records</option>
          <option value="alert">Alert Records</option>
          <option value="cost">Cost Records</option>
        </select>

        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
        >
          <option value="">All Actions</option>
          <option value="INSPECTION_CREATED">Inspection Created</option>
          <option value="DISPATCH_EXECUTED">Dispatch Executed</option>
          <option value="ALERT_UPDATED">Alert Updated</option>
          <option value="COST_RECORDED">Cost Recorded</option>
        </select>

        {(entityTypeFilter || actionFilter) && (
          <button
            onClick={() => { setEntityTypeFilter(''); setActionFilter(''); }}
            className="text-xs text-blue-600 hover:underline font-medium"
          >
            Reset filters
          </button>
        )}

        <div className="ml-auto text-xs text-slate-400 font-medium">
          {events.length} event{events.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Audit Events */}
      {isLoading ? (
        <LoadingState message="Loading audit trail..." />
      ) : error ? (
        <ErrorState title="Could Not Load Audit Trail" message={error} onRetry={loadAudit} />
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
          <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-slate-700">No audit events found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or perform some actions to see the audit trail.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <AuditEventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
