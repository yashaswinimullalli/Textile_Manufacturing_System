import { Router, Request, Response } from 'express';
import { pool, withTransaction } from '../config/db.js';
import { z } from 'zod';

export const dispatchRouter = Router();

const dispatchCreateSchema = z.object({
  fabric_roll_id: z.union([z.number(), z.string()]).optional(),
  roll_code: z.string().optional(),
  roll_id: z.string().optional(),
  vehicle_number: z.string().min(2),
  destination: z.string().min(2),
  dispatch_quantity: z.number().positive().optional(),
  quantity: z.number().positive().optional(),
  unit_price: z.number().positive().default(120),
  dispatch_reference: z.string().optional(),
  created_by: z.union([z.number(), z.string()]).optional(),
});

// GET /api/dispatches (List dispatch history)
dispatchRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT d.*, 
             di.fabric_roll_id, di.quantity as dispatched_roll_qty,
             fr.roll_id, fr.qr_code, fr.weight as roll_weight,
             e.name as dispatcher_name
      FROM dispatches d
      LEFT JOIN dispatch_items di ON d.id = di.dispatch_id
      LEFT JOIN fabric_rolls fr ON di.fabric_roll_id = fr.id
      LEFT JOIN employees e ON d.created_by = e.id
      ORDER BY d.dispatch_date DESC
    `);
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// POST /api/dispatch/validate (Validate roll clearance before dispatch)
dispatchRouter.post('/validate', async (req: Request, res: Response) => {
  const { roll_id, roll_code, fabric_roll_id, quantity } = req.body;
  const targetId = fabric_roll_id || roll_id || roll_code;

  if (!targetId) {
    return res.status(400).json({ success: false, error: { code: 'MISSING_PARAM', message: 'Roll identifier is required.' } });
  }

  try {
    const isNum = /^\d+$/.test(String(targetId));
    const result = await pool.query(
      `SELECT * FROM fabric_rolls 
       WHERE ${isNum ? 'id = $1 OR' : ''} LOWER(roll_id) = LOWER($1) OR LOWER(qr_code) = LOWER($1)
       LIMIT 1`,
      [String(targetId)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Fabric roll not found.' } });
    }

    const roll = result.rows[0];
    const weight = parseFloat(roll.weight);
    const dispatched = parseFloat(roll.dispatched_quantity || 0);
    const available = Math.max(0, weight - dispatched);
    const reqQty = parseFloat(quantity || available);

    // Gate checks
    const isPassed = roll.qc_status === 'APPROVED';
    const hasStock = available >= reqQty && reqQty > 0;
    const canDispatch = isPassed && hasStock;

    let blockerReason: string | null = null;
    if (!isPassed) blockerReason = `Safety Gate Block: Roll ${roll.roll_id} has QC status "${roll.qc_status}". Only APPROVED rolls can be dispatched.`;
    else if (!hasStock) blockerReason = `Safety Gate Block: Requested ${reqQty} kg exceeds available balance of ${available} kg.`;

    return res.json({
      success: true,
      data: {
        roll_id: roll.roll_id,
        qc_status: roll.qc_status,
        total_weight: weight,
        dispatched_quantity: dispatched,
        available_quantity: available,
        can_dispatch: canDispatch,
        blocker_reason: blockerReason,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// POST /api/dispatches (Execute transactional dispatch)
dispatchRouter.post('/', async (req: Request, res: Response) => {
  const parsed = dispatchCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: parsed.error.issues } });
  }

  const data = parsed.data;
  const rawRollId = data.fabric_roll_id || data.roll_id || data.roll_code;
  if (!rawRollId) {
    return res.status(400).json({ success: false, error: { code: 'MISSING_ROLL', message: 'Fabric roll ID or code is required.' } });
  }

  const unitPrice = data.unit_price || 120;
  const ref = data.dispatch_reference || `VAS-DSP-${Date.now().toString().slice(-6)}`;

  try {
    const outcome = await withTransaction(async (client) => {
      // 1. Lock fabric_rolls row
      const isNum = /^\d+$/.test(String(rawRollId));
      const rollRes = await client.query(
        `SELECT * FROM fabric_rolls 
         WHERE ${isNum ? 'id = $1 OR' : ''} LOWER(roll_id) = LOWER($1) OR LOWER(qr_code) = LOWER($1)
         FOR UPDATE`,
        [String(rawRollId)]
      );

      if (rollRes.rows.length === 0) {
        throw new Error('Fabric roll not found');
      }

      const roll = rollRes.rows[0];
      const totalWeight = parseFloat(roll.weight);
      const dispatchedSoFar = parseFloat(roll.dispatched_quantity || 0);
      const available = totalWeight - dispatchedSoFar;

      // 2. Validate Safety Gate Rules
      if (roll.qc_status !== 'APPROVED') {
        throw new Error(`Dispatch Blocked: Roll ${roll.roll_id} has QC status "${roll.qc_status}". Only QC APPROVED rolls may be dispatched.`);
      }

      const requestedQty = Number(data.dispatch_quantity ?? data.quantity ?? available);
      if (requestedQty <= 0) {
        throw new Error('Dispatched quantity must be greater than zero.');
      }
      if (requestedQty > available) {
        throw new Error(`Over-dispatch prevented: Cannot dispatch ${requestedQty} kg. Only ${available} kg remaining on roll ${roll.roll_id}.`);
      }

      const lineTotal = requestedQty * unitPrice;

      // 3. Insert dispatches record
      const dRes = await client.query(
        `INSERT INTO dispatches 
          (dispatch_reference, vehicle_number, destination, dispatch_date, total_weight, item_quantity, unit_price, total_revenue, status, created_by, created_at)
         VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, 'DISPATCHED', $8, NOW())
         RETURNING *`,
        [
          ref,
          data.vehicle_number.trim(),
          data.destination.trim(),
          requestedQty,
          requestedQty,
          unitPrice,
          lineTotal,
          data.created_by ? Number(data.created_by) : 5, // Default to Dispatch dept employee
        ]
      );
      const dispatch = dRes.rows[0];

      // 4. Insert dispatch_items junction record
      await client.query(
        `INSERT INTO dispatch_items (dispatch_id, fabric_roll_id, quantity, unit_price, line_total)
         VALUES ($1, $2, $3, $4, $5)`,
        [dispatch.id, roll.id, requestedQty, unitPrice, lineTotal]
      );

      // 5. Update fabric_rolls dispatched_quantity
      const newDispatched = dispatchedSoFar + requestedQty;
      await client.query(
        `UPDATE fabric_rolls 
         SET dispatched_quantity = $1, updated_at = NOW() 
         WHERE id = $2`,
        [newDispatched, roll.id]
      );

      return {
        dispatch,
        roll: {
          id: String(roll.id),
          roll_id: roll.roll_id,
          dispatched_quantity: newDispatched,
          remaining_quantity: totalWeight - newDispatched,
        },
      };
    });

    return res.status(201).json({
      success: true,
      data: outcome,
      message: `Dispatch ${ref} confirmed. Revenue of ₹${outcome.dispatch.total_revenue} logged.`,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: { code: 'DISPATCH_ERROR', message: err.message } });
  }
});
