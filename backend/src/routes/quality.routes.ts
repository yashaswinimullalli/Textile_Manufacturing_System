import { Router, Request, Response } from 'express';
import { pool, withTransaction } from '../config/db.js';
import { z } from 'zod';

export const qualityRouter = Router();

const inspectionSchema = z.object({
  batch_id: z.union([z.number(), z.string()]).optional(),
  yarn_batch_id: z.union([z.number(), z.string()]).optional(),
  inspector_name: z.string().optional(),
  inspector_id: z.union([z.number(), z.string()]).optional(),
  packaging_condition: z.string().default('Acceptable'),
  visible_contamination: z.string().optional(),
  contamination_found: z.boolean().optional(),
  colour_consistency: z.string().default('Acceptable'),
  yarn_appearance: z.string().optional(),
  appearance: z.string().optional(),
  visual_remarks: z.string().optional(),
  defect_description: z.string().optional(),
  defects: z.string().optional(),
  decision: z.enum(['PENDING_INSPECTION', 'ON_HOLD', 'PASSED', 'PARTIALLY_ACCEPTED', 'REJECTED']).optional(),
  disposition: z.enum(['PENDING_INSPECTION', 'ON_HOLD', 'PASSED', 'PARTIALLY_ACCEPTED', 'REJECTED']).optional(),
  quantity_inspected: z.number().optional(),
  quantity_approved: z.number().min(0).optional(),
  accepted_quantity: z.number().min(0).optional(),
  quantity_held: z.number().min(0).default(0),
  quantity_rejected: z.number().min(0).optional(),
  rejected_quantity: z.number().min(0).optional(),
  decision_reason: z.string().optional(),
  remarks: z.string().optional(),
  spec_checks: z.array(z.any()).optional(),
});

function mapInspectionRow(row: any) {
  return {
    ...row,
    id: String(row.id),
    batch_id: String(row.yarn_batch_id),
    inspector_name: row.inspector_name || 'Quality Inspector',
    decision: row.disposition,
    disposition: row.disposition,
    quantity_approved: parseFloat(row.accepted_quantity ?? 0),
    quantity_rejected: parseFloat(row.rejected_quantity ?? 0),
    accepted_quantity: parseFloat(row.accepted_quantity ?? 0),
    rejected_quantity: parseFloat(row.rejected_quantity ?? 0),
    packaging_condition: row.packaging_condition,
    colour_consistency: row.colour_consistency,
    yarn_appearance: row.appearance,
    appearance: row.appearance,
    visible_contamination: row.contamination_found ? 'Observed' : 'Not observed',
    contamination_found: Boolean(row.contamination_found),
    visual_remarks: row.remarks || '',
    defect_description: row.defects || '',
    spec_checks: [],
  };
}

