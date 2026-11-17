import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Download, ExternalLink, LifeBuoy } from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import type { Product } from '../types/studio';
import { SafeMedia } from '../components/SafeMedia';

export function ProductDetailPage({ slug }: { slug: string }) {
  const { lang, t, navigate, products } = useStudio();
  const isRtl = lang === 'fa';
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  const [product, setProduct] = useState<Product | null>(
    () => products.find((p) => p.slug === slug) ?? null,
  );
  const [loading, setLoading] = useState(!product);
  const [notFound, setNotFound] = useState(false);
  const [activeScreenshot, setActiveScreenshot] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await fetch(`/api/products/${encodeURIComponent(slug)}`);
        if (!res.ok) {
          if (active) setNotFound(true);
          return;
        }
        const json = await res.json();
        if (active && json.item) {
          setProduct(json.item);
          setActiveScreenshot(json.item.screenshots?.[0] ?? null);
        }
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 space-y-6">
        <div className="h-10 w-44 rounded-lg bg-white/5 animate-pulse" />
        <div className="h-72 rounded-2xl bg-[#0d0e12] border border-white/10 animate-pulse" />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center space-y-5">
        <h1 className="font-display text-2xl font-bold text-white">{t.products.emptyTitle}</h1>
        <button
          type="button"
          onClick={() => navigate('/products')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 text-sm text-white hover:bg-white/15 cursor-pointer"
        >
          <BackIcon className="h-4 w-4" />
          <span>{t.productDetail.backToCatalog}</span>
        </button>
      </div>
    );
  }

  const title = isRtl ? product.titleFa : product.titleEn;
  const shortDesc = isRtl ? product.shortDescFa : product.shortDescEn;
  const fullDesc = isRtl ? product.fullDescFa : product.fullDescEn;

  const storeLinks = [
    { key: 'myket', label: t.productDetail.myket, url: product.links?.myket },
    { key: 'bazaar', label: t.productDetail.bazaar, url: product.links?.bazaar },
    { key: 'googlePlay', label: t.productDetail.googlePlay, url: product.links?.googlePlay },
    { key: 'direct', label: t.productDetail.direct, url: product.links?.direct },
  ].filter((item) => Boolean(item.url));

  const mainShot = activeScreenshot || product.screenshots[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      <button
        type="button"
        onClick={() => navigate('/products')}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <BackIcon className="h-4 w-4" />
        <span>{t.productDetail.backToCatalog}</span>
      </button>

      {/* Product Hero Header */}
      <section className="surface-card rounded-2xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col sm:flex-row items-start gap-6">
          <SafeMedia
            src={product.iconUrl}
            alt={title}
            fallbackTitle={title}
            className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl object-cover border border-[#D4AF37]/30 shrink-0"
          />
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="text-[#D4AF37] font-medium">
                {t.products.categoryLabels[product.category]}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">
                {t.productDetail.version}: {product.version}
              </span>
              {product.releaseDate && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular">
                    {t.productDetail.releaseDate}: {product.releaseDate}
                  </span>
                </>
              )}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">{title}</h1>
            <p className="text-base leading-relaxed text-slate-300">{shortDesc}</p>
          </div>
        </div>

        {/* Store Download Actions */}
        <div className="lg:col-span-4 space-y-3 lg:border-s lg:border-white/10 lg:ps-8">
          <h2 className="text-sm font-semibold text-white">{t.productDetail.downloadHeading}</h2>
          {storeLinks.length === 0 ? (
            <p className="text-xs text-slate-400">{t.productDetail.noLinks}</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {storeLinks.map((store) => (
                <a
                  key={store.key}
                  href={store.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${
                    store.key === 'direct'
                      ? 'bg-gradient-to-r from-[#E8C563] to-[#C89B2B] text-[#070709] hover:brightness-110'
                      : 'border border-white/15 bg-[#13151c] text-white hover:border-[#D4AF37]/55'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    <span>{store.label}</span>
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-75" />
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Screenshots Gallery */}
      {product.screenshots.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-bold text-white">
            {t.productDetail.galleryTitle}
          </h2>
          {mainShot && (
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#0d0e12]">
              <SafeMedia
                src={mainShot}
                alt={`${title} Screenshot`}
                className="w-full max-h-[480px] object-contain bg-black"
              />
            </div>
          )}
          {product.screenshots.length > 1 && (
            <div className="flex flex-wrap gap-3">
              {product.screenshots.map((shot, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveScreenshot(shot)}
                  className={`rounded-lg overflow-hidden border-2 transition cursor-pointer ${
                    mainShot === shot ? 'border-[#D4AF37]' : 'border-white/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  <SafeMedia src={shot} alt="" className="h-16 w-28 object-cover" />
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Full Overview & Support Link */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 surface-card rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="font-display text-xl font-bold text-white">
            {t.productDetail.overviewTitle}
          </h2>
          <div className="text-sm sm:text-base leading-8 text-slate-300 whitespace-pre-line">
            {fullDesc || shortDesc}
          </div>
        </div>

        <div className="lg:col-span-4 surface-card rounded-2xl p-6 space-y-4 h-fit">
          <h3 className="text-base font-bold text-white">{t.productDetail.needHelp}</h3>
          <button
            type="button"
            onClick={() => navigate('/support')}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#F2CF66] text-sm font-medium hover:bg-[#D4AF37]/20 transition cursor-pointer"
          >
            <LifeBuoy className="h-4 w-4" />
            <span>{t.productDetail.openTicket}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
