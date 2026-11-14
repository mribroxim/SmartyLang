import 'dotenv/config';
import { readFile } from 'node:fs/promises';
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
  const sql = await readFile(path.join(process.cwd(), 'server', 'migrations', '001_initial.sql'), 'utf8');
  await query(sql);
}

export async function closeDatabase(): Promise<void> {
  await pool.end();
}
