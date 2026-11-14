import 'dotenv/config';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL?.trim();
export const databaseConfigured = Boolean(connectionString);

export const pool = new Pool({
  connectionString,
  max: Number(process.env.DATABASE_POOL_SIZE || 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

export async function query<T = any>(text: string, values: unknown[] = []): Promise<pg.QueryResult<T>> {
  if (!databaseConfigured) {
    throw new Error('DATABASE_URL is not configured');
  }
  return pool.query<T>(text, values);
}

export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function runMigrations(): Promise<void> {
  if (!databaseConfigured) return;
  const dir = path.join(process.cwd(), 'server', 'migrations');
  await withTransaction(async tx => {
    await tx.query("SELECT pg_advisory_xact_lock(7342901)");
    await tx.query('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
    for (const name of (await readdir(dir)).filter(name => /^\d+_.*\.sql$/.test(name)).sort()) {
      if ((await tx.query('SELECT 1 FROM schema_migrations WHERE name = $1', [name])).rowCount) continue;
      await tx.query(await readFile(path.join(dir, name), 'utf8'));
      await tx.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
    }
  });
}

export async function closeDatabase(): Promise<void> {
  await pool.end();
}
