import { Router, Request, Response } from 'express';
import { pool, withTransaction } from '../config/db.js';
import { z } from 'zod';

export const yarnRouter = Router();

// Zod validation for receiving a new yarn batch
const receiveBatchSchema = z.object({
  batch_code: z.string().min(2),
  barcode_id: z.string().optional(),
  barcode: z.string().optional(), // alias
  yarn_type: z.enum(['Cotton', 'Polyester', 'Blend']),
  colour: z.string().min(1),
  supplier_name: z.string().optional(),
  supplier: z.string().optional(), // alias
  received_quantity: z.number().positive().optional(),
  quantity_received: z.number().positive().optional(), // alias
  unit: z.string().default('kg'),
  reorder_threshold: z.number().min(0).default(100),
  storage_location_id: z.union([z.number(), z.string()]).optional(),
  storage_location: z.string().optional(),
  qc_status: z.enum(['PENDING_INSPECTION', 'PASSED', 'ON_HOLD', 'PARTIALLY_ACCEPTED', 'REJECTED']).default('PENDING_INSPECTION'),
  received_at: z.string().optional(),
});

// Helper to format yarn batch with standard and backward-compatible fields
function mapYarnBatch(row: any) {
  return {
    ...row,
    id: String(row.id),
    barcode: row.barcode_id || row.barcode,
    supplier: row.supplier_name || row.supplier,
    quantity_received: parseFloat(row.received_quantity ?? row.quantity_received ?? 0),
    quantity_available: parseFloat(row.available_quantity ?? row.quantity_available ?? 0),
    inspection_status: row.qc_status || row.inspection_status || 'PENDING_INSPECTION',
    storage_location: row.rack_name || row.storage_location || (row.storage_location_id ? `Rack #${row.storage_location_id}` : 'Unassigned'),
    storage_location_id: row.storage_location_id ? Number(row.storage_location_id) : null,
    reorder_threshold: parseFloat(row.reorder_threshold ?? 100),
  };
}

// GET /api/yarn-batches/barcode/:barcode (Quick lookup for scanner)
yarnRouter.get('/barcode/:barcode', async (req: Request, res: Response) => {
  const barcode = String(req.params.barcode).trim();
  try {
    const result = await pool.query(
      `SELECT yb.*, sl.location_code, sl.rack_name
       FROM yarn_batches yb
       LEFT JOIN storage_locations sl ON yb.storage_location_id = sl.id
       WHERE LOWER(yb.barcode_id) = LOWER($1) OR LOWER(yb.batch_code) = LOWER($1)
       LIMIT 1`,
      [barcode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `No yarn batch found matching barcode or batch code "${barcode}".`,
        },
      });
    }

    return res.json({
      success: true,
      data: mapYarnBatch(result.rows[0]),
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: err.message },
    });
  }
});

