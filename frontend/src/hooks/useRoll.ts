'use client';

import { useState, useEffect, useCallback } from 'react';
import { rollService } from '@/services/rollService';
import { RollDetailResponse, Inspection } from '@/types/factory';

export function useRoll(rollCode: string) {
  const [data, setData] = useState<RollDetailResponse | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRoll = useCallback(async () => {
    if (!rollCode) return;
    try {
      setIsLoading(true);
      setError(null);
      const [rollRes, inspRes] = await Promise.all([
        rollService.getRoll(rollCode),
        rollService.getRollInspections(rollCode)
      ]);
      setData(rollRes);
      setInspections(inspRes.inspections || []);
    } catch (err: any) {
      setError(err.message || `Roll ${rollCode} could not be loaded.`);
    } finally {
      setIsLoading(false);
    }
  }, [rollCode]);

  useEffect(() => {
    loadRoll();
  }, [loadRoll]);

  return {
    data,
    roll: data?.roll ?? null,
    order: data?.order ?? null,
    latestInspection: data?.latest_inspection ?? null,
    dispatchEligibility: data?.dispatch_eligibility ?? null,
    inspections,
    isLoading,
    error,
    refresh: loadRoll
  };
}
