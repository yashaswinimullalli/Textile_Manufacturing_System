import { Router, Request, Response } from 'express';
import { pool, withTransaction } from '../config/db.js';
import { z } from 'zod';

export const ordersRouter = Router();

const createOrderSchema = z.object({
  order_number: z.string().min(2).optional(),
  order_no: z.string().min(2).optional(), // alias
  customer_name: z.string().min(1).optional(),
  customer_reference: z.string().min(1).optional(), // alias
  fabric_type: z.string().min(1),
  required_quantity: z.number().positive().optional(),
  target_quantity: z.number().positive().optional(), // alias
  unit: z.string().default('kg'),
  due_date: z.string().min(1),
  start_date: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT', 'Low', 'Normal', 'High', 'Urgent']).default('NORMAL'),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'Planned', 'In Progress', 'On Hold', 'Completed']).default('PENDING'),
});

function mapOrderRow(row: any) {
  // Normalize status for UI
  let uiStatus = row.status;
  if (row.status === 'PENDING') uiStatus = 'Planned';
  else if (row.status === 'IN_PROGRESS') uiStatus = 'In Progress';
  else if (row.status === 'ON_HOLD') uiStatus = 'On Hold';
  else if (row.status === 'COMPLETED') uiStatus = 'Completed';

  return {
    ...row,
    id: String(row.id),
    order_no: row.order_number,
    order_number: row.order_number,
    customer_reference: row.customer_name || 'Retail Customer',
    customer_name: row.customer_name || 'Retail Customer',
    target_quantity: parseFloat(row.required_quantity ?? 0),
    required_quantity: parseFloat(row.required_quantity ?? 0),
    produced_quantity: parseFloat(row.produced_quantity ?? 0),
    unit: row.unit || 'kg',
    status: uiStatus,
    db_status: row.status,
    priority: row.priority || 'NORMAL',
    due_date: row.due_date ? String(row.due_date).slice(0, 10) : '',
    start_date: row.start_date ? String(row.start_date).slice(0, 10) : '',
    is_flagged_for_review: row.status === 'ON_HOLD',
  };
}

