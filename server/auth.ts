import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

const COOKIE_NAME = 'tak1_admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

// Ephemeral fallback secret per process if SESSION_SECRET env is not set
const FALLBACK_SECRET = crypto.randomBytes(32).toString('hex');

function getSessionSecret(): string {
  return process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16
    ? process.env.SESSION_SECRET
    : FALLBACK_SECRET;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

export interface SessionPayload {
  email: string;
  exp: number;
}

export function createSessionToken(email: string): string {
  const payload: SessionPayload = {
    email,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || !token.includes('.')) return null;
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return null;

  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encoded)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (!parsed.email || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie;
  if (!header) return {};
  const result: Record<string, string> = {};
  for (const chunk of header.split(';')) {
    const idx = chunk.indexOf('=');
    if (idx === -1) continue;
    const key = chunk.slice(0, idx).trim();
    const val = chunk.slice(idx + 1).trim();
    if (key) {
      result[key] = decodeURIComponent(val);
    }
  }
  return result;
}

export function getAdminFromRequest(req: Request): SessionPayload | null {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  return verifySessionToken(token);
}

function isHttpsRequest(req: Request): boolean {
  const proto = String(req.headers['x-forwarded-proto'] ?? '').toLowerCase();
  const origin = String(req.headers.origin ?? '').toLowerCase();
  return req.secure || proto.includes('https') || origin.startsWith('https://');
}

export function setAdminSessionCookie(req: Request, res: Response, email: string): void {
  const token = createSessionToken(email);
  const secure = isHttpsRequest(req);
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'HttpOnly',
    'Path=/',
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
    secure ? 'SameSite=None' : 'SameSite=Lax',
  ];
  if (secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearAdminSessionCookie(req: Request, res: Response): void {
  const secure = isHttpsRequest(req);
  const parts = [
    `${COOKIE_NAME}=`,
    'HttpOnly',
    'Path=/',
    'Max-Age=0',
    secure ? 'SameSite=None' : 'SameSite=Lax',
  ];
  if (secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const session = getAdminFromRequest(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized: Admin authentication required.' });
    return;
  }
  (req as Request & { adminEmail?: string }).adminEmail = session.email;
  next();
}
