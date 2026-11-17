import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useStudio } from '../context/StudioContext';

export function Navbar() {
  const { lang, path, navigate, toggleLang, t } = useStudio();
  const isFa = lang === 'fa';
  const [mobileOpen, setMobileOpen] = useState(false);

  const primaryLinks = [
    { to: '/', label: t.nav.home },
    { to: '/products', label: t.nav.products },
    { to: '/team', label: t.nav.team },
    { to: '/news', label: t.nav.news },
    { to: '/support', label: t.nav.support },
  ];

  const allMobileLinks = [
    ...primaryLinks,
    { to: '/feedback', label: t.nav.feedback },
    { to: '/contact', label: t.nav.contact },
  ];

  const isActive = (to: string) => {
    if (to === '/') return path === '/';
    return path === to || path.startsWith(`${to}/`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070709]/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Zone 1: Single-line Brand Lockup */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
            setMobileOpen(false);
          }}
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
        >
          <img
            src="/assets/aistudio/image_3e0bd734.png"
            alt={isFa ? 'توسعه‌دهندگان بازی تک۱ | TAK1 Game Studio' : 'TAK1 Game Studio'}
            className="h-9 w-9 rounded-lg object-cover border border-white/10"
          />
          {isFa ? (
            <span className="flex flex-col leading-tight">
              <span className="font-display text-sm sm:text-base font-bold tracking-tight text-white">
                توسعه‌دهندگان بازی <span className="text-[#D4AF37]">تک۱</span>
              </span>
            </span>
          ) : (
            <span className="flex flex-col leading-tight">
              <span className="font-display text-base sm:text-lg font-bold tracking-tight text-white">
                TAK<span className="text-[#D4AF37]">1</span>{' '}
                <span className="text-sm font-medium text-slate-300">Game Studio</span>
              </span>
            </span>
          )}
        </a>

        {/* Zone 2: 5 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          {primaryLinks.map((link) => {
            const active = isActive(link.to);
            return (
              <a
                key={link.to}
                href={link.to}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(link.to);
                }}
                className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors duration-150 ${
                  active
                    ? 'border-[#D4AF37] text-white'
                    : 'border-transparent text-slate-300 hover:text-white hover:border-white/25'
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action + Mobile Drawer Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={toggleLang}
            className="px-4 py-2 text-xs font-semibold tracking-wide text-[#070709] bg-gradient-to-r from-[#E8C563] to-[#C89B2B] rounded-lg hover:brightness-110 transition duration-150 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.nav.langSwitch}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-lg border border-white/10 text-slate-200 hover:border-[#D4AF37]/50 cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0b0c10] px-4 py-4">
          <nav className="grid grid-cols-2 gap-2">
            {allMobileLinks.map((link) => {
              const active = isActive(link.to);
              return (
                <a
                  key={link.to}
                  href={link.to}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(link.to);
                    setMobileOpen(false);
                  }}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#D4AF37]/15 text-[#F2CF66] border border-[#D4AF37]/40'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
