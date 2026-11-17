import { ArrowLeft, ArrowRight, ExternalLink, Gamepad2, LifeBuoy, MessageSquarePlus } from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import { SafeMedia } from '../components/SafeMedia';

export function HomePage() {
  const { lang, t, navigate, products, news, loadingData, dataError, refreshPublicData } = useStudio();
  const isRtl = lang === 'fa';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const featuredProducts = products.slice(0, 3);
  const latestNews = news.slice(0, 3);

  return (
    <div className="bg-[#070709] text-[#EAECEF]">
      {/* 1. Bespoke Hero Section with Official TAK1 Logo + Interactive 3D Metallic Crest */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="/src/assets/images/studio_architecture_backdrop_1794901594923.jpg"
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#070709]/85 via-[#070709]/75 to-[#070709]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="max-w-4xl space-y-6">
              <div className="flex items-center gap-4">
                <img
                  src="/assets/aistudio/image_3e0bd734.png"
                  alt={isRtl ? 'نشان رسمی توسعه‌دهندگان بازی تک۱ | TAK1 Game Studio' : 'TAK1 Game Studio Official Emblem'}
                  className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border border-[#D4AF37]/35 bg-[#0a0b0e] object-contain p-1.5 shadow-lg shadow-black/60"
                />
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-medium text-[#E5C158] tracking-wide">
                    {t.hero.kicker}
                  </p>
                  <p className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {isRtl ? (
                      <>
                        توسعه‌دهندگان بازی <span className="text-[#D4AF37]">تک۱</span>{' '}
                        <span className="text-sm sm:text-base text-slate-400 font-normal">
                          · TAK1 Game Studio
                        </span>
                      </>
                    ) : (
                      <>
                        TAK1 <span className="text-slate-400 font-normal">Game Studio</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <h1 className="font-display text-[clamp(0.85rem,2.2vw,1.625rem)] font-bold leading-tight tracking-tight text-metallic-silver whitespace-nowrap">
                {t.hero.title}
              </h1>

              <p className="max-w-lg text-xs sm:text-[13px] leading-relaxed text-slate-400">
                {t.hero.subtitle}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/products')}
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-lg bg-gradient-to-r from-[#E8C563] to-[#C89B2B] text-[#070709] text-sm font-semibold hover:brightness-110 transition duration-150 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Gamepad2 className="h-4 w-4" />
                  <span>{t.hero.primaryCta}</span>
                  <ArrowIcon className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/team')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-white/15 bg-[#0d0e12] text-slate-200 text-sm font-medium hover:border-[#D4AF37]/50 hover:text-white transition duration-150 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>{t.hero.secondaryCta}</span>
                </button>
              </div>
          </div>

          {/* 4-Column Engineering Pillars Strip Below Hero Split */}
          <div className="mt-14 pt-10 border-t border-white/10">
            <h2 className="text-sm font-semibold text-[#D4AF37] mb-6">
              {t.pillars.heading}
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {t.pillars.items.map((item) => (
                <div key={item.index} className="surface-card rounded-xl p-5 space-y-2.5">
                  <span className="font-mono-tabular text-xs font-semibold text-[#D4AF37]">
                    {item.index}
                  </span>
                  <h3 className="text-base font-semibold text-white">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Published Games & Apps Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="space-y-1.5">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
              {t.homeSections.releasesTitle}
            </h2>
            <p className="text-sm text-slate-400">{t.homeSections.releasesSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#E5C158] hover:text-[#F8E59D] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>{t.homeSections.viewAllReleases}</span>
            <ArrowIcon className="h-4 w-4" />
          </button>
        </div>

        {loadingData ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-72 rounded-xl border border-white/10 bg-[#0d0e12] animate-pulse" />
            ))}
          </div>
        ) : dataError ? (
          <div className="surface-card rounded-xl p-8 text-center space-y-4">
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
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {featuredProducts.map((product) => {
              const title = isRtl ? product.titleFa : product.titleEn;
              const desc = isRtl ? product.shortDescFa : product.shortDescEn;
              const categoryText = t.products.categoryLabels[product.category];
              return (
                <article
                  key={product.id}
                  onClick={() => navigate(`/products/${product.slug}`)}
                  className="surface-card surface-card-hover rounded-xl p-5 flex flex-col justify-between cursor-pointer"
                >
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <SafeMedia
                        src={product.iconUrl}
                        alt={title}
                        fallbackTitle={title}
                        className="h-16 w-16 rounded-xl object-cover shrink-0 border border-white/10"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="text-[#D4AF37]">{categoryText}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono-tabular">v{product.version}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white truncate">{title}</h3>
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
        ) : null}
      </section>

      {/* 3. Latest News & Dispatches */}
      <section className="border-t border-white/10 bg-[#0a0b0e]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div className="space-y-1.5">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                {t.homeSections.newsTitle}
              </h2>
              <p className="text-sm text-slate-400">{t.homeSections.newsSubtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/news')}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#E5C158] hover:text-[#F8E59D] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{t.homeSections.viewAllNews}</span>
              <ArrowIcon className="h-4 w-4" />
            </button>
          </div>

          {latestNews.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {latestNews.map((post) => {
                const title = isRtl ? post.titleFa : post.titleEn;
                const summary = isRtl ? post.summaryFa : post.summaryEn;
                return (
                  <article
                    key={post.id}
                    onClick={() => navigate('/news')}
                    className="surface-card surface-card-hover rounded-xl overflow-hidden cursor-pointer flex flex-col"
                  >
                    {post.coverUrl && (
                      <SafeMedia
                        src={post.coverUrl}
                        alt={title}
                        className="h-44 w-full object-cover border-b border-white/10"
                      />
                    )}
                    <div className="p-5 space-y-2.5 flex-1">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="text-[#D4AF37]">{t.news.categories[post.category]}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-tabular">{post.publishedAt.slice(0, 10)}</span>
                      </div>
                      <h3 className="text-base font-bold text-white">{title}</h3>
                      <p className="text-sm text-slate-400 line-clamp-3">{summary}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>

      {/* 4. Support & Community Gateway */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="surface-card rounded-2xl p-8 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-2xl space-y-2.5">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                {t.homeSections.communityTitle}
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-slate-400">
                {t.homeSections.communityDesc}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 shrink-0">
              <button
                type="button"
                onClick={() => navigate('/support')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-[#E8C563] to-[#C89B2B] text-[#070709] text-sm font-semibold hover:brightness-110 transition cursor-pointer whitespace-nowrap"
              >
                <LifeBuoy className="h-4 w-4" />
                <span>{t.homeSections.supportAction}</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/feedback')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-white/15 bg-[#111319] text-slate-200 text-sm font-medium hover:border-[#D4AF37]/50 transition cursor-pointer whitespace-nowrap"
              >
                <MessageSquarePlus className="h-4 w-4" />
                <span>{t.homeSections.feedbackAction}</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
