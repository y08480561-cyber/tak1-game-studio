import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { createSupabaseAuthClient, repo } from './db.ts';
import type { AdminRole, AdminUser } from '../src/types/studio.ts';

const COOKIE_NAME = 'tak1_admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

const FALLBACK_SECRET = crypto.randomBytes(32).toString('hex');

function getSessionSecret(): string {
  return process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16
    ? process.env.SESSION_SECRET
    : FALLBACK_SECRET;
}

export interface SessionPayload {
  email: string;
  authUserId: string;
  accessToken: string;
  refreshToken: string;
  exp: number;
}

export interface AuthenticatedAdminRequest extends Request {
  adminUser?: AdminUser;
}

export function createSessionToken(payload: Omit<SessionPayload, 'exp'>): string {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(fullPayload), 'utf8').toString('base64url');
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
    if (
      !parsed.email ||
      !parsed.accessToken ||
      typeof parsed.exp !== 'number' ||
      parsed.exp < Date.now()
    ) {
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

function isHttpsRequest(req: Request): boolean {
  const proto = String(req.headers['x-forwarded-proto'] ?? '').toLowerCase();
  const origin = String(req.headers.origin ?? '').toLowerCase();
  return req.secure || proto.includes('https') || origin.startsWith('https://');
}

export function setAdminSessionCookie(
  req: Request,
  res: Response,
  payload: Omit<SessionPayload, 'exp'>,
): void {
  const token = createSessionToken(payload);
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

export async function resolveAdminFromRequest(
  req: Request,
  res?: Response,
): Promise<AdminUser | null> {
  if (repo.storageMode !== 'supabase') return null;

  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  const session = verifySessionToken(token);
  if (!session) return null;

  try {
    const authClient = createSupabaseAuthClient();
    const { data, error } = await authClient.auth.getUser(session.accessToken);
    let activeUser = data?.user ?? null;

    if ((error || !activeUser) && session.refreshToken) {
      const { data: refreshed, error: refreshErr } = await authClient.auth.refreshSession({
        refresh_token: session.refreshToken,
      });
      if (!refreshErr && refreshed.user && refreshed.session) {
        activeUser = refreshed.user;
        if (res) {
          setAdminSessionCookie(req, res, {
            email: activeUser.email || session.email,
            authUserId: activeUser.id,
            accessToken: refreshed.session.access_token,
            refreshToken: refreshed.session.refresh_token,
          });
        }
      }
    }

    if (!activeUser) return null;
    return await repo.findActiveAdminByAuthOrEmail(activeUser.id, activeUser.email || session.email);
  } catch {
    return null;
  }
}

export async function requireAdmin(
  req: AuthenticatedAdminRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (repo.storageMode !== 'supabase') {
      res.status(503).json({
        error: 'Supabase is not configured on the server.',
        code: 'SUPABASE_NOT_CONFIGURED',
      });
      return;
    }

    const admin = await resolveAdminFromRequest(req, res);
    if (!admin) {
      res.status(401).json({ error: 'Unauthorized: Valid studio admin session required.' });
      return;
    }

    req.adminUser = admin;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized: Admin verification failed.' });
  }
}

export function requireAdminRole(roles: AdminRole[]) {
  return (req: AuthenticatedAdminRequest, res: Response, next: NextFunction): void => {
    if (!req.adminUser || !roles.includes(req.adminUser.role)) {
      res.status(403).json({ error: 'Forbidden: Insufficient administrator permissions.' });
      return;
    }
    next();
  };
}
