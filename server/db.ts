import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  AdminOverviewStats,
  ContactMessage,
  NewsPost,
  Product,
  Suggestion,
  SupportTicket,
  TeamMember,
} from '../src/types/studio.ts';

interface AdminUserRecord {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

interface LocalDatabaseSchema {
  products: Product[];
  news: NewsPost[];
  teamMembers: TeamMember[];
  supportTickets: SupportTicket[];
  suggestions: Suggestion[];
  contactMessages: ContactMessage[];
  adminUsers: AdminUserRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'tak1-studio-db.json');

const EMPTY_DB: LocalDatabaseSchema = {
  products: [],
  news: [],
  teamMembers: [],
  supportTickets: [],
  suggestions: [],
  contactMessages: [],
  adminUsers: [],
};

function ensureLocalStore(): LocalDatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(EMPTY_DB, null, 2), 'utf8');
    return structuredClone(EMPTY_DB);
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<LocalDatabaseSchema>;
    return {
      products: Array.isArray(parsed.products) ? parsed.products : [],
      news: Array.isArray(parsed.news) ? parsed.news : [],
      teamMembers: Array.isArray(parsed.teamMembers) ? parsed.teamMembers : [],
      supportTickets: Array.isArray(parsed.supportTickets) ? parsed.supportTickets : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      contactMessages: Array.isArray(parsed.contactMessages) ? parsed.contactMessages : [],
      adminUsers: Array.isArray(parsed.adminUsers) ? parsed.adminUsers : [],
    };
  } catch {
    return structuredClone(EMPTY_DB);
  }
}

