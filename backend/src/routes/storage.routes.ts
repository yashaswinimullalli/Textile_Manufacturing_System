import { Router, Request, Response } from 'express';
import { pool } from '../config/db.js';

export const storageRouter = Router();

// GET /api/storage-locations (List all warehouse storage racks)
storageRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT sl.*, COUNT(yb.id) as current_batch_count, COALESCE(SUM(yb.available_quantity), 0) as current_stored_weight
      FROM storage_locations sl
      LEFT JOIN yarn_batches yb ON sl.id = yb.storage_location_id
      GROUP BY sl.id
      ORDER BY sl.id ASC
    `);
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});
