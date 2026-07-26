/**
 * Password hashing utilities. Uses bcryptjs (pure JS) so it works on the
 * Edge runtime as well as Node. Switch to `argon2` if we ever move auth
 * routes to Node-only — argon2 is a stronger KDF but requires native bindings.
 */
import bcrypt from 'bcryptjs';

const COST = 11;

export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, COST);
}

export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}
