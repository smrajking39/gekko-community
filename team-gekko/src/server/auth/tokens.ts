/**
 * Short-lived signed tokens for email verification + password reset.
 * Signed with `JWT_VERIFY_SECRET` (separate from the Auth.js session secret
 * so a leak of one does not compromise the other).
 *
 * Tokens are stored in the `VerificationToken` table for revocation; the
 * signed payload contains the user id + purpose so we can validate before
 * touching the DB.
 */
import { SignJWT, jwtVerify } from 'jose';

type Purpose = 'verify_email' | 'password_reset';

type TokenPayload = {
  uid: string;
  purpose: Purpose;
};

const PURPOSE_TTL: Record<Purpose, string> = {
  verify_email: '24h',
  password_reset: '60min',
};

function getKey(): Uint8Array {
  const secret = process.env.JWT_VERIFY_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) throw new Error('JWT_VERIFY_SECRET (or AUTH_SECRET) is required');
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('teamgekko')
    .setSubject(payload.uid)
    .setExpirationTime(PURPOSE_TTL[payload.purpose])
    .sign(getKey());
}

export async function verifyToken(token: string, purpose: Purpose): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, getKey(), { issuer: 'teamgekko' });
  if (payload.purpose !== purpose) {
    throw new Error('Token purpose mismatch');
  }
  if (typeof payload.uid !== 'string') {
    throw new Error('Malformed token payload');
  }
  return { uid: payload.uid, purpose };
}

/** Six-digit OTP for email verification fallback. */
export function generateOtp(): string {
  return Math.floor(100_000 + Math.random() * 900_000).toString();
}
