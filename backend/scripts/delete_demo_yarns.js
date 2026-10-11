import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgresql://postgres:yasha@localhost:5432/vastra' });

async function run() {
  try {
    const delRes = await pool.query(`
      DELETE FROM yarn_batches 
      WHERE batch_code LIKE 'VAS-DEMO-Y0%' 
        AND batch_code NOT IN ('VAS-DEMO-Y01', 'VAS-DEMO-Y02', 'VAS-DEMO-Y03')
      RETURNING batch_code
    `);
    console.log(`Successfully deleted ${delRes.rowCount} demo sample yarn batches.`);
    
    const remaining = await pool.query('SELECT batch_code, yarn_type, colour, supplier_name, received_quantity FROM yarn_batches ORDER BY id');
    console.log('Remaining yarn batches in database:', remaining.rows);

    await pool.end();
  } catch (err) {
    console.error('Error deleting demo sample yarns:', err);
  }
}

run();
