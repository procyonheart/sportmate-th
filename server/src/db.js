import pg from 'pg';
import { config } from './config.js';

// local Postgres doesn't use TLS; managed providers (Neon/Supabase/Render) require it
const sslFor = (url) => (url.includes('localhost') || url.includes('127.0.0.1') ? false : { rejectUnauthorized: false });

export const makePool = (connectionString) =>
  new pg.Pool({ connectionString, ssl: sslFor(connectionString) });

// application pool — uses the pooled (-pooler) connection in production
export const pool = makePool(config.databaseUrl);

export const query = (text, params) => pool.query(text, params);

// run fn inside a transaction; auto commit/rollback
export async function withTx(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
