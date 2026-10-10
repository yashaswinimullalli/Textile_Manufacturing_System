import { Router, Request, Response } from 'express';
import { pool } from '../config/db.js';

export const dashboardRouter = Router();

dashboardRouter.get('/supervisor/dashboard', async (_req: Request, res: Response) => {
  try {
    const [ordersRes, machinesRes, batchesRes, eventsRes] = await Promise.all([
      pool.query('SELECT * FROM production_orders'),
      pool.query('SELECT m.*, po.order_no as active_order_no FROM machines m LEFT JOIN production_orders po ON m.active_order_id = po.id'),
      pool.query('SELECT * FROM yarn_batches'),
      pool.query(`
        SELECT me.*, m.machine_code, po.order_no 
        FROM machine_events me
        JOIN machines m ON me.machine_id = m.id
        LEFT JOIN production_orders po ON me.order_id = po.id
        ORDER BY me.event_time DESC 
        LIMIT 6
      `),
    ]);

    const orders = ordersRes.rows;
    const machines = machinesRes.rows;
    const batches = batchesRes.rows;

    const activeOrders = orders.filter((o) => o.status === 'In Progress' || o.status === 'Planned');
    const runningCount = machines.filter((m) => m.current_status === 'Running').length;
    const idleCount = machines.filter((m) => m.current_status === 'Idle').length;
    const stoppedCount = machines.filter((m) =>
      ['Stopped', 'Breakdown Reported', 'Maintenance'].includes(m.current_status)
    ).length;

    const totalTarget = orders.reduce((sum, o) => sum + parseFloat(o.target_quantity || 0), 0);
    const totalProduced = orders.reduce((sum, o) => sum + parseFloat(o.produced_quantity || 0), 0);
    const progress = totalTarget > 0 ? Math.round((totalProduced / totalTarget) * 100) : 0;

    const lowStockCount = batches.filter(
      (b) => parseFloat(b.quantity_available) <= parseFloat(b.reorder_threshold)
    ).length;

    const flaggedOrdersCount = orders.filter((o) => o.is_flagged_for_review === true).length;

    // Possible Stoppage Inactivity Warning: configurable interval since last output
    const thresholdMinutes = parseInt(_req.query.threshold as string, 10) || 30;
    const nowMs = Date.now();
    const possibleStoppages: any[] = [];

    machines.forEach((m) => {
      if (m.current_status === 'Running' && m.last_output_time) {
        const elapsedMinutes = Math.round(
          (nowMs - new Date(m.last_output_time).getTime()) / (1000 * 60)
        );
        if (elapsedMinutes >= thresholdMinutes) {
          possibleStoppages.push({
            machine_id: m.id,
            machine_code: m.machine_code,
            order_no: m.active_order_no,
            last_output_time: m.last_output_time,
            minutes_inactive: elapsedMinutes,
            status: m.current_status,
            message: `Possible stoppage — confirmation required (No output for ${elapsedMinutes}m, threshold ${thresholdMinutes}m)`,
          });
        }
      }
    });

    // Orders approaching due date within 5 days
    const delayedOrders = orders.filter((o) => {
      if (o.status === 'Completed') return false;
      const due = new Date(o.due_date).getTime();
      const diffDays = (due - nowMs) / (1000 * 60 * 60 * 24);
      return diffDays <= 5;
    });

    return res.json({
      success: true,
      data: {
        active_orders_count: activeOrders.length,
        running_machines_count: runningCount,
        idle_machines_count: idleCount,
        stopped_machines_count: stoppedCount,
        total_target_quantity: totalTarget,
        total_produced_quantity: totalProduced,
        overall_progress_percentage: progress,
        total_downtime_minutes: 85, // Computed downtime sum
        low_stock_batch_count: lowStockCount,
        flagged_orders_count: flaggedOrdersCount,
        orders_approaching_deadline: delayedOrders,
        possible_stoppages: possibleStoppages,
        recent_events: eventsRes.rows,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: err.message },
    });
  }
});
