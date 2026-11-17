import { useState } from 'react';
import { Newspaper, ShieldCheck, X } from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import type { NewsPost } from '../types/studio';
import { SafeMedia } from '../components/SafeMedia';

export function NewsPage() {
  const { lang, t, news, loadingData, navigate } = useStudio();
  const isRtl = lang === 'fa';
  const [selectedPost, setSelectedPost] = useState<NewsPost | null>(null);

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 space-y-10">
      <header className="space-y-3">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
          {t.news.title}
        </h1>
        <p className="max-w-2xl text-base text-slate-400">{t.news.subtitle}</p>
      </header>

      {loadingData ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-64 rounded-xl border border-white/10 bg-[#0d0e12] animate-pulse" />
          ))}
        </div>
      ) : news.length === 0 ? (
        <div className="surface-card rounded-2xl p-10 text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-[#D4AF37]">
            <Newspaper className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-white">{t.news.emptyTitle}</h2>
          <p className="max-w-lg mx-auto text-sm text-slate-400">{t.news.emptyDesc}</p>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#F2CF66] text-xs font-medium hover:bg-[#D4AF37]/20 cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{t.homeSections.goToAdmin}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {news.map((post) => {
            const title = isRtl ? post.titleFa : post.titleEn;
            const summary = isRtl ? post.summaryFa : post.summaryEn;
            return (
              <article
                key={post.id}
                className="surface-card surface-card-hover rounded-xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {post.coverUrl && (
                    <SafeMedia
                      src={post.coverUrl}
                      alt={title}
                      className="h-48 w-full object-cover border-b border-white/10"
                    />
                  )}
                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="text-[#D4AF37] font-medium">
                        {t.news.categories[post.category]}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">{post.publishedAt.slice(0, 10)}</span>
                    </div>
                    <h2 className="text-lg font-bold text-white">{title}</h2>
                    <p className="text-sm leading-relaxed text-slate-400 line-clamp-3">{summary}</p>
                  </div>
                </div>

                <div className="px-6 pb-6">
                  <button
                    type="button"
                    onClick={() => setSelectedPost(post)}
                    className="text-xs font-semibold text-[#E5C158] hover:text-[#F8E59D] cursor-pointer"
                  >
                    {t.news.readMore}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Article Reader Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/15 bg-[#0d0e12] p-6 sm:p-8 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="text-[#D4AF37]">{t.news.categories[selectedPost.category]}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular">{selectedPost.publishedAt.slice(0, 10)}</span>
                </div>
                <h2 className="font-display text-2xl font-bold text-white">
                  {isRtl ? selectedPost.titleFa : selectedPost.titleEn}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="h-9 w-9 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                aria-label={t.news.close}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selectedPost.coverUrl && (
              <SafeMedia
                src={selectedPost.coverUrl}
                alt=""
                className="w-full max-h-64 rounded-xl object-cover border border-white/10"
              />
            )}

            <div className="text-sm sm:text-base leading-8 text-slate-300 whitespace-pre-line">
              {isRtl
                ? selectedPost.contentFa || selectedPost.summaryFa
                : selectedPost.contentEn || selectedPost.summaryEn}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
