'use client';

import { useState, useEffect, useCallback } from 'react';
import { ownerService } from '@/services/ownerService';
import { Alert } from '@/types/factory';

export function useAlerts(filters?: { status?: string; severity?: string; order_id?: string }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await ownerService.getAlerts(filters);
      setAlerts(res.alerts || []);
    } catch (err: any) {
      setError(err.message || 'Could not load alerts.');
    } finally {
      setIsLoading(false);
    }
  }, [filters?.status, filters?.severity, filters?.order_id]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const acknowledgeAlert = async (alertId: string, notes?: string) => {
    await ownerService.updateAlertStatus(alertId, 'ACKNOWLEDGED', notes || 'Acknowledged by user');
    await loadAlerts();
  };

  const resolveAlert = async (alertId: string, notes: string) => {
    await ownerService.updateAlertStatus(alertId, 'RESOLVED', notes);
    await loadAlerts();
  };

  return {
    alerts,
    isLoading,
    error,
    refresh: loadAlerts,
    acknowledgeAlert,
    resolveAlert
  };
}
