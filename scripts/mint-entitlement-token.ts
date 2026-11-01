/**
 * DEV ONLY: mints a premium entitlement token for testing.
 *
 *   ENTITLEMENT_SECRET=... npm run mint-token -- --sub tester --days 7 --cap 20
 *
 * Paste the printed code into Privacy, Backup & Lock → Premium access code.
 * Refuses to run in production or on Vercel; real tokens should come from
 * whatever handles payments, which is not built yet.
 */
import { randomUUID } from 'node:crypto';
import { mintEntitlementToken, MIN_SECRET_LENGTH } from '../api/_lib/entitlement.ts';

if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
  console.error('mint-entitlement-token is for development only.');
  process.exit(1);
}

const secret = process.env.ENTITLEMENT_SECRET || '';
if (secret.length < MIN_SECRET_LENGTH) {
  console.error(`Set ENTITLEMENT_SECRET (at least ${MIN_SECRET_LENGTH} characters) to the same value the server uses.`);
  process.exit(1);
}

const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const days = Number(arg('days', '7'));
const cap = Number(arg('cap', '20'));
if (!(days > 0) || !Number.isInteger(cap) || cap < 1) {
  console.error('--days must be positive and --cap a whole number of at least 1.');
  process.exit(1);
}

const claims = {
  sub: arg('sub', 'dev-tester'),
  jti: randomUUID(),
  tier: 'premium' as const,
  exp: Math.floor(Date.now() / 1000 + days * 24 * 60 * 60),
  cap,
};
console.log(mintEntitlementToken(claims, secret));
console.error(`Token ${claims.jti} for "${claims.sub}": ${cap} premium requests a month, expires ${new Date(claims.exp * 1000).toISOString()}.`);
