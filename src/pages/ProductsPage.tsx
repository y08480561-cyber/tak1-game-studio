import { useMemo, useState } from 'react';
import { ExternalLink, Gamepad2, Search } from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import type { ProductCategory } from '../types/studio';
import { SafeMedia } from '../components/SafeMedia';

export function ProductsPage() {
  const { lang, t, products, loadingData, dataError, refreshPublicData, navigate } = useStudio();
  const isRtl = lang === 'fa';
  const [filter, setFilter] = useState<'all' | ProductCategory>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (filter !== 'all' && p.category !== filter) return false;
      if (!q) return true;
      return (
        p.titleFa.toLowerCase().includes(q) ||
        p.titleEn.toLowerCase().includes(q) ||
        p.shortDescFa.toLowerCase().includes(q) ||
        p.shortDescEn.toLowerCase().includes(q)
      );
    });
  }, [products, filter, query]);

  const filterButtons: { id: 'all' | ProductCategory; label: string }[] = [
    { id: 'all', label: t.products.filterAll },
    { id: 'game', label: t.products.filterGames },
    { id: 'app', label: t.products.filterApps },
    { id: 'tool', label: t.products.filterTools },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 space-y-10">
      <header className="space-y-3">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
          {t.products.title}
        </h1>
        <p className="max-w-2xl text-base text-slate-400">{t.products.subtitle}</p>
      </header>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl border border-white/10 bg-[#0d0e12]">
          {filterButtons.map((btn) => {
            const active = filter === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => setFilter(btn.id)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-[#E8C563] to-[#C89B2B] text-[#070709] font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-80">
          <Search
            className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 ${
              isRtl ? 'right-3.5' : 'left-3.5'
            }`}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.products.searchPlaceholder}
            className={`w-full rounded-xl border border-white/10 bg-[#0d0e12] py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#D4AF37] focus:outline-none ${
              isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'
            }`}
          />
        </div>
      </div>

      {/* Catalog Grid */}
      {loadingData ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-72 rounded-xl border border-white/10 bg-[#0d0e12] animate-pulse" />
          ))}
        </div>
      ) : dataError ? (
        <div className="surface-card rounded-xl p-10 text-center space-y-4">
          <p className="text-base font-semibold text-white">{t.products.serverErrorTitle}</p>
          <p className="text-sm text-slate-400">{dataError}</p>
          <button
            type="button"
            onClick={() => void refreshPublicData()}
            className="px-4 py-2 rounded-lg bg-white/10 text-sm text-white hover:bg-white/15 cursor-pointer"
          >
            {t.products.retry}
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="surface-card rounded-2xl p-10 text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-[#D4AF37]">
            <Gamepad2 className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-white">{t.products.emptyTitle}</h2>
          <p className="max-w-lg mx-auto text-sm text-slate-400">{t.products.emptyDesc}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => {
            const title = isRtl ? product.titleFa : product.titleEn;
            const desc = isRtl ? product.shortDescFa : product.shortDescEn;
            const categoryText = t.products.categoryLabels[product.category];

            return (
              <article
                key={product.id}
                onClick={() => navigate(`/products/${product.slug}`)}
                className="surface-card surface-card-hover rounded-xl p-6 flex flex-col justify-between cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <SafeMedia
                      src={product.iconUrl}
                      alt={title}
                      fallbackTitle={title}
                      className="h-18 w-18 rounded-2xl object-cover shrink-0 border border-white/10"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="text-[#D4AF37]">{categoryText}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-tabular">
                          {t.products.versionLabel} {product.version}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-white truncate">{title}</h2>
                      {product.releaseDate && (
                        <p className="font-mono-tabular text-xs text-slate-500">
                          {product.releaseDate}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-400 line-clamp-3">{desc}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-medium text-[#E5C158]">
                  <span>{t.products.viewDetails}</span>
                  <ExternalLink className="h-4 w-4" />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
