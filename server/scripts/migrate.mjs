// Runs every .sql file in migrations/ in order (idempotent — schema uses IF NOT EXISTS).
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { makePool } from '../src/db.js';
import { config } from '../src/config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '..', 'migrations');

// DDL must run over a DIRECT (non-pooler) connection on Neon
const pool = makePool(config.databaseUrlUnpooled);

const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();
for (const f of files) {
  const sql = await readFile(join(migrationsDir, f), 'utf8');
  process.stdout.write(`running ${f} ... `);
  await pool.query(sql);
  console.log('ok');
}
await pool.end();
console.log('migrations complete');
