import { Router, Request, Response } from 'express';
import { pool } from '../config/db.js';
import { z } from 'zod';
import { simulationEngine } from '../services/simulation.service.js';

export const ordersRouter = Router();

const createOrderSchema = z.object({
  order_no: z.string().min(2),
  customer_reference: z.string().min(1),
  fabric_type: z.string().min(1),
  target_quantity: z.number().positive(),
  required_yarn_quantity: z.number().min(0).default(0),
  due_date: z.string(),
  status: z.enum(['Planned', 'In Progress', 'On Hold', 'Completed']).default('Planned'),
});

// GET /api/orders
ordersRouter.get('/', async (req: Request, res: Response) => {
  const { status, search } = req.query;
  try {
    let query = 'SELECT * FROM production_orders WHERE 1=1';
    const params: any[] = [];

    if (status && status !== 'ALL') {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    if (search && typeof search === 'string' && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      query += ` AND (LOWER(order_no) LIKE $${params.length} OR LOWER(customer_reference) LIKE $${params.length} OR LOWER(fabric_type) LIKE $${params.length})`;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    return res.json({ success: true, data: result.rows });
  } catch (_err: any) {
    const defaultOrders = [
      {
        id: 'ord-1',
        order_no: 'PO-2026-101',
        customer_reference: 'Zara Global Retail (Summer Twill)',
        fabric_type: '100% Combed Cotton Twill 180 GSM',
        target_quantity: 5000,
        produced_quantity: 3600,
        required_yarn_quantity: 2200,
        due_date: '2026-10-18',
        status: 'In Progress',
        is_flagged_for_review: false,
        created_at: '2026-10-02T08:00:00Z',
      },
      {
        id: 'ord-2',
        order_no: 'PO-2026-102',
        customer_reference: 'H&M Knitwear Division',
        fabric_type: 'Poly-Cotton Single Jersey 160 GSM',
        target_quantity: 3000,
        produced_quantity: 1200,
        required_yarn_quantity: 1400,
        due_date: '2026-10-14',
        status: 'In Progress',
        is_flagged_for_review: false,
        created_at: '2026-10-03T09:30:00Z',
      },
      {
        id: 'ord-3',
        order_no: 'PO-2026-103',
        customer_reference: 'Marks & Spencer Workwear',
        fabric_type: 'Poly Oxford Heavy Duty 240 GSM',
        target_quantity: 4000,
        produced_quantity: 0,
        required_yarn_quantity: 1900,
        due_date: '2026-10-25',
        status: 'Planned',
        is_flagged_for_review: false,
        created_at: '2026-10-08T11:00:00Z',
      },
      {
        id: 'ord-4',
        order_no: 'PO-2026-098',
        customer_reference: 'Decathlon Sportswear',
        fabric_type: 'Micro Polyester Interlock',
        target_quantity: 2500,
        produced_quantity: 2500,
        required_yarn_quantity: 1100,
        due_date: '2026-10-09',
        status: 'Completed',
        is_flagged_for_review: false,
        created_at: '2026-09-28T10:00:00Z',
      },
    ];

    // Sync with simulation engine: if any simulated machine stopped, flag order, and sync produced meters!
    const simMachines = simulationEngine.getAllMachinesTelemetry();
    for (const s of simMachines) {
      if (s.active_order_id) {
        const ord = defaultOrders.find((o) => o.id === s.active_order_id);
        if (ord) {
          if (s.produced_quantity > ord.produced_quantity) {
            ord.produced_quantity = s.produced_quantity;
          }
          if (['STOPPED', 'EMERGENCY_STOP', 'BREAKDOWN_REPORTED'].includes(s.operating_state)) {
            ord.is_flagged_for_review = true;
            (ord as any).flag_reason = `Loom ${s.machine_code} reported ${s.operating_state} in simulation.`;
          }
        }
      }
    }
    return res.json({ success: true, data: defaultOrders });
  }
});

// POST /api/orders
ordersRouter.post('/', async (req: Request, res: Response) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: parsed.error.issues },
    });
  }

  const data = parsed.data;
  try {
    const existing = await pool.query(
      'SELECT id FROM production_orders WHERE LOWER(order_no) = LOWER($1)',
      [data.order_no]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'DUPLICATE_ORDER', message: `Order number "${data.order_no}" already exists.` },
      });
    }

    const result = await pool.query(
      `INSERT INTO production_orders 
        (order_no, customer_reference, fabric_type, target_quantity, required_yarn_quantity, due_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.order_no,
        data.customer_reference,
        data.fabric_type,
        data.target_quantity,
        data.required_yarn_quantity,
        data.due_date,
        data.status,
      ]
    );

    return res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Production order created.',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: err.message },
    });
  }
});

// GET /api/orders/:id/material-availability
ordersRouter.get('/:id/material-availability', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const orderRes = await pool.query('SELECT * FROM production_orders WHERE id = $1', [id]);
    if (orderRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order not found' },
      });
    }

    const order = orderRes.rows[0];
    const required = parseFloat(order.required_yarn_quantity || 0);

    // Get all available yarn batches that have passed quality inspection
    const batchesRes = await pool.query(
      "SELECT id, batch_code, barcode, yarn_type, colour, quantity_available, inspection_status FROM yarn_batches WHERE quantity_available > 0 AND (inspection_status IS NULL OR inspection_status IN ('PASSED', 'PARTIALLY_ACCEPTED')) ORDER BY received_at ASC"
    );

    const availableTotal = batchesRes.rows.reduce(
      (sum, b) => sum + parseFloat(b.quantity_available),
      0
    );
    const shortage = Math.max(0, required - availableTotal);

    return res.json({
      success: true,
      data: {
        order_id: order.id,
        order_no: order.order_no,
        fabric_type: order.fabric_type,
        required_quantity: required,
        available_quantity: availableTotal,
        shortage_quantity: shortage,
        is_sufficient: shortage === 0,
        unit: 'kg',
        recommended_batches: batchesRes.rows,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: err.message },
    });
  }
});

// PATCH /api/orders/:id/clear-flag
ordersRouter.patch('/:id/clear-flag', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE production_orders 
       SET is_flagged_for_review = FALSE, flag_reason = NULL, updated_at = NOW() 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
    }
    return res.json({ success: true, data: result.rows[0], message: 'Flag cleared successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// POST /api/orders/:id/production-records
ordersRouter.post('/:id/production-records', async (req: Request, res: Response) => {
  const order_id = req.params.id as string;
  const { machine_id, quantity_produced } = req.body;

  const qty = parseFloat(quantity_produced);
  if (!qty || qty <= 0) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Quantity must be positive' } });
  }

  try {
    // 1. Insert production record
    const recRes = await pool.query(
      `INSERT INTO production_records (order_id, machine_id, quantity_produced, recorded_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [order_id, machine_id, qty]
    );

    // 2. Update order produced quantity
    const orderRes = await pool.query(
      `UPDATE production_orders 
       SET produced_quantity = produced_quantity + $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [qty, order_id]
    );

    // 3. Update machine last output time and status to Running
    if (machine_id) {
      await pool.query(
        `UPDATE machines 
         SET last_output_time = NOW(), current_status = 'Running', updated_at = NOW() 
         WHERE id = $1`,
        [machine_id]
      );
    }

    return res.status(201).json({ success: true, data: { record: recRes.rows[0], order: orderRes.rows[0] }, message: 'Production output logged.' });
  } catch (_err: any) {
    // When DB is offline, add to simulationEngine records and sync
    const simRec = simulationEngine.addSimulatedRecord({
      order_id,
      machine_id,
      quantity_produced: qty,
    });
    return res.status(201).json({ success: true, data: { record: simRec }, message: 'Production output logged.' });
  }
});

// GET /api/orders/production-records
ordersRouter.get('/production-records', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT pr.*, m.machine_code, po.order_no
      FROM production_records pr
      LEFT JOIN machines m ON pr.machine_id = m.id
      LEFT JOIN production_orders po ON pr.order_id = po.id
      ORDER BY pr.recorded_at DESC
      LIMIT 50
    `);
    return res.json({ success: true, data: result.rows });
  } catch (_err: any) {
    // When DB is offline, return simulated records!
    return res.json({
      success: true,
      data: simulationEngine.getSimulatedRecords(),
    });
  }
});

