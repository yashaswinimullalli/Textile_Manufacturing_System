import { api } from '@/lib/api-client';
import { CostRecord } from '@/types/factory';

export const costService = {
  async getCosts(filters: { orderId?: string; category?: string } = {}): Promise<{ costs: CostRecord[]; aggregated: any }> {
    return api.getOwnerCosts(filters);
  },

  async addCost(payload: any): Promise<{ cost: CostRecord }> {
    return api.addCostRecord(payload);
  }
};
