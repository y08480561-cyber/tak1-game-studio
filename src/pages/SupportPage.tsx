import { useState, useEffect, type FormEvent } from 'react';
import { CheckCircle2, Clock, History, LifeBuoy, RefreshCw, Search } from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import type { TicketStatus } from '../types/studio';

interface TrackedTicketResult {
  trackingCode: string;
  subject: string;
  productName: string;
  status: TicketStatus;
  adminReply: string;
  repliedAt: string | null;
  createdAt: string;
}

interface LocalTicketRecord {
  trackingCode: string;
  subject: string;
  productName: string;
  status: TicketStatus;
  adminReply: string;
  createdAt: string;
}

const STORAGE_KEY = 'tak1_my_tickets';

export function SupportPage() {
  const { t, products, lang, navigate } = useStudio();
  const isRtl = lang === 'fa';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [productName, setProductName] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const [trackCode, setTrackCode] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackedTicket, setTrackedTicket] = useState<TrackedTicketResult | null>(null);
  const [trackNotFound, setTrackNotFound] = useState(false);

  const [myTickets, setMyTickets] = useState<LocalTicketRecord[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as LocalTicketRecord[];
        if (Array.isArray(parsed)) {
          setMyTickets(parsed);
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  const saveTicketToLocal = (newTicket: LocalTicketRecord) => {
    setMyTickets((prev) => {
      const filtered = prev.filter((item) => item.trackingCode !== newTicket.trackingCode);
      const updated = [newTicket, ...filtered].slice(0, 15);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setCreatedCode(null);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, productName, subject, message }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Submission failed');
      const code = json.ticket.trackingCode;
      setCreatedCode(code);

      // Save to local history
      saveTicketToLocal({
        trackingCode: code,
        subject: subject.trim(),
        productName: productName.trim(),
        status: 'open',
        adminReply: '',
        createdAt: new Date().toISOString(),
      });

      setName('');
      setEmail('');
      setProductName('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrack = async (codeToTrack?: string) => {
    const target = (codeToTrack ?? trackCode).trim();
    if (!target) return;
    setTrackingLoading(true);
    setTrackNotFound(false);
    setTrackedTicket(null);
    if (codeToTrack) setTrackCode(codeToTrack);
    try {
      const res = await fetch(`/api/support/track/${encodeURIComponent(target)}`);
      if (!res.ok) {
        setTrackNotFound(true);
        return;
      }
      const json = await res.json();
      setTrackedTicket(json.ticket);

      // Update local storage record status & adminReply if exists
      setMyTickets((prev) => {
        const updated = prev.map((item) =>
          item.trackingCode === json.ticket.trackingCode
            ? { ...item, status: json.ticket.status, adminReply: json.ticket.adminReply || '' }
            : item,
        );
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // Ignore
        }
        return updated;
      });
    } catch {
      setTrackNotFound(true);
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleRefreshHistory = async () => {
    if (myTickets.length === 0) return;
    for (const item of myTickets) {
      try {
        const res = await fetch(`/api/support/track/${encodeURIComponent(item.trackingCode)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.ticket) {
            setMyTickets((prev) =>
              prev.map((t) =>
                t.trackingCode === json.ticket.trackingCode
                  ? { ...t, status: json.ticket.status, adminReply: json.ticket.adminReply || '' }
                  : t,
              ),
            );
          }
        }
      } catch {
        // Continue
      }
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(myTickets));
    } catch {
      // Ignore
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 space-y-10">
      {/* Community Hub Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-2">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
            {t.support.title}
          </h1>
          <p className="text-base text-slate-400">{t.support.subtitle}</p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-white/10 bg-[#0d0e12]">
          <button
            type="button"
            onClick={() => navigate('/support')}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#E8C563] to-[#C89B2B] text-[#070709] whitespace-nowrap cursor-pointer"
          >
            {t.nav.support}
          </button>
          <button
            type="button"
            onClick={() => navigate('/feedback')}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 whitespace-nowrap cursor-pointer"
          >
            {t.nav.feedback}
          </button>
          <button
            type="button"
            onClick={() => navigate('/contact')}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 whitespace-nowrap cursor-pointer"
          >
            {t.nav.contact}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Submit Support Ticket Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 surface-card rounded-2xl p-6 sm:p-8 space-y-5"
        >
          <div className="flex items-center gap-2.5 text-white">
            <LifeBuoy className="h-5 w-5 text-[#D4AF37]" />
            <h2 className="text-lg font-bold">{t.support.formTitle}</h2>
          </div>

          {createdCode && (
            <div className="rounded-xl border border-[#D4AF37]/45 bg-[#D4AF37]/10 p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#F2CF66]">
                <CheckCircle2 className="h-4 w-4" />
                <span>{t.support.successTitle}</span>
              </div>
              <p className="text-xs text-slate-200">
                {t.support.successTracking}{' '}
                <span className="font-mono-tabular font-bold text-white">{createdCode}</span>
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1.5 text-xs text-slate-300">
              <span>{t.support.name} *</span>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#070709] px-3.5 py-2.5 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </label>

            <label className="block space-y-1.5 text-xs text-slate-300">
              <span>{t.support.email} *</span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#070709] px-3.5 py-2.5 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1.5 text-xs text-slate-300">
              <span>{t.support.product}</span>
              {products.length > 0 ? (
                <select
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#070709] px-3.5 py-2.5 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="">—</option>
                  {products.map((p) => (
                    <option key={p.id} value={isRtl ? p.titleFa : p.titleEn}>
                      {isRtl ? p.titleFa : p.titleEn}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#070709] px-3.5 py-2.5 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              )}
            </label>

            <label className="block space-y-1.5 text-xs text-slate-300">
              <span>{t.support.subject} *</span>
              <input
                required
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#070709] px-3.5 py-2.5 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </label>
          </div>

          <label className="block space-y-1.5 text-xs text-slate-300">
            <span>{t.support.message} *</span>
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#070709] px-3.5 py-2.5 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#E8C563] to-[#C89B2B] text-[#070709] text-sm font-semibold hover:brightness-110 disabled:opacity-60 transition cursor-pointer"
          >
            {submitting ? t.support.submitting : t.support.submit}
          </button>
        </form>

        {/* Ticket Tracking & History Box (Matches CSS Selector 1) */}
        <div className="lg:col-span-5 surface-card rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 text-white">
            <Search className="h-5 w-5 text-[#D4AF37]" />
            <h2 className="text-lg font-bold">{t.support.trackTitle}</h2>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleTrack();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={trackCode}
              onChange={(e) => setTrackCode(e.target.value)}
              placeholder={t.support.trackPlaceholder}
              className="flex-1 rounded-xl border border-white/10 bg-[#070709] px-3.5 py-2.5 font-mono-tabular text-sm text-white focus:border-[#D4AF37] focus:outline-none"
            />
            <button
              type="submit"
              disabled={trackingLoading}
              className="px-4 py-2.5 rounded-xl border border-white/15 bg-white/10 text-xs font-semibold text-white hover:border-[#D4AF37]/50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.support.trackButton}
            </button>
          </form>

          {trackNotFound && (
            <p className="text-xs text-red-300">{t.support.trackNotFound}</p>
          )}

          {trackedTicket && (
            <div className="rounded-xl border border-white/10 bg-[#070709] p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono-tabular font-bold text-[#D4AF37]">
                  {trackedTicket.trackingCode}
                </span>
                <span className="text-slate-300">
                  {t.support.statusLabels[trackedTicket.status]}
                </span>
              </div>
              <p className="text-sm font-semibold text-white">{trackedTicket.subject}</p>
              {trackedTicket.adminReply ? (
                <div className="pt-3 border-t border-white/10 space-y-1">
                  <p className="text-xs font-medium text-[#E5C158]">{t.support.adminReplyLabel}</p>
                  <p className="text-sm text-slate-200 whitespace-pre-line">
                    {trackedTicket.adminReply}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400">{t.support.awaitingReply}</p>
              )}
            </div>
          )}

          {/* Persistent Ticket History Section */}
          <div className="pt-6 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <History className="h-4 w-4 text-[#D4AF37]" />
                <h3 className="text-sm font-bold">{t.support.historyTitle}</h3>
              </div>
              {myTickets.length > 0 && (
                <button
                  type="button"
                  onClick={() => void handleRefreshHistory()}
                  className="inline-flex items-center gap-1.5 text-xs text-[#E5C158] hover:text-[#F8E59D] cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>{t.support.refreshHistory}</span>
                </button>
              )}
            </div>

            {myTickets.length === 0 ? (
              <p className="text-xs text-slate-500 italic">{t.support.historyEmpty}</p>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {myTickets.map((item) => (
                  <div
                    key={item.trackingCode}
                    onClick={() => void handleTrack(item.trackingCode)}
                    className="rounded-xl border border-white/10 bg-[#070709] p-3.5 space-y-2 cursor-pointer hover:border-[#D4AF37]/50 transition"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono-tabular font-bold text-[#D4AF37]">
                        {item.trackingCode}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-300">
                        <Clock className="h-3 w-3 text-slate-500" />
                        {t.support.statusLabels[item.status]}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-white truncate">{item.subject}</p>
                    {item.adminReply ? (
                      <p className="text-xs text-emerald-300 line-clamp-2">
                        <span className="font-medium text-[#E5C158]">پاسخ: </span>
                        {item.adminReply}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500">{t.support.awaitingReply}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
