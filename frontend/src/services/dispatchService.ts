import { api } from '@/lib/api-client';

export const dispatchService = {
  async validateDispatch(rollCodes: string | string[], quantity?: number): Promise<{ all_eligible: boolean; results: any[] }> {
    return api.validateDispatch(rollCodes, quantity);
  },

  async executeDispatch(payload: { roll_code: string; quantity?: number; destination?: string; tracking_ref?: string }): Promise<any> {
    return api.executeDispatch(payload);
  }
};
