import { api } from '@/lib/api-client';
import { Inspection, QualitySummaryResponse, QualityTrendsResponse } from '@/types/factory';

export const inspectionService = {
  async createInspection(rollCode: string, payload: any): Promise<{ inspection: Inspection; receipt: any }> {
    return api.createInspection(rollCode, payload);
  },

  async getReinspectionQueue(): Promise<{ queue: any[] }> {
    return api.getReinspectionQueue();
  },

  async getQualitySummary(): Promise<QualitySummaryResponse> {
    return api.getQualitySummary();
  },

  async getQualityTrends(): Promise<QualityTrendsResponse> {
    return api.getQualityTrends();
  }
};
