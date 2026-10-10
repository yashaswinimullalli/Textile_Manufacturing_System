'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { AuditEvent } from '@/types/factory';
import { formatDate } from '@/lib/formatters';
import LoadingState from '../shared/LoadingState';
import { 
  History, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Clock, 
  User, 
  Search,
  Filter,
  CheckCircle2,
  FileCode,
  Lock
} from 'lucide-react';

export default function AuditTimeline() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [searchEntityId, setSearchEntityId] = useState('');

  useEffect(() => {
    fetchEvents();
  }, [actionFilter, entityTypeFilter]);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const res = await api.getAuditTrail({
        action: actionFilter || undefined,
        entityType: entityTypeFilter || undefined
      });
      setEvents(res.events || []);
    } catch (err) {
      console.error('Error fetching audit trail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getFriendlyAction = (action: string) => {
    switch (action) {
      case 'INSPECTION_CREATED':
        return { label: 'Quality Check Saved', badge: 'bg-blue-100 text-blue-800' };
      case 'DISPATCH_COMPLETED':
        return { label: 'Truck Loaded & Shipped', badge: 'bg-emerald-100 text-emerald-800' };
      case 'DISPATCH_BLOCKED':
        return { label: 'Blocked Shipping Attempt', badge: 'bg-rose-100 text-rose-800' };
      case 'ALERT_STATUS_CHANGED':
        return { label: 'Alert Updated', badge: 'bg-amber-100 text-amber-800' };
      case 'COST_RECORDED':
        return { label: 'Expense Bill Logged', badge: 'bg-purple-100 text-purple-800' };
      case 'INITIAL_SEED':
        return { label: 'Mill Starting Data Seeded', badge: 'bg-slate-100 text-slate-800' };
      default:
        return { label: action.replace(/_/g, ' '), badge: 'bg-slate-100 text-slate-800' };
    }
  };

  const filteredEvents = searchEntityId
    ? events.filter(e => e.entity_id.toLowerCase().includes(searchEntityId.toLowerCase()) || e.actor_name.toLowerCase().includes(searchEntityId.toLowerCase()) || e.reason.toLowerCase().includes(searchEntityId.toLowerCase()))
    : events;

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white border border-slate-700 shadow-xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-700 text-slate-300 text-xs font-bold mb-3">
            <History className="w-3.5 h-3.5 text-teal-400" />
            <span>Immutable History • Unchangeable Mill Records</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Mill Activity Log
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Every inspection result, truck loading attempt, cost entry, and alert resolution is permanently recorded here. Nobody can delete or secretly alter past actions.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
          >
            <option value="">All Activity Types</option>
            <option value="INSPECTION_CREATED">Quality Inspections</option>
            <option value="DISPATCH_COMPLETED">Successful Shipments</option>
            <option value="DISPATCH_BLOCKED">Blocked Shipping Attempts</option>
            <option value="ALERT_STATUS_CHANGED">Alert Updates</option>
            <option value="COST_RECORDED">Expense Logs</option>
          </select>

          <select
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
          >
            <option value="">All Items</option>
            <option value="inspection">Inspections</option>
            <option value="dispatch">Dispatches</option>
            <option value="alert">Alerts</option>
            <option value="cost">Costs</option>
            <option value="roll">Rolls</option>
          </select>

          <div className="relative">
            <input
              type="text"
              placeholder="Search by Person or Roll ID..."
              value={searchEntityId}
              onChange={(e) => setSearchEntityId(e.target.value)}
              className="pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3.5" />
          </div>
        </div>

        <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full self-start">
          Showing {filteredEvents.length} recorded events
        </span>
      </div>

      {/* Audit Timeline Rows */}
      {isLoading ? (
        <LoadingState message="Fetching immutable activity records..." />
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900">No Records Found</h3>
          <p className="text-xs text-slate-500 mt-1">No activities match your filter.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
          {filteredEvents.map((evt) => {
            const isExpanded = expandedId === evt.id;
            const actionInfo = getFriendlyAction(evt.action);

            return (
              <div key={evt.id} className="p-5 hover:bg-slate-50/80 transition">
                <div 
                  onClick={() => toggleExpand(evt.id)}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${actionInfo.badge}`}>
                          {actionInfo.label}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">{evt.reason}</h4>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                        <span>Person: <strong className="text-slate-800">{evt.actor_name}</strong></span>
                        <span>Item / Target: <strong className="font-mono text-slate-700">{evt.entity_type} {evt.entity_id}</strong></span>
                        <span>Time: <strong>{formatDate(evt.timestamp)}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end md:self-center">
                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                      {isExpanded ? 'Hide Details' : 'Show Diff Details'}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </div>

                {/* Expanded Technical Diff View */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs animate-in fade-in duration-150">
                    <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono">
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 flex items-center space-x-1">
                        <FileCode className="w-3.5 h-3.5 text-rose-400" />
                        <span>State Before Change (Old Data)</span>
                      </div>
                      <pre className="text-[11px] overflow-x-auto text-rose-300">
                        {evt.before_json ? JSON.stringify(evt.before_json, null, 2) : '// None (New item created)'}
                      </pre>
                    </div>

                    <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono">
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 flex items-center space-x-1">
                        <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                        <span>State After Change (New Data)</span>
                      </div>
                      <pre className="text-[11px] overflow-x-auto text-emerald-300">
                        {evt.after_json ? JSON.stringify(evt.after_json, null, 2) : '// Record unchanged or closed'}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
