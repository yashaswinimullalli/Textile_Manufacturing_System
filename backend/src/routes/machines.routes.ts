import { Router, Request, Response } from 'express';
import { pool, withTransaction } from '../config/db.js';
import { simulationEngine } from '../services/simulation.service.js';
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
    fabric_type: row.fabric_type || null,
    customer_name: row.customer_name || null,
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
             po.order_number, po.fabric_type, po.customer_name,
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
              po.order_number, po.fabric_type, po.customer_name,
              e.name as operator_name
       FROM machines m
       LEFT JOIN machine_assignments ma ON m.id = ma.machine_id AND ma.status = 'ACTIVE'
       LEFT JOIN production_orders po ON ma.production_order_id = po.id
       LEFT JOIN employees e ON ma.assigned_employee_id = e.id
       WHERE ${isNum ? 'm.id = $1' : 'LOWER(m.machine_code) = LOWER($1)'}
       LIMIT 1`,
      [isNum ? Number(id) : id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Machine not found' } });
    }

    return res.json({ success: true, data: mapMachineRow(result.rows[0]) });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// POST /api/machines/assign-batch (Assign next 5 orders to machines)
machinesRouter.post('/assign-batch', async (req: Request, res: Response) => {
  const { machine_ids, order_ids } = req.body;
  if (!Array.isArray(machine_ids) || machine_ids.length === 0) {
    return res.status(400).json({ success: false, error: { message: 'machine_ids array required' } });
  }

  try {
    const outcome = await withTransaction(async (client) => {
      let targetOrderIds: number[] = [];
      if (Array.isArray(order_ids) && order_ids.length > 0) {
        for (const oId of order_ids) {
          const isNum = /^\d+$/.test(String(oId));
          const oRes = await client.query(
            `SELECT id FROM production_orders WHERE ${isNum ? 'id = $1' : 'LOWER(order_number) = LOWER($1)'} LIMIT 1`,
            [isNum ? Number(oId) : String(oId)]
          );
          if (oRes.rows.length > 0) targetOrderIds.push(oRes.rows[0].id);
        }
      } else {
        const oRes = await client.query(
          `SELECT id FROM production_orders 
           WHERE status IN ('PENDING', 'IN_PROGRESS')
             AND id NOT IN (SELECT production_order_id FROM machine_assignments WHERE status = 'ACTIVE')
           ORDER BY id ASC LIMIT $1`,
          [machine_ids.length]
        );
        targetOrderIds = oRes.rows.map((r: any) => r.id);
      }

      // If there aren't enough pending orders, grab other available orders or provision orders
      if (targetOrderIds.length < machine_ids.length) {
        const excludeList = targetOrderIds.length > 0 ? targetOrderIds.join(',') : '0';
        const moreOrders = await client.query(
          `SELECT id FROM production_orders 
           WHERE id NOT IN (${excludeList})
           ORDER BY id ASC LIMIT $1`,
          [machine_ids.length - targetOrderIds.length]
        );
        for (const row of moreOrders.rows) {
          targetOrderIds.push(row.id);
        }
      }

      // If still fewer orders than machines, create new production orders
      while (targetOrderIds.length < machine_ids.length) {
        const nextIdx = 100 + targetOrderIds.length + 1;
        const newOrder = await client.query(
          `INSERT INTO production_orders (order_number, customer_name, fabric_type, required_quantity, produced_quantity, unit, status, priority, start_date, due_date, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 0, 'METERS', 'PENDING', 'HIGH', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', NOW(), NOW())
           RETURNING id`,
          [`VAS-PO-${nextIdx}`, `Apex Textiles Batch #${nextIdx}`, 'Cotton Poplin 60s', 5000]
        );
        targetOrderIds.push(newOrder.rows[0].id);
      }

      let assignedCount = 0;
      const assignedMachineIds: number[] = [];

      for (let i = 0; i < machine_ids.length; i++) {
        const mId = machine_ids[i];
        const orderIdNum = targetOrderIds[i];
        if (!orderIdNum) break;

        const isNum = /^\d+$/.test(String(mId));
        const mRes = await client.query(
          `SELECT id FROM machines WHERE ${isNum ? 'id = $1' : 'LOWER(machine_code) = LOWER($1)'} LIMIT 1`,
          [isNum ? Number(mId) : String(mId)]
        );
        if (mRes.rows.length === 0) continue;
        const machineId = mRes.rows[0].id;

        await client.query(
          "UPDATE machine_assignments SET status = 'COMPLETED', released_at = NOW() WHERE machine_id = $1 AND status = 'ACTIVE'",
          [machineId]
        );

        await client.query(
          `INSERT INTO machine_assignments (machine_id, production_order_id, assigned_employee_id, assigned_at, status)
           VALUES ($1, $2, 1, NOW(), 'ACTIVE')`,
          [machineId, orderIdNum]
        );

        await client.query("UPDATE machines SET status = 'RUNNING' WHERE id = $1", [machineId]);
        await client.query("UPDATE production_orders SET status = 'IN_PROGRESS' WHERE id = $1", [orderIdNum]);

        await client.query(
          `INSERT INTO machine_events (machine_id, event_type, reason, started_at, remarks, created_at)
           VALUES ($1, 'START', 'Assigned to production order', NOW(), $2, NOW())`,
          [machineId, `Assigned to order #${orderIdNum}`]
        );
        assignedCount++;
        assignedMachineIds.push(machineId);
      }

      return { assignedCount, assignedMachineIds };
    });

    // Also trigger simulation engine for assigned machines so they run immediately
    for (const mId of outcome.assignedMachineIds) {
      try {
        simulationEngine.triggerScenario(String(mId), 'NORMAL_PRODUCTION');
      } catch {}
    }

    return res.status(201).json({
      success: true,
      count: outcome.assignedCount,
      message: `Successfully assigned ${outcome.assignedCount} machines.`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/machines/:id/assign & /:id/assignments (Assign order & operator to machine)
const handleAssignMachine = async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { order_id, employee_id, operator_name } = req.body;

  try {
    const outcome = await withTransaction(async (client) => {
      const isNum = /^\d+$/.test(id);
      const mRes = await client.query(
        `SELECT id FROM machines WHERE ${isNum ? 'id = $1' : 'LOWER(machine_code) = LOWER($1)'} LIMIT 1`,
        [isNum ? Number(id) : id]
      );
      if (mRes.rows.length === 0) throw new Error('Machine not found');
      const machineId = mRes.rows[0].id;

      const isOrderNum = /^\d+$/.test(String(order_id));
      const oRes = await client.query(
        `SELECT id FROM production_orders WHERE ${isOrderNum ? 'id = $1' : 'LOWER(order_number) = LOWER($1)'} LIMIT 1`,
        [isOrderNum ? Number(order_id) : String(order_id)]
      );
      if (oRes.rows.length === 0) throw new Error('Production order not found');
      const orderIdNum = oRes.rows[0].id;

      await client.query(
        "UPDATE machine_assignments SET status = 'COMPLETED', released_at = NOW() WHERE machine_id = $1 AND status = 'ACTIVE'",
        [machineId]
      );

      const assignRes = await client.query(
        `INSERT INTO machine_assignments (machine_id, production_order_id, assigned_employee_id, assigned_at, status)
         VALUES ($1, $2, $3, NOW(), 'ACTIVE')
         RETURNING *`,
        [machineId, orderIdNum, employee_id ? Number(employee_id) : 1]
      );

      await client.query("UPDATE machines SET status = 'RUNNING' WHERE id = $1", [machineId]);
      await client.query("UPDATE production_orders SET status = 'IN_PROGRESS' WHERE id = $1", [orderIdNum]);

      await client.query(
        `INSERT INTO machine_events (machine_id, event_type, reason, started_at, remarks, created_at)
         VALUES ($1, 'START', 'Assigned to production order', NOW(), $2, NOW())`,
        [machineId, `Assigned to order #${orderIdNum}`]
      );

      return { assignment: assignRes.rows[0], machineId };
    });

    try {
      simulationEngine.triggerScenario(String(outcome.machineId), 'NORMAL_PRODUCTION');
    } catch {}

    return res.status(201).json({ success: true, data: outcome.assignment, message: 'Machine assignment confirmed.' });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: { code: 'ASSIGN_ERROR', message: err.message } });
  }
};

