import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const host = process.env.DB_HOST || 'localhost';
const port = parseInt(process.env.DB_PORT || '5432', 10);
const user = process.env.DB_USER || 'postgres';
const password = process.env.DB_PASSWORD || 'postgres';
const targetDb = process.env.DB_NAME || 'fabrictrace_db';

async function runMigrations() {
  console.log(`Connecting to PostgreSQL at ${host}:${port} as ${user}...`);

  // 1. Connect to default 'postgres' database to verify/create target database
  const rootClient = new Client({ host, port, user, password, database: 'postgres' });
  try {
    await rootClient.connect();
    const checkDb = await rootClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [targetDb]
    );
    if (checkDb.rows.length === 0) {
      console.log(`Database "${targetDb}" does not exist. Creating now...`);
      await rootClient.query(`CREATE DATABASE "${targetDb}"`);
      console.log(`Database "${targetDb}" created.`);
    } else {
      console.log(`Database "${targetDb}" exists.`);
    }
  } catch (err: any) {
    console.error('Error connecting to root PostgreSQL database:', err.message);
    process.exit(1);
  } finally {
    await rootClient.end();
  }

  // 2. Connect to the target database and execute migrations & seed
  const appClient = new Client({ host, port, user, password, database: targetDb });
  try {
    await appClient.connect();

    console.log('Running migration: 001_create_tables.sql...');
    const schemaSql = fs.readFileSync(
      path.resolve(__dirname, 'migrations/001_create_tables.sql'),
      'utf8'
    );
    await appClient.query(schemaSql);
    console.log('Schema tables created successfully.');

    console.log('Running seed data: seed_data.sql...');
    const seedSql = fs.readFileSync(
      path.resolve(__dirname, 'seed/seed_data.sql'),
      'utf8'
    );
    await appClient.query(seedSql);
    console.log('Demo seed data populated successfully.');

    console.log('\nMigration complete! PostgreSQL database is ready for FabricTrace.');
  } catch (err: any) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await appClient.end();
  }
}

runMigrations();
