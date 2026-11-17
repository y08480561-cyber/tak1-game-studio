import crypto from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  AdminOverviewStats,
  AdminRole,
  AdminUser,
  ContactMessage,
  NewsPost,
  Product,
  SiteSettings,
  Suggestion,
  SupabaseStatus,
  SupportTicket,
  TeamMember,
} from '../src/types/studio.ts';

export class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, message: string, code = 'SERVER_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function getSupabaseEnv(): { url: string; serviceRoleKey: string; missingVars: string[] } {
  const url = process.env.SUPABASE_URL?.trim() || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';
  const missingVars: string[] = [];

  if (!url || !/^https?:\/\/.+/i.test(url)) {
    missingVars.push('SUPABASE_URL');
  }
  if (!serviceRoleKey) {
    missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
  }

  return { url, serviceRoleKey, missingVars };
}

let cachedUrl = '';
let cachedKey = '';
let cachedAdminClient: SupabaseClient | null = null;

export function getSupabaseAdminClient(): SupabaseClient {
  const { url, serviceRoleKey, missingVars } = getSupabaseEnv();
  if (missingVars.length > 0) {
    throw new HttpError(
      503,
      `Supabase is not configured on the server. Missing: ${missingVars.join(', ')}`,
      'SUPABASE_NOT_CONFIGURED',
    );
  }
  if (!cachedAdminClient || cachedUrl !== url || cachedKey !== serviceRoleKey) {
    cachedUrl = url;
    cachedKey = serviceRoleKey;
    cachedAdminClient = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cachedAdminClient;
}

export function createSupabaseAuthClient(): SupabaseClient {
  const { url, serviceRoleKey, missingVars } = getSupabaseEnv();
  if (missingVars.length > 0) {
    throw new HttpError(
      503,
      `Supabase is not configured on the server. Missing: ${missingVars.join(', ')}`,
      'SUPABASE_NOT_CONFIGURED',
    );
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function isMissingTableError(err: { code?: string; message?: string } | null | undefined): boolean {
  if (!err) return false;
  const code = String(err.code || '');
  const msg = String(err.message || '').toLowerCase();
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    msg.includes('could not find the table') ||
    msg.includes('does not exist')
  );
}

export function toSafeHttpError(err: unknown): HttpError {
  if (err instanceof HttpError) return err;
  const raw = err as { code?: string; message?: string } | undefined;
  const code = String(raw?.code || '');
  const msg = String(raw?.message || '');

  if (isMissingTableError(raw)) {
    return new HttpError(
      503,
      'Supabase database schema is incomplete. Please execute supabase/schema.sql in Supabase SQL Editor.',
      'SUPABASE_SCHEMA_MISSING',
    );
  }
  if (code === '23505') {
    return new HttpError(409, 'A record with this unique identifier already exists.', 'DUPLICATE_RECORD');
  }
  if (code === '23503') {
    return new HttpError(400, 'Referenced record does not exist.', 'FOREIGN_KEY_ERROR');
  }
  if (code === '23514') {
    return new HttpError(400, 'Submitted data violated a database validation rule.', 'CHECK_VIOLATION');
  }
  if (msg.toLowerCase().includes('fetch failed') || msg.toLowerCase().includes('enotfound')) {
    return new HttpError(503, 'Unable to reach Supabase server.', 'SUPABASE_UNREACHABLE');
  }

  return new HttpError(500, 'An internal database operation failed.', 'DATABASE_ERROR');
}

function mapSupabaseProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    slug: String(row.slug),
    category: (row.category as Product['category']) || 'game',
    titleFa: String(row.title_fa ?? ''),
    titleEn: String(row.title_en ?? ''),
    shortDescFa: String(row.short_desc_fa ?? ''),
    shortDescEn: String(row.short_desc_en ?? ''),
    fullDescFa: String(row.full_desc_fa ?? ''),
    fullDescEn: String(row.full_desc_en ?? ''),
    version: String(row.version ?? '1.0.0'),
    releaseDate: String(row.release_date ?? ''),
    iconUrl: String(row.icon_url ?? ''),
    screenshots: Array.isArray(row.screenshots) ? row.screenshots.map(String) : [],
    links: (row.links as Product['links']) ?? {},
    featured: Boolean(row.featured),
    published: row.published === undefined ? true : Boolean(row.published),
    createdBy: row.created_by ? String(row.created_by) : null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

function mapSupabaseNews(row: Record<string, unknown>): NewsPost {
  return {
    id: String(row.id),
    titleFa: String(row.title_fa ?? ''),
    titleEn: String(row.title_en ?? ''),
    summaryFa: String(row.summary_fa ?? ''),
    summaryEn: String(row.summary_en ?? ''),
    contentFa: String(row.content_fa ?? ''),
    contentEn: String(row.content_en ?? ''),
    coverUrl: String(row.cover_url ?? ''),
    category: (row.category as NewsPost['category']) || 'studio',
    published: row.published === undefined ? true : Boolean(row.published),
    publishedAt: String(row.published_at ?? new Date().toISOString()),
    authorId: row.author_id ? String(row.author_id) : null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

function mapSupabaseTeam(row: Record<string, unknown>): TeamMember {
  return {
    id: String(row.id),
    nameFa: String(row.name_fa ?? ''),
    nameEn: String(row.name_en ?? ''),
    roleFa: String(row.role_fa ?? ''),
    roleEn: String(row.role_en ?? ''),
    bioFa: String(row.bio_fa ?? ''),
    bioEn: String(row.bio_en ?? ''),
    avatarUrl: String(row.avatar_url ?? ''),
    sortOrder: Number(row.sort_order ?? 0),
    published: row.published === undefined ? true : Boolean(row.published),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

function mapSupabaseTicket(row: Record<string, unknown>): SupportTicket {
  return {
    id: String(row.id),
    trackingCode: String(row.tracking_code ?? ''),
    name: String(row.name ?? ''),
    email: String(row.email ?? ''),
    productId: row.product_id ? String(row.product_id) : null,
    productName: String(row.product_name ?? ''),
    subject: String(row.subject ?? ''),
    message: String(row.message ?? ''),
    status: (row.status as SupportTicket['status']) || 'open',
    adminReply: String(row.admin_reply ?? ''),
    repliedBy: row.replied_by ? String(row.replied_by) : null,
    repliedAt: row.replied_at ? String(row.replied_at) : null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

function mapSupabaseSuggestion(row: Record<string, unknown>): Suggestion {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    email: String(row.email ?? ''),
    category: (row.category as Suggestion['category']) || 'feature',
    productId: row.product_id ? String(row.product_id) : null,
    title: String(row.title ?? ''),
    details: String(row.details ?? ''),
    status: (row.status as Suggestion['status']) || 'new',
    adminNote: String(row.admin_note ?? ''),
    reviewedBy: row.reviewed_by ? String(row.reviewed_by) : null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

function mapSupabaseContact(row: Record<string, unknown>): ContactMessage {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    email: String(row.email ?? ''),
    subject: String(row.subject ?? ''),
    message: String(row.message ?? ''),
    read: Boolean(row.read),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

function mapSupabaseSettings(row: Record<string, unknown>): SiteSettings {
  return {
    id: String(row.id ?? 'default'),
    studioNameFa: String(row.studio_name_fa ?? 'استودیوی بازی‌سازی TAK1'),
    studioNameEn: String(row.studio_name_en ?? 'TAK1 Game Studio'),
    taglineFa: String(row.tagline_fa ?? ''),
    taglineEn: String(row.tagline_en ?? ''),
    contactEmail: String(row.contact_email ?? 'contact@kalametgame.ir'),
    officialDomain: String(row.official_domain ?? 'kalametgame.ir'),
    maintenanceMode: Boolean(row.maintenance_mode),
    announcementFa: String(row.announcement_fa ?? ''),
    announcementEn: String(row.announcement_en ?? ''),
    socialLinks: (row.social_links as SiteSettings['socialLinks']) ?? {},
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

function mapSupabaseAdminUser(row: Record<string, unknown>): AdminUser {
  return {
    id: String(row.id),
    authUserId: row.auth_user_id ? String(row.auth_user_id) : null,
    email: String(row.email),
    displayName: String(row.display_name ?? ''),
    role: (['super_admin', 'admin', 'editor'].includes(String(row.role))
      ? String(row.role)
      : 'admin') as AdminRole,
    isActive: row.is_active === undefined ? true : Boolean(row.is_active),
    lastLoginAt: row.last_login_at ? String(row.last_login_at) : null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

export class StudioRepository {
  get storageMode(): 'supabase' | 'unconfigured' {
    return getSupabaseEnv().missingVars.length === 0 ? 'supabase' : 'unconfigured';
  }

  async checkSupabaseStatus(): Promise<SupabaseStatus> {
    const { missingVars } = getSupabaseEnv();
    if (missingVars.length > 0) {
      return {
        configured: false,
        connected: false,
        schemaReady: false,
        missingVars,
        error: `Missing required environment variable(s): ${missingVars.join(', ')}`,
      };
    }

    try {
      const sb = getSupabaseAdminClient();
      const [productsCheck, adminsCheck, settingsCheck] = await Promise.all([
        sb.from('products').select('id', { count: 'exact', head: true }),
        sb.from('admin_users').select('id', { count: 'exact', head: true }),
        sb.from('site_settings').select('id', { count: 'exact', head: true }),
      ]);

      const firstErr = productsCheck.error || adminsCheck.error || settingsCheck.error;
      if (firstErr) {
        if (isMissingTableError(firstErr)) {
          return {
            configured: true,
            connected: true,
            schemaReady: false,
            missingVars: [],
            error: 'Connected to Supabase, but required schema tables are missing. Run supabase/schema.sql.',
          };
        }
        return {
          configured: true,
          connected: false,
          schemaReady: false,
          missingVars: [],
          error: 'Supabase rejected the query. Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
        };
      }

      return {
        configured: true,
        connected: true,
        schemaReady: true,
        missingVars: [],
      };
    } catch (err) {
      const safe = toSafeHttpError(err);
      return {
        configured: true,
        connected: false,
        schemaReady: false,
        missingVars: [],
        error: safe.message,
      };
    }
  }

  // ---- Admin Auth & RBAC ----
  async hasAnyAdmin(): Promise<boolean> {
    const sb = getSupabaseAdminClient();
    const { count, error } = await sb
      .from('admin_users')
      .select('id', { count: 'exact', head: true });
    if (error) throw toSafeHttpError(error);
    return (count ?? 0) > 0;
  }

  async findActiveAdminByAuthOrEmail(authUserId: string, email: string): Promise<AdminUser | null> {
    const sb = getSupabaseAdminClient();
    const normalizedEmail = email.trim().toLowerCase();

    const { data: byAuth, error: authErr } = await sb
      .from('admin_users')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (authErr) throw toSafeHttpError(authErr);
    if (byAuth) {
      const admin = mapSupabaseAdminUser(byAuth);
      return admin.isActive ? admin : null;
    }

    const { data: byEmail, error: emailErr } = await sb
      .from('admin_users')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (emailErr) throw toSafeHttpError(emailErr);
    if (!byEmail) return null;

    const admin = mapSupabaseAdminUser(byEmail);
    if (!admin.isActive) return null;

    if (!admin.authUserId && authUserId) {
      await sb.from('admin_users').update({ auth_user_id: authUserId }).eq('id', admin.id);
      admin.authUserId = authUserId;
    }
    return admin;
  }

  async createInitialAdmin(email: string, password: string, displayName: string): Promise<{
    admin: AdminUser;
    accessToken: string;
    refreshToken: string;
  }> {
    const sb = getSupabaseAdminClient();
    const normalizedEmail = email.trim().toLowerCase();

    const { count, error: countErr } = await sb
      .from('admin_users')
      .select('id', { count: 'exact', head: true });
    if (countErr) throw toSafeHttpError(countErr);
    if ((count ?? 0) > 0) {
      throw new HttpError(403, 'An administrator account already exists.', 'SETUP_LOCKED');
    }

    let authUserId = '';
    const { data: createdAuth, error: createAuthErr } = await sb.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName || 'Studio Owner', role: 'super_admin' },
    });

    if (createAuthErr) {
      // If user already exists in Supabase Auth, verify password via signInWithPassword before linking
      if (createAuthErr.message.toLowerCase().includes('already')) {
        const authClient = createSupabaseAuthClient();
        const { data: signInData, error: signInErr } = await authClient.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (signInErr || !signInData.user) {
          throw new HttpError(
            409,
            'This email already exists in Supabase Auth with a different password.',
            'AUTH_USER_EXISTS',
          );
        }
        authUserId = signInData.user.id;
      } else {
        throw new HttpError(400, createAuthErr.message || 'Failed to create Supabase Auth user.', 'AUTH_CREATE_FAILED');
      }
    } else {
      authUserId = createdAuth.user.id;
    }

    const { data: row, error: insertErr } = await sb
      .from('admin_users')
      .insert({
        auth_user_id: authUserId,
        email: normalizedEmail,
        display_name: displayName || 'Studio Owner',
        role: 'super_admin',
        is_active: true,
        last_login_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (insertErr || !row) throw toSafeHttpError(insertErr);

    const authClient = createSupabaseAuthClient();
    const { data: signIn, error: loginErr } = await authClient.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    if (loginErr || !signIn.session) {
      throw new HttpError(500, 'Admin account created, but automatic sign-in failed.', 'AUTH_SIGNIN_FAILED');
    }

    return {
      admin: mapSupabaseAdminUser(row),
      accessToken: signIn.session.access_token,
      refreshToken: signIn.session.refresh_token,
    };
  }

  async loginAdminWithSupabaseAuth(email: string, password: string): Promise<{
    admin: AdminUser;
    accessToken: string;
    refreshToken: string;
  }> {
    const sb = getSupabaseAdminClient();
    const authClient = createSupabaseAuthClient();
    const normalizedEmail = email.trim().toLowerCase();

    const { data: signIn, error: authErr } = await authClient.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (authErr || !signIn.user || !signIn.session) {
      throw new HttpError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    const admin = await this.findActiveAdminByAuthOrEmail(signIn.user.id, signIn.user.email || normalizedEmail);
    if (!admin) {
      throw new HttpError(403, 'This account does not have active studio admin privileges.', 'ADMIN_FORBIDDEN');
    }

    await sb
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', admin.id);

    return {
      admin,
      accessToken: signIn.session.access_token,
      refreshToken: signIn.session.refresh_token,
    };
  }

  async listAdminUsers(): Promise<AdminUser[]> {
    const sb = getSupabaseAdminClient();
    const { data, error } = await sb
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw toSafeHttpError(error);
    return (data ?? []).map(mapSupabaseAdminUser);
  }

  async createAdditionalAdmin(input: {
    email: string;
    password: string;
    displayName: string;
    role: AdminRole;
  }): Promise<AdminUser> {
    const sb = getSupabaseAdminClient();
    const normalizedEmail = input.email.trim().toLowerCase();

    const { data: authCreated, error: authErr } = await sb.auth.admin.createUser({
      email: normalizedEmail,
      password: input.password,
      email_confirm: true,
      user_metadata: { display_name: input.displayName, role: input.role },
    });

    if (authErr || !authCreated.user) {
      throw new HttpError(400, authErr?.message || 'Unable to create Supabase Auth user.', 'AUTH_CREATE_FAILED');
    }

    const { data, error } = await sb
      .from('admin_users')
      .insert({
        auth_user_id: authCreated.user.id,
        email: normalizedEmail,
        display_name: input.displayName,
        role: input.role,
        is_active: true,
      })
      .select('*')
      .single();

    if (error || !data) throw toSafeHttpError(error);
    return mapSupabaseAdminUser(data);
  }

  async updateAdminUser(
    id: string,
    patch: Partial<{ role: AdminRole; isActive: boolean; displayName: string }>,
  ): Promise<AdminUser | null> {
    const sb = getSupabaseAdminClient();
    const updateObj: Record<string, unknown> = {};
    if (patch.role !== undefined) updateObj.role = patch.role;
    if (patch.isActive !== undefined) updateObj.is_active = patch.isActive;
    if (patch.displayName !== undefined) updateObj.display_name = patch.displayName;

    const { data, error } = await sb
      .from('admin_users')
      .update(updateObj)
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw toSafeHttpError(error);
    return data ? mapSupabaseAdminUser(data) : null;
  }

  async deleteAdminUser(id: string): Promise<boolean> {
    const sb = getSupabaseAdminClient();
    const { data: existing, error: fetchErr } = await sb
      .from('admin_users')
      .select('id, auth_user_id')
      .eq('id', id)
      .maybeSingle();
    if (fetchErr) throw toSafeHttpError(fetchErr);
    if (!existing) return false;

    const { error } = await sb.from('admin_users').delete().eq('id', id);
    if (error) throw toSafeHttpError(error);

    if (existing.auth_user_id) {
      await sb.auth.admin.deleteUser(String(existing.auth_user_id)).catch(() => undefined);
    }
    return true;
  }

  // ---- Site Settings ----
  async getSiteSettings(): Promise<SiteSettings> {
    const sb = getSupabaseAdminClient();
    const { data, error } = await sb
      .from('site_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();
    if (error) throw toSafeHttpError(error);
    if (!data) {
      return mapSupabaseSettings({ id: 'default' });
    }
    return mapSupabaseSettings(data);
  }

  async updateSiteSettings(
    patch: Partial<Omit<SiteSettings, 'id' | 'updatedAt'>>,
    adminId?: string,
  ): Promise<SiteSettings> {
    const sb = getSupabaseAdminClient();
    const payload: Record<string, unknown> = { id: 'default' };
    if (patch.studioNameFa !== undefined) payload.studio_name_fa = patch.studioNameFa;
    if (patch.studioNameEn !== undefined) payload.studio_name_en = patch.studioNameEn;
    if (patch.taglineFa !== undefined) payload.tagline_fa = patch.taglineFa;
    if (patch.taglineEn !== undefined) payload.tagline_en = patch.taglineEn;
    if (patch.contactEmail !== undefined) payload.contact_email = patch.contactEmail;
    if (patch.officialDomain !== undefined) payload.official_domain = patch.officialDomain;
    if (patch.maintenanceMode !== undefined) payload.maintenance_mode = patch.maintenanceMode;
    if (patch.announcementFa !== undefined) payload.announcement_fa = patch.announcementFa;
    if (patch.announcementEn !== undefined) payload.announcement_en = patch.announcementEn;
    if (patch.socialLinks !== undefined) payload.social_links = patch.socialLinks;
    if (adminId) payload.updated_by = adminId;

    const { data, error } = await sb
      .from('site_settings')
      .upsert(payload, { onConflict: 'id' })
      .select('*')
      .single();
    if (error || !data) throw toSafeHttpError(error);
    return mapSupabaseSettings(data);
  }

  // ---- Products ----
  async listProducts(includeUnpublished = false): Promise<Product[]> {
    const sb = getSupabaseAdminClient();
    let q = sb.from('products').select('*').order('created_at', { ascending: false });
    if (!includeUnpublished) q = q.eq('published', true);
    const { data, error } = await q;
    if (error) throw toSafeHttpError(error);
    return (data ?? []).map(mapSupabaseProduct);
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const sb = getSupabaseAdminClient();
    const { data, error } = await sb
      .from('products')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle();
    if (error) throw toSafeHttpError(error);
    return data ? mapSupabaseProduct(data) : null;
  }

  async createProduct(
    input: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
    adminId?: string,
  ): Promise<Product> {
    const sb = getSupabaseAdminClient();
    const { data, error } = await sb
      .from('products')
      .insert({
        slug: input.slug,
        category: input.category,
        title_fa: input.titleFa,
        title_en: input.titleEn,
        short_desc_fa: input.shortDescFa,
        short_desc_en: input.shortDescEn,
        full_desc_fa: input.fullDescFa,
        full_desc_en: input.fullDescEn,
        version: input.version,
        release_date: input.releaseDate,
        icon_url: input.iconUrl,
        screenshots: input.screenshots,
        links: input.links,
        featured: input.featured,
        published: input.published,
        created_by: adminId ?? null,
      })
      .select('*')
      .single();
    if (error || !data) throw toSafeHttpError(error);
    return mapSupabaseProduct(data);
  }

  async updateProduct(id: string, input: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<Product | null> {
    const sb = getSupabaseAdminClient();
    const patch: Record<string, unknown> = {};
    if (input.slug !== undefined) patch.slug = input.slug;
    if (input.category !== undefined) patch.category = input.category;
    if (input.titleFa !== undefined) patch.title_fa = input.titleFa;
    if (input.titleEn !== undefined) patch.title_en = input.titleEn;
    if (input.shortDescFa !== undefined) patch.short_desc_fa = input.shortDescFa;
    if (input.shortDescEn !== undefined) patch.short_desc_en = input.shortDescEn;
    if (input.fullDescFa !== undefined) patch.full_desc_fa = input.fullDescFa;
    if (input.fullDescEn !== undefined) patch.full_desc_en = input.fullDescEn;
    if (input.version !== undefined) patch.version = input.version;
    if (input.releaseDate !== undefined) patch.release_date = input.releaseDate;
    if (input.iconUrl !== undefined) patch.icon_url = input.iconUrl;
    if (input.screenshots !== undefined) patch.screenshots = input.screenshots;
    if (input.links !== undefined) patch.links = input.links;
    if (input.featured !== undefined) patch.featured = input.featured;
    if (input.published !== undefined) patch.published = input.published;

    const { data, error } = await sb.from('products').update(patch).eq('id', id).select('*').maybeSingle();
    if (error) throw toSafeHttpError(error);
    return data ? mapSupabaseProduct(data) : null;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const sb = getSupabaseAdminClient();
    const { error } = await sb.from('products').delete().eq('id', id);
    if (error) throw toSafeHttpError(error);
    return true;
  }

  // ---- News ----
  async listNews(includeUnpublished = false): Promise<NewsPost[]> {
    const sb = getSupabaseAdminClient();
    let q = sb.from('news').select('*').order('published_at', { ascending: false });
    if (!includeUnpublished) q = q.eq('published', true);
    const { data, error } = await q;
    if (error) throw toSafeHttpError(error);
    return (data ?? []).map(mapSupabaseNews);
  }

  async createNews(input: Omit<NewsPost, 'id' | 'createdAt' | 'updatedAt'>, adminId?: string): Promise<NewsPost> {
    const sb = getSupabaseAdminClient();
    const { data, error } = await sb
      .from('news')
      .insert({
        title_fa: input.titleFa,
        title_en: input.titleEn,
        summary_fa: input.summaryFa,
        summary_en: input.summaryEn,
        content_fa: input.contentFa,
        content_en: input.contentEn,
        cover_url: input.coverUrl,
        category: input.category,
        published: input.published,
        published_at: input.publishedAt,
        author_id: adminId ?? null,
      })
      .select('*')
      .single();
    if (error || !data) throw toSafeHttpError(error);
    return mapSupabaseNews(data);
  }

  async updateNews(id: string, input: Partial<Omit<NewsPost, 'id' | 'createdAt'>>): Promise<NewsPost | null> {
    const sb = getSupabaseAdminClient();
    const patch: Record<string, unknown> = {};
    if (input.titleFa !== undefined) patch.title_fa = input.titleFa;
    if (input.titleEn !== undefined) patch.title_en = input.titleEn;
    if (input.summaryFa !== undefined) patch.summary_fa = input.summaryFa;
    if (input.summaryEn !== undefined) patch.summary_en = input.summaryEn;
    if (input.contentFa !== undefined) patch.content_fa = input.contentFa;
    if (input.contentEn !== undefined) patch.content_en = input.contentEn;
    if (input.coverUrl !== undefined) patch.cover_url = input.coverUrl;
    if (input.category !== undefined) patch.category = input.category;
    if (input.published !== undefined) patch.published = input.published;
    if (input.publishedAt !== undefined) patch.published_at = input.publishedAt;

    const { data, error } = await sb.from('news').update(patch).eq('id', id).select('*').maybeSingle();
    if (error) throw toSafeHttpError(error);
    return data ? mapSupabaseNews(data) : null;
  }

  async deleteNews(id: string): Promise<boolean> {
    const sb = getSupabaseAdminClient();
    const { error } = await sb.from('news').delete().eq('id', id);
    if (error) throw toSafeHttpError(error);
    return true;
  }

  // ---- Team ----
  async listTeam(includeUnpublished = false): Promise<TeamMember[]> {
    const sb = getSupabaseAdminClient();
    let q = sb.from('team_members').select('*').order('sort_order', { ascending: true });
    if (!includeUnpublished) q = q.eq('published', true);
    const { data, error } = await q;
    if (error) throw toSafeHttpError(error);
    return (data ?? []).map(mapSupabaseTeam);
  }

  async createTeamMember(input: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<TeamMember> {
    const sb = getSupabaseAdminClient();
    const { data, error } = await sb
      .from('team_members')
      .insert({
        name_fa: input.nameFa,
        name_en: input.nameEn,
        role_fa: input.roleFa,
        role_en: input.roleEn,
        bio_fa: input.bioFa,
        bio_en: input.bioEn,
        avatar_url: input.avatarUrl,
        sort_order: input.sortOrder,
        published: input.published,
      })
      .select('*')
      .single();
    if (error || !data) throw toSafeHttpError(error);
    return mapSupabaseTeam(data);
  }

  async updateTeamMember(
    id: string,
    input: Partial<Omit<TeamMember, 'id' | 'createdAt'>>,
  ): Promise<TeamMember | null> {
    const sb = getSupabaseAdminClient();
    const patch: Record<string, unknown> = {};
    if (input.nameFa !== undefined) patch.name_fa = input.nameFa;
    if (input.nameEn !== undefined) patch.name_en = input.nameEn;
    if (input.roleFa !== undefined) patch.role_fa = input.roleFa;
    if (input.roleEn !== undefined) patch.role_en = input.roleEn;
    if (input.bioFa !== undefined) patch.bio_fa = input.bioFa;
    if (input.bioEn !== undefined) patch.bio_en = input.bioEn;
    if (input.avatarUrl !== undefined) patch.avatar_url = input.avatarUrl;
    if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;
    if (input.published !== undefined) patch.published = input.published;

    const { data, error } = await sb.from('team_members').update(patch).eq('id', id).select('*').maybeSingle();
    if (error) throw toSafeHttpError(error);
    return data ? mapSupabaseTeam(data) : null;
  }

  async deleteTeamMember(id: string): Promise<boolean> {
    const sb = getSupabaseAdminClient();
    const { error } = await sb.from('team_members').delete().eq('id', id);
    if (error) throw toSafeHttpError(error);
    return true;
  }

  // ---- Support Tickets ----
  async createTicket(
    input: Pick<SupportTicket, 'name' | 'email' | 'productId' | 'productName' | 'subject' | 'message'>,
  ): Promise<SupportTicket> {
    const sb = getSupabaseAdminClient();
    const trackingCode = `TAK1-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const { data, error } = await sb
      .from('support_tickets')
      .insert({
        tracking_code: trackingCode,
        name: input.name,
        email: input.email,
        product_id: input.productId || null,
        product_name: input.productName,
        subject: input.subject,
        message: input.message,
        status: 'open',
        admin_reply: '',
      })
      .select('*')
      .single();
    if (error || !data) throw toSafeHttpError(error);
    return mapSupabaseTicket(data);
  }

  async findTicketByTrackingCode(code: string): Promise<SupportTicket | null> {
    const sb = getSupabaseAdminClient();
    const normalized = code.trim().toUpperCase();
    const { data, error } = await sb
      .from('support_tickets')
      .select('*')
      .eq('tracking_code', normalized)
      .maybeSingle();
    if (error) throw toSafeHttpError(error);
    return data ? mapSupabaseTicket(data) : null;
  }

  async listTickets(): Promise<SupportTicket[]> {
    const sb = getSupabaseAdminClient();
    const { data, error } = await sb
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw toSafeHttpError(error);
    return (data ?? []).map(mapSupabaseTicket);
  }

  async updateTicket(
    id: string,
    patch: Partial<Pick<SupportTicket, 'status' | 'adminReply'>>,
    adminId?: string,
  ): Promise<SupportTicket | null> {
    const sb = getSupabaseAdminClient();
    const updateObj: Record<string, unknown> = {};
    if (patch.status !== undefined) updateObj.status = patch.status;
    if (patch.adminReply !== undefined) {
      updateObj.admin_reply = patch.adminReply;
      updateObj.replied_at = new Date().toISOString();
      if (adminId) updateObj.replied_by = adminId;
    }

    const { data, error } = await sb
      .from('support_tickets')
      .update(updateObj)
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw toSafeHttpError(error);
    return data ? mapSupabaseTicket(data) : null;
  }

  // ---- Suggestions ----
  async createSuggestion(
    input: Pick<Suggestion, 'name' | 'email' | 'category' | 'productId' | 'title' | 'details'>,
  ): Promise<Suggestion> {
    const sb = getSupabaseAdminClient();
    const { data, error } = await sb
      .from('suggestions')
      .insert({
        name: input.name,
        email: input.email,
        category: input.category,
        product_id: input.productId || null,
        title: input.title,
        details: input.details,
        status: 'new',
        admin_note: '',
      })
      .select('*')
      .single();
    if (error || !data) throw toSafeHttpError(error);
    return mapSupabaseSuggestion(data);
  }

  async listSuggestions(): Promise<Suggestion[]> {
    const sb = getSupabaseAdminClient();
    const { data, error } = await sb
      .from('suggestions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw toSafeHttpError(error);
    return (data ?? []).map(mapSupabaseSuggestion);
  }

  async updateSuggestion(
    id: string,
    patch: Partial<Pick<Suggestion, 'status' | 'adminNote'>>,
    adminId?: string,
  ): Promise<Suggestion | null> {
    const sb = getSupabaseAdminClient();
    const updateObj: Record<string, unknown> = {};
    if (patch.status !== undefined) updateObj.status = patch.status;
    if (patch.adminNote !== undefined) updateObj.admin_note = patch.adminNote;
    if (adminId) updateObj.reviewed_by = adminId;

    const { data, error } = await sb
      .from('suggestions')
      .update(updateObj)
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw toSafeHttpError(error);
    return data ? mapSupabaseSuggestion(data) : null;
  }

  async deleteSuggestion(id: string): Promise<boolean> {
    const sb = getSupabaseAdminClient();
    const { error } = await sb.from('suggestions').delete().eq('id', id);
    if (error) throw toSafeHttpError(error);
    return true;
  }

  // ---- Contact Messages ----
  async createContactMessage(
    input: Pick<ContactMessage, 'name' | 'email' | 'subject' | 'message'>,
  ): Promise<ContactMessage> {
    const sb = getSupabaseAdminClient();
    const { data, error } = await sb
      .from('contact_messages')
      .insert({
        name: input.name,
        email: input.email,
        subject: input.subject,
        message: input.message,
        read: false,
      })
      .select('*')
      .single();
    if (error || !data) throw toSafeHttpError(error);
    return mapSupabaseContact(data);
  }

  async listContactMessages(): Promise<ContactMessage[]> {
    const sb = getSupabaseAdminClient();
    const { data, error } = await sb
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw toSafeHttpError(error);
    return (data ?? []).map(mapSupabaseContact);
  }

  async markContactMessageRead(id: string, read: boolean): Promise<ContactMessage | null> {
    const sb = getSupabaseAdminClient();
    const { data, error } = await sb
      .from('contact_messages')
      .update({ read })
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw toSafeHttpError(error);
    return data ? mapSupabaseContact(data) : null;
  }

  async deleteContactMessage(id: string): Promise<boolean> {
    const sb = getSupabaseAdminClient();
    const { error } = await sb.from('contact_messages').delete().eq('id', id);
    if (error) throw toSafeHttpError(error);
    return true;
  }

  // ---- Media Upload to Supabase Storage ----
  async uploadMediaToStorage(dataUrl: string, folder = 'general'): Promise<{ url: string }> {
    const match = /^data:(image\/(?:png|jpeg|jpg|webp|gif|svg\+xml));base64,([A-Za-z0-9+/=]+)$/i.exec(
      dataUrl.trim(),
    );
    if (!match) {
      throw new HttpError(400, 'Invalid image format. Supported: PNG, JPG, WEBP, GIF, SVG.', 'INVALID_MEDIA');
    }

    const mimeType = match[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : match[1].toLowerCase();
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > 5 * 1024 * 1024) {
      throw new HttpError(400, 'Image size must be 5MB or less.', 'MEDIA_TOO_LARGE');
    }

    const extMap: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/svg+xml': 'svg',
    };
    const ext = extMap[mimeType] || 'png';
    const safeFolder = folder.replace(/[^a-z0-9_-]/gi, '') || 'general';
    const filePath = `${safeFolder}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;

    const sb = getSupabaseAdminClient();
    const { error: uploadErr } = await sb.storage
      .from('studio-media')
      .upload(filePath, buffer, { contentType: mimeType, upsert: false });

    if (uploadErr) {
      throw new HttpError(
        503,
        'Failed to upload image to Supabase Storage bucket "studio-media". Ensure supabase/schema.sql has been executed.',
        'STORAGE_UPLOAD_FAILED',
      );
    }

    const { data } = sb.storage.from('studio-media').getPublicUrl(filePath);
    return { url: data.publicUrl };
  }

  // ---- Overview Metrics ----
  async getOverviewStats(): Promise<AdminOverviewStats> {
    const [products, news, team, tickets, suggestions, messages, admins] = await Promise.all([
      this.listProducts(true),
      this.listNews(true),
      this.listTeam(true),
      this.listTickets(),
      this.listSuggestions(),
      this.listContactMessages(),
      this.listAdminUsers(),
    ]);
    return {
      totalProducts: products.length,
      publishedProducts: products.filter((p) => p.published).length,
      totalNews: news.length,
      publishedNews: news.filter((n) => n.published).length,
      totalTeamMembers: team.length,
      publishedTeamMembers: team.filter((m) => m.published).length,
      openTickets: tickets.filter((t) => t.status !== 'resolved').length,
      totalTickets: tickets.length,
      pendingSuggestions: suggestions.filter((s) => s.status === 'new').length,
      totalSuggestions: suggestions.length,
      unreadMessages: messages.filter((m) => !m.read).length,
      totalMessages: messages.length,
      totalAdmins: admins.length,
      storageMode: this.storageMode,
    };
  }
}

export const repo = new StudioRepository();
