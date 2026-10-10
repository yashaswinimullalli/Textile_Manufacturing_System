'use client';

import { useState } from 'react';
import { inspectionService } from '@/services/inspectionService';

export function useInspection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<any | null>(null);

  const submitInspection = async (rollCode: string, payload: any) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await inspectionService.createInspection(rollCode, payload);
      setReceipt(res.receipt);
      return res;
    } catch (err: any) {
      setError(err.message || 'Inspection submission failed.');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitInspection,
    isSubmitting,
    error,
    receipt,
    clearReceipt: () => setReceipt(null)
  };
}
