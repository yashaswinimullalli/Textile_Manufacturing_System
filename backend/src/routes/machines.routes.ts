import { Router, Request, Response } from 'express';
import { pool, withTransaction } from '../config/db.js';
import { z } from 'zod';
import { simulationEngine } from '../services/simulation.service.js';

export const machinesRouter = Router();

// GET /api/machines
machinesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT m.*, po.order_no as active_order_no
      FROM machines m
      LEFT JOIN production_orders po ON m.active_order_id = po.id
      ORDER BY m.machine_code ASC
    `);
    return res.json({ success: true, data: result.rows });
  } catch (_err: any) {
    // When DB is offline, return live simulated machines from simulationEngine
    const simMachines = simulationEngine.getAllMachinesTelemetry();
    const mapped = simMachines.map((s) => ({
      id: s.machine_id,
      machine_code: s.machine_code,
      process_type: s.process_type,
      current_status:
        s.operating_state === 'RUNNING' || s.operating_state === 'STARTING'
          ? 'Running'
          : s.operating_state === 'STOPPED' || s.operating_state === 'EMERGENCY_STOP'
          ? 'Stopped'
          : s.operating_state === 'MAINTENANCE'
          ? 'Maintenance'
          : s.operating_state === 'BREAKDOWN_REPORTED'
          ? 'Breakdown Reported'
          : 'Idle',
      current_shift: 'Morning (06:00 - 14:00)',
      assigned_operator: 'Floor Operator',
      active_order_id: s.active_order_id,
      active_order_no: s.active_order_no,
      produced_quantity: s.produced_quantity,
      last_output_time: s.last_output_persisted_at || new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    }));
    return res.json({ success: true, data: mapped });
  }
});

// POST /api/machines/:id/assignments
machinesRouter.post('/:id/assignments', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { order_id, shift, operator_name } = req.body;

  try {
    const result = await withTransaction(async (client) => {
      // Update machine
      const machRes = await client.query(
        `UPDATE machines 
         SET active_order_id = $1, current_shift = $2, assigned_operator = $3, current_status = 'Running', updated_at = NOW() 
         WHERE id = $4 
         RETURNING *`,
        [order_id, shift, operator_name || 'Floor Operator', id]
      );

      // Record assignment
      await client.query(
        `INSERT INTO machine_assignments (machine_id, order_id, shift, operator_name, start_time)
         VALUES ($1, $2, $3, $4, NOW())`,
        [id, order_id, shift, operator_name || 'Floor Operator']
      );

      return machRes.rows[0];
    });

    return res.json({ success: true, data: result, message: 'Machine assigned successfully.' });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: { code: 'ASSIGNMENT_ERROR', message: err.message } });
  }
});

// POST /api/orders/:id/production-records
machinesRouter.post('/orders/:id/production-records', async (req: Request, res: Response) => {
  const { id: order_id } = req.params;
  const { machine_id, quantity_produced } = req.body;

  const qty = parseFloat(quantity_produced);
  if (!qty || qty <= 0) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Quantity must be positive' } });
  }

  try {
    const result = await withTransaction(async (client) => {
      // 1. Insert production record
      const recRes = await client.query(
        `INSERT INTO production_records (order_id, machine_id, quantity_produced, recorded_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING *`,
        [order_id, machine_id, qty]
      );

      // 2. Update order produced quantity
      const orderRes = await client.query(
        `UPDATE production_orders 
         SET produced_quantity = produced_quantity + $1, updated_at = NOW() 
         WHERE id = $2 
         RETURNING *`,
        [qty, order_id]
      );

      // 3. Update machine last output time
      await client.query(
        `UPDATE machines 
         SET last_output_time = NOW(), updated_at = NOW() 
         WHERE id = $1`,
        [machine_id]
      );

      return { record: recRes.rows[0], order: orderRes.rows[0] };
    });

    return res.status(201).json({ success: true, data: result, message: 'Production output logged.' });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: { code: 'RECORD_ERROR', message: err.message } });
  }
});

// POST /api/machines/:id/events & /api/machines/:id/simulate-event
machinesRouter.post('/:id/events', async (req: Request, res: Response) => {
  return handleEventLogging(req, res, false);
});

machinesRouter.post('/:id/simulate-event', async (req: Request, res: Response) => {
  return handleEventLogging(req, res, true);
});

async function handleEventLogging(req: Request, res: Response, isSimulated: boolean) {
  const { id: machine_id } = req.params;
  const { event_type, order_id, reason } = req.body;

  try {
    const result = await withTransaction(async (client) => {
      // Map event_type to machine current_status
      let newStatus = event_type;
      if (event_type === 'Resumed') {
        newStatus = 'Running';
      }

      // Update machine status
      const machRes = await client.query(
        `UPDATE machines 
         SET current_status = $1, updated_at = NOW() 
         WHERE id = $2 
         RETURNING *`,
        [newStatus, machine_id]
      );

      // Insert machine event
      const eventRes = await client.query(
        `INSERT INTO machine_events (machine_id, order_id, event_type, event_source, reason, event_time)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [
          machine_id,
          order_id || machRes.rows[0]?.active_order_id || null,
          event_type,
          isSimulated ? 'Simulator' : 'Operator Report',
          reason || (isSimulated ? 'Hackathon Demo Simulator Event' : 'Floor update'),
        ]
      );

      // Flag affected order for review if downtime / stoppage event occurred
      const targetOrderId = order_id || machRes.rows[0]?.active_order_id;
      let flaggedOrder = null;
      if (targetOrderId && ['Stopped', 'Breakdown Reported', 'Maintenance'].includes(event_type)) {
        const flagText = `Machine ${machRes.rows[0]?.machine_code || machine_id} reported ${event_type}: ${reason || 'Downtime detected'}`;
        const orderRes = await client.query(
          `UPDATE production_orders 
           SET is_flagged_for_review = TRUE, flag_reason = $1, updated_at = NOW() 
           WHERE id = $2 
           RETURNING *`,
          [flagText, targetOrderId]
        );
        flaggedOrder = orderRes.rows[0];
      }

      return { machine: machRes.rows[0], event: eventRes.rows[0], flagged_order: flaggedOrder };
    });

    return res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: { code: 'EVENT_ERROR', message: err.message } });
  }
}

// GET /api/machines/:id/downtime
machinesRouter.get('/:id/downtime', async (req: Request, res: Response) => {
  const { id: machine_id } = req.params;

  try {
    const eventsRes = await pool.query(
      `SELECT * FROM machine_events 
       WHERE machine_id = $1 
       ORDER BY event_time ASC`,
      [machine_id]
    );

    let totalMinutes = 0;
    let incidents = 0;
    let lastStoppedTime: number | null = null;

    for (const e of eventsRes.rows) {
      const eTime = new Date(e.event_time).getTime();
      if (['Stopped', 'Breakdown Reported', 'Maintenance'].includes(e.event_type)) {
        lastStoppedTime = eTime;
        incidents++;
      } else if (['Resumed', 'Running'].includes(e.event_type) && lastStoppedTime) {
        const diff = Math.round((eTime - lastStoppedTime) / (1000 * 60));
        totalMinutes += Math.max(1, diff);
        lastStoppedTime = null;
      }
    }

    if (lastStoppedTime) {
      const diff = Math.round((Date.now() - lastStoppedTime) / (1000 * 60));
      totalMinutes += Math.max(1, diff);
    }

    return res.json({
      success: true,
      data: { total_minutes: totalMinutes, incidents },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});
