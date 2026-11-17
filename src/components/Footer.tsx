import { useStudio } from '../context/StudioContext';

export function Footer() {
  const { navigate, t } = useStudio();

  const studioLinks = [
    { to: '/', label: t.nav.home },
    { to: '/products', label: t.nav.products },
    { to: '/team', label: t.nav.team },
    { to: '/news', label: t.nav.news },
  ];

  const communityLinks = [
    { to: '/support', label: t.nav.support },
    { to: '/feedback', label: t.nav.feedback },
    { to: '/contact', label: t.nav.contact },
    { to: '/admin', label: t.nav.admin },
  ];

  return (
    <footer className="border-t border-white/10 bg-[#050507] text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/assets/aistudio/image_3e0bd734.png"
                alt="TAK1 Game Studio"
                className="h-12 w-12 rounded-xl object-cover border border-white/10"
              />
              <div>
                <p className="font-display text-lg font-bold text-white">TAK1 Game Studio</p>
                <p className="font-mono-tabular text-xs text-[#D4AF37]">kalametgame.ir</p>
              </div>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-slate-400">
              {t.footer.tagline}
            </p>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h3 className="text-sm font-semibold text-white">{t.footer.pagesHeading}</h3>
            <ul className="space-y-2 text-sm">
              {studioLinks.map((item) => (
                <li key={item.to}>
                  <a
                    href={item.to}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(item.to);
                    }}
                    className="hover:text-[#F2CF66] transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h3 className="text-sm font-semibold text-white">{t.footer.communityHeading}</h3>
            <ul className="space-y-2 text-sm">
              {communityLinks.map((item) => (
                <li key={item.to}>
                  <a
                    href={item.to}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(item.to);
                    }}
                    className="hover:text-[#F2CF66] transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>{t.footer.copyright}</p>
          <span className="font-mono-tabular text-slate-500">kalametgame.ir</span>
        </div>
      </div>
    </footer>
  );
}
