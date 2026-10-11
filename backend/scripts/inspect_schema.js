import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/vastra',
});

async function main() {
  const res = await pool.query(`
    SELECT column_name, data_type, is_generated, generation_expression, column_default
    FROM information_schema.columns
    WHERE table_name = 'dispatch_items'
    ORDER BY ordinal_position;
  `);
  console.log('dispatch_items columns:', res.rows);
  await pool.end();
}

main().catch(console.error);