// GET /api/quality-inspections (List all raw material inspections)
qualityRouter.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT rmi.*, 
             yb.batch_code, yb.barcode_id as barcode, yb.supplier_name as supplier,
             yb.yarn_type, yb.colour, yb.received_quantity, yb.available_quantity,
             e.name as inspector_name
      FROM raw_material_inspections rmi
      JOIN yarn_batches yb ON rmi.yarn_batch_id = yb.id
      LEFT JOIN employees e ON rmi.inspector_id = e.id
      ORDER BY rmi.created_at DESC
    `);
    const data = result.rows.map(mapInspectionRow);
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// GET /api/quality-inspections/batches/:id/inspections (History for a specific batch)
qualityRouter.get('/batches/:id/inspections', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    const isNum = /^\d+$/.test(id);
    const result = await pool.query(
      `SELECT rmi.*, 
              yb.batch_code, yb.barcode_id as barcode, yb.supplier_name as supplier,
              yb.yarn_type, yb.colour,
              e.name as inspector_name
       FROM raw_material_inspections rmi
       JOIN yarn_batches yb ON rmi.yarn_batch_id = yb.id
       LEFT JOIN employees e ON rmi.inspector_id = e.id
       WHERE ${isNum ? 'rmi.yarn_batch_id = $1 OR' : ''} LOWER(yb.batch_code) = LOWER($1)
       ORDER BY rmi.created_at ASC`,
      [id]
    );

    const data = result.rows.map(mapInspectionRow);
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// POST /api/quality-inspections/batches/:id/inspections
qualityRouter.post('/batches/:id/inspections', async (req: Request, res: Response) => {
  const rawBatchId = String(req.params.id);
  const parsed = inspectionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: parsed.error.issues },
    });
  }

  const data = parsed.data;
  const disposition = data.disposition || data.decision || 'PASSED';
  const acceptedQty = Number(data.accepted_quantity ?? data.quantity_approved ?? 0);
  const rejectedQty = Number(data.rejected_quantity ?? data.quantity_rejected ?? 0);
  const contamination = data.contamination_found ?? (data.visible_contamination === 'Observed');
  const appearance = data.appearance || data.yarn_appearance || 'NORMAL';
  const packaging = data.packaging_condition || 'Acceptable';
  const remarks = data.remarks || data.visual_remarks || data.decision_reason || '';
  const defects = data.defects || data.defect_description || '';

  try {
    const outcome = await withTransaction(async (client) => {
      // 1. Resolve batch and lock row
      const isNum = /^\d+$/.test(rawBatchId);
      const batchRes = await client.query(
        `SELECT * FROM yarn_batches 
         WHERE ${isNum ? 'id = $1 OR' : ''} LOWER(batch_code) = LOWER($1) OR LOWER(barcode_id) = LOWER($1)
         FOR UPDATE`,
        [rawBatchId]
      );

      if (batchRes.rows.length === 0) {
        throw new Error(`Yarn batch "${rawBatchId}" not found.`);
      }

      const batch = batchRes.rows[0];
      const batchId = batch.id;
      const totalReceived = parseFloat(batch.received_quantity);

      // Validate quantities do not exceed received quantity
      if (acceptedQty + rejectedQty > totalReceived) {
        throw new Error(`Inspection total (${acceptedQty + rejectedQty} kg) exceeds batch received quantity (${totalReceived} kg).`);
      }

      // 2. Resolve inspector ID from employees table (or fallback to first QC inspector)
      let inspectorId: number | null = null;
      if (data.inspector_id) {
        inspectorId = Number(data.inspector_id);
      } else {
        const empRes = await client.query(
          "SELECT id FROM employees WHERE department_id = 2 OR LOWER(role) LIKE '%inspector%' LIMIT 1"
        );
        if (empRes.rows.length > 0) inspectorId = Number(empRes.rows[0].id);
      }

      // 3. Insert raw_material_inspections record
      const inspRes = await client.query(
        `INSERT INTO raw_material_inspections 
          (yarn_batch_id, inspector_id, inspection_date, packaging_condition, contamination_found,
           colour_consistency, appearance, defects, remarks, accepted_quantity, rejected_quantity, disposition, created_at)
         VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
         RETURNING *`,
        [
          batchId,
          inspectorId,
          packaging,
          contamination,
          data.colour_consistency || 'CONSISTENT',
          appearance,
          defects,
          remarks,
          acceptedQty,
          rejectedQty,
          disposition,
        ]
      );

      // 4. Update yarn_batches qc_status and available_quantity
      // Only approved quantities become eligible for production issue!
      let newAvailableQty = 0;
      if (disposition === 'PASSED' || disposition === 'PARTIALLY_ACCEPTED') {
        newAvailableQty = acceptedQty;
      }

      const updatedBatchRes = await client.query(
        `UPDATE yarn_batches 
         SET qc_status = $1, available_quantity = $2, updated_at = NOW() 
         WHERE id = $3 
         RETURNING *`,
        [disposition, newAvailableQty, batchId]
      );

      return {
        inspection: mapInspectionRow({ ...inspRes.rows[0], batch_code: batch.batch_code }),
        batch: {
          ...updatedBatchRes.rows[0],
          id: String(updatedBatchRes.rows[0].id),
          quantity_available: parseFloat(updatedBatchRes.rows[0].available_quantity),
          inspection_status: updatedBatchRes.rows[0].qc_status,
        },
      };
    });

    return res.status(201).json({
      success: true,
      data: outcome,
      message: `Quality inspection logged for batch: Status set to ${disposition}. Approved stock: ${acceptedQty} kg.`,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: { code: 'QC_ERROR', message: err.message } });
  }
});
