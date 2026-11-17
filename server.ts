import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { repo } from './server/db.ts';
import {
  clearAdminSessionCookie,
  getAdminFromRequest,
  hashPassword,
  requireAdmin,
  setAdminSessionCookie,
  verifyPassword,
} from './server/auth.ts';

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT || 3000);

  app.set('trust proxy', 1);
  app.use(express.json({ limit: '10mb' }));

  // ---- Health ----
  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      brand: 'TAK1 Game Studio',
      domain: 'kalametgame.ir',
      storageMode: repo.storageMode,
      timestamp: new Date().toISOString(),
    });
  });

  // ---- Public Catalog, News & Team ----
  app.get('/api/products', async (_req, res) => {
    try {
      const items = await repo.listProducts(false);
      res.json({ items });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
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
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get('/api/news', async (_req, res) => {
    try {
      const items = await repo.listNews();
      res.json({ items });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get('/api/team', async (_req, res) => {
    try {
      const items = await repo.listTeam();
      res.json({ items });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // ---- Public Submissions (Support, Suggestions, Contact) ----
  app.post('/api/support', async (req, res) => {
    try {
      const { name, email, productName, subject, message } = req.body ?? {};
      if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
        res.status(400).json({ error: 'All required fields must be filled.' });
        return;
      }
      const ticket = await repo.createTicket({
        name: String(name).trim(),
        email: String(email).trim(),
        productName: String(productName ?? '').trim(),
        subject: String(subject).trim(),
        message: String(message).trim(),
      });
      res.status(201).json({ ticket });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get('/api/support/track/:code', async (req, res) => {
    try {
      const ticket = await repo.findTicketByTrackingCode(req.params.code);
      if (!ticket) {
        res.status(404).json({ error: 'Ticket not found' });
        return;
      }
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
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/suggestions', async (req, res) => {
    try {
      const { name, email, category, title, details } = req.body ?? {};
      if (!name?.trim() || !title?.trim() || !details?.trim()) {
        res.status(400).json({ error: 'Name, title, and details are required.' });
        return;
      }
      const allowedCats = ['feature', 'game_idea', 'improvement', 'other'];
      const suggestion = await repo.createSuggestion({
        name: String(name).trim(),
        email: String(email ?? '').trim(),
        category: allowedCats.includes(category) ? category : 'feature',
        title: String(title).trim(),
        details: String(details).trim(),
      });
      res.status(201).json({ suggestion });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/contact', async (req, res) => {
    try {
      const { name, email, subject, message } = req.body ?? {};
      if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
        res.status(400).json({ error: 'All contact fields are required.' });
        return;
      }
      const item = await repo.createContactMessage({
        name: String(name).trim(),
        email: String(email).trim(),
        subject: String(subject).trim(),
        message: String(message).trim(),
      });
      res.status(201).json({ message: item });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // ---- Admin Authentication ----
  app.get('/api/admin/session', async (req, res) => {
    try {
      const session = getAdminFromRequest(req);
      const hasAdmin = await repo.hasAnyAdmin();
      res.json({
        authenticated: Boolean(session),
        adminEmail: session?.email ?? null,
        needsSetup: !hasAdmin,
        storageMode: repo.storageMode,
      });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/admin/setup', async (req, res) => {
    try {
      const hasAdmin = await repo.hasAnyAdmin();
      if (hasAdmin) {
        res.status(403).json({ error: 'Admin account is already configured.' });
        return;
      }
      const { email, password } = req.body ?? {};
      if (!email?.trim() || !password || String(password).length < 8) {
        res.status(400).json({ error: 'Valid email and password (min 8 chars) required.' });
        return;
      }
      const passwordHash = hashPassword(String(password));
      const created = await repo.createAdmin(String(email), passwordHash);
      setAdminSessionCookie(req, res, created.email);
      res.status(201).json({ authenticated: true, adminEmail: created.email });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/admin/login', async (req, res) => {
    try {
      const { email, password } = req.body ?? {};
      const normalizedEmail = String(email ?? '').trim().toLowerCase();
      const rawPassword = String(password ?? '');

      if (!normalizedEmail || !rawPassword) {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
      }

      // 1. Check env-configured admin credentials if set
      const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
      const envPassword = process.env.ADMIN_PASSWORD;
      if (envEmail && envPassword && normalizedEmail === envEmail && rawPassword === envPassword) {
        setAdminSessionCookie(req, res, normalizedEmail);
        res.json({ authenticated: true, adminEmail: normalizedEmail });
        return;
      }

      // 2. Check database admin user
      const record = await repo.findAdminByEmail(normalizedEmail);
      if (record && verifyPassword(rawPassword, record.passwordHash)) {
        setAdminSessionCookie(req, res, record.email);
        res.json({ authenticated: true, adminEmail: record.email });
        return;
      }

      res.status(401).json({ error: 'Invalid credentials.' });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
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
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get('/api/admin/products', requireAdmin, async (_req, res) => {
    try {
      const items = await repo.listProducts(true);
      res.json({ items });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/admin/products', requireAdmin, async (req, res) => {
    try {
      const body = req.body ?? {};
      if (!body.titleFa?.trim() && !body.titleEn?.trim()) {
        res.status(400).json({ error: 'Product title is required.' });
        return;
      }
      const slugBase = String(body.slug || body.titleEn || body.titleFa || 'product')
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '') || `tak1-${Date.now()}`;

      const item = await repo.createProduct({
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
        iconUrl: String(body.iconUrl ?? '').trim(),
        screenshots: Array.isArray(body.screenshots) ? body.screenshots.filter(Boolean) : [],
        links: {
          myket: String(body.links?.myket ?? '').trim() || undefined,
          bazaar: String(body.links?.bazaar ?? '').trim() || undefined,
          googlePlay: String(body.links?.googlePlay ?? '').trim() || undefined,
          direct: String(body.links?.direct ?? '').trim() || undefined,
        },
        featured: Boolean(body.featured),
        published: body.published === undefined ? true : Boolean(body.published),
      });
      res.status(201).json({ item });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.put('/api/admin/products/:id', requireAdmin, async (req, res) => {
    try {
      const body = req.body ?? {};
      const item = await repo.updateProduct(req.params.id, {
        slug: body.slug,
        category: body.category,
        titleFa: body.titleFa,
        titleEn: body.titleEn,
        shortDescFa: body.shortDescFa,
        shortDescEn: body.shortDescEn,
        fullDescFa: body.fullDescFa,
        fullDescEn: body.fullDescEn,
        version: body.version,
        releaseDate: body.releaseDate,
        iconUrl: body.iconUrl,
        screenshots: Array.isArray(body.screenshots) ? body.screenshots.filter(Boolean) : undefined,
        links: body.links,
        featured: body.featured,
        published: body.published,
      });
      if (!item) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      res.json({ item });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
    try {
      const ok = await repo.deleteProduct(req.params.id);
      res.json({ ok });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Admin News
  app.post('/api/admin/news', requireAdmin, async (req, res) => {
    try {
      const b = req.body ?? {};
      if (!b.titleFa?.trim() && !b.titleEn?.trim()) {
        res.status(400).json({ error: 'News title is required.' });
        return;
      }
      const item = await repo.createNews({
        titleFa: String(b.titleFa ?? b.titleEn ?? '').trim(),
        titleEn: String(b.titleEn ?? b.titleFa ?? '').trim(),
        summaryFa: String(b.summaryFa ?? '').trim(),
        summaryEn: String(b.summaryEn ?? '').trim(),
        contentFa: String(b.contentFa ?? '').trim(),
        contentEn: String(b.contentEn ?? '').trim(),
        coverUrl: String(b.coverUrl ?? '').trim(),
        category: ['release', 'studio', 'update', 'event'].includes(b.category) ? b.category : 'studio',
        publishedAt: String(b.publishedAt || new Date().toISOString()),
      });
      res.status(201).json({ item });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.put('/api/admin/news/:id', requireAdmin, async (req, res) => {
    try {
      const item = await repo.updateNews(req.params.id, req.body ?? {});
      if (!item) {
        res.status(404).json({ error: 'News post not found' });
        return;
      }
      res.json({ item });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete('/api/admin/news/:id', requireAdmin, async (req, res) => {
    try {
      const ok = await repo.deleteNews(req.params.id);
      res.json({ ok });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Admin Team
  app.post('/api/admin/team', requireAdmin, async (req, res) => {
    try {
      const b = req.body ?? {};
      if (!b.nameFa?.trim() && !b.nameEn?.trim()) {
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
        avatarUrl: String(b.avatarUrl ?? '').trim(),
        sortOrder: Number(b.sortOrder ?? 0),
      });
      res.status(201).json({ item });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.put('/api/admin/team/:id', requireAdmin, async (req, res) => {
    try {
      const item = await repo.updateTeamMember(req.params.id, req.body ?? {});
      if (!item) {
        res.status(404).json({ error: 'Team member not found' });
        return;
      }
      res.json({ item });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete('/api/admin/team/:id', requireAdmin, async (req, res) => {
    try {
      const ok = await repo.deleteTeamMember(req.params.id);
      res.json({ ok });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Admin Support Tickets
  app.get('/api/admin/tickets', requireAdmin, async (_req, res) => {
    try {
      const items = await repo.listTickets();
      res.json({ items });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.patch('/api/admin/tickets/:id', requireAdmin, async (req, res) => {
    try {
      const { status, adminReply } = req.body ?? {};
      const item = await repo.updateTicket(req.params.id, { status, adminReply });
      if (!item) {
        res.status(404).json({ error: 'Ticket not found' });
        return;
      }
      res.json({ item });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Admin Suggestions
  app.get('/api/admin/suggestions', requireAdmin, async (_req, res) => {
    try {
      const items = await repo.listSuggestions();
      res.json({ items });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.patch('/api/admin/suggestions/:id', requireAdmin, async (req, res) => {
    try {
      const { status, adminNote } = req.body ?? {};
      const item = await repo.updateSuggestion(req.params.id, { status, adminNote });
      if (!item) {
        res.status(404).json({ error: 'Suggestion not found' });
        return;
      }
      res.json({ item });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete('/api/admin/suggestions/:id', requireAdmin, async (req, res) => {
    try {
      const ok = await repo.deleteSuggestion(req.params.id);
      res.json({ ok });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Admin Contact Messages
  app.get('/api/admin/messages', requireAdmin, async (_req, res) => {
    try {
      const items = await repo.listContactMessages();
      res.json({ items });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.patch('/api/admin/messages/:id', requireAdmin, async (req, res) => {
    try {
      const { read } = req.body ?? {};
      const item = await repo.markContactMessageRead(req.params.id, Boolean(read));
      if (!item) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }
      res.json({ item });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete('/api/admin/messages/:id', requireAdmin, async (req, res) => {
    try {
      const ok = await repo.deleteContactMessage(req.params.id);
      res.json({ ok });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
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

  app.listen(port, '0.0.0.0', () => {
    console.log(`TAK1 Game Studio server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
