import { Router, Request, Response } from 'express';
import { pool, withTransaction } from '../config/db.js';
import { z } from 'zod';

export const fabricRouter = Router();

const createRollSchema = z.object({
  roll_id: z.string().min(2).optional(),
  qr_code: z.string().optional(),
  production_order_id: z.union([z.number(), z.string()]).optional(),
  order_id: z.union([z.number(), z.string()]).optional(),
  weight: z.number().positive(),
  unit: z.string().default('kg'),
  qc_status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
});

const rollInspectionSchema = z.object({
  inspector_id: z.union([z.number(), z.string()]).optional(),
  defect_type: z.string().optional(),
  defect_count: z.number().int().min(0).default(0),
  remarks: z.string().optional(),
  notes: z.string().optional(),
  decision: z.string().optional(),
  disposition: z.enum(['APPROVED', 'REJECTED', 'REINSPECTION', 'PASSED', 'REWORK']).optional(),
});

function mapRollRow(row: any) {
  const totalWeight = parseFloat(row.weight || 0);
  const dispatched = parseFloat(row.dispatched_quantity || 0);
  const availableToDispatch = Math.max(0, totalWeight - dispatched);
  const isApproved = row.qc_status === 'APPROVED' || row.qc_status === 'PASSED';

  return {
    ...row,
    id: String(row.id),
    roll_code: row.roll_id,
    roll_id: row.roll_id,
    qr_code: row.qr_code || row.roll_id,
    fabric_type: row.fabric_type || 'Standard Weave Cotton',
    customer: row.customer_name || 'Retail Client',
    weight: totalWeight,
    produced_quantity: totalWeight,
    dispatched_quantity: dispatched,
    available_to_dispatch: availableToDispatch,
    is_dispatch_eligible: isApproved && availableToDispatch > 0,
    qc_status: row.qc_status,
    operational_status: isApproved ? (availableToDispatch === 0 ? 'DISPATCHED' : 'PASSED') : (row.qc_status === 'REJECTED' ? 'REJECTED' : (row.qc_status === 'REINSPECTION' || row.qc_status === 'REWORK' ? 'REWORK' : 'PENDING')),
    order_no: row.order_number || null,
  };
}

