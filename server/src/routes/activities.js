import { z } from 'zod';
import { query, withTx } from '../db.js';
import { requireAuth } from '../auth.js';
import { uploadImage } from '../storage.js';

const postSchema = z.object({
  sport: z.string().min(1),
  location_name: z.string().min(1),
  datetime: z.string().min(1),
  lat: z.union([z.number(), z.string()]).optional(),
  lng: z.union([z.number(), z.string()]).optional(),
  description: z.string().optional().default(''),
  max_people: z.union([z.number(), z.string()]).optional().default(1),
  image_url: z.string().optional().default(''),   // may be a base64 data URL
  display_name: z.string().optional().default(''),
  privacy: z.string().optional().default('public'),
});

const num = (v) => (v === '' || v == null ? null : Number(v));

function mapActivity(row) {
  return {
    id: row.id,
    username: row.username,
    sport: row.sport,
    location_name: row.location_name,
    lat: row.lat,
    lng: row.lng,
    datetime: row.datetime,
    description: row.description,
    max_people: row.max_people,
    created_at: row.created_at,
    image_url: row.image_url || '',
    display_name: row.display_name || row.username,
    join_count: Number(row.join_count) || 0,
    privacy: row.privacy || 'public',
  };
}

export default async function activityRoutes(fastify) {
  // ─── Get upcoming activities (public) ─────────────────────
  fastify.get('/getActivities', async () => {
    const { rows } = await query(
      `SELECT a.*, COALESCE(j.cnt, 0) AS join_count
         FROM activities a
         LEFT JOIN (SELECT activity_id, COUNT(*) cnt FROM joiners GROUP BY activity_id) j
           ON j.activity_id = a.id
        WHERE a.datetime > now()
        ORDER BY a.datetime ASC`
    );
    return { success: true, activities: rows.map(mapActivity) };
  });

  // ─── Post activity (auth) ─────────────────────────────────
  fastify.post('/postActivity', { preHandler: requireAuth }, async (req, reply) => {
    const parsed = postSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ success: false, message: 'กรุณากรอกข้อมูลกิจกรรมให้ครบ' });
    }
    const d = parsed.data;
    const username = req.user.username; // from token, never from body

    let imageUrl = '';
    try { imageUrl = await uploadImage(d.image_url, 'sportmate/activities'); }
    catch (e) { req.log.error({ e }, 'image upload failed'); }

    const { rows } = await query(
      `INSERT INTO activities
         (username, sport, location_name, lat, lng, datetime, description,
          max_people, image_url, display_name, privacy)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id`,
      [username, d.sport, d.location_name, num(d.lat), num(d.lng), d.datetime,
       d.description, Math.max(1, parseInt(d.max_people) || 1), imageUrl,
       d.display_name || username, d.privacy]
    );
    return reply.send({ success: true, id: rows[0].id, message: 'โพสกิจกรรมสำเร็จ!' });
  });

  // ─── Join activity (auth, race-safe) ──────────────────────
  fastify.post('/joinActivity', { preHandler: requireAuth }, async (req, reply) => {
    const { activity_id } = req.body || {};
    const username = req.user.username;
    if (!activity_id) return reply.send({ success: false, message: 'ข้อมูลไม่ครบ' });

    try {
      const result = await withTx(async (client) => {
        // lock the activity row so capacity check + insert are atomic
        const act = await client.query('SELECT id, username, max_people FROM activities WHERE id=$1 FOR UPDATE', [activity_id]);
        if (act.rowCount === 0) return { success: false, message: 'ไม่พบกิจกรรม' };
        const owner = act.rows[0].username;
        const maxPeople = act.rows[0].max_people;

        const dupe = await client.query('SELECT 1 FROM joiners WHERE activity_id=$1 AND username=$2', [activity_id, username]);
        if (dupe.rowCount > 0) return { success: false, message: 'เข้าร่วมแล้ว' };

        const cnt = await client.query('SELECT COUNT(*)::int AS c FROM joiners WHERE activity_id=$1', [activity_id]);
        if (cnt.rows[0].c >= maxPeople) return { success: false, message: 'กิจกรรมเต็มแล้ว' };

        await client.query('INSERT INTO joiners (activity_id, username) VALUES ($1,$2)', [activity_id, username]);

        // notify the owner (not if they joined their own activity)
        if (owner && owner !== username) {
          await client.query(
            `INSERT INTO notifications (recipient_username, type, actor_username, activity_id, message)
             VALUES ($1,'join',$2,$3,$4)`,
            [owner, username, activity_id, `${username} ขอเข้าร่วมกิจกรรมของคุณ`]
          );
        }
        return { success: true, join_count: cnt.rows[0].c + 1 };
      });
      return reply.send(result);
    } catch (e) {
      req.log.error({ e }, 'joinActivity failed');
      return reply.code(500).send({ success: false, message: 'เกิดข้อผิดพลาด' });
    }
  });

  // ─── Leave activity (auth) ────────────────────────────────
  fastify.post('/leaveActivity', { preHandler: requireAuth }, async (req, reply) => {
    const { activity_id } = req.body || {};
    const username = req.user.username;
    if (!activity_id) return reply.send({ success: false, message: 'ข้อมูลไม่ครบ' });

    const del = await query('DELETE FROM joiners WHERE activity_id=$1 AND username=$2', [activity_id, username]);
    if (del.rowCount === 0) return reply.send({ success: false, message: 'ไม่พบการเข้าร่วม' });

    const cnt = await query('SELECT COUNT(*)::int AS c FROM joiners WHERE activity_id=$1', [activity_id]);
    return reply.send({ success: true, join_count: cnt.rows[0].c });
  });
}
