import { DemoRole } from '@/types/factory';

export interface RoleCapability {
  canInspect: boolean;
  canViewOwnerDashboard: boolean;
  canRecordCosts: boolean;
  canManageAlerts: boolean;
  canDispatch: boolean;
  canViewAudit: boolean;
  description: string;
}

export const ROLE_DEFINITIONS: Record<DemoRole, RoleCapability> = {
  QUALITY_INSPECTOR: {
    canInspect: true,
    canViewOwnerDashboard: false,
    canRecordCosts: false,
    canManageAlerts: false,
    canDispatch: false,
    canViewAudit: true,
    description: "Floor Quality Specialist. Can perform inspections and lookup rolls. Cannot dispatch or edit costs."
  },
  OWNER: {
    canInspect: false,
    canViewOwnerDashboard: true,
    canRecordCosts: true,
    canManageAlerts: true,
    canDispatch: false,
    canViewAudit: true,
    description: "Factory Owner & Accounts. Can review alerts, order progress, costs, trends. Cannot modify inspection outcomes."
  },
  DISPATCH_OFFICER: {
    canInspect: false,
    canViewOwnerDashboard: false,
    canRecordCosts: false,
    canManageAlerts: false,
    canDispatch: true,
    canViewAudit: true,
    description: "Logistics Lead. Executes verified dispatches governed by the server-side Dispatch Safety Gate."
  }
};

export const DEMO_ACTORS: Record<DemoRole, { id: string; name: string; role: DemoRole; title: string }> = {
  QUALITY_INSPECTOR: {
    id: "inspector_alex",
    name: "Alex Kumar",
    role: "QUALITY_INSPECTOR",
    title: "Lead Quality Inspector"
  },
  OWNER: {
    id: "owner_sarah",
    name: "Sarah Chen",
    role: "OWNER",
    title: "Managing Director / Owner"
  },
  DISPATCH_OFFICER: {
    id: "dispatch_raj",
    name: "Rajesh V",
    role: "DISPATCH_OFFICER",
    title: "Logistics & Dispatch Lead"
  }
};
