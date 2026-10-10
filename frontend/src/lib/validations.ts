import { DecisionType, DefectType } from '@/types/factory';

export const CONTROLLED_DEFECT_TYPES: { value: DefectType; label: string; description: string }[] = [
  { value: 'none', label: 'No Defects (Clean Fabric)', description: 'Uniform structure, perfect surface, ready to pack' },
  { value: 'stain/oil', label: 'Oil / Grease Spot', description: 'Machine oil spots or dirty grease on cloth' },
  { value: 'hole/tear', label: 'Hole / Torn Fabric', description: 'Cut or torn cloth, needle puncture, broken threads' },
  { value: 'shade or colour variation', label: 'Wrong Color / Shade Mismatch', description: 'Uneven dyeing, streaky color, lot mismatch' },
  { value: 'weaving/knitting defect', label: 'Weave Defect / Broken Pick', description: 'Loose knot, missing pick, slub, dropped stitch' },
  { value: 'width/measurement issue', label: 'Incorrect Fabric Width', description: 'Cloth is too wide, too narrow, or uneven edge' },
  { value: 'contamination', label: 'Foreign Dirt / Foreign Fibers', description: 'Plastic bits, foreign yarn, or dust contamination' },
  { value: 'other', label: 'Other Documented Flaw', description: 'Any other defect not listed above' }
];

export interface InspectionFormValues {
  decision: DecisionType;
  defect_type: DefectType;
  affected_quantity: number | string;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  location: string;
  notes: string;
}

export function validateInspectionForm(values: InspectionFormValues, rollQuantity: number): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!values.decision) {
    errors.decision = 'Please pick a decision (Pass, Rework, or Reject).';
  }

  const qty = Number(values.affected_quantity);
  if (values.affected_quantity === '' || isNaN(qty)) {
    errors.affected_quantity = 'Please enter how many meters are affected.';
  } else if (qty < 0) {
    errors.affected_quantity = 'Meters cannot be a negative number.';
  } else if (qty > rollQuantity) {
    errors.affected_quantity = `Damaged length (${qty}m) cannot be greater than the whole roll (${rollQuantity}m).`;
  }

  if (values.decision === 'REWORK' || values.decision === 'REJECT') {
    if (qty <= 0) {
      errors.affected_quantity = `Since this roll needs ${values.decision.toLowerCase()}, please enter how many meters have flaws (must be greater than 0).`;
    }
    if (!values.defect_type || values.defect_type === 'none') {
      errors.defect_type = `Please select what kind of flaw was found.`;
    }
  }

  if (values.notes && values.notes.length > 500) {
    errors.notes = 'Notes must be under 500 characters.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
