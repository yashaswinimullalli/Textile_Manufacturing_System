import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgresql://postgres:yasha@localhost:5432/vastra' });

async function run() {
  try {
    const demoIdsRes = await pool.query(`
      SELECT id FROM yarn_batches WHERE batch_code LIKE 'VAS-DEMO-Y0%' AND batch_code NOT IN ('VAS-DEMO-Y01', 'VAS-DEMO-Y02', 'VAS-DEMO-Y03')
    `);
    const ids = demoIdsRes.rows.map(r => r.id);

    const rmi = await pool.query('SELECT count(*) FROM raw_material_inspections WHERE yarn_batch_id = ANY($1)', [ids]);
    const sm = await pool.query('SELECT count(*) FROM stock_movements WHERE yarn_batch_id = ANY($1)', [ids]);

    console.log('raw_material_inspections count for demo batches:', rmi.rows[0].count);
    console.log('stock_movements count for demo batches:', sm.rows[0].count);

    await pool.end();
  } catch (err) {
    console.error(err);
  }
}

run();
