import { useState, type FormEvent } from 'react';
import { CheckCircle2, MessageSquarePlus } from 'lucide-react';
import { useStudio } from '../context/StudioContext';

export function FeedbackPage() {
  const { t, navigate } = useStudio();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<'feature' | 'game_idea' | 'improvement' | 'other'>('feature');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, category, title, details }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to submit suggestion');
      setSuccess(true);
      setName('');
      setEmail('');
      setTitle('');
      setDetails('');
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8 space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-2">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
            {t.feedback.title}
          </h1>
          <p className="max-w-2xl text-base text-slate-400">{t.feedback.subtitle}</p>
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
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#E8C563] to-[#C89B2B] text-[#070709] whitespace-nowrap cursor-pointer"
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

      <form onSubmit={handleSubmit} className="surface-card rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2.5 text-white">
          <MessageSquarePlus className="h-5 w-5 text-[#D4AF37]" />
          <h2 className="text-lg font-bold">{t.feedback.title}</h2>
        </div>

        {success && (
          <div className="rounded-xl border border-[#D4AF37]/45 bg-[#D4AF37]/10 p-4 flex items-center gap-2.5 text-sm text-[#F2CF66]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{t.feedback.successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="block space-y-1.5 text-xs text-slate-300">
            <span>{t.feedback.name} *</span>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#070709] px-3.5 py-2.5 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
            />
          </label>

          <label className="block space-y-1.5 text-xs text-slate-300">
            <span>{t.feedback.email}</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#070709] px-3.5 py-2.5 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
            />
          </label>

          <label className="block space-y-1.5 text-xs text-slate-300">
            <span>{t.feedback.category}</span>
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as 'feature' | 'game_idea' | 'improvement' | 'other')
              }
              className="w-full rounded-xl border border-white/10 bg-[#070709] px-3.5 py-2.5 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
            >
              <option value="feature">{t.feedback.categories.feature}</option>
              <option value="game_idea">{t.feedback.categories.game_idea}</option>
              <option value="improvement">{t.feedback.categories.improvement}</option>
              <option value="other">{t.feedback.categories.other}</option>
            </select>
          </label>
        </div>

        <label className="block space-y-1.5 text-xs text-slate-300">
          <span>{t.feedback.titleLabel} *</span>
          <input
            required
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#070709] px-3.5 py-2.5 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
          />
        </label>

        <label className="block space-y-1.5 text-xs text-slate-300">
          <span>{t.feedback.detailsLabel} *</span>
          <textarea
            required
            rows={5}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#070709] px-3.5 py-2.5 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#E8C563] to-[#C89B2B] text-[#070709] text-sm font-semibold hover:brightness-110 disabled:opacity-60 transition cursor-pointer"
        >
          {submitting ? t.feedback.submitting : t.feedback.submit}
        </button>
      </form>
    </div>
  );
}
