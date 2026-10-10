'use client';

import { useState, useEffect, useCallback } from 'react';
import { ownerService } from '@/services/ownerService';
import { OwnerSummaryResponse } from '@/types/factory';

export function useOwnerSummary() {
  const [summary, setSummary] = useState<OwnerSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await ownerService.getOwnerSummary();
      setSummary(res);
    } catch (err: any) {
      setError(err.message || 'Could not load executive summary.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return { summary, isLoading, error, refresh: loadSummary };
}
