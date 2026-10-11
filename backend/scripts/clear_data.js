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

async function clearData() {
  const client = await pool.connect();
  try {
    const tableRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    const tables = new Set(tableRes.rows.map(r => r.table_name));
    console.log('Found tables in DB:', Array.from(tables));

    await client.query('BEGIN');
    if (tables.has('fabric_inspections')) await client.query('DELETE FROM fabric_inspections');
    if (tables.has('dispatch_items')) await client.query('DELETE FROM dispatch_items');
    if (tables.has('dispatches')) await client.query('DELETE FROM dispatches');
    if (tables.has('fabric_rolls')) await client.query('DELETE FROM fabric_rolls');
    if (tables.has('production_records')) await client.query('DELETE FROM production_records');
    if (tables.has('machine_assignments')) await client.query('DELETE FROM machine_assignments');
    if (tables.has('stock_movements')) await client.query('DELETE FROM stock_movements WHERE production_order_id IS NOT NULL');
    if (tables.has('machines')) await client.query("UPDATE machines SET status = 'AVAILABLE'");
    
    let count = 0;
    if (tables.has('production_orders')) {
      const res = await client.query('DELETE FROM production_orders');
      count = res.rowCount;
    }

    await client.query('COMMIT');
    console.log(`Successfully removed ${count} orders. Database is clean and ready for new production CSV input.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error clearing data:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

clearData();
