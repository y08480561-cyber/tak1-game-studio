import dns from 'node:dns';
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Fallback for runtimes where setDefaultResultOrder is not supported
}
import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { HttpError, repo, toSafeHttpError } from './server/db.ts';
import {
  clearAdminSessionCookie,
  requireAdmin,
  requireAdminRole,
  resolveAdminFromRequest,
  setAdminSessionCookie,
  type AuthenticatedAdminRequest,
} from './server/auth.ts';
import type { AdminRole } from './src/types/studio.ts';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ALLOWED_CORS_ORIGINS = new Set([
  'https://kalametgame.ir',
  'https://www.kalametgame.ir',
  'https://tak1-game-studio.onrender.com',
]);

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_CORS_ORIGINS.has(origin)) return true;
  if (/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.run\.app$/i.test(origin)) return true;
  return false;
}

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function createRateLimiter(bucketName: string, maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = String(req.ip || req.socket.remoteAddress || 'unknown');
    const key = `${bucketName}:${ip}`;
    const now = Date.now();
    const current = rateBuckets.get(key);

    if (!current || now > current.resetAt) {
      rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (current.count >= maxRequests) {
      const retrySec = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retrySec));
      res.status(429).json({
        error: 'Too many requests. Please try again shortly.',
        code: 'RATE_LIMITED',
      });
      return;
    }

    current.count += 1;
    next();
  };
}

const authLimiter = createRateLimiter('admin-auth', 12, 15 * 60 * 1000);
const publicSubmitLimiter = createRateLimiter('public-submit', 15, 10 * 60 * 1000);
const trackLimiter = createRateLimiter('ticket-track', 40, 5 * 60 * 1000);