// GET /api/yarn-batches (List with search & filters)
yarnRouter.get('/', async (req: Request, res: Response) => {
  const { yarn_type, low_stock, search, qc_status, storage_location_id } = req.query;
  try {
    let query = `
      SELECT yb.*, sl.location_code, sl.rack_name
      FROM yarn_batches yb
      LEFT JOIN storage_locations sl ON yb.storage_location_id = sl.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (yarn_type && yarn_type !== 'ALL') {
      params.push(yarn_type);
      query += ` AND LOWER(yb.yarn_type) = LOWER($${params.length})`;
    }

    if (qc_status && qc_status !== 'ALL') {
      params.push(qc_status);
      query += ` AND UPPER(yb.qc_status) = UPPER($${params.length})`;
    }

    if (low_stock === 'true') {
      query += ' AND yb.available_quantity <= yb.reorder_threshold';
    }

    if (storage_location_id) {
      params.push(storage_location_id);
      query += ` AND yb.storage_location_id = $${params.length}`;
    }

    if (search && typeof search === 'string' && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      query += ` AND (LOWER(yb.batch_code) LIKE $${params.length} OR LOWER(yb.barcode_id) LIKE $${params.length} OR LOWER(yb.supplier_name) LIKE $${params.length} OR LOWER(yb.colour) LIKE $${params.length})`;
    }

    query += ' ORDER BY yb.created_at DESC';

    const result = await pool.query(query, params);
    const data = result.rows.map(mapYarnBatch);
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: err.message },
    });
  }
});

// GET /api/yarn-batches/:id
yarnRouter.get('/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    const isNumeric = /^\d+$/.test(id);
    const result = await pool.query(
      `SELECT yb.*, sl.location_code, sl.rack_name
       FROM yarn_batches yb
       LEFT JOIN storage_locations sl ON yb.storage_location_id = sl.id
       WHERE ${isNumeric ? 'yb.id = $1 OR' : ''} LOWER(yb.batch_code) = LOWER($1) OR LOWER(yb.barcode_id) = LOWER($1)
       LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Yarn batch not found' } });
    }

    return res.json({ success: true, data: mapYarnBatch(result.rows[0]) });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// POST /api/yarn-batches (Create/receive new batch & initial stock movement)
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
  const batchCode = data.batch_code.trim();
  const barcodeId = (data.barcode_id || data.barcode || `VAS-QR-${Date.now().toString().slice(-6)}`).trim();
  const supplierName = (data.supplier_name || data.supplier || 'Generic Supplier').trim();
  const qty = Number(data.received_quantity ?? data.quantity_received ?? 0);
  const receivedAt = data.received_at ? new Date(data.received_at) : new Date();

  if (qty <= 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_QUANTITY', message: 'Received quantity must be greater than zero.' },
    });
  }

  try {
    const outcome = await withTransaction(async (client) => {
      // Check batch uniqueness
      const existing = await client.query(
        'SELECT id FROM yarn_batches WHERE LOWER(batch_code) = LOWER($1) OR LOWER(barcode_id) = LOWER($2)',
        [batchCode, barcodeId]
      );
      if (existing.rows.length > 0) {
        throw new Error(`Batch code "${batchCode}" or barcode "${barcodeId}" already exists in the database.`);
      }

      // Resolve storage location if supplied as name or ID
      let storageLocationId: number | null = null;
      if (data.storage_location_id) {
        storageLocationId = Number(data.storage_location_id);
      } else if (data.storage_location) {
        const slRes = await client.query(
          'SELECT id FROM storage_locations WHERE LOWER(rack_name) = LOWER($1) OR LOWER(location_code) = LOWER($1) LIMIT 1',
          [data.storage_location.trim()]
        );
        if (slRes.rows.length > 0) {
          storageLocationId = Number(slRes.rows[0].id);
        }
      }

      // Default to 1 (Rack A1) if none found
      if (!storageLocationId) {
        const defaultSl = await client.query('SELECT id FROM storage_locations ORDER BY id ASC LIMIT 1');
        if (defaultSl.rows.length > 0) {
          storageLocationId = Number(defaultSl.rows[0].id);
        }
      }

      // Note: By industrial standard, incoming uninspected stock has available_quantity = 0 until QC passed
      // If qc_status is explicitly PASSED, available_quantity = qty
      const initialQcStatus = data.qc_status || 'PENDING_INSPECTION';
      const availableQty = initialQcStatus === 'PASSED' ? qty : 0;

      const batchRes = await client.query(
        `INSERT INTO yarn_batches 
          (batch_code, barcode_id, yarn_type, colour, supplier_name, received_quantity, available_quantity, 
           unit, reorder_threshold, storage_location_id, qc_status, received_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
         RETURNING *`,
        [
          batchCode,
          barcodeId,
          data.yarn_type,
          data.colour.trim(),
          supplierName,
          qty,
          availableQty,
          data.unit || 'kg',
          data.reorder_threshold || 100,
          storageLocationId,
          initialQcStatus,
          receivedAt,
        ]
      );
      const batch = batchRes.rows[0];

      // Insert initial stock movement audit ledger entry
      const moveRes = await client.query(
        `INSERT INTO stock_movements 
          (yarn_batch_id, movement_type, quantity, reference_number, remarks, created_at)
         VALUES ($1, 'RECEIPT', $2, $3, $4, NOW())
         RETURNING *`,
        [
          batch.id,
          qty,
          `GRN-${Date.now().toString().slice(-6)}`,
          `Initial delivery from ${supplierName} (${initialQcStatus})`,
        ]
      );

      return { batch: mapYarnBatch(batch), movement: moveRes.rows[0] };
    });

    return res.status(201).json({
      success: true,
      data: outcome,
      message: `Yarn batch "${batchCode}" recorded successfully in PostgreSQL.`,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { code: 'INSERT_ERROR', message: err.message },
    });
  }
});

// PATCH /api/yarn-batches/:id (Update permitted details without corrupting stock ledger)
yarnRouter.patch('/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { colour, reorder_threshold, storage_location_id, storage_location } = req.body;

  try {
    const isNumeric = /^\d+$/.test(id);
    let slId = storage_location_id ? Number(storage_location_id) : undefined;
    if (!slId && storage_location) {
      const slRes = await pool.query(
        'SELECT id FROM storage_locations WHERE LOWER(rack_name) = LOWER($1) OR LOWER(location_code) = LOWER($1) LIMIT 1',
        [storage_location.trim()]
      );
      if (slRes.rows.length > 0) slId = Number(slRes.rows[0].id);
    }

    const result = await pool.query(
      `UPDATE yarn_batches 
       SET colour = COALESCE($1, colour),
           reorder_threshold = COALESCE($2, reorder_threshold),
           storage_location_id = COALESCE($3, storage_location_id),
           updated_at = NOW()
       WHERE ${isNumeric ? 'id = $4' : 'batch_code = $4'}
       RETURNING *`,
      [colour || null, reorder_threshold ? Number(reorder_threshold) : null, slId || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Yarn batch not found' } });
    }

    return res.json({
      success: true,
      data: mapYarnBatch(result.rows[0]),
      message: 'Batch details updated successfully.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});
