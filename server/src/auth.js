import argon2 from 'argon2';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from './config.js';

// ─── Password hashing ────────────────────────────────────────
export function hashPassword(plain) {
  return argon2.hash(plain);
}

export function verifyArgon2(hash, plain) {
  return argon2.verify(hash, plain);
}

// legacy: old Sheets rows stored client-side SHA-256 (no salt).
// used ONLY to let migrated users log in once, then we rehash to argon2.
export function sha256(plain) {
  return crypto.createHash('sha256').update(plain, 'utf8').digest('hex');
}

// ─── JWT ─────────────────────────────────────────────────────
export function issueToken(member) {
  return jwt.sign(
    { sub: member.username, email: member.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

// ─── Fastify preHandler: require a valid Bearer token ────────
// attaches req.user = { username, email }. Write routes MUST use the
// username from here, never from the request body.
export async function requireAuth(req, reply) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return reply.code(401).send({ success: false, message: 'ต้องเข้าสู่ระบบก่อน' });
  }
  try {
    const payload = verifyToken(token);
    req.user = { username: payload.sub, email: payload.email };
  } catch {
    return reply.code(401).send({ success: false, message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' });
  }
}
