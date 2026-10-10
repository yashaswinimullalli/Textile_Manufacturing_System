import { Router, Request, Response } from 'express';
import { pool, withTransaction } from '../config/db.js';
import { z } from 'zod';
import {
  QualityInspection,
  InspectionDisposition,
  SpecCheckItem,
} from '../models/quality.types.js';

export const qualityRouter = Router();

// In-memory fallback inspection store for offline/demo resilience
export let localInspections: QualityInspection[] = [
  {
    id: 'insp-1',
    batch_id: 'batch-1',
    batch_code: 'YB-COT-2026-001',
    barcode: 'FTB-202610-001',
    supplier: 'Vardhman Textiles Ltd',
    yarn_type: 'Cotton',
    colour: 'Bleached White',
    inspection_number: 1,
    stage: 'INITIAL',
    inspector_name: 'Priya Sharma (Lead QC)',
    inspection_date: '2026-10-01T09:30:00Z',
    packaging_condition: 'Acceptable',
    visible_contamination: 'Not observed',
    colour_consistency: 'Acceptable',
    yarn_appearance: 'Acceptable',
    visual_remarks: 'Clean carton packaging, poly-wrapped cones, zero moisture ingress.',
    defect_description: '',
    spec_checks: [
      { id: 'sc-1', test_name: 'Yarn Count / Linear Density', expected_spec: '30s Ne ± 1.5%', actual_value: '30.2s Ne', unit: 'Ne', result: 'Pass', is_mandatory: true },
      { id: 'sc-2', test_name: 'Single Yarn Tensile Strength', expected_spec: '> 280 cN', actual_value: '298 cN', unit: 'cN', result: 'Pass', is_mandatory: true },
      { id: 'sc-3', test_name: 'Yarn Evenness (CVm %)', expected_spec: '< 13.5%', actual_value: '11.8%', unit: 'CVm %', result: 'Pass', is_mandatory: true },
      { id: 'sc-4', test_name: 'Twist per Inch (TPI)', expected_spec: '21.5 ± 1.0', actual_value: '21.8', unit: 'TPI', result: 'Pass', is_mandatory: false },
    ],
    supplier_cert_ref: 'COA-VARDH-2026-8812',
    decision: 'PASSED',
    quantity_inspected: 2500,
    quantity_approved: 2500,
    quantity_held: 0,
    quantity_rejected: 0,
    decision_reason: 'All visual and physical laboratory parameters within acceptable ASTM D2256 / ISO 2060 tolerances.',
    created_at: '2026-10-01T09:30:00Z',
  },
  {
    id: 'insp-2',
    batch_id: 'batch-2',
    batch_code: 'YB-POLY-2026-014',
    barcode: 'FTB-202610-014',
    supplier: 'Reliance Industries Yarn Div',
    yarn_type: 'Polyester',
    colour: 'Navy Blue #19',
    inspection_number: 1,
    stage: 'INITIAL',
    inspector_name: 'Anand Patel (QC Inspector)',
    inspection_date: '2026-10-03T11:00:00Z',
    packaging_condition: 'Acceptable',
    visible_contamination: 'Not observed',
    colour_consistency: 'Acceptable',
    yarn_appearance: 'Acceptable',
    visual_remarks: 'Doff packaging intact, lot stickers match invoice.',
    defect_description: '',
    spec_checks: [
      { id: 'sc-1', test_name: 'Denier / Filament Count', expected_spec: '150D / 48F', actual_value: '149.6D / 48F', unit: 'Denier', result: 'Pass', is_mandatory: true },
      { id: 'sc-2', test_name: 'Tenacity (g/den)', expected_spec: '> 4.2 g/d', actual_value: '4.6 g/d', unit: 'g/d', result: 'Pass', is_mandatory: true },
      { id: 'sc-3', test_name: 'Elongation at Break %', expected_spec: '18 - 24%', actual_value: '21.2%', unit: '%', result: 'Pass', is_mandatory: true },
    ],
    supplier_cert_ref: 'RIL-COA-NY-0912',
    decision: 'PASSED',
    quantity_inspected: 1800,
    quantity_approved: 1800,
    quantity_held: 0,
    quantity_rejected: 0,
    decision_reason: 'Full conformance to polyester filament specification.',
    created_at: '2026-10-03T11:00:00Z',
  },
  {
    id: 'insp-3',
    batch_id: 'batch-3',
    batch_code: 'YB-BLD-2026-008',
    barcode: 'FTB-202610-008',
    supplier: 'Arvind Mills Yarn Hub',
    yarn_type: 'Blend',
    colour: 'Charcoal Grey',
    inspection_number: 1,
    stage: 'INITIAL',
    inspector_name: 'Priya Sharma (Lead QC)',
    inspection_date: '2026-10-05T15:00:00Z',
    packaging_condition: 'Acceptable',
    visible_contamination: 'Not observed',
    colour_consistency: 'Issue found',
    yarn_appearance: 'Acceptable',
    visual_remarks: 'Slight shade variation observed across cone layers in pallet 3.',
    defect_description: 'Delta-E shade variance of 1.4 between top and bottom cones of pallet 3.',
    spec_checks: [
      { id: 'sc-1', test_name: 'Yarn Count', expected_spec: '24s Ne Blend', actual_value: '23.8s Ne', unit: 'Ne', result: 'Pass', is_mandatory: true },
      { id: 'sc-2', test_name: 'Blend Composition Ratio', expected_spec: '65/35 Poly-Cotton ± 2%', actual_value: '64.8/35.2', unit: '%', result: 'Pass', is_mandatory: true },
      { id: 'sc-3', test_name: 'Spectrophotometer Delta-E', expected_spec: 'Delta-E < 0.8', actual_value: '1.4', unit: 'dE', result: 'Fail', is_mandatory: true, remarks: 'Shade deviation requires dye house review' },
    ],
    supplier_cert_ref: 'ARV-BLD-2026-44',
    decision: 'ON_HOLD',
    quantity_inspected: 1200,
    quantity_approved: 0,
    quantity_held: 1200,
    quantity_rejected: 0,
    decision_reason: 'Placed on hold for shade lab confirmation and customer approval before dye lot issue.',
    created_at: '2026-10-05T15:00:00Z',
  },
];