// GET /api/orders (List all production orders)
ordersRouter.get('/', async (req: Request, res: Response) => {
  const { status, search } = req.query;
  try {
    let query = 'SELECT * FROM production_orders WHERE 1=1';
    const params: any[] = [];

    if (status && status !== 'ALL') {
      const s = String(status).toUpperCase().replace(/\s+/g, '_');
      params.push(s);
      query += ` AND (UPPER(status) = $${params.length} OR status = $${params.length})`;
    }

    if (search && typeof search === 'string' && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      query += ` AND (LOWER(order_number) LIKE $${params.length} OR LOWER(customer_name) LIKE $${params.length} OR LOWER(fabric_type) LIKE $${params.length})`;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    const data = result.rows.map(mapOrderRow);
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// GET /api/orders/:id
ordersRouter.get('/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    const isNum = /^\d+$/.test(id);
    const result = await pool.query(
      `SELECT * FROM production_orders WHERE ${isNum ? 'id = $1 OR' : ''} LOWER(order_number) = LOWER($1) LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
    }

    return res.json({ success: true, data: mapOrderRow(result.rows[0]) });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

async function purgeDemoOrdersSafely(): Promise<number> {
  const demoIdsResult = await pool.query(
    `SELECT id FROM production_orders WHERE order_number LIKE 'VAS-DEMO-%'`
  );
  if (demoIdsResult.rows.length === 0) return 0;
  const demoIds = demoIdsResult.rows.map((r: any) => r.id);

  await pool.query(
    `DELETE FROM fabric_inspections WHERE fabric_roll_id IN (SELECT id FROM fabric_rolls WHERE production_order_id = ANY($1))`,
    [demoIds]
  );
  await pool.query(
    `DELETE FROM dispatch_items WHERE fabric_roll_id IN (SELECT id FROM fabric_rolls WHERE production_order_id = ANY($1))`,
    [demoIds]
  );
  await pool.query(`DELETE FROM fabric_rolls WHERE production_order_id = ANY($1)`, [demoIds]);
  await pool.query(`DELETE FROM stock_movements WHERE production_order_id = ANY($1)`, [demoIds]);
  await pool.query(`DELETE FROM production_records WHERE production_order_id = ANY($1)`, [demoIds]);
  await pool.query(`DELETE FROM machine_assignments WHERE production_order_id = ANY($1)`, [demoIds]);
  const delOrders = await pool.query(`DELETE FROM production_orders WHERE id = ANY($1)`, [demoIds]);
  return delOrders.rowCount || 0;
}

// DELETE /api/orders/demo (Remove demo orders and dependent records)
ordersRouter.delete('/demo', async (req: Request, res: Response) => {
  try {
    const count = await purgeDemoOrdersSafely();
    return res.json({
      success: true,
      count,
      message: `Cleaned up ${count} default demo orders.`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/orders/bulk (Bulk import production orders)
ordersRouter.post('/bulk', async (req: Request, res: Response) => {
  const { orders, replaceDemo } = req.body;
  if (!Array.isArray(orders) || orders.length === 0) {
    return res.status(400).json({
      success: false,
      error: { message: 'Orders array is required and must not be empty.' },
    });
  }

  try {
    if (replaceDemo) {
      await purgeDemoOrdersSafely();
    }

    let inserted = 0;
    for (const ord of orders) {
      const orderNumber = String(ord.order_no || ord.order_number || '').trim().toUpperCase();
      const customerName = String(ord.customer_reference || ord.customer_name || 'Retail Client').trim();
      const fabricType = String(ord.fabric_type || 'Cotton Fabric').trim();
      const reqQty = Number(ord.target_quantity ?? ord.required_quantity ?? 0);
      const unit = ord.unit || 'm';
      const dueDate = ord.due_date ? new Date(ord.due_date) : new Date(Date.now() + 14 * 86400000);
      let startDate = ord.start_date ? new Date(ord.start_date) : new Date(dueDate.getTime() - 14 * 86400000);
      if (isNaN(startDate.getTime()) || startDate > dueDate) {
        startDate = new Date(dueDate.getTime() - 7 * 86400000);
      }

      if (!orderNumber || reqQty <= 0) continue;

      await pool.query(
        `INSERT INTO production_orders 
          (order_number, customer_name, fabric_type, required_quantity, produced_quantity, unit, status, priority, start_date, due_date, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 0, $5, 'PENDING', 'NORMAL', $6, $7, NOW(), NOW())
         ON CONFLICT (order_number) 
         DO UPDATE SET 
           customer_name = EXCLUDED.customer_name,
           fabric_type = EXCLUDED.fabric_type,
           required_quantity = EXCLUDED.required_quantity,
           due_date = EXCLUDED.due_date,
           updated_at = NOW()`,
        [orderNumber, customerName, fabricType, reqQty, unit, startDate, dueDate]
      );
      inserted++;
    }

    return res.status(201).json({
      success: true,
      count: inserted,
      message: `Successfully imported ${inserted} production orders into system.`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/orders (User creates a new production order through UI)
ordersRouter.post('/', async (req: Request, res: Response) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: parsed.error.issues },
    });
  }

  const data = parsed.data;
  const orderNumber = (data.order_number || data.order_no || `VAS-PO-${Date.now().toString().slice(-6)}`).trim();
  const customerName = (data.customer_name || data.customer_reference || 'Standard Client').trim();
  const reqQty = Number(data.required_quantity ?? data.target_quantity ?? 0);
  const priority = String(data.priority).toUpperCase();

  // Normalize status for vastra
  let status = 'PENDING';
  if (data.status === 'In Progress' || data.status === 'IN_PROGRESS') status = 'IN_PROGRESS';
  else if (data.status === 'Completed' || data.status === 'COMPLETED') status = 'COMPLETED';
  else if (data.status === 'On Hold' || data.status === 'ON_HOLD') status = 'ON_HOLD';

  if (reqQty <= 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_QUANTITY', message: 'Required quantity must be greater than zero.' },
    });
  }

  try {
    const existing = await pool.query(
      'SELECT id FROM production_orders WHERE LOWER(order_number) = LOWER($1)',
      [orderNumber]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'DUPLICATE_ORDER', message: `Order number "${orderNumber}" already exists.` },
      });
    }

    const startDate = data.start_date ? new Date(data.start_date) : new Date();
    const dueDate = new Date(data.due_date);

    const result = await pool.query(
      `INSERT INTO production_orders 
        (order_number, customer_name, fabric_type, required_quantity, produced_quantity, unit, status, priority, start_date, due_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 0, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING *`,
      [
        orderNumber,
        customerName,
        data.fabric_type.trim(),
        reqQty,
        data.unit || 'kg',
        status,
        priority,
        startDate,
        dueDate,
      ]
    );

    return res.status(201).json({
      success: true,
      data: mapOrderRow(result.rows[0]),
      message: `Production Order "${orderNumber}" created successfully in PostgreSQL.`,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: err.message },
    });
  }
});

// PATCH /api/orders/:id (Update order status or permitted fields)
ordersRouter.patch('/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { status, priority, due_date, notes } = req.body;

  try {
    const isNum = /^\d+$/.test(id);
    let dbStatus = status ? String(status).toUpperCase().replace(/\s+/g, '_') : undefined;
    if (dbStatus === 'PLANNED') dbStatus = 'PENDING';

    const result = await pool.query(
      `UPDATE production_orders 
       SET status = COALESCE($1, status),
           priority = COALESCE($2, priority),
           due_date = COALESCE($3, due_date),
           completed_at = CASE WHEN $1 = 'COMPLETED' THEN NOW() ELSE completed_at END,
           updated_at = NOW()
       WHERE ${isNum ? 'id = $4' : 'order_number = $4'}
       RETURNING *`,
      [
        dbStatus || null,
        priority ? String(priority).toUpperCase() : null,
        due_date ? new Date(due_date) : null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
    }

    return res.json({
      success: true,
      data: mapOrderRow(result.rows[0]),
      message: 'Production order updated successfully.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// GET /api/orders/:id/material-availability
ordersRouter.get('/:id/material-availability', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    const isNum = /^\d+$/.test(id);
    const orderRes = await pool.query(
      `SELECT * FROM production_orders WHERE ${isNum ? 'id = $1 OR' : ''} LOWER(order_number) = LOWER($1) LIMIT 1`,
      [id]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
    }

    const order = orderRes.rows[0];
    const required = parseFloat(order.required_quantity || 0);

    // Find all QC-passed yarn batches
    const batchesRes = await pool.query(
      `SELECT yb.*, sl.rack_name 
       FROM yarn_batches yb
       LEFT JOIN storage_locations sl ON yb.storage_location_id = sl.id
       WHERE yb.available_quantity > 0 AND yb.qc_status IN ('PASSED', 'PARTIALLY_ACCEPTED')
       ORDER BY yb.received_at ASC`
    );

    const availableTotal = batchesRes.rows.reduce(
      (sum, b) => sum + parseFloat(b.available_quantity),
      0
    );
    const shortage = Math.max(0, required - availableTotal);

    return res.json({
      success: true,
      data: {
        order_id: String(order.id),
        order_no: order.order_number,
        fabric_type: order.fabric_type,
        required_quantity: required,
        available_quantity: availableTotal,
        shortage_quantity: shortage,
        is_sufficient: shortage === 0,
        unit: order.unit || 'kg',
        recommended_batches: batchesRes.rows.map((b) => ({
          id: String(b.id),
          batch_code: b.batch_code,
          barcode: b.barcode_id,
          yarn_type: b.yarn_type,
          colour: b.colour,
          quantity_available: parseFloat(b.available_quantity),
          storage_location: b.rack_name || 'Warehouse',
        })),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// POST /api/orders/:id/production-records (Record production meter output)
ordersRouter.post('/:id/production-records', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { machine_id, employee_id, quantity_produced, remarks } = req.body;

  const qty = parseFloat(quantity_produced);
  if (!qty || qty <= 0) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Quantity must be positive' } });
  }

  try {
    const outcome = await withTransaction(async (client) => {
      // 1. Resolve order
      const isNum = /^\d+$/.test(id);
      const orderRes = await client.query(
        `SELECT * FROM production_orders WHERE ${isNum ? 'id = $1 OR' : ''} LOWER(order_number) = LOWER($1) FOR UPDATE`,
        [id]
      );
      if (orderRes.rows.length === 0) {
        throw new Error('Production order not found');
      }
      const order = orderRes.rows[0];
      const newProduced = parseFloat(order.produced_quantity || 0) + qty;
      const target = parseFloat(order.required_quantity || 0);
      const newStatus = newProduced >= target ? 'COMPLETED' : 'IN_PROGRESS';

      // 2. Insert production record
      const recRes = await client.query(
        `INSERT INTO production_records (production_order_id, machine_id, employee_id, quantity_produced, production_date, remarks, created_at)
         VALUES ($1, $2, $3, $4, NOW(), $5, NOW())
         RETURNING *`,
        [
          order.id,
          machine_id ? Number(machine_id) : null,
          employee_id ? Number(employee_id) : null,
          qty,
          remarks || `Incremental output logged for ${order.order_number}`,
        ]
      );

      // 3. Update order produced quantity
      const updOrderRes = await client.query(
        `UPDATE production_orders 
         SET produced_quantity = $1, 
             status = CASE WHEN status = 'COMPLETED' THEN status ELSE $2 END,
             completed_at = CASE WHEN $2 = 'COMPLETED' THEN NOW() ELSE completed_at END,
             updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [newProduced, newStatus, order.id]
      );

      // 4. Update machine status to RUNNING if machine provided
      if (machine_id) {
        await client.query(
          "UPDATE machines SET status = 'RUNNING' WHERE id = $1",
          [Number(machine_id)]
        );
      }

      return {
        record: recRes.rows[0],
        order: mapOrderRow(updOrderRes.rows[0]),
      };
    });

    return res.status(201).json({
      success: true,
      data: outcome,
      message: `Production output of ${qty} recorded successfully.`,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: { code: 'TRANSACTION_ERROR', message: err.message } });
  }
});

// GET /api/orders/production-records (List production record audit log)
ordersRouter.get('/production-records/all', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT pr.*, 
             po.order_number, po.fabric_type,
             m.machine_code, m.machine_name,
             e.name as operator_name
      FROM production_records pr
      JOIN production_orders po ON pr.production_order_id = po.id
      LEFT JOIN machines m ON pr.machine_id = m.id
      LEFT JOIN employees e ON pr.employee_id = e.id
      ORDER BY pr.production_date DESC
      LIMIT 100
    `);
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});
