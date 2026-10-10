import express from 'express';
import cors from 'cors';
import { yarnRouter } from './routes/yarn.routes.js';
import { stockRouter } from './routes/stock.routes.js';
import { ordersRouter } from './routes/orders.routes.js';
import { machinesRouter } from './routes/machines.routes.js';
import { dashboardRouter } from './routes/dashboard.routes.js';
import { simulationRouter } from './routes/simulation.routes.js';
import { qualityRouter } from './routes/quality.routes.js';
import { pool } from './config/db.js';

export const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Health check endpoint with database ping
app.get('/api/health', async (_req, res) => {
  try {
    const dbRes = await pool.query('SELECT NOW() as db_time, current_database() as db_name');
    res.json({
      status: 'UP',
      service: 'FabricTrace Backend REST API',
      database: 'Connected',
      db_time: dbRes.rows[0].db_time,
      db_name: dbRes.rows[0].db_name,
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'DEGRADED',
      service: 'FabricTrace Backend REST API',
      database: 'Disconnected',
      error: err.message,
    });
  }
});

// Mount modular REST routes
app.use('/api/yarn-batches', yarnRouter);
app.use('/api/stock-movements', stockRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/machines', machinesRouter);
app.use('/api/simulation', simulationRouter);
app.use('/api/quality-inspections', qualityRouter);
app.use('/api', dashboardRouter);

