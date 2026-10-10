// Centralized API client for FabricTrace with role context and demo state support
import { DemoRole, RollDetailResponse, QualitySummaryResponse, OwnerSummaryResponse, OwnerOrderProgress, QualityTrendsResponse, Alert, CostRecord, AuditEvent, Inspection } from '@/types/factory';
import { DEMO_ACTORS } from './permissions';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private currentRole: DemoRole = 'QUALITY_INSPECTOR';

  setRole(role: DemoRole) {
    this.currentRole = role;
    if (typeof window !== 'undefined') {
      localStorage.setItem('fabrictrace_demo_role', role);
    }
  }

  getRole(): DemoRole {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fabrictrace_demo_role') as DemoRole;
      if (saved && ['QUALITY_INSPECTOR', 'OWNER', 'DISPATCH_OFFICER'].includes(saved)) {
        this.currentRole = saved;
      }
    }
    return this.currentRole;
  }

  private getHeaders(): HeadersInit {
    const role = this.getRole();
    const actor = DEMO_ACTORS[role];
    return {
      'Content-Type': 'application/json',
      'x-actor-role': actor.role,
      'x-actor-id': actor.id,
      'x-actor-name': actor.name
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers = { ...this.getHeaders(), ...options.headers };

    try {
      const res = await fetch(url, { ...options, headers });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const error = new Error(data.message || `API request failed with status ${res.status}`);
        (error as any).status = res.status;
        (error as any).data = data;
        throw error;
      }

      return data as T;
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message?.includes('fetch')) {
        throw new Error(`Cannot reach FabricTrace API at ${API_BASE}. Ensure the backend server is running.`);
      }
      throw err;
    }
  }

  // --- Quality Inspector Methods ---
  async getQualitySummary(): Promise<QualitySummaryResponse> {
    return this.request<QualitySummaryResponse>('/quality/summary');
  }

  async getReinspectionQueue(): Promise<{ queue: any[] }> {
    return this.request<{ queue: any[] }>('/quality/reinspection-queue');
  }

  async getRoll(rollCode: string): Promise<RollDetailResponse> {
    return this.request<RollDetailResponse>(`/rolls/${encodeURIComponent(rollCode.trim())}`);
  }

  async getRollInspections(rollCode: string): Promise<{ roll_code: string; inspections: Inspection[] }> {
    return this.request<{ roll_code: string; inspections: Inspection[] }>(`/rolls/${encodeURIComponent(rollCode.trim())}/inspections`);
  }

  async createInspection(rollCode: string, payload: any): Promise<{ inspection: Inspection; receipt: any }> {
    return this.request<{ inspection: Inspection; receipt: any }>(`/rolls/${encodeURIComponent(rollCode.trim())}/inspections`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // --- Owner Methods ---
  async getOwnerSummary(): Promise<OwnerSummaryResponse> {
    return this.request<OwnerSummaryResponse>('/owner/summary');
  }

  async getAlerts(filters: { status?: string; severity?: string } = {}): Promise<{ alerts: Alert[] }> {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.severity) params.append('severity', filters.severity);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ alerts: Alert[] }>(`/owner/alerts${query}`);
  }

  async updateAlertStatus(alertId: string, status: string, resolution_notes?: string): Promise<{ alert: Alert }> {
    return this.request<{ alert: Alert }>(`/owner/alerts/${alertId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, resolution_notes })
    });
  }

  async getOwnerOrders(): Promise<{ orders: OwnerOrderProgress[] }> {
    return this.request<{ orders: OwnerOrderProgress[] }>('/owner/orders');
  }

  async getQualityTrends(): Promise<QualityTrendsResponse> {
    return this.request<QualityTrendsResponse>('/owner/quality-trends');
  }

  async getOwnerCosts(filters: { orderId?: string; category?: string } = {}): Promise<{ costs: CostRecord[]; aggregated: any }> {
    const params = new URLSearchParams();
    if (filters.orderId) params.append('orderId', filters.orderId);
    if (filters.category) params.append('category', filters.category);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ costs: CostRecord[]; aggregated: any }>(`/owner/costs${query}`);
  }

  async addCostRecord(payload: any): Promise<{ cost: CostRecord }> {
    return this.request<{ cost: CostRecord }>('/owner/costs', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // --- Dispatch Safety Gate Methods ---
  async validateDispatch(rollCodes: string | string[], quantity?: number): Promise<{ all_eligible: boolean; results: any[] }> {
    const payload = Array.isArray(rollCodes) ? { roll_codes: rollCodes } : { roll_code: rollCodes, quantity };
    return this.request<{ all_eligible: boolean; results: any[] }>('/dispatch/validate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async executeDispatch(payload: { roll_code: string; quantity?: number; destination?: string; tracking_ref?: string }): Promise<any> {
    return this.request<any>('/dispatch', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // --- Audit Methods ---
  async getAuditTrail(filters: { entityType?: string; entityId?: string; action?: string } = {}): Promise<{ events: AuditEvent[] }> {
    const params = new URLSearchParams();
    if (filters.entityType) params.append('entityType', filters.entityType);
    if (filters.entityId) params.append('entityId', filters.entityId);
    if (filters.action) params.append('action', filters.action);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ events: AuditEvent[] }>(`/audit${query}`);
  }

  // --- Demo Reset ---
  async resetDemoData(): Promise<any> {
    return this.request<any>('/demo/reset', { method: 'POST' });
  }
}

export const api = new ApiClient();
