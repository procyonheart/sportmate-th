// One-time migration: Google Sheets -> PostgreSQL.
//
// How to use:
//   1. In Google Sheets: File -> Download -> CSV for each tab, save as
//      server/sheets_export/Members.csv, Activities.csv, Joiners.csv
//   2. node scripts/migrate_from_sheets.mjs
//
// Old password hashes are client-side SHA-256; we store them with
// password_algo='sha256' so src/routes/auth.js upgrades them to argon2
// on each user's next successful login (see login handler).
//
// Column order follows tools/apps_script/Code.gs:16-31.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool } from '../src/db.js';
import { uploadImage } from '../src/storage.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = process.argv[2] || join(__dirname, '..', 'sheets_export');

// minimal RFC-4180 CSV parser (handles quotes, commas, newlines in quotes)
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* ignore */ }
      else field += c;
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

async function load(name) {
  try { return parseCsv(await readFile(join(dir, name), 'utf8')); }
  catch { console.log(`(skip) ${name} not found`); return []; }
}

const truthy = (v) => v === true || /^(true|TRUE)$/.test(String(v || ''));
const isoOrNull = (v) => { const d = new Date(v); return isNaN(d) ? null : d.toISOString(); };

async function run() {
  // ─── Members ───────────────────────────────────────────────
  const members = await load('Members.csv');
  let mCount = 0;
  for (let i = 1; i < members.length; i++) {
    const r = members[i];
    if (!r[2] || !r[3]) continue;                 // need username + email
    if (String(r[3]).toLowerCase() === 'email') continue; // stray header row
    let photoUrl = '';
    const rawPhoto = r[17] || '';
    if (rawPhoto.startsWith('data:')) {
      try { photoUrl = await uploadImage(rawPhoto, 'sportmate/avatars'); } catch { photoUrl = ''; }
    }
    await pool.query(
      `INSERT INTO members
         (fullname, username, email, phone, sports, password_hash, password_algo,
          created_at, gender, skill_level, province, preferred_time, verify_token,
          is_verified, id_verify_status, display_name, display_name_changed_at, photo_url)
       VALUES ($1,$2,$3,$4,$5,$6,'sha256',$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       ON CONFLICT (username) DO NOTHING`,
      [r[1] || r[2], r[2], r[3], r[4] || '', r[5] || '', r[6] || '',
       isoOrNull(r[7]) || new Date().toISOString(), r[8] || '', r[9] || '', r[10] || '',
       r[11] || '', r[12] || null, truthy(r[13]), r[14] || 'unverified',
       r[15] || r[2], isoOrNull(r[16]), photoUrl]
    );
    mCount++;
  }
  console.log(`members: ${mCount}`);

  // ─── Activities ────────────────────────────────────────────
  const acts = await load('Activities.csv');
  let aCount = 0;
  for (let i = 1; i < acts.length; i++) {
    const r = acts[i];
    if (!r[0] || !r[1]) continue;
    let imageUrl = r[10] || '';
    if (imageUrl.startsWith('data:')) {
      try { imageUrl = await uploadImage(imageUrl, 'sportmate/activities'); } catch { imageUrl = ''; }
    }
    await pool.query(
      `INSERT INTO activities
         (id, username, sport, location_name, lat, lng, datetime, description,
          max_people, created_at, image_url, display_name, privacy)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (id) DO NOTHING`,
      [r[0], r[1], r[2] || '', r[3] || '', parseFloat(r[4]) || null, parseFloat(r[5]) || null,
       isoOrNull(r[6]) || new Date().toISOString(), r[7] || '', parseInt(r[8]) || 1,
       isoOrNull(r[9]) || new Date().toISOString(), imageUrl, r[11] || r[1], r[13] || 'public']
    );
    aCount++;
  }
  console.log(`activities: ${aCount}`);

  // ─── Joiners ───────────────────────────────────────────────
  const joiners = await load('Joiners.csv');
  let jCount = 0;
  for (let i = 1; i < joiners.length; i++) {
    const r = joiners[i];
    if (!r[0] || !r[1]) continue;
    await pool.query(
      `INSERT INTO joiners (activity_id, username, joined_at)
       VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
      [r[0], r[1], isoOrNull(r[2]) || new Date().toISOString()]
    );
    jCount++;
  }
  console.log(`joiners: ${jCount}`);

  await pool.end();
  console.log('sheets migration complete');
}

run().catch((e) => { console.error(e); process.exit(1); });
