// Shared TypeScript interfaces for FabricTrace

export type DecisionType = 'PASS' | 'REWORK' | 'REJECT';

export type OperationalStatus = 
  | 'NEEDS_INSPECTION'
  | 'PASSED'
  | 'REWORK_REQUIRED'
  | 'REJECTED'
  | 'DISPATCHED';

export type DefectType = 
  | 'none'
  | 'hole/tear'
  | 'stain/oil'
  | 'shade or colour variation'
  | 'weaving/knitting defect'
  | 'width/measurement issue'
  | 'contamination'
  | 'other';

export type DefectSeverity = 'none' | 'low' | 'medium' | 'high' | 'critical';

export type AlertSeverity = 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export type CostCategory = 'material' | 'labour' | 'machine/overhead' | 'rework' | 'transport';

export type DemoRole = 'QUALITY_INSPECTOR' | 'OWNER' | 'DISPATCH_OFFICER';

export interface UserActor {
  id: string;
  name: string;
  role: DemoRole;
}

export interface Roll {
  id: string;
  roll_code: string;
  order_id: string;
  fabric_type: string;
  produced_quantity: number;
  dispatched_quantity: number;
  remaining_quantity?: number;
  unit: string;
  operational_status: OperationalStatus;
  machine_id: string;
  shift: string;
  yarn_batch: string;
  operator_name: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_code: string;
  customer_reference: string;
  target_quantity: number;
  unit: string;
  due_date: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  created_at: string;
}

export interface Inspection {
  id: string;
  roll_id: string;
  inspector_user_id: string;
  inspector_name: string;
  decision: DecisionType;
  defect_type: DefectType;
  affected_quantity: number;
  unit: string;
  severity: DefectSeverity;
  location: string;
  notes: string;
  photo_url?: string | null;
  prior_inspection_id?: string | null;
  created_at: string;
}

export interface DispatchEligibility {
  eligible: boolean;
  reason: string;
}

export interface RollDetailResponse {
  roll: Roll;
  order: Order | null;
  latest_inspection: Inspection | null;
  inspections_count: number;
  dispatch_eligibility: DispatchEligibility;
}

export interface Alert {
  id: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  reason: string;
  source_record_type: string;
  source_record_id: string;
  order_id: string;
  created_at: string;
  status: AlertStatus;
  assigned_to: string;
  suggested_action: string;
  resolution_notes?: string | null;
}

export interface CostRecord {
  id: string;
  order_id: string;
  category: CostCategory;
  amount: number;
  currency: string;
  recorded_at: string;
  source_reference: string;
  is_estimated: boolean;
  status: string;
  notes?: string;
}

export interface AuditEvent {
  id: string;
  actor_user_id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  before_json: any;
  after_json: any;
  reason: string;
  timestamp: string;
  request_id: string;
}

export interface QualitySummaryResponse {
  counts: {
    needs_inspection: number;
    rework_due: number;
    recently_rejected: number;
    inspected_today: number;
  };
  recent_activity: {
    inspection_id: string;
    roll_code: string;
    roll_id: string;
    decision: DecisionType;
    defect_type: string;
    affected_quantity: number;
    unit: string;
    inspector: string;
    timestamp: string;
  }[];
}

export interface OwnerSummaryResponse {
  date_range: { from: string; to: string };
  metrics: {
    urgent_alerts: { value: number; label: string; definition: string };
    orders_at_risk: { value: number; label: string; definition: string };
    quarantine_quantity: { value: number; rejected: number; rework: number; unit: string; label: string; definition: string };
    financial_exposure: { recorded_total: number; estimated_total: number; total_costs: number; currency: string; label: string; definition: string };
    overall_pass_rate: { value: string; label: string; definition: string };
  };
}

export interface OwnerOrderProgress {
  order_id: string;
  order_code: string;
  customer_reference: string;
  target_quantity: number;
  unit: string;
  due_date: string;
  status: string;
  produced_quantity: number;
  passed_quantity: number;
  dispatched_quantity: number;
  rework_quantity: number;
  rejected_quantity: number;
  remaining_target: number;
  completion_percentage: string;
  roll_count: number;
}

export interface QualityTrendsResponse {
  caveat_note: string;
  summary: {
    total_inspection_events: number;
    unique_rolls_tested: number;
    pass_rate: string;
    rework_rate: string;
    reject_rate: string;
    total_affected_quantity: number;
    unit: string;
  };
  defect_categories: {
    defect_type: string;
    incident_count: number;
    affected_quantity: number;
    unit: string;
  }[];
  recent_trend_data: {
    id: string;
    roll_id: string;
    decision: DecisionType;
    defect_type: string;
    affected_quantity: number;
    timestamp: string;
  }[];
}
