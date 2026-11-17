import { ArrowLeft, ArrowRight, Home, Gamepad2 } from 'lucide-react';
import { useStudio } from '../context/StudioContext';

export function NotFoundPage() {
  const { lang, navigate } = useStudio();
  const isFa = lang === 'fa';
  const BackArrow = isFa ? ArrowRight : ArrowLeft;

  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center space-y-6">
      <p className="font-mono-tabular text-xs font-semibold tracking-widest uppercase text-[#D4AF37]">
        404 · Not Found
      </p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
        {isFa ? 'صفحه مورد نظر یافت نشد' : 'Page Not Found'}
      </h1>
      <p className="text-sm sm:text-base leading-relaxed text-slate-400">
        {isFa
          ? 'آدرسی که وارد کرده‌اید وجود ندارد یا منتقل شده است. می‌توانید به صفحه اصلی یا فهرست محصولات بازگردید.'
          : 'The page you requested does not exist or has moved. Return to the studio homepage or browse our catalog.'}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#E8C563] to-[#C89B2B] text-[#070709] text-sm font-semibold hover:brightness-110 transition cursor-pointer"
        >
          <Home className="h-4 w-4" />
          <span>{isFa ? 'بازگشت به خانه' : 'Back to Home'}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/products')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/15 bg-[#0d0e12] text-slate-200 text-sm font-medium hover:border-[#D4AF37]/50 transition cursor-pointer"
        >
          <Gamepad2 className="h-4 w-4" />
          <span>{isFa ? 'مشاهده محصولات' : 'Browse Products'}</span>
          <BackArrow className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
