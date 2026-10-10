import { api } from '@/lib/api-client';
import { OwnerOrderProgress } from '@/types/factory';

export const orderService = {
  async getOrders(): Promise<{ orders: OwnerOrderProgress[] }> {
    return api.getOwnerOrders();
  }
};
