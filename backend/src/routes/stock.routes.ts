import { Router, Request, Response } from 'express';
import { pool, withTransaction } from '../config/db.js';
import { z } from 'zod';

export const stockRouter = Router();

const movementSchema = z.object({
  batch_id: z.string().uuid(),
  movement_type: z.enum(['RECEIPT', 'ISSUE', 'CONSUMPTION', 'ADJUSTMENT']),
  quantity: z.number().positive('Quantity must be greater than zero'),
  reference: z.string().optional(),
  order_id: z.string().uuid().optional(),
});

// POST /api/stock-movements (Atomic transaction with row-level locking)
stockRouter.post('/', async (req: Request, res: Response) => {
  const parsed = movementSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request body',
        details: parsed.error.issues,
      },
    });
  }

  const { batch_id, movement_type, quantity, reference, order_id } = parsed.data;

  try {
    const outcome = await withTransaction(async (client) => {
      // 1. Row-level lock to prevent concurrent overdrafts
      const batchRes = await client.query(
        'SELECT * FROM yarn_batches WHERE id = $1 FOR UPDATE',
        [batch_id]
      );

      if (batchRes.rows.length === 0) {
        throw new Error(`Batch ID ${batch_id} not found.`);
      }

      const batch = batchRes.rows[0];
      const currentAvailable = parseFloat(batch.quantity_available || 0);
      const qcStatus = batch.inspection_status || 'PENDING_INSPECTION';
      let newBalance = currentAvailable;

      // 2. Validate quality inspection clearance before issuing to production
      if (movement_type === 'ISSUE' || movement_type === 'CONSUMPTION') {
        if (qcStatus === 'PENDING_INSPECTION') {
          throw new Error(
            `Quality Restriction: Batch ${batch.batch_code} is PENDING_INSPECTION. Yarn must be inspected and approved before it can be issued to production.`
          );
        }
        if (qcStatus === 'ON_HOLD') {
          throw new Error(
            `Quality Quarantine: Batch ${batch.batch_code} is currently ON_HOLD pending quality review or laboratory test confirmation.`
          );
        }
        if (qcStatus === 'REJECTED') {
          throw new Error(
            `Quality Rejection: Batch ${batch.batch_code} was REJECTED during incoming inspection and cannot be issued to production.`
          );
        }
        if (quantity > currentAvailable) {
          throw new Error(
            `Insufficient approved stock: Cannot issue ${quantity} kg. Only ${currentAvailable} kg approved and available for batch ${batch.batch_code}.`
          );
        }
        newBalance -= quantity;
      } else if (movement_type === 'RECEIPT') {
        newBalance += quantity;
      } else if (movement_type === 'ADJUSTMENT') {
        newBalance = quantity; // Absolute adjustment or delta
      }

      // 3. Atomically update inventory balance
      const updateRes = await client.query(
        `UPDATE yarn_batches 
         SET quantity_available = $1, updated_at = NOW() 
         WHERE id = $2 
         RETURNING *`,
        [newBalance, batch_id]
      );

      // 4. Insert immutable movement audit record
      const moveRes = await client.query(
        `INSERT INTO stock_movements (batch_id, movement_type, quantity, reference, order_id, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [
          batch_id,
          movement_type,
          quantity,
          reference || `Stock ${movement_type} recorded`,
          order_id || null,
        ]
      );

      return {
        batch: updateRes.rows[0],
        movement: moveRes.rows[0],
      };
    });

    return res.status(201).json({
      success: true,
      data: outcome,
      message: `Stock ${movement_type} confirmed and ledger updated.`,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'TRANSACTION_ERROR',
        message: err.message,
      },
    });
  }
});

// GET /api/stock-movements (Audit history)
stockRouter.get('/', async (req: Request, res: Response) => {
  const { batch_id, movement_type, limit } = req.query;
  try {
    let query = `
      SELECT sm.*, yb.batch_code, yb.barcode, po.order_no
      FROM stock_movements sm
      JOIN yarn_batches yb ON sm.batch_id = yb.id
      LEFT JOIN production_orders po ON sm.order_id = po.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (batch_id) {
      params.push(batch_id);
      query += ` AND sm.batch_id = $${params.length}`;
    }

    if (movement_type) {
      params.push(movement_type);
      query += ` AND sm.movement_type = $${params.length}`;
    }

    query += ' ORDER BY sm.created_at DESC';

    if (limit) {
      params.push(parseInt(limit as string, 10));
      query += ` LIMIT $${params.length}`;
    }

    const result = await pool.query(query, params);
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: err.message },
    });
  }
});
