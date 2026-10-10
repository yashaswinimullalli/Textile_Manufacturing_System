'use client';

import { useState, useEffect, useCallback } from 'react';
import { auditService } from '@/services/auditService';
import { AuditEvent } from '@/types/factory';

export function useAudit(filters: { entityType?: string; entityId?: string; action?: string } = {}) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAudit = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await auditService.getAuditTrail(filters);
      setEvents(res.events || []);
    } catch (err: any) {
      setError(err.message || 'Could not load audit log.');
    } finally {
      setIsLoading(false);
    }
  }, [filters.entityType, filters.entityId, filters.action]);

  useEffect(() => {
    loadAudit();
  }, [loadAudit]);

  return {
    events,
    isLoading,
    error,
    refresh: loadAudit
  };
}
