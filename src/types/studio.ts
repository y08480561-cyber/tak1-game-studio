export type Language = 'fa' | 'en';

export type ProductCategory = 'game' | 'app' | 'tool';

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
  publishedAt: string;
  createdAt: string;
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
  createdAt: string;
}

export type TicketStatus = 'open' | 'in_progress' | 'resolved';

export interface SupportTicket {
  id: string;
  trackingCode: string;
  name: string;
  email: string;
  productName: string;
  subject: string;
  message: string;
  status: TicketStatus;
  adminReply: string;
  repliedAt: string | null;
  createdAt: string;
}

export type SuggestionStatus = 'new' | 'reviewed' | 'planned' | 'archived';

export interface Suggestion {
  id: string;
  name: string;
  email: string;
  category: 'feature' | 'game_idea' | 'improvement' | 'other';
  title: string;
  details: string;
  status: SuggestionStatus;
  adminNote: string;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AdminOverviewStats {
  totalProducts: number;
  publishedProducts: number;
  totalNews: number;
  totalTeamMembers: number;
  openTickets: number;
  totalTickets: number;
  pendingSuggestions: number;
  totalSuggestions: number;
  unreadMessages: number;
  totalMessages: number;
  storageMode: 'supabase' | 'local';
}

export interface AdminSessionStatus {
  authenticated: boolean;
  adminEmail: string | null;
  needsSetup: boolean;
  storageMode: 'supabase' | 'local';
}
