import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Download, ExternalLink, LifeBuoy } from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import type { Product } from '../types/studio';
import { SafeMedia } from '../components/SafeMedia';
import {
  TAK1_AD_REWARD_FALLBACK_PRODUCT,
  TAK1_AD_REWARD_SEO,
  TAK1_AD_REWARD_SLUG,
} from '../seo/tak1AdRewardSeo';

export function ProductDetailPage({ slug }: { slug: string }) {
  const { lang, t, navigate, products } = useStudio();
  const isRtl = lang === 'fa';
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const isTargetAdRewardGame = slug === TAK1_AD_REWARD_SLUG;

  const [product, setProduct] = useState<Product | null>(
    () =>
      products.find((p) => p.slug === slug) ??
      (isTargetAdRewardGame ? TAK1_AD_REWARD_FALLBACK_PRODUCT : null),
  );
  const [loading, setLoading] = useState(!product);
  const [notFound, setNotFound] = useState(false);
  const [activeScreenshot, setActiveScreenshot] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!isTargetAdRewardGame) {
        setLoading(true);
      }
      setNotFound(false);
      try {
        const res = await fetch(`/api/products/${encodeURIComponent(slug)}`);
        if (!res.ok) {
          if (active) {
            if (isTargetAdRewardGame && res.status !== 404) {
              setProduct((prev) => prev ?? TAK1_AD_REWARD_FALLBACK_PRODUCT);
            } else {
              setNotFound(true);
            }
          }
          return;
        }
        const json = await res.json();
        if (active && json.item) {
          setProduct(json.item);
          setActiveScreenshot(json.item.screenshots?.[0] ?? null);
        }
      } catch {
        if (active) {
          if (isTargetAdRewardGame) {
            setProduct((prev) => prev ?? TAK1_AD_REWARD_FALLBACK_PRODUCT);
          } else {
            setNotFound(true);
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [slug, isTargetAdRewardGame]);

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

  const title = isTargetAdRewardGame
    ? isRtl
      ? TAK1_AD_REWARD_SEO.fa.h1
      : TAK1_AD_REWARD_SEO.en.h1
    : isRtl
      ? product.titleFa
      : product.titleEn;
  const shortDesc = isTargetAdRewardGame
    ? (isRtl ? product.shortDescFa : product.shortDescEn) ||
      (isRtl ? TAK1_AD_REWARD_SEO.fa.shortSummary : TAK1_AD_REWARD_SEO.en.shortSummary)
    : isRtl
      ? product.shortDescFa
      : product.shortDescEn;
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
      <a
        href="/products"
        onClick={(e) => {
          e.preventDefault();
          navigate('/products');
        }}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <BackIcon className="h-4 w-4" />
        <span>{t.productDetail.backToCatalog}</span>
      </a>

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
        <div className="lg:col-span-8 surface-card rounded-2xl p-6 sm:p-8 space-y-6">
          {isTargetAdRewardGame ? (
            isRtl ? (
              <article className="space-y-6 text-sm sm:text-base leading-8 text-slate-300">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                  معرفی کامل بازی تبلیغ ببین جایزه ببر
                </h2>
                <p>
                  <strong className="font-semibold text-white">بازی تبلیغ ببین جایزه ببر</strong> محصول
                  رسمی استودیوی{' '}
                  <strong className="font-semibold text-[#F2CF66]">توسعه‌دهندگان بازی تک۱</strong>{' '}
                  (TAK1 Game Studio) است که برای سیستم‌عامل اندروید طراحی شده است. در این{' '}
                  <strong className="font-semibold text-white">بازی جایزه‌دار ایرانی</strong>، کاربران
                  می‌توانند در اوقات فراغت با مشاهده ویدئوهای تبلیغاتی جایزه‌دار و تکمیل مربع‌های
                  امتیاز روزانه، امتیاز جمع‌آوری کنند و در جدول رتبه‌بندی زنده با سایر کاربران رقابت
                  داشته باشند.
                </p>

                <div className="space-y-2.5 pt-2 border-t border-white/10">
                  <h3 className="font-display text-lg font-bold text-white">
                    چالش ۱۰۰ مربع روزانه و جدول رتبه‌بندی زنده
                  </h3>
                  <p>
                    ساختار اصلی رقابت بر پایه چالش ۱۰۰ مربع امتیاز روزانه با چرخه هوشمند ۲۴ ساعته
                    بنا شده است. تمامی امتیازهای ثبت‌شده در سرور به‌صورت شفاف در جدول رتبه‌بندی
                    زنده نمایش داده می‌شوند تا هر کاربر بتواند جایگاه خود و برترین امتیازآوران دوره
                    را مشاهده کند.
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t border-white/10">
                  <h3 className="font-display text-lg font-bold text-white">
                    امکانات نسخه اندروید (نسخه {product.version})
                  </h3>
                  <ul className="list-disc ps-5 space-y-2 text-slate-300">
                    <li>
                      چالش روزانه ۱۰۰ مربع تبلیغاتی با چرخه ۲۴ ساعته و ثبت امتیاز در جدول رتبه‌بندی
                      زنده
                    </li>
                    <li>
                      فروشگاه درون‌برنامه‌ای جهت ارتقای حساب به سطوح نقره‌ای (ضریب ۳ برابری امتیاز) و
                      طلایی (ضریب ۶ برابری امتیاز ویژه)
                    </li>
                    <li>
                      قابلیت بازگشایی آنی مربع‌ها از طریق بسته‌های فروشگاه بدون نیاز به تماشای تبلیغ
                    </li>
                    <li>
                      سیستم اطلاعیه و بنرهای زنده برای دریافت آخرین اخبار مسابقات، اعلام برندگان و
                      شروع دوره‌های جدید از سرور
                    </li>
                    <li>
                      بخش پشتیبانی و پیام‌ها جهت ارتباط مستقیم با مدیریت، ثبت تیکت و پیگیری وضعیت
                      جوایز
                    </li>
                  </ul>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-white/10">
                  <h3 className="font-display text-lg font-bold text-white">
                    دانلود تبلیغ ببین جایزه ببر برای اندروید از مایکت
                  </h3>
                  <p>
                    برای{' '}
                    <strong className="font-semibold text-white">
                      دانلود تبلیغ ببین جایزه ببر
                    </strong>{' '}
                    می‌توانید نسخه رسمی اندروید را از طریق لینک مایکت موجود در بالای همین صفحه دریافت
                    کنید. پرداخت‌های درون‌برنامه‌ای برنامه نیز به‌صورت کامل با درگاه امن مایکت
                    یکپارچه‌سازی شده است.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-white/10">
                  <h3 className="font-display text-lg font-bold text-white">
                    امنیت حساب، حریم خصوصی و معرفی توسعه‌دهندگان بازی تک۱
                  </h3>
                  <p>
                    تمامی تراکنش‌ها و امتیازها در این محصول با توکن‌های رمزنگاری‌شده (SHA-256 Nonce)
                    و ارتباط رمزنگاری‌شده با سرور محافظت می‌شوند و اطلاعات حساب کاربری و شماره تماس
                    مطابق اصول حریم خصوصی نگهداری می‌گردند. این عنوان توسط تیم{' '}
                    <a
                      href="/team"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/team');
                      }}
                      className="text-[#F2CF66] hover:underline"
                    >
                      توسعه‌دهندگان بازی تک۱ (TAK1 Game Studio)
                    </a>{' '}
                    توسعه و پشتیبانی می‌شود. همچنین می‌توانید{' '}
                    <a
                      href="/products"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/products');
                      }}
                      className="text-[#F2CF66] hover:underline"
                    >
                      سایر بازی‌ها و اپلیکیشن‌های استودیو تک۱
                    </a>{' '}
                    را در کاتالوگ محصولات مشاهده کنید.
                  </p>
                </div>
              </article>
            ) : (
              <article className="space-y-6 text-sm sm:text-base leading-8 text-slate-300">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                  About Tabligh Bebin Jayeze Bebar
                </h2>
                <p>
                  <strong className="font-semibold text-white">Tabligh Bebin Jayeze Bebar</strong> is
                  an official Android release developed by{' '}
                  <strong className="font-semibold text-[#F2CF66]">TAK1 Game Studio</strong>. Players
                  earn points by watching rewarded ad videos and completing daily challenge squares
                  while competing on a transparent live leaderboard.
                </p>
                <div className="space-y-2.5 pt-2 border-t border-white/10">
                  <h3 className="font-display text-lg font-bold text-white">
                    Core Features (Version {product.version})
                  </h3>
                  <ul className="list-disc ps-5 space-y-2 text-slate-300">
                    <li>Daily 100-square rewarded ad challenge on an automated 24-hour cycle</li>
                    <li>Live leaderboard tracking top scorers throughout each competition cycle</li>
                    <li>In-app store upgrades (Silver 3x and Gold 6x score multipliers) and quick-unlock packs</li>
                    <li>Direct in-app support ticket tracking, live winner announcements, and SHA-256 protected scoring</li>
                  </ul>
                </div>
                <div className="space-y-2.5 pt-2 border-t border-white/10">
                  <h3 className="font-display text-lg font-bold text-white">
                    Official Android Download & Developer Info
                  </h3>
                  <p>
                    Install the verified Android release via the Myket link on this page. Developed
                    and maintained by{' '}
                    <a
                      href="/team"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/team');
                      }}
                      className="text-[#F2CF66] hover:underline"
                    >
                      TAK1 Game Studio
                    </a>
                    .
                  </p>
                </div>
              </article>
            )
          ) : (
            <>
              <h2 className="font-display text-xl font-bold text-white">
                {t.productDetail.overviewTitle}
              </h2>
              <div className="text-sm sm:text-base leading-8 text-slate-300 whitespace-pre-line">
                {fullDesc || shortDesc}
              </div>
            </>
          )}
        </div>

        <div className="lg:col-span-4 surface-card rounded-2xl p-6 space-y-4 h-fit">
          <h2 className="text-base font-bold text-white">{t.productDetail.needHelp}</h2>
          <a
            href="/support"
            onClick={(e) => {
              e.preventDefault();
              navigate('/support');
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#F2CF66] text-sm font-medium hover:bg-[#D4AF37]/20 transition"
          >
            <LifeBuoy className="h-4 w-4" />
            <span>{t.productDetail.openTicket}</span>
          </a>
        </div>
      </section>
    </div>
  );
}
