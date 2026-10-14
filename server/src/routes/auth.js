import crypto from 'node:crypto';
import { z } from 'zod';
import { query } from '../db.js';
import { hashPassword, verifyArgon2, sha256, issueToken } from '../auth.js';
import { sendVerificationEmail, sendIdVerifyAdminAlert } from '../email.js';
import { config } from '../config.js';

const signupSchema = z.object({
  fullname: z.string().min(1),
  username: z.string().min(1).regex(/^[A-Za-z0-9_.]+$/),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional().default(''),
  sports: z.union([z.string(), z.array(z.string())]).optional().default(''),
  gender: z.string().optional().default(''),
  skill_level: z.string().optional().default(''),
  province: z.string().optional().default(''),
  preferred_time: z.union([z.string(), z.array(z.string())]).optional().default(''),
});

const asText = (v) => (Array.isArray(v) ? v.join(', ') : (v || ''));

export default async function authRoutes(fastify) {
  // ─── Signup ───────────────────────────────────────────────
  fastify.post('/signup', async (req, reply) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ success: false, message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' });
    }
    const d = parsed.data;

    const dupe = await query(
      'SELECT 1 FROM members WHERE email = $1 OR lower(username) = lower($2) LIMIT 1',
      [d.email, d.username]
    );
    // generic response to avoid account enumeration
    if (dupe.rowCount > 0) {
      const u = await query('SELECT 1 FROM members WHERE lower(username)=lower($1)', [d.username]);
      if (u.rowCount > 0) return reply.send({ success: false, message: 'Username นี้ถูกใช้งานแล้ว' });
      return reply.send({ success: true, message: 'สมัครสมาชิกสำเร็จ! กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ' });
    }

    const passwordHash = await hashPassword(d.password);
    // AUTO_VERIFY launch mode: mark verified and skip the email step
    const autoVerify = config.autoVerify;
    const verifyToken = autoVerify ? null : crypto.randomUUID();

    await query(
      `INSERT INTO members
        (fullname, username, email, phone, sports, password_hash, password_algo,
         gender, skill_level, province, preferred_time, verify_token, is_verified,
         id_verify_status, display_name)
       VALUES ($1,$2,$3,$4,$5,$6,'argon2',$7,$8,$9,$10,$11,$12,'unverified',$2)`,
      [d.fullname, d.username, d.email, d.phone, asText(d.sports), passwordHash,
       d.gender, d.skill_level, d.province, asText(d.preferred_time), verifyToken, autoVerify]
    );

    if (!autoVerify) {
      try { await sendVerificationEmail(d.email, d.fullname, d.username, verifyToken); }
      catch (e) { req.log.error({ e }, 'verification email failed'); }
    }

    return reply.send({
      success: true,
      auto_verified: autoVerify,
      message: autoVerify
        ? 'สมัครสมาชิกสำเร็จ! เข้าสู่ระบบได้เลย'
        : 'สมัครสมาชิกสำเร็จ! กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ',
    });
  });

  // ─── Login ────────────────────────────────────────────────
  fastify.post('/login', async (req, reply) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return reply.send({ success: false, message: 'กรุณากรอกอีเมลและรหัสผ่าน' });
    }

    const { rows } = await query('SELECT * FROM members WHERE email = $1 LIMIT 1', [email]);
    const m = rows[0];
    if (!m) return reply.send({ success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

    // verify password (argon2 for new users, one-time sha256 path for migrated users)
    let ok = false;
    if (m.password_algo === 'sha256') {
      ok = m.password_hash === sha256(password);
      if (ok) {
        // transparently upgrade to argon2
        const newHash = await hashPassword(password);
        await query('UPDATE members SET password_hash=$1, password_algo=$2 WHERE id=$3',
          [newHash, 'argon2', m.id]);
      }
    } else {
      ok = await verifyArgon2(m.password_hash, password).catch(() => false);
    }
    if (!ok) return reply.send({ success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

    if (!m.is_verified) {
      return reply.send({ success: false, need_verification: true, message: 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ' });
    }

    const token = issueToken(m);
    return reply.send({
      success: true,
      token,
      fullname: m.fullname,
      username: m.username,
      email: m.email,
      sports: m.sports,
      gender: m.gender || '',
      skill_level: m.skill_level || '',
      province: m.province || '',
      preferred_time: m.preferred_time || '',
      id_verify_status: m.id_verify_status || 'unverified',
      display_name: m.display_name || m.username,
      photo_url: m.photo_url || '',
    });
  });

  // ─── Verify email ─────────────────────────────────────────
  fastify.post('/verifyEmail', async (req, reply) => {
    const { token } = req.body || {};
    if (!token) return reply.send({ success: false, message: 'Token ไม่ถูกต้อง' });

    const { rows } = await query('SELECT * FROM members WHERE verify_token = $1 LIMIT 1', [token]);
    const m = rows[0];
    if (!m) return reply.send({ success: false, message: 'Token ไม่ถูกต้องหรือหมดอายุแล้ว' });
    if (m.is_verified) return reply.send({ success: true, message: 'อีเมลนี้ยืนยันแล้ว', already: true });

    await query('UPDATE members SET is_verified = TRUE WHERE id = $1', [m.id]);
    return reply.send({
      success: true,
      message: 'ยืนยันอีเมลสำเร็จ! ตอนนี้คุณสามารถเข้าสู่ระบบได้แล้ว',
      fullname: m.fullname,
      username: m.username,
    });
  });

  // ─── Resend verification ──────────────────────────────────
  fastify.post('/resendVerification', async (req, reply) => {
    const { email } = req.body || {};
    if (!email) return reply.send({ success: false, message: 'กรุณาระบุอีเมล' });

    const { rows } = await query('SELECT * FROM members WHERE email = $1 LIMIT 1', [email]);
    const m = rows[0];
    // generic success to avoid enumeration
    if (!m || m.is_verified) {
      return reply.send({ success: true, message: 'ถ้าอีเมลนี้ยังไม่ยืนยัน เราได้ส่งลิงก์ใหม่ให้แล้ว' });
    }
    const newToken = crypto.randomUUID();
    await query('UPDATE members SET verify_token = $1 WHERE id = $2', [newToken, m.id]);
    try { await sendVerificationEmail(m.email, m.fullname, m.username, newToken); }
    catch (e) { req.log.error({ e }, 'resend email failed'); }
    return reply.send({ success: true, message: 'ส่งอีเมลยืนยันใหม่แล้ว กรุณาตรวจสอบกล่องจดหมาย' });
  });

  // ─── Submit ID verification request ───────────────────────
  fastify.post('/submitIdVerify', async (req, reply) => {
    const { email, username } = req.body || {};
    if (!email) return reply.send({ success: false, message: 'กรุณาระบุอีเมล' });

    const { rows } = await query('SELECT * FROM members WHERE email = $1 LIMIT 1', [email]);
    const m = rows[0];
    if (!m) return reply.send({ success: false, message: 'ไม่พบบัญชีนี้ในระบบ' });
    if (m.id_verify_status === 'approved') {
      return reply.send({ success: false, message: 'บัญชีนี้ยืนยันตัวตนแล้ว' });
    }
    await query("UPDATE members SET id_verify_status = 'pending' WHERE id = $1", [m.id]);
    try { await sendIdVerifyAdminAlert(username || m.username, m.email); } catch {}
    return reply.send({ success: true, message: 'ส่งคำขอยืนยันตัวตนสำเร็จ รอการตรวจสอบจากทีมงาน' });
  });
}
