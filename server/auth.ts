import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { env, isDemo } from './env';
import { HttpError } from './errors';

// Accounts are anonymous: the server issues an id plus an HMAC signature.
// No email, name or phone number is collected.

function secret(): string {
  if (env.appSecret) return env.appSecret;
  if (isDemo()) return 'demo-only-insecure-secret';
  throw new HttpError(500, 'APP_SECRET is not configured');
}

function sign(userId: string): string {
  return createHmac('sha256', secret()).update(userId).digest('base64url');
}

export function issueToken(): { userId: string; token: string } {
  const userId = randomUUID();
  return { userId, token: `${userId}.${sign(userId)}` };
}

export function verifyToken(header: string | undefined): string {
  const token = header?.startsWith('Bearer ') ? header.slice(7) : '';
  const [userId, sig] = token.split('.');
  if (!userId || !sig) throw new HttpError(401, 'Not signed in');
  const expected = Buffer.from(sign(userId));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    throw new HttpError(401, 'Invalid session');
  }
  return userId;
}
