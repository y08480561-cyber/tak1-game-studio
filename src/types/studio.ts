export type Language = 'fa' | 'en';

export type ProductCategory = 'game' | 'app' | 'tool';

export type AdminRole = 'super_admin' | 'admin' | 'editor';

export interface ProductStoreLinks {
  myket?: string;
  bazaar?: string;
  googlePlay?: string;
  direct?: string;
}

export interface Product {
  id: string;
  slug: string;
  category: ProductCategory;
  titleFa: string;
  titleEn: string;
  shortDescFa: string;
  shortDescEn: string;
  fullDescFa: string;
  fullDescEn: string;
  version: string;
  releaseDate: string;
  iconUrl: string;
  screenshots: string[];
  links: ProductStoreLinks;
  featured: boolean;
  published: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewsPost {
  id: string;
  titleFa: string;
  titleEn: string;
  summaryFa: string;
  summaryEn: string;
  contentFa: string;
  contentEn: string;
  coverUrl: string;
  category: 'release' | 'studio' | 'update' | 'event';
  published: boolean;
  publishedAt: string;
  authorId?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface TeamMember {
  id: string;
  nameFa: string;
  nameEn: string;
  roleFa: string;
  roleEn: string;
  bioFa: string;
  bioEn: string;
  avatarUrl: string;
  sortOrder: number;
  published: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type TicketStatus = 'open' | 'in_progress' | 'resolved';

export interface SupportTicket {
  id: string;
  trackingCode: string;
  name: string;
  email: string;
  productId?: string | null;
  productName: string;
  subject: string;
  message: string;
  status: TicketStatus;
  adminReply: string;
  repliedBy?: string | null;
  repliedAt: string | null;
  createdAt: string;
  updatedAt?: string;
}

export type SuggestionStatus = 'new' | 'reviewed' | 'planned' | 'archived';

export interface Suggestion {
  id: string;
  name: string;
  email: string;
  category: 'feature' | 'game_idea' | 'improvement' | 'other';
  productId?: string | null;
  title: string;
  details: string;
  status: SuggestionStatus;
  adminNote: string;
  reviewedBy?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface SiteSocialLinks {
  telegram?: string;
  instagram?: string;
  discord?: string;
  github?: string;
  website?: string;
}

export interface SiteSettings {
  id: string;
  studioNameFa: string;
  studioNameEn: string;
  taglineFa: string;
  taglineEn: string;
  contactEmail: string;
  officialDomain: string;
  maintenanceMode: boolean;
  announcementFa: string;
  announcementEn: string;
  socialLinks: SiteSocialLinks;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  authUserId: string | null;
  email: string;
  displayName: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupabaseStatus {
  configured: boolean;
  connected: boolean;
  schemaReady: boolean;
  missingVars: string[];
  error?: string;
}

export interface AdminOverviewStats {
  totalProducts: number;
  publishedProducts: number;
  totalNews: number;
  publishedNews: number;
  totalTeamMembers: number;
  publishedTeamMembers: number;
  openTickets: number;
  totalTickets: number;
  pendingSuggestions: number;
  totalSuggestions: number;
  unreadMessages: number;
  totalMessages: number;
  totalAdmins: number;
  storageMode: 'supabase' | 'unconfigured';
}

export interface AdminSessionStatus {
  authenticated: boolean;
  adminId: string | null;
  adminEmail: string | null;
  adminName: string | null;
  adminRole: AdminRole | null;
  needsSetup: boolean;
  storageMode: 'supabase' | 'unconfigured';
  supabaseStatus: SupabaseStatus;
}
