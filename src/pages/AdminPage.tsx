import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  BarChart3,
  Check,
  Database,
  Gamepad2,
  Inbox,
  LifeBuoy,
  LogOut,
  MessageSquarePlus,
  Newspaper,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import type {
  AdminOverviewStats,
  AdminSessionStatus,
  ContactMessage,
  NewsPost,
  Product,
  ProductCategory,
  Suggestion,
  SuggestionStatus,
  SupportTicket,
  TeamMember,
  TicketStatus,
} from '../types/studio';
import { SafeMedia } from '../components/SafeMedia';

type AdminTab = 'overview' | 'products' | 'news' | 'team' | 'tickets' | 'suggestions' | 'messages';

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
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
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

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

  // Ticket Reply Drafts
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [suggestionNotes, setSuggestionNotes] = useState<Record<string, string>>({});

  const flash = (msg: string) => {
    setFeedbackBanner(msg);
    setTimeout(() => setFeedbackBanner(null), 3500);
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
      const [ovRes, prodRes, newsRes, teamRes, tickRes, sugRes, msgRes] = await Promise.all([
        fetch('/api/admin/overview'),
        fetch('/api/admin/products'),
        fetch('/api/news'),
        fetch('/api/team'),
        fetch('/api/admin/tickets'),
        fetch('/api/admin/suggestions'),
        fetch('/api/admin/messages'),
      ]);

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
    } catch {
      // ignore transient load failures
    }
  }, []);

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
        body: JSON.stringify({ email: authEmail, password: authPassword }),
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

    const url = editingProductId
      ? `/api/admin/products/${editingProductId}`
      : '/api/admin/products';
    const method = editingProductId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      resetProductForm();
      await Promise.all([loadAdminData(), refreshPublicData()]);
      flash(isFa ? 'محصول با موفقیت ذخیره شد.' : 'Product saved successfully.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await Promise.all([loadAdminData(), refreshPublicData()]);
      flash(isFa ? 'محصول حذف شد.' : 'Product deleted.');
    }
  };

  const handleNewsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      titleFa: nTitleFa,
      titleEn: nTitleEn,
      category: nCategory,
      summaryFa: nSummaryFa,
      summaryEn: nSummaryEn,
      contentFa: nContentFa,
      contentEn: nContentEn,
      coverUrl: nCoverUrl,
    };
    const url = editingNewsId ? `/api/admin/news/${editingNewsId}` : '/api/admin/news';
    const method = editingNewsId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setEditingNewsId(null);
      setNTitleFa('');
      setNTitleEn('');
      setNSummaryFa('');
      setNSummaryEn('');
      setNContentFa('');
      setNContentEn('');
      setNCoverUrl('');
      await Promise.all([loadAdminData(), refreshPublicData()]);
      flash(isFa ? 'خبر منتشر شد.' : 'News dispatch saved.');
    }
  };

  const handleDeleteNews = async (id: string) => {
    const res = await fetch(`/api/admin/news/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await Promise.all([loadAdminData(), refreshPublicData()]);
      flash(isFa ? 'خبر حذف شد.' : 'News deleted.');
    }
  };

  const handleTeamSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      nameFa: mNameFa,
      nameEn: mNameEn,
      roleFa: mRoleFa,
      roleEn: mRoleEn,
      bioFa: mBioFa,
      bioEn: mBioEn,
      avatarUrl: mAvatarUrl,
      sortOrder: mSortOrder,
    };
    const url = editingTeamId ? `/api/admin/team/${editingTeamId}` : '/api/admin/team';
    const method = editingTeamId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setEditingTeamId(null);
      setMNameFa('');
      setMNameEn('');
      setMRoleFa('');
      setMRoleEn('');
      setMBioFa('');
      setMBioEn('');
      setMAvatarUrl('');
      setMSortOrder(0);
      await Promise.all([loadAdminData(), refreshPublicData()]);
      flash(isFa ? 'اطلاعات عضو تیم ذخیره شد.' : 'Team member saved.');
    }
  };

  const handleDeleteTeam = async (id: string) => {
    const res = await fetch(`/api/admin/team/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await Promise.all([loadAdminData(), refreshPublicData()]);
      flash(isFa ? 'عضو تیم حذف شد.' : 'Team member removed.');
    }
  };

  const handleTicketUpdate = async (id: string, status: TicketStatus) => {
    const res = await fetch(`/api/admin/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminReply: replyDrafts[id] ?? '' }),
    });
    if (res.ok) {
      await loadAdminData();
      flash(isFa ? 'پاسخ تیکت ثبت شد.' : 'Support ticket updated.');
    }
  };

  const handleSuggestionUpdate = async (id: string, status: SuggestionStatus) => {
    const res = await fetch(`/api/admin/suggestions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNote: suggestionNotes[id] ?? '' }),
    });
    if (res.ok) {
      await loadAdminData();
      flash(isFa ? 'وضعیت پیشنهاد به‌روزرسانی شد.' : 'Suggestion updated.');
    }
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

  const handleUploadSingle = async (
    e: ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setter(dataUrl);
  };

  const handleUploadScreenshot = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const urls = await Promise.all(files.map(fileToDataUrl));
    setPScreenshots((prev) => [...prev, ...urls]);
  };

  if (loadingSession) {
    return (
      <div className="mx-auto max-w-md px-4 py-24">
        <div className="h-64 rounded-2xl border border-white/10 bg-[#0d0e12] animate-pulse" />
      </div>
    );
  }

  // ---- Authentication / Setup Screen ----
  if (!session?.authenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-20">
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
                ? 'با ایمیل و رمز عبوری که در راه‌اندازی اولیه ثبت کرده‌اید (یا مقادیر ADMIN_EMAIL و ADMIN_PASSWORD در تنظیمات سرور) وارد شوید.'
                : 'Sign in with the administrator email and password registered during initial setup (or server ADMIN_EMAIL / ADMIN_PASSWORD).'}
            </p>
          )}

          {authError && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">
              {authError}
            </div>
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
      </div>
    );
  }

  const tabs: { id: AdminTab; label: string; icon: typeof BarChart3 }[] = [
    { id: 'overview', label: t.admin.tabs.overview, icon: BarChart3 },
    { id: 'products', label: t.admin.tabs.products, icon: Gamepad2 },
    { id: 'news', label: t.admin.tabs.news, icon: Newspaper },
    { id: 'team', label: t.admin.tabs.team, icon: Users },
    { id: 'tickets', label: t.admin.tabs.tickets, icon: LifeBuoy },
    { id: 'suggestions', label: t.admin.tabs.suggestions, icon: MessageSquarePlus },
    { id: 'messages', label: t.admin.tabs.messages, icon: Inbox },
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
            <span aria-hidden="true">·</span>
            <span>
              {t.admin.storageLabel}{' '}
              {session.storageMode === 'supabase'
                ? t.admin.storageSupabase
                : t.admin.storageLocal}
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
              <p className="text-xs text-slate-400">{isFa ? 'محصولات منتشرشده' : 'Published Products'}</p>
              <p className="font-mono-tabular text-3xl font-bold text-white">
                {overview?.publishedProducts ?? 0}
                <span className="text-sm font-normal text-slate-500">
                  {' '}
                  / {overview?.totalProducts ?? 0}
                </span>
              </p>
            </div>

            <div className="surface-card rounded-xl p-5 space-y-1.5">
              <p className="text-xs text-slate-400">{isFa ? 'اخبار و اطلاعیه‌ها' : 'News Dispatches'}</p>
              <p className="font-mono-tabular text-3xl font-bold text-white">
                {overview?.totalNews ?? 0}
              </p>
            </div>

            <div className="surface-card rounded-xl p-5 space-y-1.5">
              <p className="text-xs text-slate-400">{isFa ? 'تیکت‌های باز پشتیبانی' : 'Open Support Tickets'}</p>
              <p className="font-mono-tabular text-3xl font-bold text-[#F2CF66]">
                {overview?.openTickets ?? 0}
                <span className="text-sm font-normal text-slate-500">
                  {' '}
                  / {overview?.totalTickets ?? 0}
                </span>
              </p>
            </div>

            <div className="surface-card rounded-xl p-5 space-y-1.5">
              <p className="text-xs text-slate-400">{isFa ? 'پیشنهادهای جدید / پیام‌ها' : 'New Suggestions / Messages'}</p>
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
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-white">
                {isFa ? 'آماده اتصال به Supabase و استقرار در Render' : 'Supabase & Render Architecture Status'}
              </h2>
              <p className="text-xs leading-relaxed text-slate-400">
                {isFa
                  ? 'کد بک‌اند به‌طور خودکار متغیرهای SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY را بررسی می‌کند. در صورت تنظیم، تمام داده‌ها در PostgreSQL سوپابیس ذخیره می‌شوند و اسکیما در فایل supabase/schema.sql آماده است.'
                  : 'The server repository automatically switches to Supabase PostgreSQL when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured (schema provided in supabase/schema.sql).'}
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
                {isFa ? 'آیکون برنامه (آدرس یا آپلود فایل)' : 'App Icon (URL or Upload)'}
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
                  <span>{isFa ? 'آپلود آیکون' : 'Upload Icon'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => void handleUploadSingle(e, setPIconUrl)}
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
                  <span>{isFa ? 'آپلود تصویر' : 'Upload'}</span>
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
                <span>{isFa ? 'انتشار عمومی در سایت' : 'Published on Website'}</span>
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
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E8C563] to-[#C89B2B] text-[#070709] text-sm font-semibold hover:brightness-110 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>
                {editingProductId
                  ? isFa
                    ? 'ذخیره تغییرات'
                    : 'Save Changes'
                  : isFa
                    ? 'ثبت و انتشار محصول'
                    : 'Create Product'}
              </span>
            </button>
          </form>

          {/* Existing Products List */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">
              {isFa ? `محصولات ثبت‌شده (${adminProducts.length})` : `Registered Products (${adminProducts.length})`}
            </h3>
            {adminProducts.length === 0 ? (
              <div className="surface-card rounded-xl p-6 text-xs text-slate-400">
                {isFa ? 'هنوز محصولی ثبت نشده است.' : 'No products registered yet.'}
              </div>
            ) : (
              adminProducts.map((p) => (
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
                        {p.category} · v{p.version} · {p.published ? 'Published' : 'Draft'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
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
            <h2 className="text-base font-bold text-white">
              {editingNewsId
                ? isFa
                  ? 'ویرایش خبر'
                  : 'Edit News Post'
                : isFa
                  ? 'انتشار خبر یا اطلاعیه جدید'
                  : 'Publish News or Announcement'}
            </h2>
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
                <span>{isFa ? 'آپلود' : 'Upload'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void handleUploadSingle(e, setNCoverUrl)}
                />
              </label>
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E8C563] to-[#C89B2B] text-[#070709] text-sm font-semibold hover:brightness-110 cursor-pointer"
            >
              {editingNewsId ? (isFa ? 'به‌روزرسانی' : 'Update') : isFa ? 'انتشار خبر' : 'Publish'}
            </button>
          </form>

          <div className="lg:col-span-6 space-y-3">
            {adminNews.length === 0 ? (
              <div className="surface-card rounded-xl p-6 text-xs text-slate-400">
                {t.news.emptyTitle}
              </div>
            ) : (
              adminNews.map((post) => (
                <div
                  key={post.id}
                  className="surface-card rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {isFa ? post.titleFa : post.titleEn}
                    </p>
                    <p className="font-mono-tabular text-xs text-slate-400">
                      {post.category} · {post.publishedAt.slice(0, 10)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
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
            <h2 className="text-base font-bold text-white">
              {editingTeamId
                ? isFa
                  ? 'ویرایش عضو تیم'
                  : 'Edit Team Member'
                : isFa
                  ? 'افزودن عضو جدید به تیم TAK1'
                  : 'Add TAK1 Team Member'}
            </h2>
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
                <span>{isFa ? 'آپلود' : 'Upload'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void handleUploadSingle(e, setMAvatarUrl)}
                />
              </label>
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E8C563] to-[#C89B2B] text-[#070709] text-sm font-semibold hover:brightness-110 cursor-pointer"
            >
              {editingTeamId ? (isFa ? 'ذخیره تغییرات' : 'Save Member') : isFa ? 'افزودن به تیم' : 'Add Member'}
            </button>
          </form>

          <div className="lg:col-span-6 space-y-3">
            {adminTeam.length === 0 ? (
              <div className="surface-card rounded-xl p-6 text-xs text-slate-400">
                {t.team.emptyTitle}
              </div>
            ) : (
              adminTeam.map((m) => (
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
                        {isFa ? m.roleFa : m.roleEn}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
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
          {tickets.length === 0 ? (
            <div className="surface-card rounded-xl p-8 text-center text-sm text-slate-400">
              {isFa ? 'هیچ تیکت پشتیبانی ثبت نشده است.' : 'No support tickets submitted yet.'}
            </div>
          ) : (
            tickets.map((ticket) => (
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
          {suggestions.length === 0 ? (
            <div className="surface-card rounded-xl p-8 text-center text-sm text-slate-400">
              {isFa ? 'هنوز پیشنهادی ثبت نشده است.' : 'No suggestions received yet.'}
            </div>
          ) : (
            suggestions.map((s) => (
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
                    placeholder={isFa ? 'یادداشت مدیریتی...' : 'Admin note...'}
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
          {messages.length === 0 ? (
            <div className="surface-card rounded-xl p-8 text-center text-sm text-slate-400">
              {isFa ? 'صندوق پیام‌های تماس خالی است.' : 'Contact inbox is empty.'}
            </div>
          ) : (
            messages.map((m) => (
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
    </div>
  );
}
