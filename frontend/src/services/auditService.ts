import { api } from '@/lib/api-client';
import { AuditEvent } from '@/types/factory';

export const auditService = {
  async getAuditTrail(filters: { entityType?: string; entityId?: string; action?: string } = {}): Promise<{ events: AuditEvent[] }> {
    return api.getAuditTrail(filters);
  }
};
