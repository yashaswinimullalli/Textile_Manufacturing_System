'use client';

import { useState, useEffect, useCallback } from 'react';
import { costService } from '@/services/costService';
import { CostRecord } from '@/types/factory';

export function useCosts(filters: { orderId?: string; category?: string } = {}) {
  const [costs, setCosts] = useState<CostRecord[]>([]);
  const [aggregated, setAggregated] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCosts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await costService.getCosts(filters);
      setCosts(res.costs || []);
      setAggregated(res.aggregated || null);
    } catch (err: any) {
      setError(err.message || 'Could not load cost records.');
    } finally {
      setIsLoading(false);
    }
  }, [filters.orderId, filters.category]);

  useEffect(() => {
    loadCosts();
  }, [loadCosts]);

  return {
    costs,
    aggregated,
    isLoading,
    error,
    refresh: loadCosts
  };
}
