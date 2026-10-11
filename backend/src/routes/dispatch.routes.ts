import { Router, Request, Response } from 'express';
import { pool, withTransaction } from '../config/db.js';
import { z } from 'zod';

export const dispatchRouter = Router();

const dispatchCreateSchema = z.object({
  fabric_roll_id: z.union([z.number(), z.string()]).optional(),
  roll_code: z.string().optional(),
  roll_id: z.string().optional(),
  packages: z.array(z.any()).optional(),
  rolls: z.array(z.any()).optional(),
  vehicle_number: z.string().optional().default('MH-12-TX-8821'),
  destination: z.string().optional().default('Primary Regional Hub'),
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
             po.customer_name as buyer, po.fabric_type,
             e.name as dispatcher_name
      FROM dispatches d
      LEFT JOIN dispatch_items di ON d.id = di.dispatch_id
      LEFT JOIN fabric_rolls fr ON di.fabric_roll_id = fr.id
      LEFT JOIN production_orders po ON fr.production_order_id = po.id
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
    const cleanId = String(targetId).trim();
    const isNum = /^\d+$/.test(cleanId);
    const result = await pool.query(
      `SELECT fr.*, po.customer_name, po.fabric_type, po.order_number
       FROM fabric_rolls fr
       LEFT JOIN production_orders po ON fr.production_order_id = po.id
       WHERE ${isNum ? 'fr.id = $1 OR' : ''} 
             LOWER(fr.roll_id) = LOWER($1) OR 
             LOWER(fr.qr_code) = LOWER($1) OR
             LOWER(REPLACE(fr.roll_id, '-', '')) = LOWER(REPLACE($1, '-', '')) OR
             LOWER(REPLACE(fr.roll_id, '#', '')) = LOWER(REPLACE($1, '#', '')) OR
             LOWER(po.order_number) = LOWER($1)
       LIMIT 1`,
      [cleanId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: { code: 'NOT_FOUND', message: `Fabric roll "${cleanId}" not found in database.` },
        can_dispatch: false,
        blocker_reason: `Unrecognized Roll: Barcode "${cleanId}" does not exist in factory inventory.`
      });
    }

    const roll = result.rows[0];
    const weight = parseFloat(roll.weight);
    const dispatched = parseFloat(roll.dispatched_quantity || 0);
    const available = Math.max(0, weight - dispatched);
    const reqQty = parseFloat(quantity || available);

    // Gate checks
    const isPassed = roll.qc_status === 'APPROVED' || roll.qc_status === 'PASSED';
    const hasStock = available >= reqQty && reqQty > 0;
    const canDispatch = isPassed && hasStock;

    let blockerReason: string | null = null;
    if (!isPassed) blockerReason = `Quality Gate Block: Roll ${roll.roll_id} has QC status "${roll.qc_status}". Only APPROVED rolls can be dispatched.`;
    else if (!hasStock) blockerReason = `Safety Gate Block: Roll ${roll.roll_id} has already been dispatched (${dispatched}/${weight} kg shipped).`;

    return res.json({
      success: true,
      data: {
        id: roll.id,
        roll_id: roll.roll_id,
        roll_code: roll.roll_id,
        fabric_type: roll.fabric_type || 'Standard Weave Cotton',
        customer_name: roll.customer_name || 'Retail Client',
        order_number: roll.order_number || '',
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
  const packageList = data.packages || data.rolls || (data.fabric_roll_id || data.roll_id || data.roll_code ? [
    {
      roll_id: data.fabric_roll_id || data.roll_id || data.roll_code,
      quantity: data.dispatch_quantity ?? data.quantity,
      unit_price: data.unit_price,
    }
  ] : []);

  if (packageList.length === 0) {
    return res.status(400).json({ success: false, error: { code: 'MISSING_ROLL', message: 'At least one fabric roll is required to dispatch.' } });
  }

  const vehicleNo = data.vehicle_number || 'MH-12-TX-8821';
  const dest = data.destination || 'Primary Regional Hub';
  const ref = data.dispatch_reference || `VAS-DSP-${Date.now().toString().slice(-6)}`;
  const unitPrice = data.unit_price || 120;

  try {
    const outcome = await withTransaction(async (client) => {
      let totalDispatchedWeight = 0;
      let totalRevenue = 0;
      const dispatchedRolls: any[] = [];

      // 1. First validate each roll
      for (const item of packageList) {
        const itemRollId = String(item.roll_id || item.rollCode || item.roll_code || item.id).trim();
        const isNum = /^\d+$/.test(itemRollId);

        const rollRes = await client.query(
          `SELECT * FROM fabric_rolls 
           WHERE ${isNum ? 'id = $1 OR' : ''} 
                 LOWER(roll_id) = LOWER($1) OR 
                 LOWER(qr_code) = LOWER($1) OR
                 LOWER(REPLACE(roll_id, '-', '')) = LOWER(REPLACE($1, '-', '')) OR
                 LOWER(REPLACE(roll_id, '#', '')) = LOWER(REPLACE($1, '#', ''))
           FOR UPDATE`,
          [itemRollId]
        );

        if (rollRes.rows.length === 0) {
          throw new Error(`Fabric roll "${itemRollId}" not found in database.`);
        }

        const roll = rollRes.rows[0];
        const isApproved = roll.qc_status === 'APPROVED' || roll.qc_status === 'PASSED';
        if (!isApproved) {
          throw new Error(`Dispatch Blocked: Roll ${roll.roll_id} has QC status "${roll.qc_status}". Only QC APPROVED rolls may be dispatched.`);
        }

        const totalWeight = parseFloat(roll.weight);
        const dispatchedSoFar = parseFloat(roll.dispatched_quantity || 0);
        const available = totalWeight - dispatchedSoFar;
        const requestedQty = Number(item.quantity ?? item.weight ?? available);

        if (requestedQty <= 0) throw new Error(`Invalid dispatch quantity for roll ${roll.roll_id}.`);
        if (requestedQty > available) {
          throw new Error(`Cannot dispatch ${requestedQty} kg. Only ${available} kg available for roll ${roll.roll_id}.`);
        }

        totalDispatchedWeight += requestedQty;
        const itemRevenue = requestedQty * (item.unit_price || unitPrice);
        totalRevenue += itemRevenue;

        dispatchedRolls.push({
          roll,
          requestedQty,
          itemRevenue,
          itemUnitPrice: item.unit_price || unitPrice,
          newDispatched: dispatchedSoFar + requestedQty,
        });
      }

      // 2. Insert master dispatches record
      const dRes = await client.query(
        `INSERT INTO dispatches 
          (dispatch_reference, vehicle_number, destination, dispatch_date, total_weight, item_quantity, unit_price, total_revenue, status, created_by, created_at)
         VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, 'DISPATCHED', $8, NOW())
         RETURNING *`,
        [
          ref,
          vehicleNo.trim(),
          dest.trim(),
          totalDispatchedWeight,
          dispatchedRolls.length,
          unitPrice,
          totalRevenue,
          data.created_by ? Number(data.created_by) : 5,
        ]
      );
      const dispatch = dRes.rows[0];

      // 3. Insert items and update rolls
      for (const item of dispatchedRolls) {
        await client.query(
          `INSERT INTO dispatch_items (dispatch_id, fabric_roll_id, quantity, unit_price)
           VALUES ($1, $2, $3, $4)`,
          [dispatch.id, item.roll.id, item.requestedQty, item.itemUnitPrice]
        );

        await client.query(
          `UPDATE fabric_rolls 
           SET dispatched_quantity = $1, updated_at = NOW() 
           WHERE id = $2`,
          [item.newDispatched, item.roll.id]
        );
      }

      return {
        dispatch,
        packagesDispatched: dispatchedRolls.length,
        totalWeight: totalDispatchedWeight,
        totalRevenue,
      };
    });

    return res.status(201).json({
      success: true,
      data: outcome,
      message: `Dispatch ${ref} confirmed: ${outcome.packagesDispatched} rolls (${outcome.totalWeight} kg) dispatched. Gate pass authorized.`,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: { code: 'DISPATCH_ERROR', message: err.message } });
  }
});

