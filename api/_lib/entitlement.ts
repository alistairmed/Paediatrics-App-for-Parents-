import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Premium entitlement tokens: `pp1.<payload>.<signature>`, where the payload
 * is base64url JSON and the signature is HMAC-SHA256 over `pp1.<payload>`
 * with ENTITLEMENT_SECRET. Stateless to verify; the monthly cap is counted
 * in a UsageStore keyed by the token id.
 *
 * Self-contained (only node:crypto) so scripts/mint-entitlement-token.ts can
 * import it directly.
 */
export interface EntitlementClaims {
  /** Who the token was issued to (an opaque id, never an email or name). */
  sub: string;
  /** Token id; the monthly cap is counted per token. */
  jti: string;
  tier: 'premium';
  /** Expiry, seconds since the epoch. */
  exp: number;
  /** Premium requests allowed per calendar month (UTC). */
  cap: number;
}

export type VerifyResult =
  | { ok: true; claims: EntitlementClaims }
  | { ok: false; reason: 'missing' | 'malformed' | 'signature' | 'expired' | 'invalid' | 'server' };

const PREFIX = 'pp1';
export const MIN_SECRET_LENGTH = 32;

const b64url = (buf: Buffer) => buf.toString('base64url');
const sign = (data: string, secret: string) => createHmac('sha256', secret).update(data).digest();

export function mintEntitlementToken(claims: EntitlementClaims, secret: string): string {
  if (secret.length < MIN_SECRET_LENGTH) throw new Error(`ENTITLEMENT_SECRET must be at least ${MIN_SECRET_LENGTH} characters.`);
  const payload = b64url(Buffer.from(JSON.stringify(claims)));
  return `${PREFIX}.${payload}.${b64url(sign(`${PREFIX}.${payload}`, secret))}`;
}

/** Reads a token from an `Authorization: Bearer <token>` header value. */
export const bearerToken = (header: string | undefined): string | null => {
  const match = /^Bearer\s+(\S+)$/i.exec(header?.trim() || '');
  return match ? match[1] : null;
};

export function verifyEntitlementToken(token: string | null, secret: string | undefined, now = Date.now()): VerifyResult {
  if (!secret || secret.length < MIN_SECRET_LENGTH) return { ok: false, reason: 'server' };
  if (!token) return { ok: false, reason: 'missing' };

  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== PREFIX || !parts[1] || !parts[2]) return { ok: false, reason: 'malformed' };

  const expected = sign(`${PREFIX}.${parts[1]}`, secret);
  const given = Buffer.from(parts[2], 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return { ok: false, reason: 'signature' };

  let claims: EntitlementClaims;
  try {
    claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  const valid = claims && claims.tier === 'premium'
    && typeof claims.sub === 'string' && claims.sub.length > 0
    && typeof claims.jti === 'string' && claims.jti.length > 0
    && Number.isFinite(claims.exp) && Number.isInteger(claims.cap) && claims.cap > 0;
  if (!valid) return { ok: false, reason: 'invalid' };
  if (claims.exp * 1000 <= now) return { ok: false, reason: 'expired' };
  return { ok: true, claims };
}
