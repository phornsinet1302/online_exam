// backend/src/utils/password.ts
// Exam passwords (PASSWORD_PROTECTED exams) are stored hashed, never plaintext.
import crypto from 'crypto';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const [scheme, salt, hash] = stored.split('$');
  // Rows written before hashing was introduced hold the plaintext value.
  if (scheme !== 'scrypt' || !salt || !hash) return stored === password;
  const expected = Buffer.from(hash, 'hex');
  const candidate = crypto.scryptSync(password, salt, expected.length);
  return crypto.timingSafeEqual(expected, candidate);
}
