import { api } from '@/lib/api-client';
import { RollDetailResponse, Inspection } from '@/types/factory';

export const rollService = {
  async getRoll(rollCode: string): Promise<RollDetailResponse> {
    return api.getRoll(rollCode);
  },

  async getRollInspections(rollCode: string): Promise<{ roll_code: string; inspections: Inspection[] }> {
    return api.getRollInspections(rollCode);
  }
};