function assertValidUuid(id: string): void {
  if (!UUID_RE.test(String(id ?? '').trim())) {
    throw new HttpError(400, 'Invalid record identifier format.', 'INVALID_UUID');
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function sanitizeOptionalUrl(raw: unknown): string | undefined {
  const val = String(raw ?? '').trim();
  if (!val) return undefined;
  if (/^https?:\/\/.+/i.test(val) || val.startsWith('/')) {
    return val;
  }
  throw new HttpError(400, 'Links must start with http://, https://, or /', 'INVALID_URL');
}

function sanitizeMediaUrl(raw: unknown): string {
  const val = String(raw ?? '').trim();
  if (!val) return '';
  if (
    /^https?:\/\/.+/i.test(val) ||
    val.startsWith('/') ||
    /^data:image\/(?:png|jpeg|jpg|webp|gif|svg\+xml);base64,/i.test(val)
  ) {
    return val;
  }
  throw new HttpError(400, 'Invalid media URL.', 'INVALID_MEDIA_URL');
}

function sendError(res: Response, err: unknown): void {
  const safe = toSafeHttpError(err);
  res.status(safe.status).json({ error: safe.message, code: safe.code });
}

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT || 3000);

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // Canonical www -> non-www redirect ONLY for www.kalametgame.ir (never alters game.kalametgame.ir)
  app.use((req, res, next) => {
    const host = String(req.hostname || '').toLowerCase();
    if (host === 'www.kalametgame.ir') {
      res.redirect(301, `https://kalametgame.ir${req.originalUrl}`);
      return;
    }
    next();
  });

  // Security headers & crawler directives
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (req.path.startsWith('/api/') || req.path === '/admin') {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    }
    next();
  });

  // Strict CORS policy
  app.use('/api', (req, res, next) => {
    const origin = String(req.headers.origin || '');
    if (origin && isAllowedOrigin(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    }
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.use(express.json({ limit: '10mb' }));

  // ---- SEO: robots.txt & dynamic sitemap.xml ----
  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain; charset=utf-8').send(
      ['User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /api/', '', 'Sitemap: https://kalametgame.ir/sitemap.xml'].join('\n'),
    );
  });

  app.get('/sitemap.xml', async (_req, res) => {
    type SitemapEntry = { loc: string; lastmod?: string; priority: string; changefreq: string };
    const staticPages: SitemapEntry[] = [
      { loc: 'https://kalametgame.ir/', priority: '1.0', changefreq: 'weekly' },
      { loc: 'https://kalametgame.ir/products', priority: '0.9', changefreq: 'weekly' },
      { loc: 'https://kalametgame.ir/team', priority: '0.8', changefreq: 'monthly' },
      { loc: 'https://kalametgame.ir/news', priority: '0.8', changefreq: 'weekly' },
      { loc: 'https://kalametgame.ir/support', priority: '0.7', changefreq: 'monthly' },
      { loc: 'https://kalametgame.ir/feedback', priority: '0.6', changefreq: 'monthly' },
      { loc: 'https://kalametgame.ir/contact', priority: '0.7', changefreq: 'monthly' },
    ];

    let dynamicProducts: SitemapEntry[] = [];
    if (repo.storageMode === 'supabase') {
      try {
        const products = await repo.listProducts(false);
        dynamicProducts = products.map((p) => ({
          loc: `https://kalametgame.ir/products/${encodeURIComponent(p.slug)}`,
          lastmod: p.updatedAt ? p.updatedAt.slice(0, 10) : undefined,
          priority: '0.85',
          changefreq: 'weekly',
        }));
      } catch {
        dynamicProducts = [];
      }
    }

    const entries: SitemapEntry[] = [...staticPages, ...dynamicProducts];
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...entries.map((e) => {
        const lastmodTag = typeof e.lastmod === 'string' && e.lastmod ? `<lastmod>${escapeXml(e.lastmod)}</lastmod>` : '';
        return `  <url><loc>${escapeXml(e.loc)}</loc>${lastmodTag}<changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`;
      }),
      '</urlset>',
    ].join('\n');

    res.type('application/xml; charset=utf-8').send(xml);
  });

  // ---- Health & Real Supabase Connection Status ----
  app.get('/api/health', async (_req, res) => {
    const supabaseStatus = await repo.checkSupabaseStatus();
    const ok = Boolean(supabaseStatus.connected && supabaseStatus.schemaReady);
    res.json({
      ok,
      brand: 'TAK1 Game Studio',
      domain: 'kalametgame.ir',
      storageMode: repo.storageMode,
      configured: supabaseStatus.configured,
      connected: supabaseStatus.connected,
      schemaReady: supabaseStatus.schemaReady,
      storageReady: Boolean(supabaseStatus.storageReady),
      storageError: supabaseStatus.storageError ?? null,
      missingVars: supabaseStatus.missingVars,
      missingTables: supabaseStatus.missingTables ?? [],
      error: supabaseStatus.error ?? null,
      supabaseStatus,
      timestamp: new Date().toISOString(),
    });
  });

  // ---- Public Site Settings ----
  app.get('/api/settings', async (_req, res) => {
    try {
      const settings = await repo.getSiteSettings();
      res.json({ settings });
    } catch (err) {
      sendError(res, err);
    }
  });

  // ---- Public Catalog, News & Team (Published Only) ----
  app.get('/api/products', async (_req, res) => {
    try {
      const items = await repo.listProducts(false);
      res.json({ items });
    } catch (err) {
      sendError(res, err);
    }
  });

  app.get('/api/products/:slug', async (req, res) => {
    try {
      const item = await repo.getProductBySlug(req.params.slug);
      if (!item) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      res.json({ item });
    } catch (err) {
      sendError(res, err);
    }
  });

  app.get('/api/news', async (_req, res) => {
    try {
      const items = await repo.listNews(false);
      res.json({ items });
    } catch (err) {
      sendError(res, err);
    }
  });

  app.get('/api/team', async (_req, res) => {
    try {
      const items = await repo.listTeam(false);
      res.json({ items });
    } catch (err) {
      sendError(res, err);
    }
  });

  // ---- Public Submissions (Insert-Only + Tracking Lookup by Exact Code) ----
  app.post('/api/support', publicSubmitLimiter, async (req, res) => {
    try {
      const { name, email, productId, productName, subject, message } = req.body ?? {};
      const cleanName = String(name ?? '').trim();
      const cleanEmail = String(email ?? '').trim().toLowerCase();
      const cleanSubject = String(subject ?? '').trim();
      const cleanMessage = String(message ?? '').trim();

      if (!cleanName || !cleanEmail || !cleanSubject || !cleanMessage) {
        res.status(400).json({ error: 'All required fields must be filled.' });
        return;
      }
      if (!EMAIL_RE.test(cleanEmail)) {
        res.status(400).json({ error: 'Please provide a valid email address.' });
        return;
      }

      const cleanProductId =
        typeof productId === 'string' && UUID_RE.test(productId.trim()) ? productId.trim() : null;

      const ticket = await repo.createTicket({
        name: cleanName.slice(0, 120),
        email: cleanEmail.slice(0, 160),
        productId: cleanProductId,
        productName: String(productName ?? '').trim().slice(0, 160),
        subject: cleanSubject.slice(0, 200),
        message: cleanMessage.slice(0, 4000),
      });
      res.status(201).json({
        ticket: {
          trackingCode: ticket.trackingCode,
          status: ticket.status,
          createdAt: ticket.createdAt,
        },
      });
    } catch (err) {
      sendError(res, err);
    }
  });

  app.get('/api/support/track/:code', trackLimiter, async (req, res) => {
    try {
      const code = String(req.params.code ?? '').trim().toUpperCase();
      if (!/^TAK1-[A-Z0-9]{4,12}$/.test(code)) {
        res.status(400).json({ error: 'Invalid tracking code format.' });
        return;
      }
      const ticket = await repo.findTicketByTrackingCode(code);
      if (!ticket) {
        res.status(404).json({ error: 'Ticket not found' });
        return;
      }
      // Return only non-PII status & reply fields
      res.json({
        ticket: {
          trackingCode: ticket.trackingCode,
          subject: ticket.subject,
          productName: ticket.productName,
          status: ticket.status,
          adminReply: ticket.adminReply,
          repliedAt: ticket.repliedAt,
          createdAt: ticket.createdAt,
        },
      });
    } catch (err) {
      sendError(res, err);
    }
  });

  app.post('/api/suggestions', publicSubmitLimiter, async (req, res) => {
    try {
      const { name, email, category, productId, title, details } = req.body ?? {};
      const cleanName = String(name ?? '').trim();
      const cleanEmail = String(email ?? '').trim().toLowerCase();
      const cleanTitle = String(title ?? '').trim();
      const cleanDetails = String(details ?? '').trim();

      if (!cleanName || !cleanTitle || !cleanDetails) {
        res.status(400).json({ error: 'Name, title, and details are required.' });
        return;
      }
      if (cleanEmail && !EMAIL_RE.test(cleanEmail)) {
        res.status(400).json({ error: 'Please provide a valid email address.' });
        return;
      }

      const allowedCats = ['feature', 'game_idea', 'improvement', 'other'];
      const cleanProductId =
        typeof productId === 'string' && UUID_RE.test(productId.trim()) ? productId.trim() : null;

      const suggestion = await repo.createSuggestion({
        name: cleanName.slice(0, 120),
        email: cleanEmail.slice(0, 160),
        category: allowedCats.includes(category) ? category : 'feature',
        productId: cleanProductId,
        title: cleanTitle.slice(0, 200),
        details: cleanDetails.slice(0, 4000),
      });
      res.status(201).json({
        suggestion: {
          id: suggestion.id,
          createdAt: suggestion.createdAt,
        },
      });
    } catch (err) {
      sendError(res, err);
    }
  });

  app.post('/api/contact', publicSubmitLimiter, async (req, res) => {
    try {
      const { name, email, subject, message } = req.body ?? {};
      const cleanName = String(name ?? '').trim();
      const cleanEmail = String(email ?? '').trim().toLowerCase();
      const cleanSubject = String(subject ?? '').trim();
      const cleanMessage = String(message ?? '').trim();

      if (!cleanName || !cleanEmail || !cleanSubject || !cleanMessage) {
        res.status(400).json({ error: 'All contact fields are required.' });
        return;
      }
      if (!EMAIL_RE.test(cleanEmail)) {
        res.status(400).json({ error: 'Please provide a valid email address.' });
        return;
      }

      const item = await repo.createContactMessage({
        name: cleanName.slice(0, 120),
        email: cleanEmail.slice(0, 160),
        subject: cleanSubject.slice(0, 200),
        message: cleanMessage.slice(0, 4000),
      });
      res.status(201).json({
        message: {
          id: item.id,
          createdAt: item.createdAt,
        },
      });
    } catch (err) {
      sendError(res, err);
    }
  });

  // ---- Admin Authentication (Supabase Auth + admin_users RBAC) ----
  app.get('/api/admin/session', async (req, res) => {
    try {
      const supabaseStatus = await repo.checkSupabaseStatus();
      if (!supabaseStatus.configured || !supabaseStatus.connected || !supabaseStatus.schemaReady) {
        res.json({
          authenticated: false,
          adminId: null,
          adminEmail: null,
          adminName: null,
          adminRole: null,
          needsSetup: false,
          storageMode: repo.storageMode,
          supabaseStatus,
        });
        return;
      }

      const [adminUser, hasAdmin] = await Promise.all([
        resolveAdminFromRequest(req, res),
        repo.hasAnyAdmin(),
      ]);

      res.json({
        authenticated: Boolean(adminUser),
        adminId: adminUser?.id ?? null,
        adminEmail: adminUser?.email ?? null,
        adminName: adminUser?.displayName ?? null,
        adminRole: adminUser?.role ?? null,
        needsSetup: !hasAdmin,
        storageMode: repo.storageMode,
        supabaseStatus,
      });
    } catch (err) {
      sendError(res, err);
    }
  });

  app.post('/api/admin/setup', authLimiter, async (req, res) => {
    try {
      const { email, password, displayName } = req.body ?? {};
      const cleanEmail = String(email ?? '').trim().toLowerCase();
      const rawPassword = String(password ?? '');
      const cleanName = String(displayName ?? '').trim().slice(0, 100);

      if (!EMAIL_RE.test(cleanEmail) || rawPassword.length < 8) {
        res.status(400).json({ error: 'Valid email and password (min 8 characters) are required.' });
        return;
      }

      const { admin, accessToken, refreshToken } = await repo.createInitialAdmin(
        cleanEmail,
        rawPassword,
        cleanName,
      );

      setAdminSessionCookie(req, res, {
        email: admin.email,
        authUserId: admin.authUserId || '',
        accessToken,
        refreshToken,
      });

      res.status(201).json({
        authenticated: true,
        adminEmail: admin.email,
        adminRole: admin.role,
      });
    } catch (err) {
      sendError(res, err);
    }
  });

  app.post('/api/admin/login', authLimiter, async (req, res) => {
    try {
      const { email, password } = req.body ?? {};
      const normalizedEmail = String(email ?? '').trim().toLowerCase();
      const rawPassword = String(password ?? '');

      if (!EMAIL_RE.test(normalizedEmail) || !rawPassword) {
        res.status(400).json({ error: 'Valid email and password are required.' });
        return;
      }

      const { admin, accessToken, refreshToken } = await repo.loginAdminWithSupabaseAuth(
        normalizedEmail,
        rawPassword,
      );

      setAdminSessionCookie(req, res, {
        email: admin.email,
        authUserId: admin.authUserId || '',
        accessToken,
        refreshToken,
      });

      res.json({
        authenticated: true,
        adminEmail: admin.email,
        adminRole: admin.role,
      });
    } catch (err) {
      sendError(res, err);
    }
  });

  app.post('/api/admin/logout', (req, res) => {
    clearAdminSessionCookie(req, res);
    res.json({ ok: true });
  });

  // ---- Protected Admin Endpoints ----
  app.get('/api/admin/overview', requireAdmin, async (_req, res) => {
    try {
      const stats = await repo.getOverviewStats();
      res.json({ stats });
    } catch (err) {
      sendError(res, err);
    }
  });

  // Media Upload & Management in Supabase Storage
  app.get('/api/admin/media', requireAdmin, async (_req, res) => {
    try {
      const items = await repo.listStorageMedia();
      res.json({ items });
    } catch (err) {
      sendError(res, err);
    }
  });

  app.post('/api/admin/upload', requireAdmin, async (req, res) => {
    try {
      const { dataUrl, folder } = req.body ?? {};
      if (typeof dataUrl !== 'string' || !dataUrl.trim()) {
        res.status(400).json({ error: 'Image dataUrl is required.' });
        return;
      }
      const result = await repo.uploadMediaToStorage(dataUrl, String(folder ?? 'products'));
      res.status(201).json(result);
    } catch (err) {
      sendError(res, err);
    }
  });

  app.delete('/api/admin/media', requireAdmin, async (req, res) => {
    try {
      const pathParam = String(req.body?.path ?? req.query?.path ?? '').trim();
      if (!pathParam) {
        res.status(400).json({ error: 'Storage file path is required.' });
        return;
      }
      const ok = await repo.deleteStorageMedia(pathParam);
      res.json({ ok });
    } catch (err) {
      sendError(res, err);
    }
  });

  // Admin Products
  app.get('/api/admin/products', requireAdmin, async (_req, res) => {
    try {
      const items = await repo.listProducts(true);
      res.json({ items });
    } catch (err) {
      sendError(res, err);
    }
  });

  app.post('/api/admin/products', requireAdmin, async (req: AuthenticatedAdminRequest, res) => {
    try {
      const body = req.body ?? {};
      if (!String(body.titleFa ?? '').trim() && !String(body.titleEn ?? '').trim()) {
        res.status(400).json({ error: 'Product title is required.' });
        return;
      }
      const slugBase =
        String(body.slug || body.titleEn || body.titleFa || 'product')
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, '-')
          .replace(/^-+|-+$/g, '') || `tak1-${Date.now()}`;

      const screenshots = Array.isArray(body.screenshots)
        ? body.screenshots.map(sanitizeMediaUrl).filter(Boolean)
        : [];

      const item = await repo.createProduct(
        {
          slug: slugBase,
          category: ['game', 'app', 'tool'].includes(body.category) ? body.category : 'game',
          titleFa: String(body.titleFa ?? body.titleEn ?? '').trim(),
          titleEn: String(body.titleEn ?? body.titleFa ?? '').trim(),
          shortDescFa: String(body.shortDescFa ?? '').trim(),
          shortDescEn: String(body.shortDescEn ?? '').trim(),
          fullDescFa: String(body.fullDescFa ?? '').trim(),
          fullDescEn: String(body.fullDescEn ?? '').trim(),
          version: String(body.version ?? '1.0.0').trim(),
          releaseDate: String(body.releaseDate ?? new Date().toISOString().slice(0, 10)),
          iconUrl: sanitizeMediaUrl(body.iconUrl),
          screenshots,
          links: {
            myket: sanitizeOptionalUrl(body.links?.myket),
            bazaar: sanitizeOptionalUrl(body.links?.bazaar),
            googlePlay: sanitizeOptionalUrl(body.links?.googlePlay),
            direct: sanitizeOptionalUrl(body.links?.direct),
          },
          featured: Boolean(body.featured),
          published: body.published === undefined ? true : Boolean(body.published),
        },
        req.adminUser?.id,
      );
      res.status(201).json({ item });
    } catch (err) {
      sendError(res, err);
    }
  });

  app.put('/api/admin/products/:id', requireAdmin, async (req, res) => {
    try {
      assertValidUuid(req.params.id);
      const body = req.body ?? {};
      const links =
        body.links !== undefined
          ? {
              myket: sanitizeOptionalUrl(body.links?.myket),
              bazaar: sanitizeOptionalUrl(body.links?.bazaar),
              googlePlay: sanitizeOptionalUrl(body.links?.googlePlay),
              direct: sanitizeOptionalUrl(body.links?.direct),
            }
          : undefined;

      const cleanSlug =
        body.slug !== undefined
          ? String(body.slug)
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9-]+/g, '-')
              .replace(/^-+|-+$/g, '')
          : undefined;
      if (body.slug !== undefined && !cleanSlug) {
        res.status(400).json({ error: 'Product slug cannot be empty.' });
        return;
      }

      const item = await repo.updateProduct(req.params.id, {
        slug: cleanSlug,
        category: ['game', 'app', 'tool'].includes(body.category) ? body.category : undefined,
        titleFa: body.titleFa !== undefined ? String(body.titleFa).trim() : undefined,
        titleEn: body.titleEn !== undefined ? String(body.titleEn).trim() : undefined,
        shortDescFa: body.shortDescFa !== undefined ? String(body.shortDescFa).trim() : undefined,
        shortDescEn: body.shortDescEn !== undefined ? String(body.shortDescEn).trim() : undefined,
        fullDescFa: body.fullDescFa !== undefined ? String(body.fullDescFa).trim() : undefined,
        fullDescEn: body.fullDescEn !== undefined ? String(body.fullDescEn).trim() : undefined,
        version: body.version !== undefined ? String(body.version).trim() : undefined,
        releaseDate: body.releaseDate !== undefined ? String(body.releaseDate).trim() : undefined,
        iconUrl: body.iconUrl !== undefined ? sanitizeMediaUrl(body.iconUrl) : undefined,
        screenshots: Array.isArray(body.screenshots)
          ? body.screenshots.map(sanitizeMediaUrl).filter(Boolean)
          : undefined,
        links,
        featured: body.featured !== undefined ? Boolean(body.featured) : undefined,
        published: body.published !== undefined ? Boolean(body.published) : undefined,
      });

      if (!item) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      res.json({ item });
    } catch (err) {
      sendError(res, err);
    }
  });

  app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
    try {
      assertValidUuid(req.params.id);
      const ok = await repo.deleteProduct(req.params.id);
      res.json({ ok });
    } catch (err) {
      sendError(res, err);
    }
  });

  // Admin News (includes drafts)
  app.get('/api/admin/news', requireAdmin, async (_req, res) => {
    try {
      const items = await repo.listNews(true);
      res.json({ items });
    } catch (err) {
      sendError(res, err);
    }
  });

  app.post('/api/admin/news', requireAdmin, async (req: AuthenticatedAdminRequest, res) => {
    try {
      const b = req.body ?? {};
      if (!String(b.titleFa ?? '').trim() && !String(b.titleEn ?? '').trim()) {
        res.status(400).json({ error: 'News title is required.' });
        return;
      }
      const item = await repo.createNews(
        {
          titleFa: String(b.titleFa ?? b.titleEn ?? '').trim(),
          titleEn: String(b.titleEn ?? b.titleFa ?? '').trim(),
          summaryFa: String(b.summaryFa ?? '').trim(),
          summaryEn: String(b.summaryEn ?? '').trim(),
          contentFa: String(b.contentFa ?? '').trim(),
          contentEn: String(b.contentEn ?? '').trim(),
          coverUrl: sanitizeMediaUrl(b.coverUrl),
          category: ['release', 'studio', 'update', 'event'].includes(b.category) ? b.category : 'studio',
          published: b.published === undefined ? true : Boolean(b.published),
          publishedAt: String(b.publishedAt || new Date().toISOString()),
        },
        req.adminUser?.id,
      );
      res.status(201).json({ item });
    } catch (err) {
      sendError(res, err);
    }
  });

  app.put('/api/admin/news/:id', requireAdmin, async (req, res) => {
    try {
      assertValidUuid(req.params.id);
      const b = req.body ?? {};
      const item = await repo.updateNews(req.params.id, {
        titleFa: b.titleFa !== undefined ? String(b.titleFa).trim() : undefined,
        titleEn: b.titleEn !== undefined ? String(b.titleEn).trim() : undefined,
        summaryFa: b.summaryFa !== undefined ? String(b.summaryFa).trim() : undefined,
        summaryEn: b.summaryEn !== undefined ? String(b.summaryEn).trim() : undefined,
        contentFa: b.contentFa !== undefined ? String(b.contentFa).trim() : undefined,
        contentEn: b.contentEn !== undefined ? String(b.contentEn).trim() : undefined,
        coverUrl: b.coverUrl !== undefined ? sanitizeMediaUrl(b.coverUrl) : undefined,
        category: ['release', 'studio', 'update', 'event'].includes(b.category) ? b.category : undefined,
        published: b.published !== undefined ? Boolean(b.published) : undefined,
        publishedAt: b.publishedAt !== undefined ? String(b.publishedAt) : undefined,
      });
      if (!item) {
        res.status(404).json({ error: 'News post not found' });
        return;
      }
      res.json({ item });
    } catch (err) {
      sendError(res, err);
    }
  });

  app.delete('/api/admin/news/:id', requireAdmin, async (req, res) => {
    try {
      assertValidUuid(req.params.id);
      const ok = await repo.deleteNews(req.params.id);
      res.json({ ok });
    } catch (err) {
      sendError(res, err);
    }
  });

  // Admin Team (includes drafts)
  app.get('/api/admin/team', requireAdmin, async (_req, res) => {
    try {
      const items = await repo.listTeam(true);
      res.json({ items });
    } catch (err) {
      sendError(res, err);
    }
  });

  app.post('/api/admin/team', requireAdmin, async (req, res) => {
    try {
      const b = req.body ?? {};
      if (!String(b.nameFa ?? '').trim() && !String(b.nameEn ?? '').trim()) {
        res.status(400).json({ error: 'Team member name is required.' });
        return;
      }
      const item = await repo.createTeamMember({
        nameFa: String(b.nameFa ?? b.nameEn ?? '').trim(),
        nameEn: String(b.nameEn ?? b.nameFa ?? '').trim(),
        roleFa: String(b.roleFa ?? b.roleEn ?? '').trim(),
        roleEn: String(b.roleEn ?? b.roleFa ?? '').trim(),
        bioFa: String(b.bioFa ?? '').trim(),
        bioEn: String(b.bioEn ?? '').trim(),
        avatarUrl: sanitizeMediaUrl(b.avatarUrl),
        sortOrder: Number.isFinite(Number(b.sortOrder)) ? Number(b.sortOrder) : 0,
        published: b.published === undefined ? true : Boolean(b.published),
      });
      res.status(201).json({ item });
    } catch (err) {
      sendError(res, err);
    }
  });

  app.put('/api/admin/team/:id', requireAdmin, async (req, res) => {
    try {
      assertValidUuid(req.params.id);
      const b = req.body ?? {};
      const item = await repo.updateTeamMember(req.params.id, {
        nameFa: b.nameFa !== undefined ? String(b.nameFa).trim() : undefined,
        nameEn: b.nameEn !== undefined ? String(b.nameEn).trim() : undefined,
        roleFa: b.roleFa !== undefined ? String(b.roleFa).trim() : undefined,
        roleEn: b.roleEn !== undefined ? String(b.roleEn).trim() : undefined,
        bioFa: b.bioFa !== undefined ? String(b.bioFa).trim() : undefined,
        bioEn: b.bioEn !== undefined ? String(b.bioEn).trim() : undefined,
        avatarUrl: b.avatarUrl !== undefined ? sanitizeMediaUrl(b.avatarUrl) : undefined,
        sortOrder: b.sortOrder !== undefined && Number.isFinite(Number(b.sortOrder)) ? Number(b.sortOrder) : undefined,
        published: b.published !== undefined ? Boolean(b.published) : undefined,
      });
      if (!item) {
        res.status(404).json({ error: 'Team member not found' });
        return;
      }
      res.json({ item });
    } catch (err) {
      sendError(res, err);
    }
  });

  app.delete('/api/admin/team/:id', requireAdmin, async (req, res) => {
    try {
      assertValidUuid(req.params.id);
      const ok = await repo.deleteTeamMember(req.params.id);
      res.json({ ok });
    } catch (err) {
      sendError(res, err);
    }
  });

  // Admin Support Tickets
  app.get('/api/admin/tickets', requireAdmin, async (_req, res) => {
    try {
      const items = await repo.listTickets();
      res.json({ items });
    } catch (err) {
      sendError(res, err);
    }
  });

  app.patch('/api/admin/tickets/:id', requireAdmin, async (req: AuthenticatedAdminRequest, res) => {
    try {
      assertValidUuid(req.params.id);
      const { status, adminReply } = req.body ?? {};
      const cleanStatus = ['open', 'in_progress', 'resolved'].includes(status) ? status : undefined;
      const item = await repo.updateTicket(
        req.params.id,
        {
          status: cleanStatus,
          adminReply: adminReply !== undefined ? String(adminReply).trim() : undefined,
        },
        req.adminUser?.id,
      );
      if (!item) {
        res.status(404).json({ error: 'Ticket not found' });
        return;
      }
      res.json({ item });
    } catch (err) {
      sendError(res, err);
    }
  });

  // Admin Suggestions
  app.get('/api/admin/suggestions', requireAdmin, async (_req, res) => {
    try {
      const items = await repo.listSuggestions();
      res.json({ items });
    } catch (err) {
      sendError(res, err);
    }
  });

  app.patch('/api/admin/suggestions/:id', requireAdmin, async (req: AuthenticatedAdminRequest, res) => {
    try {
      assertValidUuid(req.params.id);
      const { status, adminNote } = req.body ?? {};
      const cleanStatus = ['new', 'reviewed', 'planned', 'archived'].includes(status) ? status : undefined;
      const item = await repo.updateSuggestion(
        req.params.id,
        {
          status: cleanStatus,
          adminNote: adminNote !== undefined ? String(adminNote).trim() : undefined,
        },
        req.adminUser?.id,
      );
      if (!item) {
        res.status(404).json({ error: 'Suggestion not found' });
        return;
      }
      res.json({ item });
    } catch (err) {
      sendError(res, err);
    }
  });

  app.delete('/api/admin/suggestions/:id', requireAdmin, async (req, res) => {
    try {
      assertValidUuid(req.params.id);
      const ok = await repo.deleteSuggestion(req.params.id);
      res.json({ ok });
    } catch (err) {
      sendError(res, err);
    }
  });

  // Admin Contact Messages
  app.get('/api/admin/messages', requireAdmin, async (_req, res) => {
    try {
      const items = await repo.listContactMessages();
      res.json({ items });
    } catch (err) {
      sendError(res, err);
    }
  });

  app.patch('/api/admin/messages/:id', requireAdmin, async (req, res) => {
    try {
      assertValidUuid(req.params.id);
      const { read } = req.body ?? {};
      const item = await repo.markContactMessageRead(req.params.id, Boolean(read));
      if (!item) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }
      res.json({ item });
    } catch (err) {
      sendError(res, err);
    }
  });

  app.delete('/api/admin/messages/:id', requireAdmin, async (req, res) => {
    try {
      assertValidUuid(req.params.id);
      const ok = await repo.deleteContactMessage(req.params.id);
      res.json({ ok });
    } catch (err) {
      sendError(res, err);
    }
  });

  // Admin Site Settings
  app.get('/api/admin/settings', requireAdmin, async (_req, res) => {
    try {
      const settings = await repo.getSiteSettings();
      res.json({ settings });
    } catch (err) {
      sendError(res, err);
    }
  });

  app.put(
    '/api/admin/settings',
    requireAdmin,
    requireAdminRole(['super_admin', 'admin']),
    async (req: AuthenticatedAdminRequest, res) => {
      try {
        const b = req.body ?? {};
        const contactEmail = b.contactEmail !== undefined ? String(b.contactEmail).trim() : undefined;
        if (contactEmail && !EMAIL_RE.test(contactEmail)) {
          res.status(400).json({ error: 'Invalid contact email format.' });
          return;
        }
        const settings = await repo.updateSiteSettings(
          {
            studioNameFa: b.studioNameFa !== undefined ? String(b.studioNameFa).trim() : undefined,
            studioNameEn: b.studioNameEn !== undefined ? String(b.studioNameEn).trim() : undefined,
            taglineFa: b.taglineFa !== undefined ? String(b.taglineFa).trim() : undefined,
            taglineEn: b.taglineEn !== undefined ? String(b.taglineEn).trim() : undefined,
            contactEmail,
            officialDomain: b.officialDomain !== undefined ? String(b.officialDomain).trim() : undefined,
            maintenanceMode: b.maintenanceMode !== undefined ? Boolean(b.maintenanceMode) : undefined,
            announcementFa: b.announcementFa !== undefined ? String(b.announcementFa).trim() : undefined,
            announcementEn: b.announcementEn !== undefined ? String(b.announcementEn).trim() : undefined,
            socialLinks:
              b.socialLinks && typeof b.socialLinks === 'object'
                ? {
                    telegram: sanitizeOptionalUrl(b.socialLinks.telegram),
                    instagram: sanitizeOptionalUrl(b.socialLinks.instagram),
                    discord: sanitizeOptionalUrl(b.socialLinks.discord),
                    github: sanitizeOptionalUrl(b.socialLinks.github),
                    website: sanitizeOptionalUrl(b.socialLinks.website),
                  }
                : undefined,
          },
          req.adminUser?.id,
        );
        res.json({ settings });
      } catch (err) {
        sendError(res, err);
      }
    },
  );

  // Admin Users & Access Control (Strictly super_admin ONLY)
  app.get(
    '/api/admin/users',
    requireAdmin,
    requireAdminRole(['super_admin']),
    async (_req, res) => {
      try {
        const items = await repo.listAdminUsers();
        res.json({ items });
      } catch (err) {
        sendError(res, err);
      }
    },
  );

  app.post(
    '/api/admin/users',
    requireAdmin,
    requireAdminRole(['super_admin']),
    async (req: AuthenticatedAdminRequest, res) => {
      try {
        const { email, password, displayName, role } = req.body ?? {};
        const cleanEmail = String(email ?? '').trim().toLowerCase();
        const rawPassword = String(password ?? '');
        const cleanRole: AdminRole = ['super_admin', 'admin', 'editor'].includes(role)
          ? role
          : 'editor';

        if (!EMAIL_RE.test(cleanEmail) || rawPassword.length < 8) {
          res.status(400).json({ error: 'Valid email and password (min 8 chars) are required.' });
          return;
        }

        const item = await repo.createAdditionalAdmin({
          email: cleanEmail,
          password: rawPassword,
          displayName: String(displayName ?? '').trim(),
          role: cleanRole,
        });
        res.status(201).json({ item });
      } catch (err) {
        sendError(res, err);
      }
    },
  );

  app.patch(
    '/api/admin/users/:id',
    requireAdmin,
    requireAdminRole(['super_admin']),
    async (req: AuthenticatedAdminRequest, res) => {
      try {
        assertValidUuid(req.params.id);
        if (req.params.id === req.adminUser?.id && req.body?.isActive === false) {
          res.status(400).json({ error: 'You cannot deactivate your own admin account.' });
          return;
        }
        if (req.params.id === req.adminUser?.id && req.body?.role && req.body.role !== 'super_admin') {
          res.status(400).json({ error: 'You cannot demote your own super_admin role.' });
          return;
        }

        const existingTarget = await repo.getAdminUserById(req.params.id);
        if (!existingTarget) {
          res.status(404).json({ error: 'Admin user not found' });
          return;
        }

        const role = ['super_admin', 'admin', 'editor'].includes(req.body?.role)
          ? (req.body.role as AdminRole)
          : undefined;

        const isDemotingOrDisablingLastSuper =
          existingTarget.role === 'super_admin' &&
          existingTarget.isActive &&
          (req.body?.isActive === false || (role !== undefined && role !== 'super_admin'));

        if (isDemotingOrDisablingLastSuper) {
          const superCount = await repo.countActiveSuperAdmins();
          if (superCount <= 1) {
            res.status(400).json({ error: 'Cannot disable or demote the last active super_admin.' });
            return;
          }
        }

        const item = await repo.updateAdminUser(req.params.id, {
          role,
          isActive: req.body?.isActive !== undefined ? Boolean(req.body.isActive) : undefined,
          displayName:
            req.body?.displayName !== undefined ? String(req.body.displayName).trim() : undefined,
        });
        if (!item) {
          res.status(404).json({ error: 'Admin user not found' });
          return;
        }
        res.json({ item });
      } catch (err) {
        sendError(res, err);
      }
    },
  );

  app.delete(
    '/api/admin/users/:id',
    requireAdmin,
    requireAdminRole(['super_admin']),
    async (req: AuthenticatedAdminRequest, res) => {
      try {
        assertValidUuid(req.params.id);
        if (req.params.id === req.adminUser?.id) {
          res.status(400).json({ error: 'You cannot delete your own account.' });
          return;
        }
        const existingTarget = await repo.getAdminUserById(req.params.id);
        if (existingTarget?.role === 'super_admin' && existingTarget.isActive) {
          const superCount = await repo.countActiveSuperAdmins();
          if (superCount <= 1) {
            res.status(400).json({ error: 'Cannot delete the last active super_admin.' });
            return;
          }
        }
        const ok = await repo.deleteAdminUser(req.params.id);
        res.json({ ok });
      } catch (err) {
        sendError(res, err);
      }
    },
  );

  // Explicit 404 for unknown API paths
  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  // Safe Express body-parser / error handler
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (!err) {
      next();
      return;
    }
    const raw = err as { type?: string; status?: number };
    if (raw.type === 'entity.parse.failed') {
      res.status(400).json({ error: 'Malformed JSON request body.', code: 'INVALID_JSON' });
      return;
    }
    if (raw.type === 'entity.too.large') {
      res.status(413).json({ error: 'Request payload exceeds maximum limit (10MB).', code: 'PAYLOAD_TOO_LARGE' });
      return;
    }
    sendError(res, err);
  });

  // ---- Vite Dev Middleware or Production Dist ----
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found. Run npm run build.');
      }
    });
  }

  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`TAK1 Game Studio server listening on http://0.0.0.0:${port}`);
  });

  const shutdown = (signal: string) => {
    console.log(`Received ${signal}. Closing TAK1 Game Studio server gracefully...`);
    server.close(() => {
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 5000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
});

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
