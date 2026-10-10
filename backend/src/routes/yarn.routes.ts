import { Router, Request, Response } from 'express';
import { pool, withTransaction } from '../config/db.js';
import { z } from 'zod';

export const yarnRouter = Router();

const receiveBatchSchema = z.object({
  batch_code: z.string().min(2),
  barcode: z.string().optional(),
  yarn_type: z.enum(['Cotton', 'Polyester', 'Blend']),
  colour: z.string().min(1),
  supplier: z.string().min(1),
  quantity_received: z.number().positive(),
  unit: z.string().default('kg'),
  reorder_threshold: z.number().min(0).default(100),
  received_at: z.string().optional(),
  yarn_count_spec: z.string().optional(),
  po_reference: z.string().optional(),
  certificate_reference: z.string().optional(),
});

// GET /api/yarn-batches/barcode/:barcode (Step 2 required endpoint)
yarnRouter.get('/barcode/:barcode', async (req: Request, res: Response) => {
  const barcode = String(req.params.barcode).trim();
  try {
    const result = await pool.query(
      `SELECT * FROM yarn_batches 
       WHERE LOWER(barcode) = LOWER($1) OR LOWER(batch_code) = LOWER($1)
       LIMIT 1`,
      [barcode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `No yarn batch found for barcode "${barcode}".`,
        },
      });
    }

    return res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: err.message },
    });
  }
});

// GET /api/yarn-batches (List with filters)
yarnRouter.get('/', async (req: Request, res: Response) => {
  const { yarn_type, low_stock, search, qc_status } = req.query;
  try {
    let query = 'SELECT * FROM yarn_batches WHERE 1=1';
    const params: any[] = [];

    if (yarn_type && yarn_type !== 'ALL') {
      params.push(yarn_type);
      query += ` AND LOWER(yarn_type) = LOWER($${params.length})`;
    }

    if (qc_status && qc_status !== 'ALL') {
      params.push(qc_status);
      query += ` AND UPPER(inspection_status) = UPPER($${params.length})`;
    }

    if (low_stock === 'true') {
      query += ' AND quantity_available <= reorder_threshold';
    }

    if (search && typeof search === 'string' && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      query += ` AND (LOWER(batch_code) LIKE $${params.length} OR LOWER(barcode) LIKE $${params.length} OR LOWER(supplier) LIKE $${params.length} OR LOWER(colour) LIKE $${params.length})`;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: err.message },
    });
  }
});

// GET /api/inventory/low-stock
yarnRouter.get('/inventory/low-stock', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM yarn_batches WHERE quantity_available <= reorder_threshold ORDER BY quantity_available ASC'
    );
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: err.message },
    });
  }
});

// POST /api/yarn-batches (Receive batch & atomic stock movement - Pending Inspection by default)
yarnRouter.post('/', async (req: Request, res: Response) => {
  const parsed = receiveBatchSchema.safeParse(req.body);
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
  const barcode = data.barcode || `FTB-${Date.now().toString().slice(-6)}`;
  const receivedAt = data.received_at ? new Date(data.received_at) : new Date();

  try {
    const outcome = await withTransaction(async (client) => {
      // Check batch uniqueness
      const existing = await client.query(
        'SELECT id FROM yarn_batches WHERE LOWER(batch_code) = LOWER($1) OR LOWER(barcode) = LOWER($2)',
        [data.batch_code, barcode]
      );
      if (existing.rows.length > 0) {
        throw new Error(`Batch code or barcode already exists in database.`);
      }

      // Insert batch with inspection_status = PENDING_INSPECTION and quantity_available = 0
      const batchRes = await client.query(
        `INSERT INTO yarn_batches 
          (batch_code, barcode, yarn_type, colour, supplier, quantity_received, quantity_available, 
           quantity_approved, quantity_held, quantity_rejected, inspection_status, unit, reorder_threshold, 
           received_at, yarn_count_spec, po_reference, certificate_reference)
         VALUES ($1, $2, $3, $4, $5, $6, 0, 0, 0, 0, 'PENDING_INSPECTION', $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          data.batch_code,
          barcode,
          data.yarn_type,
          data.colour,
          data.supplier,
          data.quantity_received,
          data.unit,
          data.reorder_threshold,
          receivedAt,
          data.yarn_count_spec || null,
          data.po_reference || null,
          data.certificate_reference || null,
        ]
      );
      const batch = batchRes.rows[0];

      // Insert initial movement ledger record
      const moveRes = await client.query(
        `INSERT INTO stock_movements (batch_id, movement_type, quantity, reference, created_at)
         VALUES ($1, 'RECEIPT', $2, $3, NOW())
         RETURNING *`,
        [batch.id, data.quantity_received, `Initial delivery from ${data.supplier} (Pending Quality Inspection)`]
      );

      return { batch, movement: moveRes.rows[0] };
    });

    return res.status(201).json({
      success: true,
      data: outcome,
      message: 'Yarn batch received and logged as PENDING_INSPECTION. Stock will become available once approved by quality inspection.',
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { code: 'INSERT_ERROR', message: err.message },
    });
  }
});
