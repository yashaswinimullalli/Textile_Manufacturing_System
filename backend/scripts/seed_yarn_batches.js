import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/vastra',
});

async function main() {
  console.log('Seeding realistic raw material yarn batches...');

  // Ensure intake_scanned column exists
  await pool.query('ALTER TABLE yarn_batches ADD COLUMN IF NOT EXISTS intake_scanned BOOLEAN DEFAULT FALSE;');

  // Storage locations: make sure 3 racks exist
  await pool.query(`
    INSERT INTO storage_locations (id, location_code, rack_name, capacity)
    VALUES 
      (1, 'LOC-A1', 'Rack A1', 5000),
      (2, 'LOC-B1', 'Rack B1', 5000),
      (3, 'LOC-C1', 'Rack C1', 5000)
    ON CONFLICT (id) DO NOTHING;
  `);

  // Target batches
  const batches = [
    {
      code: 'VAS-DEMO-Y01',
      barcode: 'VAS-QR-Y01',
      type: 'Cotton',
      colour: 'Optical White',
      supplier: 'Premier Cotton Mills',
      received: 500,
      available: 500,
      threshold: 100,
      loc: 1,
      qc_status: 'PENDING_INSPECTION',
      scanned: true, // Already taken before
    },
    {
      code: 'VAS-DEMO-Y02',
      barcode: 'VAS-QR-Y02',
      type: 'Polyester',
      colour: 'Royal Blue',
      supplier: 'Reliance Industries Yarn Div',
      received: 350,
      available: 350,
      threshold: 80,
      loc: 2,
      qc_status: 'PENDING_INSPECTION',
      scanned: true, // Already taken before
    },
    {
      code: 'VAS-DEMO-Y03',
      barcode: 'VAS-QR-Y03',
      type: 'Blend',
      colour: 'Heather Grey',
      supplier: 'Arvind Yarn Hub',
      received: 420,
      available: 420,
      threshold: 100,
      loc: 3,
      qc_status: 'PENDING_INSPECTION',
      scanned: false, // Ready for user to scan/update
    },
    {
      code: 'VAS-DEMO-Y04',
      barcode: 'VAS-QR-Y04',
      type: 'Cotton',
      colour: 'Natural Ecru',
      supplier: 'Vardhman Textiles',
      received: 600,
      available: 600,
      threshold: 150,
      loc: 1,
      qc_status: 'PENDING_INSPECTION',
      scanned: false, // Ready for user to scan/update
    },
    {
      code: 'VAS-DEMO-Y05',
      barcode: 'VAS-QR-Y05',
      type: 'Polyester',
      colour: 'Charcoal Black',
      supplier: 'Filatex India',
      received: 280,
      available: 280,
      threshold: 50,
      loc: 2,
      qc_status: 'PENDING_INSPECTION',
      scanned: false, // Ready for user to scan/update
    },
    {
      code: 'VAS-DEMO-Y06',
      barcode: 'VAS-QR-Y06',
      type: 'Blend',
      colour: 'Olive Green',
      supplier: 'RSWM Spinners Ltd',
      received: 320,
      available: 320,
      threshold: 75,
      loc: 3,
      qc_status: 'PENDING_INSPECTION',
      scanned: false, // Ready for user to scan/update
    },
  ];

  for (const b of batches) {
    const existing = await pool.query(
      'SELECT id FROM yarn_batches WHERE batch_code = $1 OR barcode_id = $2',
      [b.code, b.barcode]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE yarn_batches
         SET yarn_type = $1, colour = $2, supplier_name = $3,
             received_quantity = $4, available_quantity = $5,
             reorder_threshold = $6, storage_location_id = $7,
             qc_status = $8, intake_scanned = $9, updated_at = NOW()
         WHERE id = $10`,
        [b.type, b.colour, b.supplier, b.received, b.available, b.threshold, b.loc, b.qc_status, b.scanned, existing.rows[0].id]
      );
      console.log(`Updated batch ${b.code} (${b.barcode}) - scanned: ${b.scanned}`);
    } else {
      await pool.query(
        `INSERT INTO yarn_batches
          (batch_code, barcode_id, yarn_type, colour, supplier_name, received_quantity, available_quantity, unit, reorder_threshold, storage_location_id, qc_status, intake_scanned, received_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'kg', $8, $9, $10, $11, NOW(), NOW(), NOW())`,
        [b.code, b.barcode, b.type, b.colour, b.supplier, b.received, b.available, b.threshold, b.loc, b.qc_status, b.scanned]
      );
      console.log(`Inserted batch ${b.code} (${b.barcode}) - scanned: ${b.scanned}`);
    }
  }

  const all = await pool.query('SELECT id, batch_code, barcode_id, yarn_type, colour, qc_status, intake_scanned FROM yarn_batches ORDER BY id ASC');
  console.log('Final DB yarn_batches:');
  console.table(all.rows);

  await pool.end();
}

main().catch(console.error);
