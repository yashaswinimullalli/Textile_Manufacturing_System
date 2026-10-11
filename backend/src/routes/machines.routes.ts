import { Router, Request, Response } from 'express';
import { pool, withTransaction } from '../config/db.js';
import { z } from 'zod';

export const machinesRouter = Router();

function mapMachineRow(row: any) {
  // Map DB status to UI status
  let uiStatus = 'Idle';
  if (row.status === 'RUNNING') uiStatus = 'Running';
  else if (row.status === 'STOPPED') uiStatus = 'Stopped';
  else if (row.status === 'MAINTENANCE') uiStatus = 'Maintenance';
  else if (row.status === 'BREAKDOWN') uiStatus = 'Breakdown Reported';
  else if (row.status === 'AVAILABLE') uiStatus = 'Idle';

  return {
    ...row,
    id: String(row.id),
    current_status: uiStatus,
    db_status: row.status,
    process_type: row.machine_type || 'Weaving',
    assigned_operator: row.operator_name || 'Floor Operator',
    active_order_id: row.active_order_id ? String(row.active_order_id) : null,
    active_order_no: row.order_number || null,
    current_shift: 'Morning (06:00 - 14:00)',
    capacity: parseFloat(row.capacity || 500),
  };
}

// GET /api/machines (List machines with active assignment and active order)
machinesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT m.*,
             ma.id as assignment_id, ma.production_order_id as active_order_id,
             po.order_number, po.fabric_type,
             e.name as operator_name
      FROM machines m
      LEFT JOIN machine_assignments ma ON m.id = ma.machine_id AND ma.status = 'ACTIVE'
      LEFT JOIN production_orders po ON ma.production_order_id = po.id
      LEFT JOIN employees e ON ma.assigned_employee_id = e.id
      ORDER BY m.id ASC
    `);

    const data = result.rows.map(mapMachineRow);
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// GET /api/machines/:id
machinesRouter.get('/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    const isNum = /^\d+$/.test(id);
    const result = await pool.query(
      `SELECT m.*,
              ma.id as assignment_id, ma.production_order_id as active_order_id,
              po.order_number, po.fabric_type,
              e.name as operator_name
       FROM machines m
       LEFT JOIN machine_assignments ma ON m.id = ma.machine_id AND ma.status = 'ACTIVE'
       LEFT JOIN production_orders po ON ma.production_order_id = po.id
       LEFT JOIN employees e ON ma.assigned_employee_id = e.id
       WHERE ${isNum ? 'm.id = $1 OR' : ''} LOWER(m.machine_code) = LOWER($1)
       LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Machine not found' } });
    }

    return res.json({ success: true, data: mapMachineRow(result.rows[0]) });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// POST /api/machines/:id/assign (Assign order & operator to machine)
machinesRouter.post('/:id/assign', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { order_id, employee_id, operator_name } = req.body;

  try {
    const outcome = await withTransaction(async (client) => {
      // 1. Resolve machine
      const isNum = /^\d+$/.test(id);
      const mRes = await client.query(
        `SELECT id FROM machines WHERE ${isNum ? 'id = $1 OR' : ''} LOWER(machine_code) = LOWER($1) LIMIT 1`,
        [id]
      );
      if (mRes.rows.length === 0) throw new Error('Machine not found');
      const machineId = mRes.rows[0].id;

      // 2. Resolve order
      const isOrderNum = /^\d+$/.test(String(order_id));
      const oRes = await client.query(
        `SELECT id FROM production_orders WHERE ${isOrderNum ? 'id = $1 OR' : ''} LOWER(order_number) = LOWER($1) LIMIT 1`,
        [String(order_id)]
      );
      if (oRes.rows.length === 0) throw new Error('Production order not found');
      const orderIdNum = oRes.rows[0].id;

      // 3. Close previous active assignments
      await client.query(
        "UPDATE machine_assignments SET status = 'RELEASED', released_at = NOW() WHERE machine_id = $1 AND status = 'ACTIVE'",
        [machineId]
      );

      // 4. Create new assignment
      const assignRes = await client.query(
        `INSERT INTO machine_assignments (machine_id, production_order_id, assigned_employee_id, assigned_at, status)
         VALUES ($1, $2, $3, NOW(), 'ACTIVE')
         RETURNING *`,
        [machineId, orderIdNum, employee_id ? Number(employee_id) : 1]
      );

      // 5. Update machine status to RUNNING
      await client.query("UPDATE machines SET status = 'RUNNING' WHERE id = $1", [machineId]);

      // 6. Record event
      await client.query(
        `INSERT INTO machine_events (machine_id, event_type, reason, started_at, remarks, created_at)
         VALUES ($1, 'RUNNING', 'Assigned to production order', NOW(), $2, NOW())`,
        [machineId, `Assigned to order #${orderIdNum}`]
      );

      return assignRes.rows[0];
    });

    return res.status(201).json({ success: true, data: outcome, message: 'Machine assignment confirmed.' });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: { code: 'ASSIGN_ERROR', message: err.message } });
  }
});

// POST /api/machines/:id/events (Record machine stoppage, breakdown, or maintenance)
machinesRouter.post('/:id/events', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { event_type, reason, remarks } = req.body;

  const validTypes = ['RUNNING', 'STOPPED', 'BREAKDOWN', 'MAINTENANCE', 'RESUMED'];
  const evType = String(event_type || 'STOPPED').toUpperCase();

  try {
    const outcome = await withTransaction(async (client) => {
      const isNum = /^\d+$/.test(id);
      const mRes = await client.query(
        `SELECT id FROM machines WHERE ${isNum ? 'id = $1 OR' : ''} LOWER(machine_code) = LOWER($1) LIMIT 1`,
        [id]
      );
      if (mRes.rows.length === 0) throw new Error('Machine not found');
      const machineId = mRes.rows[0].id;

      // Update machine status accordingly
      let newMachineStatus = 'STOPPED';
      if (evType === 'RUNNING' || evType === 'RESUMED') newMachineStatus = 'RUNNING';
      else if (evType === 'MAINTENANCE') newMachineStatus = 'MAINTENANCE';
      else if (evType === 'BREAKDOWN') newMachineStatus = 'STOPPED';

      await client.query('UPDATE machines SET status = $1 WHERE id = $2', [newMachineStatus, machineId]);

      // Insert event
      const evRes = await client.query(
        `INSERT INTO machine_events (machine_id, event_type, reason, started_at, remarks, created_at)
         VALUES ($1, $2, $3, NOW(), $4, NOW())
         RETURNING *`,
        [machineId, evType, reason || 'Operator reported event', remarks || '']
      );

      return evRes.rows[0];
    });

    return res.status(201).json({ success: true, data: outcome, message: `Machine event "${evType}" logged.` });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: { code: 'EVENT_ERROR', message: err.message } });
  }
});

// GET /api/machines/events/all (List recent machine events)
machinesRouter.get('/events/all', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT me.*, m.machine_code, m.machine_name
      FROM machine_events me
      JOIN machines m ON me.machine_id = m.id
      ORDER BY me.started_at DESC
      LIMIT 50
    `);
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});
