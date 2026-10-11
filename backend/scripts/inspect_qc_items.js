import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/vastra',
});

async function main() {
  const rollCols = await pool.query(`
    SELECT column_name FROM information_schema.columns WHERE table_name = 'fabric_rolls';
  `);
  console.log('fabric_rolls columns:', rollCols.rows.map(r => r.column_name));

  const rolls = await pool.query(`
    SELECT * FROM fabric_rolls ORDER BY id ASC;
  `);
  console.log('Fabric Rolls in DB count:', rolls.rows.length);
  console.log('Fabric Rolls:', rolls.rows);

  const batches = await pool.query(`
    SELECT * FROM yarn_batches ORDER BY id ASC;
  `);
  console.log('Yarn Batches in DB count:', batches.rows.length);
  console.log('Yarn Batches:', batches.rows);

  await pool.end();
}

main().catch(console.error);
