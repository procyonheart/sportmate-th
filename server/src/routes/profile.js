import { query } from '../db.js';
import { requireAuth } from '../auth.js';
import { uploadImage } from '../storage.js';

export default async function profileRoutes(fastify) {
  // ─── Public profile ───────────────────────────────────────
  fastify.get('/getProfile', async (req, reply) => {
    const username = req.query.username;
    if (!username) return reply.send({ success: false, message: 'กรุณาระบุ username' });

    const { rows } = await query('SELECT * FROM members WHERE lower(username)=lower($1) LIMIT 1', [username]);
    const m = rows[0];
    if (!m) return reply.send({ success: false, message: 'ไม่พบผู้ใช้นี้' });

    return reply.send({
      success: true,
      username: m.username,
      display_name: m.display_name || m.username,
      sports: m.sports || '',
      gender: m.gender || '',
      skill_level: m.skill_level || '',
      province: m.province || '',
      preferred_time: m.preferred_time || '',
      id_verify_status: m.id_verify_status || 'unverified',
      created_at: m.created_at || '',
      photo_url: m.photo_url || '',
    });
  });

  // ─── Update display name (auth, 1x/day) ───────────────────
  fastify.post('/updateDisplayName', { preHandler: requireAuth }, async (req, reply) => {
    const username = req.user.username;
    const newName = (req.body?.new_display_name || '').trim();
    if (newName.length < 1 || newName.length > 30) {
      return reply.send({ success: false, message: 'ชื่อที่แสดงต้องมี 1-30 ตัวอักษร' });
    }
    const { rows } = await query('SELECT display_name_changed_at FROM members WHERE username=$1', [username]);
    if (rows.length === 0) return reply.send({ success: false, message: 'ไม่พบบัญชีผู้ใช้' });

    const last = rows[0].display_name_changed_at;
    if (last && new Date(last).toDateString() === new Date().toDateString()) {
      return reply.send({ success: false, message: 'สามารถเปลี่ยนชื่อที่แสดงได้วันละ 1 ครั้งเท่านั้น' });
    }
    await query('UPDATE members SET display_name=$1, display_name_changed_at=CURRENT_DATE WHERE username=$2',
      [newName, username]);
    return reply.send({ success: true, message: 'เปลี่ยนชื่อที่แสดงสำเร็จ', display_name: newName });
  });

  // ─── Save profile photo (auth) ────────────────────────────
  fastify.post('/saveProfilePhoto', { preHandler: requireAuth }, async (req, reply) => {
    const username = req.user.username;
    let url = '';
    try { url = await uploadImage(req.body?.photo_base64 || '', 'sportmate/avatars'); }
    catch (e) { req.log.error({ e }, 'avatar upload failed'); return reply.code(500).send({ success: false, message: 'อัปโหลดรูปไม่สำเร็จ' }); }

    const upd = await query('UPDATE members SET photo_url=$1 WHERE username=$2', [url, username]);
    if (upd.rowCount === 0) return reply.send({ success: false, message: 'ไม่พบบัญชีผู้ใช้' });
    return reply.send({ success: true, photo_url: url });
  });

  // ─── Notifications (auth) — the feature that was missing ──
  fastify.get('/getNotifications', { preHandler: requireAuth }, async (req) => {
    const username = req.user.username;
    const { rows } = await query(
      `SELECT id, type, actor_username AS joiner_username, activity_id, message, read, created_at
         FROM notifications
        WHERE recipient_username=$1 AND read=FALSE
        ORDER BY created_at DESC LIMIT 50`,
      [username]
    );
    // mark as read so they're delivered once (matches old poll-and-toast behaviour)
    if (rows.length) {
      await query('UPDATE notifications SET read=TRUE WHERE recipient_username=$1 AND read=FALSE', [username]);
    }
    return { success: true, notifications: rows };
  });
}
