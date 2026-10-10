import { api } from '@/lib/api-client';
import { DemoRole } from '@/types/factory';
import { DEMO_ACTORS } from '@/lib/permissions';

export const authService = {
  getRole(): DemoRole {
    return api.getRole();
  },

  setRole(role: DemoRole): void {
    api.setRole(role);
  },

  getCurrentActor() {
    const role = api.getRole();
    return DEMO_ACTORS[role];
  },

  async resetDemoData(): Promise<{ success: boolean; message: string }> {
    return api.resetDemoData();
  }
};
