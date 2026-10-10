'use client';

import { useState, useEffect, useCallback } from 'react';
import { orderService } from '@/services/orderService';
import { OwnerOrderProgress } from '@/types/factory';

export function useOrders() {
  const [orders, setOrders] = useState<OwnerOrderProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await orderService.getOrders();
      setOrders(res.orders || []);
    } catch (err: any) {
      setError(err.message || 'Could not load order progress.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return {
    orders,
    isLoading,
    error,
    refresh: loadOrders
  };
}
