import { useState, type FormEvent } from 'react';
import { CheckCircle2, LifeBuoy, Search } from 'lucide-react';
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
      setCreatedCode(json.ticket.trackingCode);
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

  const handleTrack = async (e: FormEvent) => {
    e.preventDefault();
    if (!trackCode.trim()) return;
    setTrackingLoading(true);
    setTrackNotFound(false);
    setTrackedTicket(null);
    try {
      const res = await fetch(`/api/support/track/${encodeURIComponent(trackCode.trim())}`);
      if (!res.ok) {
        setTrackNotFound(true);
        return;
      }
      const json = await res.json();
      setTrackedTicket(json.ticket);
    } catch {
      setTrackNotFound(true);
    } finally {
      setTrackingLoading(false);
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

        {/* Ticket Tracking Box */}
        <div className="lg:col-span-5 surface-card rounded-2xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2.5 text-white">
            <Search className="h-5 w-5 text-[#D4AF37]" />
            <h2 className="text-lg font-bold">{t.support.trackTitle}</h2>
          </div>

          <form onSubmit={handleTrack} className="flex gap-2">
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
        </div>
      </div>
    </div>
  );
}
