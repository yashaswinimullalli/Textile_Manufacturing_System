import { api } from '@/lib/api-client';
import { OwnerSummaryResponse, Alert } from '@/types/factory';

export const ownerService = {
  async getOwnerSummary(): Promise<OwnerSummaryResponse> {
    return api.getOwnerSummary();
  },

  async getAlerts(filters: { status?: string; severity?: string } = {}): Promise<{ alerts: Alert[] }> {
    return api.getAlerts(filters);
  },

  async updateAlertStatus(alertId: string, status: string, notes?: string): Promise<{ alert: Alert }> {
    return api.updateAlertStatus(alertId, status, notes);
  }
};