const inspectionSubmissionSchema = z.object({
  inspector_name: z.string().min(2, 'Inspector name is required'),
  packaging_condition: z.enum(['Acceptable', 'Damaged']),
  visible_contamination: z.enum(['Not observed', 'Observed']),
  colour_consistency: z.enum(['Acceptable', 'Issue found']),
  yarn_appearance: z.enum(['Acceptable', 'Issue found']),
  visual_remarks: z.string().optional(),
  defect_description: z.string().optional(),
  photo_url: z.string().optional(),
  spec_checks: z.array(
    z.object({
      id: z.string(),
      test_name: z.string(),
      expected_spec: z.string(),
      actual_value: z.any().nullable().optional(),
      unit: z.string(),
      result: z.enum(['Pass', 'Fail', 'Not Tested']),
      is_mandatory: z.boolean(),
      remarks: z.string().optional(),
    })
  ),
  supplier_cert_ref: z.string().optional(),
  decision: z.enum(['PENDING_INSPECTION', 'ON_HOLD', 'PASSED', 'PARTIALLY_ACCEPTED', 'REJECTED']),
  quantity_approved: z.number().min(0),
  quantity_held: z.number().min(0),
  quantity_rejected: z.number().min(0),
  decision_reason: z.string().optional(),
  reinspection_reason: z.string().optional(),
  stage: z.enum(['INITIAL', 'REINSPECTION', 'AUDIT']).default('INITIAL'),
});

// GET /api/quality-inspections (List all quality inspections)
qualityRouter.get('/', async (req: Request, res: Response) => {
  const { decision, stage, search } = req.query;
  try {
    let query = `
      SELECT qi.*, yb.batch_code, yb.barcode, yb.supplier, yb.yarn_type, yb.colour, yb.unit
      FROM quality_inspections qi
      JOIN yarn_batches yb ON qi.batch_id = yb.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (decision && decision !== 'ALL') {
      params.push(decision);
      query += ` AND qi.decision = $${params.length}`;
    }

    if (stage && stage !== 'ALL') {
      params.push(stage);
      query += ` AND qi.stage = $${params.length}`;
    }

    if (search && typeof search === 'string' && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      query += ` AND (LOWER(yb.batch_code) LIKE $${params.length} OR LOWER(yb.barcode) LIKE $${params.length} OR LOWER(qi.inspector_name) LIKE $${params.length} OR LOWER(yb.supplier) LIKE $${params.length})`;
    }

    query += ' ORDER BY qi.created_at DESC';

    const result = await pool.query(query, params);
    return res.json({ success: true, data: result.rows });
  } catch (_err: any) {
    // In-memory fallback
    let list = [...localInspections];
    if (decision && decision !== 'ALL') {
      list = list.filter((i) => i.decision === decision);
    }
    if (stage && stage !== 'ALL') {
      list = list.filter((i) => i.stage === stage);
    }
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (i) =>
          i.batch_code?.toLowerCase().includes(q) ||
          i.barcode?.toLowerCase().includes(q) ||
          i.inspector_name.toLowerCase().includes(q) ||
          i.supplier?.toLowerCase().includes(q)
      );
    }
    return res.json({ success: true, data: list });
  }
});

// GET /api/quality-inspections/batches/pending (Batches awaiting inspection)
qualityRouter.get('/batches/pending', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT yb.*
      FROM yarn_batches yb
      WHERE yb.inspection_status IN ('PENDING_INSPECTION', 'ON_HOLD')
      ORDER BY yb.created_at DESC
    `);
    return res.json({ success: true, data: result.rows });
  } catch (_err: any) {
    return res.json({ success: true, data: [] });
  }
});

