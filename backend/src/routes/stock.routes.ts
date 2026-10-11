import { Router, Request, Response } from 'express';
import { pool, withTransaction } from '../config/db.js';
import { z } from 'zod';

export const stockRouter = Router();

const movementSchema = z.object({
  batch_id: z.union([z.number(), z.string()]).optional(),
  yarn_batch_id: z.union([z.number(), z.string()]).optional(),
  movement_type: z.enum(['RECEIPT', 'ISSUE', 'CONSUMPTION', 'ADJUSTMENT']),
  quantity: z.number().positive('Quantity must be greater than zero'),
  reference_number: z.string().optional(),
  reference: z.string().optional(), // alias
  production_order_id: z.union([z.number(), z.string()]).optional(),
  order_id: z.union([z.number(), z.string()]).optional(), // alias
  performed_by: z.union([z.number(), z.string()]).optional(),
  remarks: z.string().optional(),
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

  const data = parsed.data;
  const rawBatchId = data.yarn_batch_id ?? data.batch_id;
  if (!rawBatchId) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_BATCH_ID', message: 'Yarn batch ID is required.' },
    });
  }

  const rawOrderId = data.production_order_id ?? data.order_id;
  const ref = data.reference_number || data.reference || `TXN-${Date.now().toString().slice(-6)}`;
  const remarks = data.remarks || `Stock ${data.movement_type} recorded`;

  try {
    const outcome = await withTransaction(async (client) => {
      // 1. Resolve batch using ID or batch_code and acquire row-level lock
      const isNumeric = /^\d+$/.test(String(rawBatchId));
      const batchRes = await client.query(
        `SELECT * FROM yarn_batches 
         WHERE ${isNumeric ? 'id = $1 OR' : ''} LOWER(batch_code) = LOWER($1) OR LOWER(barcode_id) = LOWER($1)
         FOR UPDATE`,
        [String(rawBatchId)]
      );

      if (batchRes.rows.length === 0) {
        throw new Error(`Yarn batch "${rawBatchId}" not found in database.`);
      }

      const batch = batchRes.rows[0];
      const batchId = batch.id;
      const currentAvailable = parseFloat(batch.available_quantity || 0);
      const qcStatus = batch.qc_status || 'PENDING_INSPECTION';
      let newBalance = currentAvailable;

      // 2. Validate Quality Clearance before allowing production issue
      if (data.movement_type === 'ISSUE' || data.movement_type === 'CONSUMPTION') {
        if (qcStatus === 'PENDING_INSPECTION') {
          throw new Error(
            `Quality Restriction: Batch ${batch.batch_code} is PENDING_INSPECTION. Yarn must be inspected and approved before it can be issued to production.`
          );
        }
        if (qcStatus === 'ON_HOLD') {
          throw new Error(
            `Quality Quarantine: Batch ${batch.batch_code} is currently ON_HOLD pending quality review.`
          );
        }
        if (qcStatus === 'REJECTED') {
          throw new Error(
            `Quality Rejection: Batch ${batch.batch_code} was REJECTED during incoming inspection and cannot be issued.`
          );
        }
        if (data.quantity > currentAvailable) {
          throw new Error(
            `Insufficient approved stock: Cannot issue ${data.quantity} kg. Only ${currentAvailable} kg available for batch ${batch.batch_code}.`
          );
        }
        newBalance -= data.quantity;
      } else if (data.movement_type === 'RECEIPT') {
        newBalance += data.quantity;
      } else if (data.movement_type === 'ADJUSTMENT') {
        newBalance = data.quantity;
      }

      // 3. Atomically update yarn_batches balance
      const updateRes = await client.query(
        `UPDATE yarn_batches 
         SET available_quantity = $1, 
             received_quantity = CASE WHEN $3 = 'RECEIPT' THEN received_quantity + $2 ELSE received_quantity END,
             updated_at = NOW() 
         WHERE id = $4 
         RETURNING *`,
        [newBalance, data.quantity, data.movement_type, batchId]
      );

      // 4. Resolve production order ID if provided
      let orderIdNum: number | null = null;
      if (rawOrderId) {
        const isOrderNum = /^\d+$/.test(String(rawOrderId));
        const orderRes = await client.query(
          `SELECT id FROM production_orders WHERE ${isOrderNum ? 'id = $1 OR' : ''} LOWER(order_number) = LOWER($1) LIMIT 1`,
          [String(rawOrderId)]
        );
        if (orderRes.rows.length > 0) {
          orderIdNum = Number(orderRes.rows[0].id);
        }
      }

      // 5. Insert immutable audit movement ledger
      const moveRes = await client.query(
        `INSERT INTO stock_movements 
          (yarn_batch_id, movement_type, quantity, reference_number, production_order_id, performed_by, remarks, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING *`,
        [
          batchId,
          data.movement_type,
          data.quantity,
          ref,
          orderIdNum,
          data.performed_by ? Number(data.performed_by) : null,
          remarks,
        ]
      );

      return {
        batch: {
          ...updateRes.rows[0],
          id: String(updateRes.rows[0].id),
          quantity_available: parseFloat(updateRes.rows[0].available_quantity),
          quantity_received: parseFloat(updateRes.rows[0].received_quantity),
        },
        movement: {
          ...moveRes.rows[0],
          id: String(moveRes.rows[0].id),
          batch_id: String(batchId),
          batch_code: batch.batch_code,
        },
      };
    });

    return res.status(201).json({
      success: true,
      data: outcome,
      message: `Stock ${data.movement_type} of ${data.quantity} kg recorded successfully.`,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { code: 'TRANSACTION_ERROR', message: err.message },
    });
  }
});

// GET /api/stock-movements (Audit history with batch and order JOINs)
stockRouter.get('/', async (req: Request, res: Response) => {
  const { batch_id, movement_type, limit } = req.query;
  try {
    let query = `
      SELECT sm.*, 
             yb.batch_code, yb.barcode_id as barcode, yb.colour, yb.yarn_type,
             po.order_number as order_no
      FROM stock_movements sm
      JOIN yarn_batches yb ON sm.yarn_batch_id = yb.id
      LEFT JOIN production_orders po ON sm.production_order_id = po.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (batch_id) {
      const isNum = /^\d+$/.test(String(batch_id));
      if (isNum) {
        params.push(Number(batch_id));
        query += ` AND sm.yarn_batch_id = $${params.length}`;
      } else {
        params.push(String(batch_id));
        query += ` AND LOWER(yb.batch_code) = LOWER($${params.length})`;
      }
    }

    if (movement_type && movement_type !== 'ALL') {
      params.push(movement_type);
      query += ` AND sm.movement_type = $${params.length}`;
    }

    query += ' ORDER BY sm.created_at DESC';

    if (limit) {
      params.push(parseInt(limit as string, 10));
      query += ` LIMIT $${params.length}`;
    } else {
      query += ' LIMIT 100';
    }

    const result = await pool.query(query, params);
    const data = result.rows.map((row) => ({
      ...row,
      id: String(row.id),
      batch_id: String(row.yarn_batch_id),
      quantity: parseFloat(row.quantity),
      reference: row.reference_number,
    }));

    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: err.message },
    });
  }
});