function saveLocalStore(db: LocalDatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpFile = `${DB_FILE}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmpFile, DB_FILE);
}

function getSupabaseAdminClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
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
    publishedAt: String(row.published_at ?? new Date().toISOString()),
    createdAt: String(row.created_at ?? new Date().toISOString()),
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
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapSupabaseTicket(row: Record<string, unknown>): SupportTicket {
  return {
    id: String(row.id),
    trackingCode: String(row.tracking_code ?? ''),
    name: String(row.name ?? ''),
    email: String(row.email ?? ''),
    productName: String(row.product_name ?? ''),
    subject: String(row.subject ?? ''),
    message: String(row.message ?? ''),
    status: (row.status as SupportTicket['status']) || 'open',
    adminReply: String(row.admin_reply ?? ''),
    repliedAt: row.replied_at ? String(row.replied_at) : null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapSupabaseSuggestion(row: Record<string, unknown>): Suggestion {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    email: String(row.email ?? ''),
    category: (row.category as Suggestion['category']) || 'feature',
    title: String(row.title ?? ''),
    details: String(row.details ?? ''),
    status: (row.status as Suggestion['status']) || 'new',
    adminNote: String(row.admin_note ?? ''),
    createdAt: String(row.created_at ?? new Date().toISOString()),
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
  };
}

export class StudioRepository {
  get storageMode(): 'supabase' | 'local' {
    return getSupabaseAdminClient() ? 'supabase' : 'local';
  }

  // ---- Admin Auth Records ----
  async hasAnyAdmin(): Promise<boolean> {
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      return true;
    }
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { count } = await sb.from('admin_users').select('*', { count: 'exact', head: true });
      return (count ?? 0) > 0;
    }
    const db = ensureLocalStore();
    return db.adminUsers.length > 0;
  }

  async findAdminByEmail(email: string): Promise<AdminUserRecord | null> {
    const normalized = email.trim().toLowerCase();
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { data } = await sb
        .from('admin_users')
        .select('*')
        .eq('email', normalized)
        .maybeSingle();
      if (!data) return null;
      return {
        id: String(data.id),
        email: String(data.email),
        passwordHash: String(data.password_hash),
        createdAt: String(data.created_at),
      };
    }
    const db = ensureLocalStore();
    return db.adminUsers.find((u) => u.email.toLowerCase() === normalized) ?? null;
  }

  async createAdmin(email: string, passwordHash: string): Promise<AdminUserRecord> {
    const normalized = email.trim().toLowerCase();
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { data, error } = await sb
        .from('admin_users')
        .insert({ email: normalized, password_hash: passwordHash })
        .select('*')
        .single();
      if (error || !data) throw new Error(error?.message || 'Failed to create admin user');
      return {
        id: String(data.id),
        email: String(data.email),
        passwordHash: String(data.password_hash),
        createdAt: String(data.created_at),
      };
    }
    const db = ensureLocalStore();
    const record: AdminUserRecord = {
      id: crypto.randomUUID(),
      email: normalized,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    db.adminUsers.push(record);
    saveLocalStore(db);
    return record;
  }

  // ---- Products ----
  async listProducts(includeUnpublished = false): Promise<Product[]> {
    const sb = getSupabaseAdminClient();
    if (sb) {
      let q = sb.from('products').select('*').order('created_at', { ascending: false });
      if (!includeUnpublished) q = q.eq('published', true);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return (data ?? []).map(mapSupabaseProduct);
    }
    const db = ensureLocalStore();
    return db.products
      .filter((p) => (includeUnpublished ? true : p.published))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { data } = await sb
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .maybeSingle();
      return data ? mapSupabaseProduct(data) : null;
    }
    const db = ensureLocalStore();
    return db.products.find((p) => p.slug === slug && p.published) ?? null;
  }

  async createProduct(input: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const now = new Date().toISOString();
    const sb = getSupabaseAdminClient();
    if (sb) {
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
        })
        .select('*')
        .single();
      if (error || !data) throw new Error(error?.message || 'Failed to create product');
      return mapSupabaseProduct(data);
    }
    const db = ensureLocalStore();
    if (db.products.some((p) => p.slug === input.slug)) {
      throw new Error('Slug already exists');
    }
    const product: Product = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    db.products.unshift(product);
    saveLocalStore(db);
    return product;
  }

  async updateProduct(id: string, input: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<Product | null> {
    const now = new Date().toISOString();
    const sb = getSupabaseAdminClient();
    if (sb) {
      const patch: Record<string, unknown> = { updated_at: now };
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
      if (error) throw new Error(error.message);
      return data ? mapSupabaseProduct(data) : null;
    }
    const db = ensureLocalStore();
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const updated: Product = {
      ...db.products[idx],
      ...input,
      updatedAt: now,
    };
    db.products[idx] = updated;
    saveLocalStore(db);
    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { error } = await sb.from('products').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return true;
    }
    const db = ensureLocalStore();
    const prevLen = db.products.length;
    db.products = db.products.filter((p) => p.id !== id);
    saveLocalStore(db);
    return db.products.length < prevLen;
  }

  // ---- News ----
  async listNews(): Promise<NewsPost[]> {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { data, error } = await sb.from('news').select('*').order('published_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map(mapSupabaseNews);
    }
    const db = ensureLocalStore();
    return [...db.news].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }

  async createNews(input: Omit<NewsPost, 'id' | 'createdAt'>): Promise<NewsPost> {
    const sb = getSupabaseAdminClient();
    if (sb) {
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
          published_at: input.publishedAt,
        })
        .select('*')
        .single();
      if (error || !data) throw new Error(error?.message || 'Failed to create news');
      return mapSupabaseNews(data);
    }
    const db = ensureLocalStore();
    const item: NewsPost = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    db.news.unshift(item);
    saveLocalStore(db);
    return item;
  }

  async updateNews(id: string, input: Partial<Omit<NewsPost, 'id' | 'createdAt'>>): Promise<NewsPost | null> {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const patch: Record<string, unknown> = {};
      if (input.titleFa !== undefined) patch.title_fa = input.titleFa;
      if (input.titleEn !== undefined) patch.title_en = input.titleEn;
      if (input.summaryFa !== undefined) patch.summary_fa = input.summaryFa;
      if (input.summaryEn !== undefined) patch.summary_en = input.summaryEn;
      if (input.contentFa !== undefined) patch.content_fa = input.contentFa;
      if (input.contentEn !== undefined) patch.content_en = input.contentEn;
      if (input.coverUrl !== undefined) patch.cover_url = input.coverUrl;
      if (input.category !== undefined) patch.category = input.category;
      if (input.publishedAt !== undefined) patch.published_at = input.publishedAt;
      const { data, error } = await sb.from('news').update(patch).eq('id', id).select('*').maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapSupabaseNews(data) : null;
    }
    const db = ensureLocalStore();
    const idx = db.news.findIndex((n) => n.id === id);
    if (idx === -1) return null;
    db.news[idx] = { ...db.news[idx], ...input };
    saveLocalStore(db);
    return db.news[idx];
  }

  async deleteNews(id: string): Promise<boolean> {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { error } = await sb.from('news').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return true;
    }
    const db = ensureLocalStore();
    const prev = db.news.length;
    db.news = db.news.filter((n) => n.id !== id);
    saveLocalStore(db);
    return db.news.length < prev;
  }

  // ---- Team ----
  async listTeam(): Promise<TeamMember[]> {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { data, error } = await sb.from('team_members').select('*').order('sort_order', { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []).map(mapSupabaseTeam);
    }
    const db = ensureLocalStore();
    return [...db.teamMembers].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async createTeamMember(input: Omit<TeamMember, 'id' | 'createdAt'>): Promise<TeamMember> {
    const sb = getSupabaseAdminClient();
    if (sb) {
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
        })
        .select('*')
        .single();
      if (error || !data) throw new Error(error?.message || 'Failed to add team member');
      return mapSupabaseTeam(data);
    }
    const db = ensureLocalStore();
    const member: TeamMember = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    db.teamMembers.push(member);
    saveLocalStore(db);
    return member;
  }

  async updateTeamMember(id: string, input: Partial<Omit<TeamMember, 'id' | 'createdAt'>>): Promise<TeamMember | null> {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const patch: Record<string, unknown> = {};
      if (input.nameFa !== undefined) patch.name_fa = input.nameFa;
      if (input.nameEn !== undefined) patch.name_en = input.nameEn;
      if (input.roleFa !== undefined) patch.role_fa = input.roleFa;
      if (input.roleEn !== undefined) patch.role_en = input.roleEn;
      if (input.bioFa !== undefined) patch.bio_fa = input.bioFa;
      if (input.bioEn !== undefined) patch.bio_en = input.bioEn;
      if (input.avatarUrl !== undefined) patch.avatar_url = input.avatarUrl;
      if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;
      const { data, error } = await sb.from('team_members').update(patch).eq('id', id).select('*').maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapSupabaseTeam(data) : null;
    }
    const db = ensureLocalStore();
    const idx = db.teamMembers.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    db.teamMembers[idx] = { ...db.teamMembers[idx], ...input };
    saveLocalStore(db);
    return db.teamMembers[idx];
  }

  async deleteTeamMember(id: string): Promise<boolean> {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { error } = await sb.from('team_members').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return true;
    }
    const db = ensureLocalStore();
    const prev = db.teamMembers.length;
    db.teamMembers = db.teamMembers.filter((m) => m.id !== id);
    saveLocalStore(db);
    return db.teamMembers.length < prev;
  }

  // ---- Support Tickets ----
  async createTicket(input: Pick<SupportTicket, 'name' | 'email' | 'productName' | 'subject' | 'message'>): Promise<SupportTicket> {
    const trackingCode = `TAK1-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { data, error } = await sb
        .from('support_tickets')
        .insert({
          tracking_code: trackingCode,
          name: input.name,
          email: input.email,
          product_name: input.productName,
          subject: input.subject,
          message: input.message,
          status: 'open',
          admin_reply: '',
        })
        .select('*')
        .single();
      if (error || !data) throw new Error(error?.message || 'Failed to create ticket');
      return mapSupabaseTicket(data);
    }
    const db = ensureLocalStore();
    const ticket: SupportTicket = {
      id: crypto.randomUUID(),
      trackingCode,
      name: input.name,
      email: input.email,
      productName: input.productName,
      subject: input.subject,
      message: input.message,
      status: 'open',
      adminReply: '',
      repliedAt: null,
      createdAt: new Date().toISOString(),
    };
    db.supportTickets.unshift(ticket);
    saveLocalStore(db);
    return ticket;
  }

  async findTicketByTrackingCode(code: string): Promise<SupportTicket | null> {
    const normalized = code.trim().toUpperCase();
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { data } = await sb
        .from('support_tickets')
        .select('*')
        .eq('tracking_code', normalized)
        .maybeSingle();
      return data ? mapSupabaseTicket(data) : null;
    }
    const db = ensureLocalStore();
    return db.supportTickets.find((t) => t.trackingCode.toUpperCase() === normalized) ?? null;
  }

  async listTickets(): Promise<SupportTicket[]> {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { data, error } = await sb.from('support_tickets').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map(mapSupabaseTicket);
    }
    const db = ensureLocalStore();
    return [...db.supportTickets].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async updateTicket(
    id: string,
    patch: Partial<Pick<SupportTicket, 'status' | 'adminReply'>>,
  ): Promise<SupportTicket | null> {
    const repliedAt = patch.adminReply !== undefined ? new Date().toISOString() : undefined;
    const sb = getSupabaseAdminClient();
    if (sb) {
      const updateObj: Record<string, unknown> = {};
      if (patch.status !== undefined) updateObj.status = patch.status;
      if (patch.adminReply !== undefined) {
        updateObj.admin_reply = patch.adminReply;
        updateObj.replied_at = repliedAt;
      }
      const { data, error } = await sb
        .from('support_tickets')
        .update(updateObj)
        .eq('id', id)
        .select('*')
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapSupabaseTicket(data) : null;
    }
    const db = ensureLocalStore();
    const idx = db.supportTickets.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    db.supportTickets[idx] = {
      ...db.supportTickets[idx],
      ...patch,
      repliedAt: repliedAt ?? db.supportTickets[idx].repliedAt,
    };
    saveLocalStore(db);
    return db.supportTickets[idx];
  }

  // ---- Suggestions ----
  async createSuggestion(input: Pick<Suggestion, 'name' | 'email' | 'category' | 'title' | 'details'>): Promise<Suggestion> {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { data, error } = await sb
        .from('suggestions')
        .insert({
          name: input.name,
          email: input.email,
          category: input.category,
          title: input.title,
          details: input.details,
          status: 'new',
          admin_note: '',
        })
        .select('*')
        .single();
      if (error || !data) throw new Error(error?.message || 'Failed to save suggestion');
      return mapSupabaseSuggestion(data);
    }
    const db = ensureLocalStore();
    const item: Suggestion = {
      id: crypto.randomUUID(),
      name: input.name,
      email: input.email,
      category: input.category,
      title: input.title,
      details: input.details,
      status: 'new',
      adminNote: '',
      createdAt: new Date().toISOString(),
    };
    db.suggestions.unshift(item);
    saveLocalStore(db);
    return item;
  }

  async listSuggestions(): Promise<Suggestion[]> {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { data, error } = await sb.from('suggestions').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map(mapSupabaseSuggestion);
    }
    const db = ensureLocalStore();
    return [...db.suggestions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async updateSuggestion(
    id: string,
    patch: Partial<Pick<Suggestion, 'status' | 'adminNote'>>,
  ): Promise<Suggestion | null> {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const updateObj: Record<string, unknown> = {};
      if (patch.status !== undefined) updateObj.status = patch.status;
      if (patch.adminNote !== undefined) updateObj.admin_note = patch.adminNote;
      const { data, error } = await sb
        .from('suggestions')
        .update(updateObj)
        .eq('id', id)
        .select('*')
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapSupabaseSuggestion(data) : null;
    }
    const db = ensureLocalStore();
    const idx = db.suggestions.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    db.suggestions[idx] = { ...db.suggestions[idx], ...patch };
    saveLocalStore(db);
    return db.suggestions[idx];
  }

  async deleteSuggestion(id: string): Promise<boolean> {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { error } = await sb.from('suggestions').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return true;
    }
    const db = ensureLocalStore();
    const prev = db.suggestions.length;
    db.suggestions = db.suggestions.filter((s) => s.id !== id);
    saveLocalStore(db);
    return db.suggestions.length < prev;
  }

  // ---- Contact Messages ----
  async createContactMessage(input: Pick<ContactMessage, 'name' | 'email' | 'subject' | 'message'>): Promise<ContactMessage> {
    const sb = getSupabaseAdminClient();
    if (sb) {
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
      if (error || !data) throw new Error(error?.message || 'Failed to save message');
      return mapSupabaseContact(data);
    }
    const db = ensureLocalStore();
    const msg: ContactMessage = {
      id: crypto.randomUUID(),
      name: input.name,
      email: input.email,
      subject: input.subject,
      message: input.message,
      read: false,
      createdAt: new Date().toISOString(),
    };
    db.contactMessages.unshift(msg);
    saveLocalStore(db);
    return msg;
  }

  async listContactMessages(): Promise<ContactMessage[]> {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { data, error } = await sb
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map(mapSupabaseContact);
    }
    const db = ensureLocalStore();
    return [...db.contactMessages].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async markContactMessageRead(id: string, read: boolean): Promise<ContactMessage | null> {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { data, error } = await sb
        .from('contact_messages')
        .update({ read })
        .eq('id', id)
        .select('*')
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapSupabaseContact(data) : null;
    }
    const db = ensureLocalStore();
    const idx = db.contactMessages.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    db.contactMessages[idx].read = read;
    saveLocalStore(db);
    return db.contactMessages[idx];
  }

  async deleteContactMessage(id: string): Promise<boolean> {
    const sb = getSupabaseAdminClient();
    if (sb) {
      const { error } = await sb.from('contact_messages').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return true;
    }
    const db = ensureLocalStore();
    const prev = db.contactMessages.length;
    db.contactMessages = db.contactMessages.filter((m) => m.id !== id);
    saveLocalStore(db);
    return db.contactMessages.length < prev;
  }

  // ---- Overview Metrics ----
  async getOverviewStats(): Promise<AdminOverviewStats> {
    const [products, news, team, tickets, suggestions, messages] = await Promise.all([
      this.listProducts(true),
      this.listNews(),
      this.listTeam(),
      this.listTickets(),
      this.listSuggestions(),
      this.listContactMessages(),
    ]);
    return {
      totalProducts: products.length,
      publishedProducts: products.filter((p) => p.published).length,
      totalNews: news.length,
      totalTeamMembers: team.length,
      openTickets: tickets.filter((t) => t.status !== 'resolved').length,
      totalTickets: tickets.length,
      pendingSuggestions: suggestions.filter((s) => s.status === 'new').length,
      totalSuggestions: suggestions.length,
      unreadMessages: messages.filter((m) => !m.read).length,
      totalMessages: messages.length,
      storageMode: this.storageMode,
    };
  }
}

export const repo = new StudioRepository();
