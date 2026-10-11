import { Router, Request, Response } from 'express';
import { pool, withTransaction } from '../config/db.js';
import { z } from 'zod';

export const accountsRouter = Router();

// ─── DEPARTMENTS ─────────────────────────────────────────────────────────────
accountsRouter.get('/departments', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT d.*, COUNT(e.id) as employee_count
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id AND e.is_active = true
      GROUP BY d.id
      ORDER BY d.id ASC
    `);
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

accountsRouter.post('/departments', async (req: Request, res: Response) => {
  const { name, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: { message: 'Department name is required' } });
  }
  try {
    const result = await pool.query(
      'INSERT INTO departments (name, description, created_at) VALUES ($1, $2, NOW()) RETURNING *',
      [name.trim(), description || '']
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// ─── EMPLOYEES ───────────────────────────────────────────────────────────────
accountsRouter.get('/employees', async (req: Request, res: Response) => {
  const { department_id, search, active_only } = req.query;
  try {
    let query = `
      SELECT e.*, d.name as department_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (department_id) {
      params.push(Number(department_id));
      query += ` AND e.department_id = $${params.length}`;
    }

    if (active_only === 'true') {
      query += ' AND e.is_active = true';
    }

    if (search && typeof search === 'string' && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      query += ` AND (LOWER(e.name) LIKE $${params.length} OR LOWER(e.employee_code) LIKE $${params.length} OR LOWER(e.role) LIKE $${params.length})`;
    }

    query += ' ORDER BY e.id ASC';

    const result = await pool.query(query, params);
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

accountsRouter.post('/employees', async (req: Request, res: Response) => {
  const { employee_code, name, department_id, role, phone, daily_wage, is_active } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: { message: 'Employee name is required' } });
  }

  const code = (employee_code || `VAS-EMP-${Date.now().toString().slice(-4)}`).trim();
  const wage = parseFloat(daily_wage || 750);

  try {
    const result = await pool.query(
      `INSERT INTO employees (employee_code, name, department_id, role, phone, daily_wage, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [
        code,
        name.trim(),
        department_id ? Number(department_id) : 1,
        role || 'Worker',
        phone || '',
        wage,
        is_active !== undefined ? Boolean(is_active) : true,
      ]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// ─── ATTENDANCE & WAGES ───────────────────────────────────────────────────────
accountsRouter.get('/attendance', async (req: Request, res: Response) => {
  const { date, employee_id } = req.query;
  try {
    let query = `
      SELECT ea.*, e.name as employee_name, e.employee_code, e.role, d.name as department_name
      FROM employee_attendance ea
      JOIN employees e ON ea.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (date) {
      params.push(date);
      query += ` AND ea.attendance_date = $${params.length}`;
    }

    if (employee_id) {
      params.push(Number(employee_id));
      query += ` AND ea.employee_id = $${params.length}`;
    }

    query += ' ORDER BY ea.attendance_date DESC, ea.id ASC';

    const result = await pool.query(query, params);
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

accountsRouter.post('/attendance', async (req: Request, res: Response) => {
  const { employee_id, attendance_date, status, hours_worked, remarks } = req.body;
  if (!employee_id) {
    return res.status(400).json({ success: false, error: { message: 'Employee ID is required' } });
  }

  const attDate = attendance_date ? new Date(attendance_date) : new Date();
  const attStatus = (status || 'PRESENT').toUpperCase();
  const hours = parseFloat(hours_worked || (attStatus === 'PRESENT' ? 8 : attStatus === 'HALF_DAY' ? 4 : 0));

  try {
    const outcome = await withTransaction(async (client) => {
      // 1. Fetch employee daily wage
      const empRes = await client.query('SELECT daily_wage FROM employees WHERE id = $1', [Number(employee_id)]);
      if (empRes.rows.length === 0) throw new Error('Employee not found');
      const dailyWage = parseFloat(empRes.rows[0].daily_wage || 750);

      // Wage calculation: proportional to standard 8-hour shift
      const calculatedWage = (dailyWage * (hours / 8.0));

      // 2. Prevent duplicate attendance for same employee and date
      const checkRes = await client.query(
        'SELECT id FROM employee_attendance WHERE employee_id = $1 AND attendance_date = $2',
        [Number(employee_id), attDate]
      );

      let attRow;
      if (checkRes.rows.length > 0) {
        // Update existing attendance
        const updRes = await client.query(
          `UPDATE employee_attendance 
           SET status = $1, hours_worked = $2, wage_amount = $3, remarks = $4 
           WHERE id = $5 
           RETURNING *`,
          [attStatus, hours, calculatedWage, remarks || 'Updated attendance', checkRes.rows[0].id]
        );
        attRow = updRes.rows[0];
      } else {
        const insRes = await client.query(
          `INSERT INTO employee_attendance (employee_id, attendance_date, status, hours_worked, wage_amount, remarks, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           RETURNING *`,
          [Number(employee_id), attDate, attStatus, hours, calculatedWage, remarks || 'Logged daily attendance']
        );
        attRow = insRes.rows[0];
      }

      return attRow;
    });

    return res.status(201).json({ success: true, data: outcome, message: 'Attendance & wage recorded.' });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// ─── OPERATING EXPENSES ───────────────────────────────────────────────────────
accountsRouter.get('/expenses', async (req: Request, res: Response) => {
  const { category, start_date, end_date } = req.query;
  try {
    let query = `
      SELECT oe.*, e.name as recorded_by_name
      FROM operating_expenses oe
      LEFT JOIN employees e ON oe.recorded_by = e.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category && category !== 'ALL') {
      params.push(category);
      query += ` AND oe.category = $${params.length}`;
    }

    if (start_date) {
      params.push(start_date);
      query += ` AND oe.expense_date >= $${params.length}`;
    }

    if (end_date) {
      params.push(end_date);
      query += ` AND oe.expense_date <= $${params.length}`;
    }

    query += ' ORDER BY oe.expense_date DESC, oe.id DESC';

    const result = await pool.query(query, params);
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

accountsRouter.post('/expenses', async (req: Request, res: Response) => {
  const { category, description, amount, expense_date, expense_reference, recorded_by } = req.body;
  const numAmount = parseFloat(amount);
  if (!numAmount || numAmount <= 0) {
    return res.status(400).json({ success: false, error: { message: 'Amount must be greater than zero.' } });
  }

  const ref = expense_reference || `VAS-EXP-${Date.now().toString().slice(-6)}`;
  const expDate = expense_date ? new Date(expense_date) : new Date();

  try {
    const result = await pool.query(
      `INSERT INTO operating_expenses (expense_reference, category, description, amount, expense_date, recorded_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [
        ref,
        category || 'Utilities',
        description || 'Operating expense logged',
        numAmount,
        expDate,
        recorded_by ? Number(recorded_by) : 4,
      ]
    );
    return res.status(201).json({ success: true, data: result.rows[0], message: 'Expense logged successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// ─── PROFITABILITY & FINANCIAL REPORT ─────────────────────────────────────────
accountsRouter.get('/profit-report', async (_req: Request, res: Response) => {
  try {
    // 1. Total recorded revenue from dispatches
    const revRes = await pool.query('SELECT COALESCE(SUM(total_revenue), 0) as total_revenue FROM dispatches');
    const totalRevenue = parseFloat(revRes.rows[0].total_revenue || 0);

    // 2. Total operating expenses
    const expRes = await pool.query('SELECT COALESCE(SUM(amount), 0) as total_expenses FROM operating_expenses');
    const totalOperatingExpenses = parseFloat(expRes.rows[0].total_expenses || 0);

    // 3. Total wage expenses
    const wageRes = await pool.query('SELECT COALESCE(SUM(wage_amount), 0) as total_wages FROM employee_attendance');
    const totalWages = parseFloat(wageRes.rows[0].total_wages || 0);

    // Net profit = recorded revenue - (operating expenses + employee wages)
    const netProfit = totalRevenue - (totalOperatingExpenses + totalWages);

    // Daily breakdown for current month
    const dailyDispatches = await pool.query(`
      SELECT DATE(dispatch_date) as day, SUM(total_revenue) as revenue
      FROM dispatches
      GROUP BY DATE(dispatch_date)
      ORDER BY day DESC
    `);

    const dailyExpenses = await pool.query(`
      SELECT expense_date as day, SUM(amount) as expense
      FROM operating_expenses
      GROUP BY expense_date
      ORDER BY day DESC
    `);

    const dailyWages = await pool.query(`
      SELECT attendance_date as day, SUM(wage_amount) as wage
      FROM employee_attendance
      GROUP BY attendance_date
      ORDER BY day DESC
    `);

    return res.json({
      success: true,
      data: {
        total_revenue: totalRevenue,
        total_operating_expenses: totalOperatingExpenses,
        total_wage_expenses: totalWages,
        net_profit: netProfit,
        profit_margin: totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0,
        daily_breakdown: {
          dispatches: dailyDispatches.rows,
          expenses: dailyExpenses.rows,
          wages: dailyWages.rows,
        },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});
