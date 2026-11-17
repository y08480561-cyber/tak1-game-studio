import { useState, type FormEvent } from 'react';
import { CheckCircle2, Globe, Mail, Clock } from 'lucide-react';
import { useStudio } from '../context/StudioContext';

export function ContactPage() {
  const { t, navigate } = useStudio();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to send message');
      setSuccess(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-2">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
            {t.contact.title}
          </h1>
          <p className="text-base text-slate-400">{t.contact.subtitle}</p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-white/10 bg-[#0d0e12]">
          <button
            type="button"
            onClick={() => navigate('/support')}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 whitespace-nowrap cursor-pointer"
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
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#E8C563] to-[#C89B2B] text-[#070709] whitespace-nowrap cursor-pointer"
          >
            {t.nav.contact}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-4">
          <div className="surface-card rounded-xl p-5 flex items-start gap-4">
            <Globe className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400">{t.contact.officialDomain}</p>
              <p className="font-mono-tabular text-base font-semibold text-white">
                kalametgame.ir
              </p>
            </div>
          </div>

          <div className="surface-card rounded-xl p-5 flex items-start gap-4">
            <Mail className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400">{t.contact.studioEmail}</p>
              <p className="font-mono-tabular text-base font-semibold text-white">
                contact@kalametgame.ir
              </p>
            </div>
          </div>

          <div className="surface-card rounded-xl p-5 flex items-start gap-4">
            <Clock className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400">{t.contact.responseTime}</p>
              <p className="text-sm font-medium text-white">{t.contact.responseTimeValue}</p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 surface-card rounded-2xl p-6 sm:p-8 space-y-5"
        >
          <h2 className="text-lg font-bold text-white">{t.contact.formTitle}</h2>

          {success && (
            <div className="rounded-xl border border-[#D4AF37]/45 bg-[#D4AF37]/10 p-4 flex items-center gap-2.5 text-sm text-[#F2CF66]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{t.contact.successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1.5 text-xs text-slate-300">
              <span>{t.contact.name} *</span>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#070709] px-3.5 py-2.5 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </label>

            <label className="block space-y-1.5 text-xs text-slate-300">
              <span>{t.contact.email} *</span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#070709] px-3.5 py-2.5 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </label>
          </div>

          <label className="block space-y-1.5 text-xs text-slate-300">
            <span>{t.contact.subject} *</span>
            <input
              required
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#070709] px-3.5 py-2.5 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
            />
          </label>

          <label className="block space-y-1.5 text-xs text-slate-300">
            <span>{t.contact.message} *</span>
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
            {submitting ? t.contact.submitting : t.contact.submit}
          </button>
        </form>
      </div>
    </div>
  );
}
