import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'yasha',
  database: process.env.DB_NAME || 'vastra',
});

async function inspectYarn() {
  const res = await pool.query('SELECT id, batch_code, barcode_id, yarn_type, colour, supplier_name, available_quantity, received_quantity, qc_status FROM yarn_batches ORDER BY id ASC LIMIT 10');
  console.log('Yarn Batches in DB:', res.rows);
  const total = await pool.query('SELECT count(*) FROM yarn_batches');
  console.log('Total yarn batches count:', total.rows[0].count);
  await pool.end();
}
inspectYarn();
