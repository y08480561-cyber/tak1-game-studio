import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Check,
  Database,
  Eye,
  EyeOff,
  Gamepad2,
  Globe,
  Image as ImageIcon,
  Inbox,
  LifeBuoy,
  LogOut,
  MessageSquarePlus,
  Newspaper,
  Pencil,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  UserCog,
  Users,
} from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import type {
  AdminOverviewStats,
  AdminRole,
  AdminSessionStatus,
  AdminUser,
  ContactMessage,
  NewsPost,
  Product,
  ProductCategory,
  SiteSettings,
  StorageMediaItem,
  Suggestion,
  SuggestionStatus,
  SupportTicket,
  TeamMember,
  TicketStatus,
} from '../types/studio';
import { SafeMedia } from '../components/SafeMedia';

type AdminTab =
  | 'overview'
  | 'products'
  | 'news'
  | 'team'
  | 'media'
  | 'tickets'
  | 'suggestions'
  | 'messages'
  | 'settings'
  | 'admins';

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

export function AdminPage() {
  const { lang, t, refreshPublicData } = useStudio();
  const isFa = lang === 'fa';

  const [session, setSession] = useState<AdminSessionStatus | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authDisplayName, setAuthDisplayName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [overview, setOverview] = useState<AdminOverviewStats | null>(null);
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [adminNews, setAdminNews] = useState<NewsPost[]>([]);
  const [adminTeam, setAdminTeam] = useState<TeamMember[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [mediaItems, setMediaItems] = useState<StorageMediaItem[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingNews, setSavingNews] = useState(false);
  const [savingTeam, setSavingTeam] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [deletingMediaPath, setDeletingMediaPath] = useState<string | null>(null);

  // Search & Filter states across tabs
  const [prodQuery, setProdQuery] = useState('');
  const [prodCatFilter, setProdCatFilter] = useState<'all' | ProductCategory>('all');
  const [prodPubFilter, setProdPubFilter] = useState<'all' | 'published' | 'draft'>('all');

  const [newsQuery, setNewsQuery] = useState('');
  const [newsPubFilter, setNewsPubFilter] = useState<'all' | 'published' | 'draft'>('all');

  const [teamQuery, setTeamQuery] = useState('');
  const [teamPubFilter, setTeamPubFilter] = useState<'all' | 'published' | 'draft'>('all');

  const [ticketQuery, setTicketQuery] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | TicketStatus>('all');

  const [sugQuery, setSugQuery] = useState('');
  const [sugStatusFilter, setSugStatusFilter] = useState<'all' | SuggestionStatus>('all');

  const [msgQuery, setMsgQuery] = useState('');
  const [msgReadFilter, setMsgReadFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Product Form State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [pTitleFa, setPTitleFa] = useState('');
  const [pTitleEn, setPTitleEn] = useState('');
  const [pSlug, setPSlug] = useState('');
  const [pCategory, setPCategory] = useState<ProductCategory>('game');
  const [pVersion, setPVersion] = useState('1.0.0');
  const [pReleaseDate, setPReleaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [pShortFa, setPShortFa] = useState('');
  const [pShortEn, setPShortEn] = useState('');
  const [pFullFa, setPFullFa] = useState('');
  const [pFullEn, setPFullEn] = useState('');
  const [pIconUrl, setPIconUrl] = useState('');
  const [pScreenshots, setPScreenshots] = useState<string[]>([]);
  const [pShotInput, setPShotInput] = useState('');
  const [pMyket, setPMyket] = useState('');
  const [pBazaar, setPBazaar] = useState('');
  const [pGooglePlay, setPGooglePlay] = useState('');
  const [pDirect, setPDirect] = useState('');
  const [pFeatured, setPFeatured] = useState(false);
  const [pPublished, setPPublished] = useState(true);

  // News Form State
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [nTitleFa, setNTitleFa] = useState('');
  const [nTitleEn, setNTitleEn] = useState('');
  const [nCategory, setNCategory] = useState<NewsPost['category']>('studio');
  const [nSummaryFa, setNSummaryFa] = useState('');
  const [nSummaryEn, setNSummaryEn] = useState('');
  const [nContentFa, setNContentFa] = useState('');
  const [nContentEn, setNContentEn] = useState('');
  const [nCoverUrl, setNCoverUrl] = useState('');
  const [nPublished, setNPublished] = useState(true);

  // Team Form State
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [mNameFa, setMNameFa] = useState('');
  const [mNameEn, setMNameEn] = useState('');
  const [mRoleFa, setMRoleFa] = useState('');
  const [mRoleEn, setMRoleEn] = useState('');
  const [mBioFa, setMBioFa] = useState('');
  const [mBioEn, setMBioEn] = useState('');
  const [mAvatarUrl, setMAvatarUrl] = useState('');
  const [mSortOrder, setMSortOrder] = useState(0);
  const [mPublished, setMPublished] = useState(true);

  // Ticket & Suggestion Drafts
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [suggestionNotes, setSuggestionNotes] = useState<Record<string, string>>({});

  // Site Settings Form State
  const [sNameFa, setSNameFa] = useState('');
  const [sNameEn, setSNameEn] = useState('');
  const [sTaglineFa, setSTaglineFa] = useState('');
  const [sTaglineEn, setSTaglineEn] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sDomain, setSDomain] = useState('');
  const [sAnnFa, setSAnnFa] = useState('');
  const [sAnnEn, setSAnnEn] = useState('');
  const [sMaint, setSMaint] = useState(false);
  const [sTelegram, setSTelegram] = useState('');
  const [sInstagram, setSInstagram] = useState('');
  const [sDiscord, setSDiscord] = useState('');
  const [sGithub, setSGithub] = useState('');

  // New Admin Form State
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<AdminRole>('editor');

  const flash = (msg: string) => {
    setErrorBanner(null);
    setFeedbackBanner(msg);
    setTimeout(() => setFeedbackBanner(null), 4000);
  };

  const flashError = (msg: string) => {
    setFeedbackBanner(null);
    setErrorBanner(msg);
  };

  const loadSession = useCallback(async () => {
    setLoadingSession(true);
    try {
      const res = await fetch('/api/admin/session');
      const json = (await res.json()) as AdminSessionStatus;
      setSession(json);
    } catch {
      setSession(null);
    } finally {
      setLoadingSession(false);
    }
  }, []);

  const loadAdminData = useCallback(async () => {
    try {
      const requests: Promise<Response>[] = [
        fetch('/api/admin/overview'),
        fetch('/api/admin/products'),
        fetch('/api/admin/news'),
        fetch('/api/admin/team'),
        fetch('/api/admin/tickets'),
        fetch('/api/admin/suggestions'),
        fetch('/api/admin/messages'),
        fetch('/api/admin/settings'),
        fetch('/api/admin/media'),
      ];

      const canManageAdmins = session?.adminRole === 'super_admin';
      if (canManageAdmins) {
        requests.push(fetch('/api/admin/users'));
      }

      const [ovRes, prodRes, newsRes, teamRes, tickRes, sugRes, msgRes, setRes, mediaRes, usersRes] =
        await Promise.all(requests);

      if (ovRes.ok) setOverview((await ovRes.json()).stats);
      if (prodRes.ok) setAdminProducts((await prodRes.json()).items ?? []);
      if (newsRes.ok) setAdminNews((await newsRes.json()).items ?? []);
      if (teamRes.ok) setAdminTeam((await teamRes.json()).items ?? []);
      if (tickRes.ok) {
        const list = ((await tickRes.json()).items ?? []) as SupportTicket[];
        setTickets(list);
        const drafts: Record<string, string> = {};
        for (const item of list) drafts[item.id] = item.adminReply;
        setReplyDrafts(drafts);
      }
      if (sugRes.ok) {
        const list = ((await sugRes.json()).items ?? []) as Suggestion[];
        setSuggestions(list);
        const notes: Record<string, string> = {};
        for (const item of list) notes[item.id] = item.adminNote;
        setSuggestionNotes(notes);
      }
      if (msgRes.ok) setMessages((await msgRes.json()).items ?? []);
      if (setRes.ok) {
        const s = (await setRes.json()).settings as SiteSettings;
        setSiteSettings(s);
        setSNameFa(s.studioNameFa);
        setSNameEn(s.studioNameEn);
        setSTaglineFa(s.taglineFa);
        setSTaglineEn(s.taglineEn);
        setSEmail(s.contactEmail);
        setSDomain(s.officialDomain);
        setSAnnFa(s.announcementFa);
        setSAnnEn(s.announcementEn);
        setSMaint(s.maintenanceMode);
        setSTelegram(s.socialLinks?.telegram ?? '');
        setSInstagram(s.socialLinks?.instagram ?? '');
        setSDiscord(s.socialLinks?.discord ?? '');
        setSGithub(s.socialLinks?.github ?? '');
      }
      if (mediaRes.ok) {
        setMediaItems((await mediaRes.json()).items ?? []);
      }
      if (usersRes && usersRes.ok) {
        setAdminUsers((await usersRes.json()).items ?? []);
      }
    } catch {
      flashError(isFa ? 'خطا در دریافت اطلاعات از سرور' : 'Failed to load studio workspace data');
    }
  }, [isFa, session?.adminRole]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (session?.authenticated) {
      void loadAdminData();
    }
  }, [session?.authenticated, loadAdminData]);

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthSubmitting(true);
    setAuthError(null);
    try {
      const endpoint = session?.needsSetup ? '/api/admin/setup' : '/api/admin/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail,
          password: authPassword,
          displayName: authDisplayName,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Authentication failed');
      setAuthPassword('');
      await loadSession();
    } catch (err) {
      setAuthError((err as Error).message);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    await loadSession();
  };

  // ---- Supabase Storage Upload Helper ----
  const uploadToSupabaseStorage = async (
    file: File,
    folder: string,
    fieldKey: string,
  ): Promise<string | null> => {
    setUploadingField(fieldKey);
    setErrorBanner(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl, folder }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');
      return String(json.url);
    } catch (err) {
      flashError((err as Error).message);
      return null;
    } finally {
      setUploadingField(null);
    }
  };

  const handleUploadSingle = async (
    e: ChangeEvent<HTMLInputElement>,
    folder: string,
    fieldKey: string,
    setter: (val: string) => void,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const url = await uploadToSupabaseStorage(file, folder, fieldKey);
    if (url) {
      setter(url);
      flash(isFa ? 'تصویر با موفقیت در Supabase Storage بارگذاری شد.' : 'Image uploaded to Supabase Storage.');
    }
  };

  const handleUploadScreenshot = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    const uploaded: string[] = [];
    for (const file of files) {
      const url = await uploadToSupabaseStorage(file, 'screenshots', 'screenshots');
      if (url) uploaded.push(url);
    }
    if (uploaded.length > 0) {
      setPScreenshots((prev) => [...prev, ...uploaded]);
      flash(isFa ? 'تصاویر گالری در Supabase ذخیره شدند.' : 'Screenshots uploaded to Supabase Storage.');
    }
  };

  // ---- Products CRUD ----
  const resetProductForm = () => {
    setEditingProductId(null);
    setPTitleFa('');
    setPTitleEn('');
    setPSlug('');
    setPCategory('game');
    setPVersion('1.0.0');
    setPReleaseDate(new Date().toISOString().slice(0, 10));
    setPShortFa('');
    setPShortEn('');
    setPFullFa('');
    setPFullEn('');
    setPIconUrl('');
    setPScreenshots([]);
    setPShotInput('');
    setPMyket('');
    setPBazaar('');
    setPGooglePlay('');
    setPDirect('');
    setPFeatured(false);
    setPPublished(true);
  };

  const startEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setPTitleFa(p.titleFa);
    setPTitleEn(p.titleEn);
    setPSlug(p.slug);
    setPCategory(p.category);
    setPVersion(p.version);
    setPReleaseDate(p.releaseDate);
    setPShortFa(p.shortDescFa);
    setPShortEn(p.shortDescEn);
    setPFullFa(p.fullDescFa);
    setPFullEn(p.fullDescEn);
    setPIconUrl(p.iconUrl);
    setPScreenshots(p.screenshots);
    setPMyket(p.links.myket ?? '');
    setPBazaar(p.links.bazaar ?? '');
    setPGooglePlay(p.links.googlePlay ?? '');
    setPDirect(p.links.direct ?? '');
    setPFeatured(p.featured);
    setPPublished(p.published);
  };

  const handleProductSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (savingProduct) return;
    setSavingProduct(true);
    try {
      const payload = {
        titleFa: pTitleFa,
        titleEn: pTitleEn,
        slug: pSlug,
        category: pCategory,
        version: pVersion,
        releaseDate: pReleaseDate,
        shortDescFa: pShortFa,
        shortDescEn: pShortEn,
        fullDescFa: pFullFa,
        fullDescEn: pFullEn,
        iconUrl: pIconUrl,
        screenshots: pScreenshots,
        links: {
          myket: pMyket || undefined,
          bazaar: pBazaar || undefined,
          googlePlay: pGooglePlay || undefined,
          direct: pDirect || undefined,
        },
        featured: pFeatured,
        published: pPublished,
      };

      const url = editingProductId ? `/api/admin/products/${editingProductId}` : '/api/admin/products';
      const method = editingProductId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        flashError(json.error || 'Failed to save product');
        return;
      }
      resetProductForm();
      await Promise.all([loadAdminData(), refreshPublicData()]);
      flash(isFa ? 'محصول با موفقیت در Supabase ذخیره شد.' : 'Product saved to Supabase.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleToggleProductPublish = async (p: Product) => {
    const res = await fetch(`/api/admin/products/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !p.published }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      flashError(json.error || 'Update failed');
      return;
    }
    await Promise.all([loadAdminData(), refreshPublicData()]);
    flash(
      !p.published
        ? isFa
          ? 'محصول منتشر شد.'
          : 'Product published.'
        : isFa
          ? 'محصول به پیش‌نویس منتقل شد.'
          : 'Product moved to draft.',
    );
  };

  const handleDeleteProduct = async (id: string) => {
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      flashError(json.error || 'Delete failed');
      return;
    }
    await Promise.all([loadAdminData(), refreshPublicData()]);
    flash(isFa ? 'محصول حذف شد.' : 'Product deleted.');
  };

  // ---- News CRUD ----
  const resetNewsForm = () => {
    setEditingNewsId(null);
    setNTitleFa('');
    setNTitleEn('');
    setNCategory('studio');
    setNSummaryFa('');
    setNSummaryEn('');
    setNContentFa('');
    setNContentEn('');
    setNCoverUrl('');
    setNPublished(true);
  };

  const handleNewsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (savingNews) return;
    setSavingNews(true);
    try {
      const payload = {
        titleFa: nTitleFa,
        titleEn: nTitleEn,
        category: nCategory,
        summaryFa: nSummaryFa,
        summaryEn: nSummaryEn,
        contentFa: nContentFa,
        contentEn: nContentEn,
        coverUrl: nCoverUrl,
        published: nPublished,
      };
      const url = editingNewsId ? `/api/admin/news/${editingNewsId}` : '/api/admin/news';
      const method = editingNewsId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        flashError(json.error || 'Failed to save news');
        return;
      }
      resetNewsForm();
      await Promise.all([loadAdminData(), refreshPublicData()]);
      flash(isFa ? 'خبر در Supabase ذخیره شد.' : 'News dispatch saved.');
    } finally {
      setSavingNews(false);
    }
  };

  const handleToggleNewsPublish = async (post: NewsPost) => {
    const res = await fetch(`/api/admin/news/${post.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !post.published }),
    });
    if (!res.ok) {
      flashError('Failed to update news status');
      return;
    }
    await Promise.all([loadAdminData(), refreshPublicData()]);
    flash(
      !post.published
        ? isFa
          ? 'خبر منتشر شد.'
          : 'News published.'
        : isFa
          ? 'خبر پیش‌نویس شد.'
          : 'News set to draft.',
    );
  };

  const handleDeleteNews = async (id: string) => {
    const res = await fetch(`/api/admin/news/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      flashError('Failed to delete news');
      return;
    }
    await Promise.all([loadAdminData(), refreshPublicData()]);
    flash(isFa ? 'خبر حذف شد.' : 'News deleted.');
  };

  // ---- Team CRUD ----
  const resetTeamForm = () => {
    setEditingTeamId(null);
    setMNameFa('');
    setMNameEn('');
    setMRoleFa('');
    setMRoleEn('');
    setMBioFa('');
    setMBioEn('');
    setMAvatarUrl('');
    setMSortOrder(0);
    setMPublished(true);
  };

  const handleTeamSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (savingTeam) return;
    setSavingTeam(true);
    try {
      const payload = {
        nameFa: mNameFa,
        nameEn: mNameEn,
        roleFa: mRoleFa,
        roleEn: mRoleEn,
        bioFa: mBioFa,
        bioEn: mBioEn,
        avatarUrl: mAvatarUrl,
        sortOrder: mSortOrder,
        published: mPublished,
      };
      const url = editingTeamId ? `/api/admin/team/${editingTeamId}` : '/api/admin/team';
      const method = editingTeamId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        flashError(json.error || 'Failed to save team member');
        return;
      }
      resetTeamForm();
      await Promise.all([loadAdminData(), refreshPublicData()]);
      flash(isFa ? 'اطلاعات عضو تیم ذخیره شد.' : 'Team member saved.');
    } finally {
      setSavingTeam(false);
    }
  };

  const handleToggleTeamPublish = async (member: TeamMember) => {
    const res = await fetch(`/api/admin/team/${member.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !member.published }),
    });
    if (!res.ok) {
      flashError('Failed to update member visibility');
      return;
    }
    await Promise.all([loadAdminData(), refreshPublicData()]);
    flash(
      !member.published
        ? isFa
          ? 'عضو تیم در سایت منتشر شد.'
          : 'Team member published.'
        : isFa
          ? 'عضو تیم پیش‌نویس شد.'
          : 'Team member hidden as draft.',
    );
  };

  const handleDeleteTeam = async (id: string) => {
    const res = await fetch(`/api/admin/team/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      flashError('Failed to delete team member');
      return;
    }
    await Promise.all([loadAdminData(), refreshPublicData()]);
    flash(isFa ? 'عضو تیم حذف شد.' : 'Team member removed.');
  };

  // ---- Tickets / Suggestions / Messages ----
  const handleTicketUpdate = async (id: string, status: TicketStatus) => {
    const res = await fetch(`/api/admin/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminReply: replyDrafts[id] ?? '' }),
    });
    if (!res.ok) {
      flashError('Failed to update support ticket');
      return;
    }
    await loadAdminData();
    flash(isFa ? 'پاسخ تیکت در Supabase ثبت شد.' : 'Support ticket updated.');
  };

  const handleSuggestionUpdate = async (id: string, status: SuggestionStatus) => {
    const res = await fetch(`/api/admin/suggestions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNote: suggestionNotes[id] ?? '' }),
    });
    if (!res.ok) {
      flashError('Failed to update suggestion');
      return;
    }
    await loadAdminData();
    flash(isFa ? 'وضعیت پیشنهاد به‌روزرسانی شد.' : 'Suggestion updated.');
  };

  const handleDeleteSuggestion = async (id: string) => {
    const res = await fetch(`/api/admin/suggestions/${id}`, { method: 'DELETE' });
    if (res.ok) await loadAdminData();
  };

  const handleToggleMessageRead = async (id: string, read: boolean) => {
    const res = await fetch(`/api/admin/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read }),
    });
    if (res.ok) await loadAdminData();
  };

  const handleDeleteMessage = async (id: string) => {
    const res = await fetch(`/api/admin/messages/${id}`, { method: 'DELETE' });
    if (res.ok) await loadAdminData();
  };

  // ---- Site Settings ----
  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (savingSettings) return;
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studioNameFa: sNameFa,
          studioNameEn: sNameEn,
          taglineFa: sTaglineFa,
          taglineEn: sTaglineEn,
          contactEmail: sEmail,
          officialDomain: sDomain,
          announcementFa: sAnnFa,
          announcementEn: sAnnEn,
          maintenanceMode: sMaint,
          socialLinks: {
            telegram: sTelegram || undefined,
            instagram: sInstagram || undefined,
            discord: sDiscord || undefined,
            github: sGithub || undefined,
          },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        flashError(json.error || 'Failed to save site settings');
        return;
      }
      await Promise.all([loadAdminData(), refreshPublicData()]);
      flash(isFa ? 'تنظیمات عمومی سایت ذخیره شد.' : 'Site settings updated.');
    } finally {
      setSavingSettings(false);
    }
  };

  // ---- Media Deletion ----
  const handleDeleteMedia = async (filePath: string) => {
    if (deletingMediaPath) return;
    setDeletingMediaPath(filePath);
    try {
      const res = await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        flashError(json.error || 'Failed to delete storage file');
        return;
      }
      await loadAdminData();
      flash(isFa ? 'فایل از Supabase Storage حذف شد.' : 'Media deleted from Storage.');
    } finally {
      setDeletingMediaPath(null);
    }
  };

  // ---- Admin Users ----
  const handleCreateAdminUser = async (e: FormEvent) => {
    e.preventDefault();
    if (savingAdmin) return;
    setSavingAdmin(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newAdminEmail,
          displayName: newAdminName,
          password: newAdminPassword,
          role: newAdminRole,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        flashError(json.error || 'Failed to create admin user');
        return;
      }
      setNewAdminEmail('');
      setNewAdminName('');
      setNewAdminPassword('');
      setNewAdminRole('editor');
      await loadAdminData();
      flash(isFa ? 'مدیر جدید در Supabase Auth ایجاد شد.' : 'Admin account created.');
    } finally {
      setSavingAdmin(false);
    }
  };

  const handleToggleAdminActive = async (u: AdminUser) => {
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !u.isActive }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      flashError(json.error || 'Failed to update admin status');
      return;
    }
    await loadAdminData();
  };

  const handleChangeAdminRole = async (u: AdminUser, role: AdminRole) => {
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      flashError(json.error || 'Failed to change role');
      return;
    }
    await loadAdminData();
    flash(isFa ? 'سطح دسترسی مدیر تغییر یافت.' : 'Admin role updated.');
  };

  const handleDeleteAdminUser = async (id: string) => {
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      flashError(json.error || 'Failed to delete admin');
      return;
    }
    await loadAdminData();
  };

  // ---- Filtered Collections ----
  const filteredProducts = useMemo(() => {
    const q = prodQuery.trim().toLowerCase();
    return adminProducts.filter((p) => {
      if (prodCatFilter !== 'all' && p.category !== prodCatFilter) return false;
      if (prodPubFilter === 'published' && !p.published) return false;
      if (prodPubFilter === 'draft' && p.published) return false;
      if (!q) return true;
      return (
        p.titleFa.toLowerCase().includes(q) ||
        p.titleEn.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
      );
    });
  }, [adminProducts, prodQuery, prodCatFilter, prodPubFilter]);

  const filteredNews = useMemo(() => {
    const q = newsQuery.trim().toLowerCase();
    return adminNews.filter((n) => {
      if (newsPubFilter === 'published' && !n.published) return false;
      if (newsPubFilter === 'draft' && n.published) return false;
      if (!q) return true;
      return n.titleFa.toLowerCase().includes(q) || n.titleEn.toLowerCase().includes(q);
    });
  }, [adminNews, newsQuery, newsPubFilter]);

  const filteredTeam = useMemo(() => {
    const q = teamQuery.trim().toLowerCase();
    return adminTeam.filter((m) => {
      if (teamPubFilter === 'published' && !m.published) return false;
      if (teamPubFilter === 'draft' && m.published) return false;
      if (!q) return true;
      return (
        m.nameFa.toLowerCase().includes(q) ||
        m.nameEn.toLowerCase().includes(q) ||
        m.roleFa.toLowerCase().includes(q) ||
        m.roleEn.toLowerCase().includes(q)
      );
    });
  }, [adminTeam, teamQuery, teamPubFilter]);

  const filteredTickets = useMemo(() => {
    const q = ticketQuery.trim().toLowerCase();
    return tickets.filter((tk) => {
      if (ticketStatusFilter !== 'all' && tk.status !== ticketStatusFilter) return false;
      if (!q) return true;
      return (
        tk.trackingCode.toLowerCase().includes(q) ||
        tk.name.toLowerCase().includes(q) ||
        tk.email.toLowerCase().includes(q) ||
        tk.subject.toLowerCase().includes(q)
      );
    });
  }, [tickets, ticketQuery, ticketStatusFilter]);

  const filteredSuggestions = useMemo(() => {
    const q = sugQuery.trim().toLowerCase();
    return suggestions.filter((s) => {
      if (sugStatusFilter !== 'all' && s.status !== sugStatusFilter) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.details.toLowerCase().includes(q)
      );
    });
  }, [suggestions, sugQuery, sugStatusFilter]);

  const filteredMessages = useMemo(() => {
    const q = msgQuery.trim().toLowerCase();
    return messages.filter((m) => {
      if (msgReadFilter === 'unread' && m.read) return false;
      if (msgReadFilter === 'read' && !m.read) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q)
      );
    });
  }, [messages, msgQuery, msgReadFilter]);

  if (loadingSession) {
    return (
      <div className="mx-auto max-w-md px-4 py-24">
        <div className="h-64 rounded-2xl border border-white/10 bg-[#0d0e12] animate-pulse" />
      </div>
    );
  }

  // ---- Diagnostic Screen when Supabase is Unconfigured or Schema Missing ----
  const sbStatus = session?.supabaseStatus;
  if (!session?.authenticated) {
    const supabaseBlocked =
      !sbStatus?.configured || !sbStatus?.connected || !sbStatus?.schemaReady;

    return (
      <div className="mx-auto max-w-lg px-4 py-20 space-y-6">
        {supabaseBlocked ? (
          <div className="surface-card rounded-2xl p-6 sm:p-8 space-y-4 border border-amber-500/40">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl border border-amber-500/40 bg-amber-500/10 flex items-center justify-center text-amber-300 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">
                  {isFa ? 'وضعیت اتصال Supabase' : 'Supabase Connection Status'}
                </h1>
                <p className="text-xs text-slate-400">TAK1 Game Studio · kalametgame.ir</p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#070709] p-4 space-y-2 text-xs leading-relaxed text-slate-300">
              {!sbStatus?.configured ? (
                <>
                  <p className="font-semibold text-amber-300">
                    {isFa
                      ? 'متغیرهای محیطی Supabase روی سرور تنظیم نشده‌اند.'
                      : 'Supabase environment variables are missing on the server.'}
                  </p>
                  <p>
                    {isFa
                      ? 'لطفاً در تنظیمات Environment سرویس Render مقادیر زیر را اضافه کنید (هرگز آن‌ها را در Frontend یا GitHub قرار ندهید):'
                      : 'Add the following variables in Render Environment settings (never expose them in Frontend or GitHub):'}
                  </p>
                  <ul className="font-mono-tabular text-[#E5C158] list-disc list-inside space-y-1 pt-1">
                    {(sbStatus?.missingVars ?? ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']).map(
                      (v) => (
                        <li key={v}>{v}</li>
                      ),
                    )}
                  </ul>
                </>
              ) : !sbStatus.connected ? (
                <>
                  <p className="font-semibold text-red-300">
                    {isFa ? 'اتصال به سرور Supabase برقرار نشد.' : 'Unable to connect to Supabase.'}
                  </p>
                  <p className="font-mono-tabular text-[11px] text-slate-300 break-words">
                    {sbStatus.error}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-amber-300">
                    {isFa
                      ? 'اتصال به Supabase برقرار است، اما جداول یا دسترسی‌های پایگاه داده کامل نیست.'
                      : 'Connected to Supabase, but database schema or permissions are incomplete.'}
                  </p>
                  {sbStatus.error && (
                    <p className="font-mono-tabular text-[11px] text-slate-300 break-words">
                      {sbStatus.error}
                    </p>
                  )}
                  {sbStatus.missingTables && sbStatus.missingTables.length > 0 && (
                    <p className="font-mono-tabular text-[11px] text-amber-200 break-words">
                      {isFa ? 'جداول مفقود: ' : 'Missing tables: '}
                      {sbStatus.missingTables.join(', ')}
                    </p>
                  )}
                  <p>
                    {isFa
                      ? 'فایل supabase/schema.sql را در Supabase SQL Editor اجرا کنید و سپس صفحه را بازنشانی نمایید.'
                      : 'Execute supabase/schema.sql in your Supabase SQL Editor and refresh this page.'}
                  </p>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => void loadSession()}
              className="w-full py-2.5 rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-white hover:border-[#D4AF37]/50 cursor-pointer"
            >
              {isFa ? 'بررسی مجدد اتصال Supabase' : 'Re-check Supabase Connection'}
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleAuthSubmit}
            className="surface-card rounded-2xl p-6 sm:p-8 space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 flex items-center justify-center text-[#F2CF66]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">
                  {session?.needsSetup ? t.admin.setupTitle : t.admin.loginTitle}
                </h1>
                <p className="text-xs text-slate-400">TAK1 Game Studio · kalametgame.ir</p>
              </div>
            </div>

            {session?.needsSetup ? (
              <p className="text-xs leading-relaxed text-slate-300">{t.admin.setupDesc}</p>
            ) : (
              <p className="text-xs leading-relaxed text-slate-400">
                {isFa
                  ? 'احراز هویت به‌صورت مستقیم از طریق Supabase Auth و جدول سطوح دسترسی انجام می‌شود.'
                  : 'Authenticated directly via Supabase Auth and verified against studio admin roles.'}
              </p>
            )}

            {authError && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">
                {authError}
              </div>
            )}

            {session?.needsSetup && (
              <label className="block space-y-1.5 text-xs text-slate-300">
                <span>{isFa ? 'نام نمایشی مدیر' : 'Administrator Name'}</span>
                <input
                  type="text"
                  value={authDisplayName}
                  onChange={(e) => setAuthDisplayName(e.target.value)}
                  placeholder="TAK1 Studio Owner"
                  className="w-full rounded-xl border border-white/10 bg-[#070709] px-3.5 py-2.5 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </label>
            )}

            <label className="block space-y-1.5 text-xs text-slate-300">
              <span>{t.admin.email}</span>
              <input
                required
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#070709] px-3.5 py-2.5 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </label>

            <label className="block space-y-1.5 text-xs text-slate-300">
              <span>{t.admin.password}</span>
              <input
                required
                minLength={8}
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#070709] px-3.5 py-2.5 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </label>

            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#E8C563] to-[#C89B2B] text-[#070709] text-sm font-semibold hover:brightness-110 transition cursor-pointer"
            >
              {session?.needsSetup ? t.admin.setupBtn : t.admin.loginBtn}
            </button>
          </form>
        )}
      </div>
    );
  }

  const canManageSettings =
    session.adminRole === 'super_admin' || session.adminRole === 'admin';
  const canManageAdmins = session.adminRole === 'super_admin';

  const tabs: { id: AdminTab; label: string; icon: typeof BarChart3 }[] = [
    { id: 'overview', label: t.admin.tabs.overview, icon: BarChart3 },
    { id: 'products', label: t.admin.tabs.products, icon: Gamepad2 },
    { id: 'news', label: t.admin.tabs.news, icon: Newspaper },
    { id: 'team', label: t.admin.tabs.team, icon: Users },
    { id: 'media', label: isFa ? 'رسانه‌ها' : 'Media', icon: ImageIcon },
    { id: 'tickets', label: t.admin.tabs.tickets, icon: LifeBuoy },
    { id: 'suggestions', label: t.admin.tabs.suggestions, icon: MessageSquarePlus },
    { id: 'messages', label: t.admin.tabs.messages, icon: Inbox },
    ...(canManageSettings
      ? [{ id: 'settings' as AdminTab, label: t.admin.tabs.settings, icon: Settings }]
      : []),
    ...(canManageAdmins
      ? [{ id: 'admins' as AdminTab, label: t.admin.tabs.admins, icon: UserCog }]
      : []),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-1">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            {t.admin.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="font-mono-tabular text-[#D4AF37]">{session.adminEmail}</span>
            {session.adminRole && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular uppercase text-slate-300">
                  {session.adminRole}
                </span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>
              {t.admin.storageLabel}{' '}
              {session.storageMode === 'supabase'
                ? t.admin.storageSupabase
                : t.admin.storageUnconfigured}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleLogout()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/15 bg-[#0d0e12] text-xs font-medium text-slate-200 hover:border-red-400/50 hover:text-red-200 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>{t.admin.logout}</span>
        </button>
      </div>

      {feedbackBanner && (
        <div className="rounded-xl border border-[#D4AF37]/45 bg-[#D4AF37]/10 px-4 py-3 text-sm text-[#F2CF66] flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0" />
          <span>{feedbackBanner}</span>
        </div>
      )}

      {errorBanner && (
        <div className="rounded-xl border border-red-500/45 bg-red-500/10 px-4 py-3 text-sm text-red-200 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl border border-white/10 bg-[#0d0e12]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-gradient-to-r from-[#E8C563] to-[#C89B2B] text-[#070709] font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="surface-card rounded-xl p-5 space-y-1.5">
              <p className="text-xs text-slate-400">
                {isFa ? 'محصولات منتشرشده' : 'Published Products'}
              </p>
              <p className="font-mono-tabular text-3xl font-bold text-white">
                {overview?.publishedProducts ?? 0}
                <span className="text-sm font-normal text-slate-500">
                  {' '}
                  / {overview?.totalProducts ?? 0}
                </span>
              </p>
            </div>

            <div className="surface-card rounded-xl p-5 space-y-1.5">
              <p className="text-xs text-slate-400">
                {isFa ? 'اخبار منتشرشده' : 'Published News'}
              </p>
              <p className="font-mono-tabular text-3xl font-bold text-white">
                {overview?.publishedNews ?? 0}
                <span className="text-sm font-normal text-slate-500">
                  {' '}
                  / {overview?.totalNews ?? 0}
                </span>
              </p>
            </div>

            <div className="surface-card rounded-xl p-5 space-y-1.5">
              <p className="text-xs text-slate-400">
                {isFa ? 'تیکت‌های باز پشتیبانی' : 'Open Support Tickets'}
              </p>
              <p className="font-mono-tabular text-3xl font-bold text-[#F2CF66]">
                {overview?.openTickets ?? 0}
                <span className="text-sm font-normal text-slate-500">
                  {' '}
                  / {overview?.totalTickets ?? 0}
                </span>
              </p>
            </div>

            <div className="surface-card rounded-xl p-5 space-y-1.5">
              <p className="text-xs text-slate-400">
                {isFa ? 'پیشنهادهای جدید / پیام‌های خوانده‌نشده' : 'New Suggestions / Unread Messages'}
              </p>
              <p className="font-mono-tabular text-3xl font-bold text-white">
                {overview?.pendingSuggestions ?? 0}
                <span className="text-sm font-normal text-slate-500">
                  {' '}
                  · {overview?.unreadMessages ?? 0}
                </span>
              </p>
            </div>
          </div>

          <div className="surface-card rounded-xl p-6 flex items-start gap-4">
            <Database className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <h2 className="text-sm font-semibold text-white">
                {isFa
                  ? 'وضعیت اتصال زنده به Supabase PostgreSQL، Auth و Storage'
                  : 'Live Supabase PostgreSQL, Auth & Storage Status'}
              </h2>
              <p className="text-xs leading-relaxed text-slate-400">
                {isFa
                  ? 'تمامی عملیات محصولات، اخبار، تیم، تیکت‌ها، پیشنهادها، تنظیمات و بارگذاری تصاویر مستقیماً در پایگاه داده و فضای ذخیره‌سازی Supabase ثبت می‌شوند.'
                  : 'All catalog items, dispatches, team profiles, tickets, feedback, settings, and media uploads persist directly in Supabase PostgreSQL & Storage.'}
              </p>
              <p className="font-mono-tabular text-[11px] text-slate-300">
                Storage (studio-media):{' '}
                <span className={sbStatus?.storageReady ? 'text-emerald-300' : 'text-amber-300'}>
                  {sbStatus?.storageReady
                    ? isFa
                      ? 'آماده و متصل'
                      : 'Ready'
                    : sbStatus?.storageError || (isFa ? 'نیازمند بررسی باکت' : 'Bucket unavailable')}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Products Manager */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handleProductSubmit}
            className="lg:col-span-7 surface-card rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">
                {editingProductId
                  ? isFa
                    ? 'ویرایش محصول'
                    : 'Edit Product'
                  : isFa
                    ? 'ثبت بازی یا برنامه جدید'
                    : 'Register New Game or App'}
              </h2>
              {editingProductId && (
                <button
                  type="button"
                  onClick={resetProductForm}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  {isFa ? 'انصراف از ویرایش' : 'Cancel Edit'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1 text-xs text-slate-300">
                <span>{isFa ? 'عنوان فارسی *' : 'Title (Persian) *'}</span>
                <input
                  required
                  value={pTitleFa}
                  onChange={(e) => setPTitleFa(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </label>
              <label className="block space-y-1 text-xs text-slate-300">
                <span>{isFa ? 'عنوان انگلیسی *' : 'Title (English) *'}</span>
                <input
                  required
                  value={pTitleEn}
                  onChange={(e) => setPTitleEn(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <label className="block space-y-1 text-xs text-slate-300 sm:col-span-2">
                <span>Slug (URL)</span>
                <input
                  value={pSlug}
                  onChange={(e) => setPSlug(e.target.value)}
                  placeholder="my-game-slug"
                  className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 font-mono-tabular text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </label>
              <label className="block space-y-1 text-xs text-slate-300">
                <span>{isFa ? 'دسته‌بندی' : 'Category'}</span>
                <select
                  value={pCategory}
                  onChange={(e) => setPCategory(e.target.value as ProductCategory)}
                  className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="game">{t.products.categoryLabels.game}</option>
                  <option value="app">{t.products.categoryLabels.app}</option>
                  <option value="tool">{t.products.categoryLabels.tool}</option>
                </select>
              </label>
              <label className="block space-y-1 text-xs text-slate-300">
                <span>{isFa ? 'نسخه' : 'Version'}</span>
                <input
                  value={pVersion}
                  onChange={(e) => setPVersion(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 font-mono-tabular text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1 text-xs text-slate-300">
                <span>{isFa ? 'خلاصه معرفی (فارسی)' : 'Short Description (FA)'}</span>
                <textarea
                  rows={2}
                  value={pShortFa}
                  onChange={(e) => setPShortFa(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </label>
              <label className="block space-y-1 text-xs text-slate-300">
                <span>{isFa ? 'خلاصه معرفی (انگلیسی)' : 'Short Description (EN)'}</span>
                <textarea
                  rows={2}
                  value={pShortEn}
                  onChange={(e) => setPShortEn(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1 text-xs text-slate-300">
                <span>{isFa ? 'توضیحات کامل (فارسی)' : 'Full Description (FA)'}</span>
                <textarea
                  rows={4}
                  value={pFullFa}
                  onChange={(e) => setPFullFa(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </label>
              <label className="block space-y-1 text-xs text-slate-300">
                <span>{isFa ? 'توضیحات کامل (انگلیسی)' : 'Full Description (EN)'}</span>
                <textarea
                  rows={4}
                  value={pFullEn}
                  onChange={(e) => setPFullEn(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </label>
            </div>

            {/* Icon URL or Upload */}
            <div className="space-y-2">
              <span className="block text-xs text-slate-300">
                {isFa ? 'آیکون برنامه (آدرس یا آپلود به Supabase)' : 'App Icon (URL or Supabase Upload)'}
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  value={pIconUrl}
                  onChange={(e) => setPIconUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 min-w-[200px] rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/15 bg-white/5 text-xs text-slate-200 hover:border-[#D4AF37]/50 cursor-pointer">
                  <Upload className="h-3.5 w-3.5" />
                  <span>
                    {uploadingField === 'icon'
                      ? isFa
                        ? 'در حال آپلود...'
                        : 'Uploading...'
                      : isFa
                        ? 'آپلود آیکون'
                        : 'Upload Icon'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => void handleUploadSingle(e, 'icons', 'icon', setPIconUrl)}
                  />
                </label>
              </div>
            </div>

            {/* Screenshots */}
            <div className="space-y-2">
              <span className="block text-xs text-slate-300">
                {isFa ? 'تصاویر محیط برنامه / گیم‌پلی' : 'Screenshots Gallery'}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={pShotInput}
                  onChange={(e) => setPShotInput(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 min-w-[200px] rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (pShotInput.trim()) {
                      setPScreenshots((prev) => [...prev, pShotInput.trim()]);
                      setPShotInput('');
                    }
                  }}
                  className="px-3 py-2 rounded-xl border border-white/15 bg-white/5 text-xs text-white cursor-pointer"
                >
                  {isFa ? 'افزودن لینک' : 'Add URL'}
                </button>
                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/15 bg-white/5 text-xs text-slate-200 cursor-pointer">
                  <Upload className="h-3.5 w-3.5" />
                  <span>
                    {uploadingField === 'screenshots'
                      ? isFa
                        ? 'در حال آپلود...'
                        : 'Uploading...'
                      : isFa
                        ? 'آپلود تصویر'
                        : 'Upload'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => void handleUploadScreenshot(e)}
                  />
                </label>
              </div>
              {pScreenshots.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {pScreenshots.map((shot, i) => (
                    <div key={i} className="relative group">
                      <SafeMedia src={shot} alt="" className="h-14 w-24 rounded-lg object-cover border border-white/10" />
                      <button
                        type="button"
                        onClick={() => setPScreenshots((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Store Download Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
              <label className="block space-y-1 text-xs text-slate-300">
                <span>{isFa ? 'لینک مایکت (Myket)' : 'Myket Link'}</span>
                <input
                  value={pMyket}
                  onChange={(e) => setPMyket(e.target.value)}
                  placeholder="https://myket.ir/app/..."
                  className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </label>
              <label className="block space-y-1 text-xs text-slate-300">
                <span>{isFa ? 'لینک کافه‌بازار (Cafe Bazaar)' : 'Cafe Bazaar Link'}</span>
                <input
                  value={pBazaar}
                  onChange={(e) => setPBazaar(e.target.value)}
                  placeholder="https://cafebazaar.ir/app/..."
                  className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </label>
              <label className="block space-y-1 text-xs text-slate-300">
                <span>{isFa ? 'لینک گوگل‌پلی (Google Play)' : 'Google Play Link'}</span>
                <input
                  value={pGooglePlay}
                  onChange={(e) => setPGooglePlay(e.target.value)}
                  placeholder="https://play.google.com/store/apps/..."
                  className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </label>
              <label className="block space-y-1 text-xs text-slate-300">
                <span>{isFa ? 'لینک دانلود مستقیم (Direct)' : 'Direct Download Link'}</span>
                <input
                  value={pDirect}
                  onChange={(e) => setPDirect(e.target.value)}
                  placeholder="https://kalametgame.ir/downloads/..."
                  className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2">
              <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pPublished}
                  onChange={(e) => setPPublished(e.target.checked)}
                  className="accent-[#D4AF37]"
                />
                <span>{isFa ? 'انتشار عمومی در سایت (در غیراینصورت پیش‌نویس)' : 'Published (unchecked = Draft)'}</span>
              </label>
              <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pFeatured}
                  onChange={(e) => setPFeatured(e.target.checked)}
                  className="accent-[#D4AF37]"
                />
                <span>{isFa ? 'نمایش ویژه در صفحه اصلی' : 'Featured on Home'}</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={savingProduct}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E8C563] to-[#C89B2B] text-[#070709] text-sm font-semibold hover:brightness-110 disabled:opacity-60 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>
                {savingProduct
                  ? isFa
                    ? 'در حال ذخیره...'
                    : 'Saving...'
                  : editingProductId
                    ? isFa
                      ? 'ذخیره تغییرات'
                      : 'Save Changes'
                    : isFa
                      ? 'ثبت محصول'
                      : 'Create Product'}
              </span>
            </button>
          </form>

          {/* Existing Products List with Search & Filter */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-white">
                {isFa ? `محصولات (${filteredProducts.length})` : `Products (${filteredProducts.length})`}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="relative sm:col-span-1">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 left-2.5" />
                <input
                  value={prodQuery}
                  onChange={(e) => setProdQuery(e.target.value)}
                  placeholder={isFa ? 'جستجو...' : 'Search...'}
                  className="w-full rounded-lg border border-white/10 bg-[#0d0e12] pl-8 pr-2.5 py-1.5 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
              <select
                value={prodCatFilter}
                onChange={(e) => setProdCatFilter(e.target.value as 'all' | ProductCategory)}
                className="rounded-lg border border-white/10 bg-[#0d0e12] px-2.5 py-1.5 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="all">{isFa ? 'همه دسته‌ها' : 'All Categories'}</option>
                <option value="game">{t.products.categoryLabels.game}</option>
                <option value="app">{t.products.categoryLabels.app}</option>
                <option value="tool">{t.products.categoryLabels.tool}</option>
              </select>
              <select
                value={prodPubFilter}
                onChange={(e) => setProdPubFilter(e.target.value as 'all' | 'published' | 'draft')}
                className="rounded-lg border border-white/10 bg-[#0d0e12] px-2.5 py-1.5 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="all">{isFa ? 'همه وضعیت‌ها' : 'All Status'}</option>
                <option value="published">{isFa ? 'منتشرشده' : 'Published'}</option>
                <option value="draft">{isFa ? 'پیش‌نویس' : 'Draft'}</option>
              </select>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="surface-card rounded-xl p-6 text-xs text-slate-400">
                {isFa ? 'محصولی مطابق فیلتر یافت نشد.' : 'No matching products found.'}
              </div>
            ) : (
              filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="surface-card rounded-xl p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <SafeMedia
                      src={p.iconUrl}
                      alt={p.titleEn}
                      className="h-11 w-11 rounded-lg object-cover border border-white/10 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {isFa ? p.titleFa : p.titleEn}
                      </p>
                      <p className="font-mono-tabular text-xs text-slate-400 truncate">
                        {p.category} · v{p.version} ·{' '}
                        <span className={p.published ? 'text-emerald-400' : 'text-amber-300'}>
                          {p.published ? (isFa ? 'منتشرشده' : 'Published') : isFa ? 'پیش‌نویس' : 'Draft'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => void handleToggleProductPublish(p)}
                      title={p.published ? 'Move to Draft' : 'Publish'}
                      className="h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center text-slate-300 hover:text-[#F2CF66] cursor-pointer"
                    >
                      {p.published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEditProduct(p)}
                      className="h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
                      aria-label="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteProduct(p.id)}
                      className="h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center text-red-400 hover:bg-red-500/15 cursor-pointer"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: News Manager */}
      {activeTab === 'news' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handleNewsSubmit}
            className="lg:col-span-6 surface-card rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">
                {editingNewsId
                  ? isFa
                    ? 'ویرایش خبر'
                    : 'Edit News Post'
                  : isFa
                    ? 'انتشار خبر یا اطلاعیه جدید'
                    : 'Publish News or Announcement'}
              </h2>
              {editingNewsId && (
                <button
                  type="button"
                  onClick={resetNewsForm}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  {isFa ? 'انصراف' : 'Cancel'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1 text-xs text-slate-300">
                <span>{isFa ? 'عنوان فارسی *' : 'Title (FA) *'}</span>
                <input
                  required
                  value={nTitleFa}
                  onChange={(e) => setNTitleFa(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </label>
              <label className="block space-y-1 text-xs text-slate-300">
                <span>{isFa ? 'عنوان انگلیسی *' : 'Title (EN) *'}</span>
                <input
                  required
                  value={nTitleEn}
                  onChange={(e) => setNTitleEn(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </label>
            </div>
            <label className="block space-y-1 text-xs text-slate-300">
              <span>{isFa ? 'دسته‌بندی' : 'Category'}</span>
              <select
                value={nCategory}
                onChange={(e) => setNCategory(e.target.value as NewsPost['category'])}
                className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="release">{t.news.categories.release}</option>
                <option value="studio">{t.news.categories.studio}</option>
                <option value="update">{t.news.categories.update}</option>
                <option value="event">{t.news.categories.event}</option>
              </select>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1 text-xs text-slate-300">
                <span>{isFa ? 'خلاصه (فارسی)' : 'Summary (FA)'}</span>
                <textarea
                  rows={2}
                  value={nSummaryFa}
                  onChange={(e) => setNSummaryFa(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </label>
              <label className="block space-y-1 text-xs text-slate-300">
                <span>{isFa ? 'خلاصه (انگلیسی)' : 'Summary (EN)'}</span>
                <textarea
                  rows={2}
                  value={nSummaryEn}
                  onChange={(e) => setNSummaryEn(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1 text-xs text-slate-300">
                <span>{isFa ? 'متن کامل (فارسی)' : 'Body (FA)'}</span>
                <textarea
                  rows={4}
                  value={nContentFa}
                  onChange={(e) => setNContentFa(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </label>
              <label className="block space-y-1 text-xs text-slate-300">
                <span>{isFa ? 'متن کامل (انگلیسی)' : 'Body (EN)'}</span>
                <textarea
                  rows={4}
                  value={nContentEn}
                  onChange={(e) => setNContentEn(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                value={nCoverUrl}
                onChange={(e) => setNCoverUrl(e.target.value)}
                placeholder={isFa ? 'آدرس تصویر کاور (اختیاری)' : 'Cover Image URL (optional)'}
                className="flex-1 rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/15 bg-white/5 text-xs text-slate-200 cursor-pointer">
                <Upload className="h-3.5 w-3.5" />
                <span>
                  {uploadingField === 'news'
                    ? isFa
                      ? 'در حال آپلود...'
                      : 'Uploading...'
                    : isFa
                      ? 'آپلود'
                      : 'Upload'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void handleUploadSingle(e, 'news', 'news', setNCoverUrl)}
                />
              </label>
            </div>
            <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={nPublished}
                onChange={(e) => setNPublished(e.target.checked)}
                className="accent-[#D4AF37]"
              />
              <span>{isFa ? 'انتشار عمومی خبر (در غیراینصورت پیش‌نویس)' : 'Published (unchecked = Draft)'}</span>
            </label>
            <div>
              <button
                type="submit"
                disabled={savingNews}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E8C563] to-[#C89B2B] text-[#070709] text-sm font-semibold hover:brightness-110 disabled:opacity-60 cursor-pointer"
              >
                {savingNews
                  ? isFa
                    ? 'در حال ذخیره...'
                    : 'Saving...'
                  : editingNewsId
                    ? isFa
                      ? 'به‌روزرسانی'
                      : 'Update'
                    : isFa
                      ? 'ذخیره خبر'
                      : 'Save News'}
              </button>
            </div>
          </form>

          <div className="lg:col-span-6 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 left-2.5" />
                <input
                  value={newsQuery}
                  onChange={(e) => setNewsQuery(e.target.value)}
                  placeholder={isFa ? 'جستجو در اخبار...' : 'Search news...'}
                  className="w-full rounded-lg border border-white/10 bg-[#0d0e12] pl-8 pr-2.5 py-1.5 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
              <select
                value={newsPubFilter}
                onChange={(e) => setNewsPubFilter(e.target.value as 'all' | 'published' | 'draft')}
                className="rounded-lg border border-white/10 bg-[#0d0e12] px-2.5 py-1.5 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="all">{isFa ? 'همه وضعیت‌ها' : 'All Status'}</option>
                <option value="published">{isFa ? 'منتشرشده' : 'Published'}</option>
                <option value="draft">{isFa ? 'پیش‌نویس' : 'Draft'}</option>
              </select>
            </div>

            {filteredNews.length === 0 ? (
              <div className="surface-card rounded-xl p-6 text-xs text-slate-400">
                {t.news.emptyTitle}
              </div>
            ) : (
              filteredNews.map((post) => (
                <div
                  key={post.id}
                  className="surface-card rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {isFa ? post.titleFa : post.titleEn}
                    </p>
                    <p className="font-mono-tabular text-xs text-slate-400">
                      {post.category} · {post.publishedAt.slice(0, 10)} ·{' '}
                      <span className={post.published ? 'text-emerald-400' : 'text-amber-300'}>
                        {post.published ? (isFa ? 'منتشرشده' : 'Published') : isFa ? 'پیش‌نویس' : 'Draft'}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => void handleToggleNewsPublish(post)}
                      className="h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center text-slate-300 hover:text-[#F2CF66] cursor-pointer"
                    >
                      {post.published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNewsId(post.id);
                        setNTitleFa(post.titleFa);
                        setNTitleEn(post.titleEn);
                        setNCategory(post.category);
                        setNSummaryFa(post.summaryFa);
                        setNSummaryEn(post.summaryEn);
                        setNContentFa(post.contentFa);
                        setNContentEn(post.contentEn);
                        setNCoverUrl(post.coverUrl);
                        setNPublished(post.published);
                      }}
                      className="h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteNews(post.id)}
                      className="h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center text-red-400 hover:bg-red-500/15 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Team Manager */}
      {activeTab === 'team' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handleTeamSubmit}
            className="lg:col-span-6 surface-card rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">
                {editingTeamId
                  ? isFa
                    ? 'ویرایش عضو تیم'
                    : 'Edit Team Member'
                  : isFa
                    ? 'افزودن عضو جدید به تیم TAK1'
                    : 'Add TAK1 Team Member'}
              </h2>
              {editingTeamId && (
                <button
                  type="button"
                  onClick={resetTeamForm}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  {isFa ? 'انصراف' : 'Cancel'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1 text-xs text-slate-300">
                <span>{isFa ? 'نام (فارسی) *' : 'Name (FA) *'}</span>
                <input
                  required
                  value={mNameFa}
                  onChange={(e) => setMNameFa(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </label>
              <label className="block space-y-1 text-xs text-slate-300">
                <span>{isFa ? 'نام (انگلیسی) *' : 'Name (EN) *'}</span>
                <input
                  required
                  value={mNameEn}
                  onChange={(e) => setMNameEn(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </label>
              <label className="block space-y-1 text-xs text-slate-300">
                <span>{isFa ? 'سمت / نقش (فارسی) *' : 'Role (FA) *'}</span>
                <input
                  required
                  value={mRoleFa}
                  onChange={(e) => setMRoleFa(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </label>
              <label className="block space-y-1 text-xs text-slate-300">
                <span>{isFa ? 'سمت / نقش (انگلیسی) *' : 'Role (EN) *'}</span>
                <input
                  required
                  value={mRoleEn}
                  onChange={(e) => setMRoleEn(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1 text-xs text-slate-300">
                <span>{isFa ? 'معرفی کوتاه (فارسی)' : 'Bio (FA)'}</span>
                <textarea
                  rows={3}
                  value={mBioFa}
                  onChange={(e) => setMBioFa(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </label>
              <label className="block space-y-1 text-xs text-slate-300">
                <span>{isFa ? 'معرفی کوتاه (انگلیسی)' : 'Bio (EN)'}</span>
                <textarea
                  rows={3}
                  value={mBioEn}
                  onChange={(e) => setMBioEn(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                value={mAvatarUrl}
                onChange={(e) => setMAvatarUrl(e.target.value)}
                placeholder={isFa ? 'آدرس تصویر پروفایل' : 'Avatar URL'}
                className="flex-1 rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/15 bg-white/5 text-xs text-slate-200 cursor-pointer">
                <Upload className="h-3.5 w-3.5" />
                <span>
                  {uploadingField === 'team'
                    ? isFa
                      ? 'در حال آپلود...'
                      : 'Uploading...'
                    : isFa
                      ? 'آپلود'
                      : 'Upload'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void handleUploadSingle(e, 'team', 'team', setMAvatarUrl)}
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                <span>{isFa ? 'ترتیب نمایش:' : 'Sort Order:'}</span>
                <input
                  type="number"
                  value={mSortOrder}
                  onChange={(e) => setMSortOrder(Number(e.target.value))}
                  className="w-20 rounded-lg border border-white/10 bg-[#070709] px-2.5 py-1 font-mono-tabular text-xs text-white"
                />
              </label>
              <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mPublished}
                  onChange={(e) => setMPublished(e.target.checked)}
                  className="accent-[#D4AF37]"
                />
                <span>{isFa ? 'نمایش عمومی در سایت' : 'Published on Website'}</span>
              </label>
            </div>
            <button
              type="submit"
              disabled={savingTeam}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E8C563] to-[#C89B2B] text-[#070709] text-sm font-semibold hover:brightness-110 disabled:opacity-60 cursor-pointer"
            >
              {savingTeam
                ? isFa
                  ? 'در حال ذخیره...'
                  : 'Saving...'
                : editingTeamId
                  ? isFa
                    ? 'ذخیره تغییرات'
                    : 'Save Member'
                  : isFa
                    ? 'افزودن به تیم'
                    : 'Add Member'}
            </button>
          </form>

          <div className="lg:col-span-6 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 left-2.5" />
                <input
                  value={teamQuery}
                  onChange={(e) => setTeamQuery(e.target.value)}
                  placeholder={isFa ? 'جستجو در اعضا...' : 'Search team...'}
                  className="w-full rounded-lg border border-white/10 bg-[#0d0e12] pl-8 pr-2.5 py-1.5 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
              <select
                value={teamPubFilter}
                onChange={(e) => setTeamPubFilter(e.target.value as 'all' | 'published' | 'draft')}
                className="rounded-lg border border-white/10 bg-[#0d0e12] px-2.5 py-1.5 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="all">{isFa ? 'همه وضعیت‌ها' : 'All Status'}</option>
                <option value="published">{isFa ? 'منتشرشده' : 'Published'}</option>
                <option value="draft">{isFa ? 'پیش‌نویس' : 'Draft'}</option>
              </select>
            </div>

            {filteredTeam.length === 0 ? (
              <div className="surface-card rounded-xl p-6 text-xs text-slate-400">
                {t.team.emptyTitle}
              </div>
            ) : (
              filteredTeam.map((m) => (
                <div
                  key={m.id}
                  className="surface-card rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <SafeMedia
                      src={m.avatarUrl}
                      alt={m.nameEn}
                      className="h-10 w-10 rounded-full object-cover border border-white/10 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {isFa ? m.nameFa : m.nameEn}
                      </p>
                      <p className="text-xs text-[#D4AF37] truncate">
                        {isFa ? m.roleFa : m.roleEn} ·{' '}
                        <span className={m.published ? 'text-emerald-400' : 'text-amber-300'}>
                          {m.published ? (isFa ? 'منتشرشده' : 'Published') : isFa ? 'پیش‌نویس' : 'Draft'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => void handleToggleTeamPublish(m)}
                      className="h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center text-slate-300 hover:text-[#F2CF66] cursor-pointer"
                    >
                      {m.published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTeamId(m.id);
                        setMNameFa(m.nameFa);
                        setMNameEn(m.nameEn);
                        setMRoleFa(m.roleFa);
                        setMRoleEn(m.roleEn);
                        setMBioFa(m.bioFa);
                        setMBioEn(m.bioEn);
                        setMAvatarUrl(m.avatarUrl);
                        setMSortOrder(m.sortOrder);
                        setMPublished(m.published);
                      }}
                      className="h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteTeam(m.id)}
                      className="h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center text-red-400 hover:bg-red-500/15 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: Support Tickets */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="h-4 w-4 text-slate-400 absolute top-1/2 -translate-y-1/2 left-3" />
              <input
                value={ticketQuery}
                onChange={(e) => setTicketQuery(e.target.value)}
                placeholder={isFa ? 'جستجو با کد رهگیری، نام، ایمیل یا موضوع...' : 'Search by tracking code, name, email, or subject...'}
                className="w-full rounded-xl border border-white/10 bg-[#0d0e12] pl-9 pr-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <select
              value={ticketStatusFilter}
              onChange={(e) => setTicketStatusFilter(e.target.value as 'all' | TicketStatus)}
              className="rounded-xl border border-white/10 bg-[#0d0e12] px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
            >
              <option value="all">{isFa ? 'همه وضعیت‌ها' : 'All Ticket Statuses'}</option>
              <option value="open">{t.support.statusLabels.open}</option>
              <option value="in_progress">{t.support.statusLabels.in_progress}</option>
              <option value="resolved">{t.support.statusLabels.resolved}</option>
            </select>
          </div>

          {filteredTickets.length === 0 ? (
            <div className="surface-card rounded-xl p-8 text-center text-sm text-slate-400">
              {isFa ? 'تیکتی یافت نشد.' : 'No support tickets match the current filter.'}
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div key={ticket.id} className="surface-card rounded-xl p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-mono-tabular font-bold text-[#D4AF37]">
                        {ticket.trackingCode}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{ticket.name}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">{ticket.email}</span>
                      {ticket.productName && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{ticket.productName}</span>
                        </>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white">{ticket.subject}</h3>
                  </div>
                  <span className="text-xs font-medium text-[#E5C158]">
                    {t.support.statusLabels[ticket.status]}
                  </span>
                </div>

                <p className="text-sm text-slate-300 whitespace-pre-line">{ticket.message}</p>

                <div className="pt-4 border-t border-white/10 space-y-3">
                  <textarea
                    rows={2}
                    value={replyDrafts[ticket.id] ?? ''}
                    onChange={(e) =>
                      setReplyDrafts((prev) => ({ ...prev, [ticket.id]: e.target.value }))
                    }
                    placeholder={isFa ? 'پاسخ رسمی پشتیبانی...' : 'Official support reply...'}
                    className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleTicketUpdate(ticket.id, 'in_progress')}
                      className="px-3.5 py-2 rounded-lg border border-white/15 bg-white/5 text-xs text-slate-200 hover:border-[#D4AF37]/50 cursor-pointer"
                    >
                      {t.support.statusLabels.in_progress}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleTicketUpdate(ticket.id, 'resolved')}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#E8C563] to-[#C89B2B] text-[#070709] text-xs font-semibold cursor-pointer"
                    >
                      {isFa ? 'ثبت پاسخ و بستن تیکت' : 'Save Reply & Resolve'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 6: Suggestions */}
      {activeTab === 'suggestions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="h-4 w-4 text-slate-400 absolute top-1/2 -translate-y-1/2 left-3" />
              <input
                value={sugQuery}
                onChange={(e) => setSugQuery(e.target.value)}
                placeholder={isFa ? 'جستجو در پیشنهادها...' : 'Search suggestions...'}
                className="w-full rounded-xl border border-white/10 bg-[#0d0e12] pl-9 pr-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <select
              value={sugStatusFilter}
              onChange={(e) => setSugStatusFilter(e.target.value as 'all' | SuggestionStatus)}
              className="rounded-xl border border-white/10 bg-[#0d0e12] px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
            >
              <option value="all">{isFa ? 'همه وضعیت‌ها' : 'All Statuses'}</option>
              <option value="new">new</option>
              <option value="reviewed">reviewed</option>
              <option value="planned">planned</option>
              <option value="archived">archived</option>
            </select>
          </div>

          {filteredSuggestions.length === 0 ? (
            <div className="surface-card rounded-xl p-8 text-center text-sm text-slate-400">
              {isFa ? 'پیشنهادی یافت نشد.' : 'No suggestions match the filter.'}
            </div>
          ) : (
            filteredSuggestions.map((s) => (
              <div key={s.id} className="surface-card rounded-xl p-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="text-[#D4AF37]">{t.feedback.categories[s.category]}</span>
                      <span aria-hidden="true">·</span>
                      <span>{s.name}</span>
                      {s.email && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono-tabular">{s.email}</span>
                        </>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white">{s.title}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDeleteSuggestion(s.id)}
                    className="h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center text-red-400 hover:bg-red-500/15 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-sm text-slate-300 whitespace-pre-line">{s.details}</p>
                <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-3">
                  <input
                    value={suggestionNotes[s.id] ?? ''}
                    onChange={(e) =>
                      setSuggestionNotes((prev) => ({ ...prev, [s.id]: e.target.value }))
                    }
                    placeholder={isFa ? 'یادداشت استودیو...' : 'Studio note...'}
                    className="flex-1 min-w-[200px] rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                  {(['reviewed', 'planned', 'archived'] as SuggestionStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => void handleSuggestionUpdate(s.id, st)}
                      className={`px-3 py-1.5 rounded-lg text-xs border cursor-pointer ${
                        s.status === st
                          ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#F2CF66]'
                          : 'border-white/15 text-slate-300 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 7: Contact Inbox */}
      {activeTab === 'messages' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="h-4 w-4 text-slate-400 absolute top-1/2 -translate-y-1/2 left-3" />
              <input
                value={msgQuery}
                onChange={(e) => setMsgQuery(e.target.value)}
                placeholder={isFa ? 'جستجو در پیام‌های تماس...' : 'Search messages...'}
                className="w-full rounded-xl border border-white/10 bg-[#0d0e12] pl-9 pr-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <select
              value={msgReadFilter}
              onChange={(e) => setMsgReadFilter(e.target.value as 'all' | 'unread' | 'read')}
              className="rounded-xl border border-white/10 bg-[#0d0e12] px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
            >
              <option value="all">{isFa ? 'همه پیام‌ها' : 'All Messages'}</option>
              <option value="unread">{isFa ? 'خوانده‌نشده' : 'Unread'}</option>
              <option value="read">{isFa ? 'خوانده‌شده' : 'Read'}</option>
            </select>
          </div>

          {filteredMessages.length === 0 ? (
            <div className="surface-card rounded-xl p-8 text-center text-sm text-slate-400">
              {isFa ? 'پیامی مطابق فیلتر یافت نشد.' : 'No contact messages found.'}
            </div>
          ) : (
            filteredMessages.map((m) => (
              <div key={m.id} className="surface-card rounded-xl p-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-semibold text-white">{m.name}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">{m.email}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">{m.createdAt.slice(0, 10)}</span>
                    </div>
                    <h3 className="text-base font-bold text-[#F2CF66]">{m.subject}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleToggleMessageRead(m.id, !m.read)}
                      className="px-3 py-1.5 rounded-lg border border-white/15 text-xs text-slate-200 hover:border-[#D4AF37]/50 cursor-pointer"
                    >
                      {m.read
                        ? isFa
                          ? 'خوانده‌شده'
                          : 'Read'
                        : isFa
                          ? 'علامت‌گذاری خوانده‌شده'
                          : 'Mark Read'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteMessage(m.id)}
                      className="h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center text-red-400 hover:bg-red-500/15 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-300 whitespace-pre-line">{m.message}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB: Supabase Storage Media Library */}
      {activeTab === 'media' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white">
                {isFa ? 'فایل‌های رسانه‌ای باکت studio-media' : 'Supabase Storage Media Library (studio-media)'}
              </h2>
              <p className="text-xs text-slate-400">
                {isFa
                  ? 'تصاویر بارگذاری‌شده در Supabase Storage را بررسی یا فایل‌های اضافی را حذف کنید.'
                  : 'Inspect uploaded assets in Supabase Storage or remove unused files.'}
              </p>
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#E8C563] to-[#C89B2B] text-[#070709] text-xs font-semibold hover:brightness-110 cursor-pointer">
              <Upload className="h-3.5 w-3.5" />
              <span>
                {uploadingField === 'library'
                  ? isFa
                    ? 'در حال آپلود...'
                    : 'Uploading...'
                  : isFa
                    ? 'آپلود تصویر جدید'
                    : 'Upload Image'}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  const url = await uploadToSupabaseStorage(file, 'general', 'library');
                  if (url) {
                    await loadAdminData();
                    flash(isFa ? 'تصویر جدید بارگذاری شد.' : 'Image uploaded to Storage.');
                  }
                }}
              />
            </label>
          </div>

          {mediaItems.length === 0 ? (
            <div className="surface-card rounded-xl p-8 text-center text-sm text-slate-400">
              {isFa ? 'هنوز فایلی در باکت studio-media ذخیره نشده است.' : 'No files found in studio-media bucket.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {mediaItems.map((m) => (
                <div key={m.path} className="surface-card rounded-xl overflow-hidden flex flex-col justify-between">
                  <SafeMedia src={m.url} alt={m.name} className="h-36 w-full object-cover bg-[#070709] border-b border-white/10" />
                  <div className="p-3 space-y-2">
                    <p className="font-mono-tabular text-[11px] text-[#D4AF37] truncate">{m.folder}</p>
                    <p className="font-mono-tabular text-xs text-white truncate">{m.name}</p>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="font-mono-tabular text-[10px] text-slate-400">
                        {m.size ? `${Math.round(m.size / 1024)} KB` : '—'}
                      </span>
                      <button
                        type="button"
                        disabled={deletingMediaPath === m.path}
                        onClick={() => void handleDeleteMedia(m.path)}
                        className="h-7 w-7 rounded-lg border border-white/10 flex items-center justify-center text-red-400 hover:bg-red-500/15 disabled:opacity-50 cursor-pointer"
                        title={isFa ? 'حذف فایل' : 'Delete file'}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 8: General Site Settings */}
      {activeTab === 'settings' && canManageSettings && (
        <form onSubmit={handleSaveSettings} className="surface-card rounded-2xl p-6 sm:p-8 space-y-6 max-w-4xl">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <Globe className="h-5 w-5 text-[#D4AF37]" />
            <div>
              <h2 className="text-base font-bold text-white">
                {isFa ? 'تنظیمات عمومی وب‌سایت TAK1' : 'General Studio Website Settings'}
              </h2>
              {siteSettings?.updatedAt && (
                <p className="font-mono-tabular text-[11px] text-slate-500">
                  {isFa ? 'آخرین بروزرسانی:' : 'Updated:'} {siteSettings.updatedAt.slice(0, 19)}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1 text-xs text-slate-300">
              <span>{isFa ? 'نام استودیو (فارسی)' : 'Studio Name (FA)'}</span>
              <input
                value={sNameFa}
                onChange={(e) => setSNameFa(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </label>
            <label className="block space-y-1 text-xs text-slate-300">
              <span>{isFa ? 'نام استودیو (انگلیسی)' : 'Studio Name (EN)'}</span>
              <input
                value={sNameEn}
                onChange={(e) => setSNameEn(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </label>
            <label className="block space-y-1 text-xs text-slate-300">
              <span>{isFa ? 'شعار / معرفی فوتر (فارسی)' : 'Footer Tagline (FA)'}</span>
              <input
                value={sTaglineFa}
                onChange={(e) => setSTaglineFa(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </label>
            <label className="block space-y-1 text-xs text-slate-300">
              <span>{isFa ? 'شعار / معرفی فوتر (انگلیسی)' : 'Footer Tagline (EN)'}</span>
              <input
                value={sTaglineEn}
                onChange={(e) => setSTaglineEn(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </label>
            <label className="block space-y-1 text-xs text-slate-300">
              <span>{isFa ? 'ایمیل رسمی پشتیبانی / تماس' : 'Official Contact Email'}</span>
              <input
                type="email"
                value={sEmail}
                onChange={(e) => setSEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 font-mono-tabular text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </label>
            <label className="block space-y-1 text-xs text-slate-300">
              <span>{isFa ? 'دامنه رسمی' : 'Official Domain'}</span>
              <input
                value={sDomain}
                onChange={(e) => setSDomain(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 font-mono-tabular text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </label>
            <label className="block space-y-1 text-xs text-slate-300">
              <span>{isFa ? 'پیام اعلان عمومی (فارسی - اختیاری)' : 'Public Announcement (FA)'}</span>
              <input
                value={sAnnFa}
                onChange={(e) => setSAnnFa(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </label>
            <label className="block space-y-1 text-xs text-slate-300">
              <span>{isFa ? 'پیام اعلان عمومی (انگلیسی - اختیاری)' : 'Public Announcement (EN)'}</span>
              <input
                value={sAnnEn}
                onChange={(e) => setSAnnEn(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
            <label className="block space-y-1 text-xs text-slate-300">
              <span>Telegram URL</span>
              <input
                value={sTelegram}
                onChange={(e) => setSTelegram(e.target.value)}
                placeholder="https://t.me/..."
                className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </label>
            <label className="block space-y-1 text-xs text-slate-300">
              <span>Instagram URL</span>
              <input
                value={sInstagram}
                onChange={(e) => setSInstagram(e.target.value)}
                placeholder="https://instagram.com/..."
                className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </label>
            <label className="block space-y-1 text-xs text-slate-300">
              <span>Discord URL</span>
              <input
                value={sDiscord}
                onChange={(e) => setSDiscord(e.target.value)}
                placeholder="https://discord.gg/..."
                className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </label>
            <label className="block space-y-1 text-xs text-slate-300">
              <span>GitHub URL</span>
              <input
                value={sGithub}
                onChange={(e) => setSGithub(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </label>
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={sMaint}
              onChange={(e) => setSMaint(e.target.checked)}
              className="accent-[#D4AF37]"
            />
            <span>{isFa ? 'حالت نگهداری (Maintenance Mode)' : 'Maintenance Mode'}</span>
          </label>

          <div>
            <button
              type="submit"
              disabled={savingSettings}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E8C563] to-[#C89B2B] text-[#070709] text-sm font-semibold hover:brightness-110 disabled:opacity-60 cursor-pointer"
            >
              {savingSettings
                ? isFa
                  ? 'در حال ذخیره...'
                  : 'Saving...'
                : isFa
                  ? 'ذخیره تنظیمات در Supabase'
                  : 'Save Site Settings'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 9: Admin Users & Roles (super_admin ONLY) */}
      {activeTab === 'admins' && canManageAdmins && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handleCreateAdminUser}
            className="lg:col-span-5 surface-card rounded-2xl p-6 space-y-4"
          >
            <h2 className="text-base font-bold text-white">
              {isFa ? 'افزودن مدیر جدید (Supabase Auth)' : 'Add Studio Administrator'}
            </h2>
            <label className="block space-y-1 text-xs text-slate-300">
              <span>{isFa ? 'نام نمایشی' : 'Display Name'}</span>
              <input
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </label>
            <label className="block space-y-1 text-xs text-slate-300">
              <span>{isFa ? 'ایمیل *' : 'Email *'}</span>
              <input
                required
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </label>
            <label className="block space-y-1 text-xs text-slate-300">
              <span>{isFa ? 'رمز عبور (حداقل ۸ کاراکتر) *' : 'Password (min 8 chars) *'}</span>
              <input
                required
                minLength={8}
                type="password"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </label>
            <label className="block space-y-1 text-xs text-slate-300">
              <span>{isFa ? 'سطح دسترسی (Role)' : 'Access Role'}</span>
              <select
                value={newAdminRole}
                onChange={(e) => setNewAdminRole(e.target.value as AdminRole)}
                className="w-full rounded-xl border border-white/10 bg-[#070709] px-3 py-2 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="editor">editor ({isFa ? 'مدیریت محتوا' : 'Content Only'})</option>
                <option value="admin">admin ({isFa ? 'مدیریت کامل + تنظیمات' : 'Full + Settings'})</option>
                {session.adminRole === 'super_admin' && (
                  <option value="super_admin">super_admin ({isFa ? 'مدیر ارشد' : 'Super Admin'})</option>
                )}
              </select>
            </label>
            <button
              type="submit"
              disabled={savingAdmin}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E8C563] to-[#C89B2B] text-[#070709] text-sm font-semibold hover:brightness-110 disabled:opacity-60 cursor-pointer"
            >
              {savingAdmin
                ? isFa
                  ? 'در حال ساخت...'
                  : 'Creating...'
                : isFa
                  ? 'ساخت حساب مدیر'
                  : 'Create Admin Account'}
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            {adminUsers.map((u) => (
              <div
                key={u.id}
                className="surface-card rounded-xl p-4 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {u.displayName || u.email}
                  </p>
                  <p className="font-mono-tabular text-xs text-slate-400 truncate">
                    {u.email} · {u.isActive ? (isFa ? 'فعال' : 'Active') : isFa ? 'غیرفعال' : 'Disabled'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={u.role}
                    disabled={u.id === session.adminId}
                    onChange={(e) => void handleChangeAdminRole(u, e.target.value as AdminRole)}
                    className="rounded-lg border border-white/10 bg-[#070709] px-2.5 py-1.5 font-mono-tabular text-xs text-white disabled:opacity-50"
                  >
                    <option value="editor">editor</option>
                    <option value="admin">admin</option>
                    <option value="super_admin">super_admin</option>
                  </select>

                  {u.id !== session.adminId && (
                    <>
                      <button
                        type="button"
                        onClick={() => void handleToggleAdminActive(u)}
                        className="px-2.5 py-1.5 rounded-lg border border-white/15 text-xs text-slate-200 hover:border-[#D4AF37]/50 cursor-pointer"
                      >
                        {u.isActive ? (isFa ? 'غیرفعال کردن' : 'Disable') : isFa ? 'فعال کردن' : 'Enable'}
                      </button>
                      {session.adminRole === 'super_admin' && (
                        <button
                          type="button"
                          onClick={() => void handleDeleteAdminUser(u.id)}
                          className="h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center text-red-400 hover:bg-red-500/15 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