// GET /api/fabric-rolls (List all fabric rolls with search & filters)
fabricRouter.get('/', async (req: Request, res: Response) => {
  const { qc_status, search, dispatch_ready } = req.query;
  try {
    let query = `
      SELECT fr.*, po.order_number, po.fabric_type, po.customer_name
      FROM fabric_rolls fr
      LEFT JOIN production_orders po ON fr.production_order_id = po.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (qc_status && qc_status !== 'ALL') {
      params.push(String(qc_status).toUpperCase());
      query += ` AND UPPER(fr.qc_status) = $${params.length}`;
    }

    if (dispatch_ready === 'true') {
      query += " AND fr.qc_status = 'APPROVED' AND (fr.weight - fr.dispatched_quantity) > 0";
    }

    if (search && typeof search === 'string' && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      query += ` AND (LOWER(fr.roll_id) LIKE $${params.length} OR LOWER(fr.qr_code) LIKE $${params.length} OR LOWER(po.order_number) LIKE $${params.length})`;
    }

    query += ' ORDER BY fr.created_at DESC';

    const result = await pool.query(query, params);
    const data = result.rows.map(mapRollRow);
    return res.json({ success: true, data, rolls: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// GET /api/fabric-rolls/:id
fabricRouter.get('/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    const isNum = /^\d+$/.test(id);
    const result = await pool.query(
      `SELECT fr.*, po.order_number, po.fabric_type
       FROM fabric_rolls fr
       LEFT JOIN production_orders po ON fr.production_order_id = po.id
       WHERE ${isNum ? 'fr.id = $1 OR' : ''} LOWER(fr.roll_id) = LOWER($1) OR LOWER(fr.qr_code) = LOWER($1)
       LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Fabric roll not found' } });
    }

    // Also get inspection history
    const inspRes = await pool.query(
      `SELECT fi.*, e.name as inspector_name
       FROM fabric_inspections fi
       LEFT JOIN employees e ON fi.inspector_id = e.id
       WHERE fi.fabric_roll_id = $1
       ORDER BY fi.inspection_date DESC`,
      [result.rows[0].id]
    );

    return res.json({
      success: true,
      data: {
        ...mapRollRow(result.rows[0]),
        inspections: inspRes.rows,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// POST /api/fabric-rolls (Create roll)
fabricRouter.post('/', async (req: Request, res: Response) => {
  const parsed = createRollSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: parsed.error.issues } });
  }

  const data = parsed.data;
  const rollId = (data.roll_id || `VAS-F-${Date.now().toString().slice(-6)}`).trim();
  const qrCode = (data.qr_code || `VAS-QR-${Date.now().toString().slice(-6)}`).trim();
  const rawOrderId = data.production_order_id ?? data.order_id;

  try {
    let orderIdNum: number | null = null;
    if (rawOrderId) {
      const isNum = /^\d+$/.test(String(rawOrderId));
      const oRes = await pool.query(
        `SELECT id FROM production_orders WHERE ${isNum ? 'id = $1 OR' : ''} LOWER(order_number) = LOWER($1) LIMIT 1`,
        [String(rawOrderId)]
      );
      if (oRes.rows.length > 0) orderIdNum = Number(oRes.rows[0].id);
    }

    const result = await pool.query(
      `INSERT INTO fabric_rolls (roll_id, qr_code, production_order_id, weight, unit, qc_status, dispatched_quantity, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 0, NOW(), NOW())
       RETURNING *`,
      [rollId, qrCode, orderIdNum, data.weight, data.unit || 'kg', data.qc_status]
    );

    return res.status(201).json({
      success: true,
      data: mapRollRow(result.rows[0]),
      message: `Fabric roll "${rollId}" created successfully.`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// POST /api/fabric-rolls/:id/inspections (Record roll inspection)
fabricRouter.post('/:id/inspections', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const parsed = rollInspectionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: parsed.error.issues } });
  }

  const data = parsed.data;
  const rawDisp = (data.disposition || data.decision || 'APPROVED').toUpperCase();
  let disposition: 'APPROVED' | 'REJECTED' | 'REINSPECTION' = 'APPROVED';
  if (rawDisp === 'REJECTED' || rawDisp === 'REJECT') {
    disposition = 'REJECTED';
  } else if (rawDisp === 'REINSPECTION' || rawDisp === 'REWORK' || rawDisp === 'ON_HOLD') {
    disposition = 'REINSPECTION';
  } else {
    disposition = 'APPROVED';
  }

  try {
    const outcome = await withTransaction(async (client) => {
      const isNum = /^\d+$/.test(id);
      const rRes = await client.query(
        `SELECT * FROM fabric_rolls 
         WHERE ${isNum ? 'id = $1 OR' : ''} 
               LOWER(roll_id) = LOWER($1) OR 
               LOWER(qr_code) = LOWER($1) OR
               LOWER(REPLACE(roll_id, '-', '')) = LOWER(REPLACE($1, '-', '')) OR
               LOWER(REPLACE(roll_id, '#', '')) = LOWER(REPLACE($1, '#', ''))
         FOR UPDATE`,
        [id]
      );
      if (rRes.rows.length === 0) throw new Error(`Fabric roll "${id}" not found`);
      const roll = rRes.rows[0];

      // Inspector ID default
      let inspectorId: number | null = null;
      if (data.inspector_id) {
        inspectorId = Number(data.inspector_id);
      } else {
        const empRes = await client.query("SELECT id FROM employees WHERE department_id = 2 LIMIT 1");
        if (empRes.rows.length > 0) inspectorId = Number(empRes.rows[0].id);
      }

      // Insert inspection
      const inspRes = await client.query(
        `INSERT INTO fabric_inspections (fabric_roll_id, inspector_id, inspection_date, defect_type, defect_count, remarks, disposition, created_at)
         VALUES ($1, $2, NOW(), $3, $4, $5, $6, NOW())
         RETURNING *`,
        [
          roll.id,
          inspectorId,
          data.defect_type || 'General Inspection',
          data.defect_count,
          data.remarks || data.notes || 'Fabric Roll Stage Inspection Record',
          disposition,
        ]
      );

      // Update fabric roll status
      const updatedRoll = await client.query(
        `UPDATE fabric_rolls 
         SET qc_status = $1, updated_at = NOW() 
         WHERE id = $2 
         RETURNING *`,
        [disposition, roll.id]
      );

      return {
        inspection: inspRes.rows[0],
        roll: mapRollRow(updatedRoll.rows[0]),
      };
    });

    return res.status(201).json({
      success: true,
      data: outcome,
      message: `Fabric roll inspection completed. Status updated to ${disposition}.`,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: { code: 'INSPECTION_ERROR', message: err.message } });
  }
});

// GET /api/fabric-inspections (List all fabric roll inspections)
fabricRouter.get('/inspections/all', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT fi.*, fr.roll_id, fr.qr_code, e.name as inspector_name
      FROM fabric_inspections fi
      JOIN fabric_rolls fr ON fi.fabric_roll_id = fr.id
      LEFT JOIN employees e ON fi.inspector_id = e.id
      ORDER BY fi.inspection_date DESC
      LIMIT 100
    `);
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});
