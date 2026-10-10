// FabricTrace Quality Inspection TypeScript Interfaces

export type InspectionDisposition =
  | 'PENDING_INSPECTION'
  | 'ON_HOLD'
  | 'PASSED'
  | 'PARTIALLY_ACCEPTED'
  | 'REJECTED';

export type InspectionStage = 'INITIAL' | 'REINSPECTION' | 'AUDIT';

export type SpecCheckResult = 'Pass' | 'Fail' | 'Not Tested';

export type PackagingCondition = 'Acceptable' | 'Damaged';
export type ContaminationObserved = 'Not observed' | 'Observed';
export type VisualQuality = 'Acceptable' | 'Issue found';

export interface SpecCheckItem {
  id: string;
  test_name: string;
  expected_spec: string;
  actual_value: string | number | null;
  unit: string;
  result: SpecCheckResult;
  is_mandatory: boolean;
  remarks?: string;
}

export interface QualityInspection {
  id: string;
  batch_id: string;
  batch_code?: string;
  barcode?: string;
  supplier?: string;
  yarn_type?: string;
  colour?: string;
  inspection_number: number;
  stage: InspectionStage;
  inspector_name: string;
  inspection_date: string;

  // Visual observations
  packaging_condition: PackagingCondition;
  visible_contamination: ContaminationObserved;
  colour_consistency: VisualQuality;
  yarn_appearance: VisualQuality;
  visual_remarks?: string;
  defect_description?: string;
  photo_url?: string;

  // Lab / specification checks
  spec_checks: SpecCheckItem[];
  supplier_cert_ref?: string;

  // Decision & quantities
  decision: InspectionDisposition;
  quantity_inspected: number;
  quantity_approved: number;
  quantity_held: number;
  quantity_rejected: number;
  decision_reason?: string;
  reinspection_reason?: string;

  created_at: string;
}