machinesRouter.post('/:id/assign', handleAssignMachine);
machinesRouter.post('/:id/assignments', handleAssignMachine);

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
        `SELECT id FROM machines WHERE ${isNum ? 'id = $1' : 'LOWER(machine_code) = LOWER($1)'} LIMIT 1`,
        [isNum ? Number(id) : id]
      );
      if (mRes.rows.length === 0) throw new Error('Machine not found');
      const machineId = mRes.rows[0].id;

      // Update machine status and event type to match PostgreSQL constraints
      let newMachineStatus = 'STOPPED';
      let dbEventType = 'OTHER';

      if (evType === 'RUNNING' || evType === 'RESUMED' || evType === 'START') {
        newMachineStatus = 'RUNNING';
        dbEventType = 'START';
      } else if (evType === 'MAINTENANCE') {
        newMachineStatus = 'MAINTENANCE';
        dbEventType = 'MAINTENANCE';
      } else if (evType === 'BREAKDOWN') {
        newMachineStatus = 'STOPPED';
        dbEventType = 'DOWNTIME';
      } else if (evType === 'STOPPED' || evType === 'STOP') {
        newMachineStatus = 'STOPPED';
        dbEventType = 'STOP';
      }

      await client.query('UPDATE machines SET status = $1 WHERE id = $2', [newMachineStatus, machineId]);

      // Insert event
      const evRes = await client.query(
        `INSERT INTO machine_events (machine_id, event_type, reason, started_at, remarks, created_at)
         VALUES ($1, $2, $3, NOW(), $4, NOW())
         RETURNING *`,
        [machineId, dbEventType, reason || 'Operator reported event', remarks || '']
      );

      return { event: evRes.rows[0], machineId };
    });

    try {
      let simScenario: 'NORMAL_PRODUCTION' | 'UNEXPECTED_STOP' | 'EMERGENCY_STOP' | 'PLANNED_MAINTENANCE' | 'RESUME_PRODUCTION' = 'UNEXPECTED_STOP';
      if (evType === 'RUNNING' || evType === 'RESUMED') simScenario = 'RESUME_PRODUCTION';
      else if (evType === 'MAINTENANCE') simScenario = 'PLANNED_MAINTENANCE';
      else if (evType === 'BREAKDOWN') simScenario = 'UNEXPECTED_STOP';
      simulationEngine.triggerScenario(String(outcome.machineId), simScenario, reason);
    } catch {}

    return res.status(201).json({ success: true, data: outcome.event, message: `Machine event "${evType}" logged.` });
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