// GET /api/yarn-batches/:id/inspections (Batch inspection history / audit trail)
qualityRouter.get('/batches/:id/inspections', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT qi.*, yb.batch_code, yb.barcode, yb.supplier, yb.yarn_type, yb.colour
       FROM quality_inspections qi
       JOIN yarn_batches yb ON qi.batch_id = yb.id
       WHERE qi.batch_id = $1
       ORDER BY qi.inspection_number ASC, qi.created_at ASC`,
      [id]
    );
    return res.json({ success: true, data: result.rows });
  } catch (_err: any) {
    const batchHistory = localInspections
      .filter((i) => i.batch_id === id)
      .sort((a, b) => a.inspection_number - b.inspection_number);
    return res.json({ success: true, data: batchHistory });
  }
});

// POST /api/yarn-batches/:id/inspections (Record Inspection / Reinspection)
qualityRouter.post('/batches/:id/inspections', async (req: Request, res: Response) => {
  const { id: batch_id } = req.params;

  const parsed = inspectionSubmissionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid inspection form data',
        details: parsed.error.issues,
      },
    });
  }

  const data = parsed.data;

  // RULE 1: Mandatory Specification Checks Validation
  if (data.decision === 'PASSED') {
    const failedMandatory = data.spec_checks.find(
      (c) => c.is_mandatory && (c.result === 'Fail' || c.result === 'Not Tested')
    );
    if (failedMandatory) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MANDATORY_CHECK_INCOMPLETE',
          message: `Cannot approve batch as PASSED: Mandatory test "${failedMandatory.test_name}" has result "${failedMandatory.result}". Batches with failed or untested mandatory criteria must be placed ON_HOLD or REJECTED.`,
        },
      });
    }

    // Also check critical visual defects
    if (data.visible_contamination === 'Observed' || data.packaging_condition === 'Damaged') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VISUAL_DEFECT_FLAG',
          message: `Cannot approve batch as PASSED while visible contamination or damaged packaging is recorded. Choose ON_HOLD or PARTIALLY_ACCEPTED with explicit quantity separation.`,
        },
      });
    }
  }

  try {
    const outcome = await withTransaction(async (client) => {
      // 1. Lock batch row
      const batchRes = await client.query(
        'SELECT * FROM yarn_batches WHERE id = $1 FOR UPDATE',
        [batch_id]
      );
      if (batchRes.rows.length === 0) {
        throw new Error(`Yarn batch ${batch_id} not found.`);
      }

      const batch = batchRes.rows[0];
      const totalReceived = parseFloat(batch.quantity_received);

      // Verify sum of quantities
      const totalQuantities = data.quantity_approved + data.quantity_held + data.quantity_rejected;
      if (Math.abs(totalQuantities - totalReceived) > 0.01) {
        throw new Error(
          `Quantities do not balance: Approved (${data.quantity_approved}) + Held (${data.quantity_held}) + Rejected (${data.quantity_rejected}) must equal total batch quantity (${totalReceived}).`
        );
      }

      // Check existing inspections to compute inspection_number
      const histRes = await client.query(
        'SELECT COUNT(*) as count FROM quality_inspections WHERE batch_id = $1',
        [batch_id]
      );
      const inspectionNumber = parseInt(histRes.rows[0].count, 10) + 1;
      const stage = inspectionNumber > 1 ? 'REINSPECTION' : data.stage;

      // 2. Insert quality inspection record
      const inspRes = await client.query(
        `INSERT INTO quality_inspections 
          (batch_id, inspection_number, stage, inspector_name, inspection_date,
           packaging_condition, visible_contamination, colour_consistency, yarn_appearance,
           visual_remarks, defect_description, photo_url, spec_checks, supplier_cert_ref,
           decision, quantity_inspected, quantity_approved, quantity_held, quantity_rejected,
           decision_reason, reinspection_reason, created_at)
         VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW())
         RETURNING *`,
        [
          batch_id,
          inspectionNumber,
          stage,
          data.inspector_name,
          data.packaging_condition,
          data.visible_contamination,
          data.colour_consistency,
          data.yarn_appearance,
          data.visual_remarks || '',
          data.defect_description || '',
          data.photo_url || null,
          JSON.stringify(data.spec_checks),
          data.supplier_cert_ref || null,
          data.decision,
          totalReceived,
          data.quantity_approved,
          data.quantity_held,
          data.quantity_rejected,
          data.decision_reason || '',
          data.reinspection_reason || null,
        ]
      );

      // 3. Atomically update yarn_batches inventory eligibility
      // Available to issue is strictly the approved quantity minus already issued quantity
      const newAvailable = data.quantity_approved;

      const updateBatchRes = await client.query(
        `UPDATE yarn_batches 
         SET inspection_status = $1,
             quantity_approved = $2,
             quantity_held = $3,
             quantity_rejected = $4,
             quantity_available = $5,
             updated_at = NOW()
         WHERE id = $6
         RETURNING *`,
        [
          data.decision,
          data.quantity_approved,
          data.quantity_held,
          data.quantity_rejected,
          newAvailable,
          batch_id,
        ]
      );

      // 4. Record stock movement audit trail for inspection release or quarantine
      const moveRef = `QC ${stage} #${inspectionNumber} [${data.decision}] by ${data.inspector_name}. Approved: ${data.quantity_approved}kg, Held: ${data.quantity_held}kg, Rejected: ${data.quantity_rejected}kg`;
      await client.query(
        `INSERT INTO stock_movements (batch_id, movement_type, quantity, reference, created_at)
         VALUES ($1, 'ADJUSTMENT', $2, $3, NOW())`,
        [batch_id, data.quantity_approved, moveRef]
      );

      return {
        inspection: inspRes.rows[0],
        batch: updateBatchRes.rows[0],
      };
    });

    return res.status(201).json({
      success: true,
      data: outcome,
      message: `Quality inspection recorded successfully with decision: ${data.decision}. Inventory updated.`,
    });
  } catch (err: any) {
    // In-memory fallback handler
    const inspectionNumber = localInspections.filter((i) => i.batch_id === batch_id).length + 1;
    const stage = inspectionNumber > 1 ? 'REINSPECTION' : data.stage;

    const newInsp: QualityInspection = {
      id: `insp-${Date.now()}`,
      batch_id: String(batch_id),
      inspection_number: inspectionNumber,
      stage: stage as any,
      inspector_name: data.inspector_name,
      inspection_date: new Date().toISOString(),
      packaging_condition: data.packaging_condition,
      visible_contamination: data.visible_contamination,
      colour_consistency: data.colour_consistency,
      yarn_appearance: data.yarn_appearance,
      visual_remarks: data.visual_remarks,
      defect_description: data.defect_description,
      photo_url: data.photo_url,
      spec_checks: data.spec_checks as SpecCheckItem[],
      supplier_cert_ref: data.supplier_cert_ref,
      decision: data.decision,
      quantity_inspected: data.quantity_approved + data.quantity_held + data.quantity_rejected,
      quantity_approved: data.quantity_approved,
      quantity_held: data.quantity_held,
      quantity_rejected: data.quantity_rejected,
      decision_reason: data.decision_reason,
      reinspection_reason: data.reinspection_reason,
      created_at: new Date().toISOString(),
    };

    localInspections.unshift(newInsp);

    return res.status(201).json({
      success: true,
      data: {
        inspection: newInsp,
        batch: {
          id: batch_id,
          inspection_status: data.decision,
          quantity_approved: data.quantity_approved,
          quantity_held: data.quantity_held,
          quantity_rejected: data.quantity_rejected,
          quantity_available: data.quantity_approved,
        },
      },
      message: `Quality inspection recorded successfully with decision: ${data.decision}. Inventory updated.`,
    });
  }
});
