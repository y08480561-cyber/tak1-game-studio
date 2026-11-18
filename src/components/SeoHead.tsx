import { useEffect } from 'react';
import { useStudio } from '../context/StudioContext';

const KNOWN_STATIC_ROUTES = new Set([
  '/',
  '/products',
  '/team',
  '/news',
  '/support',
  '/feedback',
  '/contact',
  '/admin',
]);

export function isKnownStudioRoute(pathname: string): boolean {
  const normalized = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  if (KNOWN_STATIC_ROUTES.has(normalized)) return true;
  if (normalized.startsWith('/products/') && normalized.length > '/products/'.length) {
    return true;
  }
  return false;
}

function setMetaTag(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonicalLink(href: string): void {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function removeCanonicalLink(): void {
  const link = document.querySelector('link[rel="canonical"]');
  if (link) {
    link.remove();
  }
}

function setStructuredData(data: Record<string, unknown>): void {
  const id = 'tak1-structured-data';
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

const OFFICIAL_BRAND_FA = 'توسعه‌دهندگان بازی تک۱';
const OFFICIAL_BRAND_EN = 'TAK1 Game Studio';
const HOME_TITLE_FA = 'توسعه‌دهندگان بازی تک۱ | استودیوی بازی TAK1';
const HOME_DESC_FA =
  'تیم توسعه‌دهندگان بازی تک۱ (TAK1)، سازنده بازی‌های اندرویدی، اپلیکیشن و نرم‌افزارهای کاربردی. بازی‌ها و محصولات ما را ببینید و با تیم توسعه‌دهنده آشنا شوید.';

export function SeoHead() {
  const { lang, path, products, siteSettings } = useStudio();
  const isFa = lang === 'fa';
  const normalized = path === '/' ? '/' : path.replace(/\/+$/, '');
  const baseUrl = 'https://kalametgame.ir';
  const studioName = isFa ? OFFICIAL_BRAND_FA : OFFICIAL_BRAND_EN;

  let canonicalUrl = `${baseUrl}${normalized === '/' ? '/' : normalized}`;
  if (normalized.startsWith('/products/')) {
    const rawSlug = normalized.slice('/products/'.length);
    try {
      canonicalUrl = `${baseUrl}/products/${encodeURIComponent(decodeURIComponent(rawSlug))}`;
    } catch {
      canonicalUrl = `${baseUrl}/products/${encodeURIComponent(rawSlug)}`;
    }
  }

  useEffect(() => {
    let title = isFa
      ? HOME_TITLE_FA
      : `${OFFICIAL_BRAND_EN} | Android Games & Applications`;
    let description = isFa
      ? HOME_DESC_FA
      : `Official website of ${OFFICIAL_BRAND_EN} (${OFFICIAL_BRAND_FA}) on kalametgame.ir — Android games, mobile applications, studio news, team profiles, and player support.`;
    let robots = 'index, follow';
    let shouldSetCanonical = true;
    let ogImage = `${baseUrl}/assets/aistudio/image_3e0bd734.png`;

    const baseGraphNodes: Record<string, unknown>[] = [
      {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: OFFICIAL_BRAND_FA,
        alternateName: OFFICIAL_BRAND_EN,
        url: baseUrl,
        logo: `${baseUrl}/assets/aistudio/image_3e0bd734.png`,
        description:
          'تیم توسعه‌دهندگان بازی تک۱ (TAK1)، سازنده بازی‌های اندرویدی، اپلیکیشن و نرم‌افزارهای کاربردی.',
        email: siteSettings?.contactEmail || 'contact@kalametgame.ir',
      },
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        name: OFFICIAL_BRAND_FA,
        alternateName: OFFICIAL_BRAND_EN,
        url: `${baseUrl}/`,
        inLanguage: isFa ? 'fa-IR' : 'en-US',
        description: HOME_DESC_FA,
        publisher: {
          '@id': `${baseUrl}/#organization`,
        },
      },
    ];

    let jsonLd: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@graph': baseGraphNodes,
    };

    if (normalized === '/products') {
      title = isFa
        ? `محصولات و بازی‌های اندرویدی | ${OFFICIAL_BRAND_FA}`
        : `Games & Applications | ${OFFICIAL_BRAND_EN}`;
      description = isFa
        ? 'مشاهده و دانلود بازی‌های اندرویدی، اپلیکیشن‌ها و ابزارهای نرم‌افزاری ساخته‌شده توسط تیم توسعه‌دهندگان بازی تک۱ (TAK1) با لینک‌های رسمی مایکت، کافه‌بازار و گوگل‌پلی.'
        : `Official catalog of Android games, mobile applications, and tools developed by ${OFFICIAL_BRAND_EN}.`;
    } else if (normalized.startsWith('/products/')) {
      const rawSlug = normalized.slice('/products/'.length);
      let slug = rawSlug;
      try {
        slug = decodeURIComponent(rawSlug);
      } catch {
        slug = rawSlug;
      }
      const product = products.find((p) => p.slug === slug);
      if (product) {
        const pTitle = isFa ? product.titleFa : product.titleEn;
        const pDesc = isFa
          ? product.shortDescFa || product.fullDescFa
          : product.shortDescEn || product.fullDescEn;
        title = `${pTitle} | ${studioName}`;
        description = pDesc
          ? pDesc.slice(0, 155)
          : isFa
            ? `معرفی، تصاویر و لینک‌های دانلود رسمی ${pTitle} از تیم ${OFFICIAL_BRAND_FA} (TAK1).`
            : `Overview, screenshots, and official download links for ${pTitle} by ${OFFICIAL_BRAND_EN}.`;
        if (product.iconUrl) {
          ogImage = product.iconUrl.startsWith('http')
            ? product.iconUrl
            : `${baseUrl}${product.iconUrl}`;
        }
        jsonLd = {
          '@context': 'https://schema.org',
          '@graph': [
            ...baseGraphNodes,
            {
              '@type': 'SoftwareApplication',
              name: pTitle,
              applicationCategory:
                product.category === 'game' ? 'GameApplication' : 'UtilitiesApplication',
              operatingSystem: 'Android, Web',
              softwareVersion: product.version,
              description,
              url: canonicalUrl,
              author: {
                '@id': `${baseUrl}/#organization`,
              },
            },
          ],
        };
      } else {
        title = isFa ? `مشخصات محصول | ${OFFICIAL_BRAND_FA}` : `Product Details | ${OFFICIAL_BRAND_EN}`;
        description = isFa
          ? `اطلاعات فنی، تصاویر و لینک دانلود رسمی محصول در وب‌سایت ${OFFICIAL_BRAND_FA} (TAK1).`
          : `Technical specifications, screenshots, and official download links on ${OFFICIAL_BRAND_EN}.`;
      }
    } else if (normalized === '/team') {
      title = isFa ? `معرفی تیم توسعه‌دهنده | ${OFFICIAL_BRAND_FA}` : `Our Team | ${OFFICIAL_BRAND_EN}`;
      description = isFa
        ? 'آشنایی با اعضای تیم توسعه‌دهندگان بازی تک۱ (TAK1)، برنامه‌نویسان، طراحان بازی و حوزه‌های تخصصی مهندسی نرم‌افزار در استودیو.'
        : `Meet the programmers, game designers, and creators behind ${OFFICIAL_BRAND_EN}.`;
    } else if (normalized === '/news') {
      title = isFa ? `اخبار و اطلاعیه‌ها | ${OFFICIAL_BRAND_FA}` : `News & Dispatches | ${OFFICIAL_BRAND_EN}`;
      description = isFa
        ? 'جدیدترین اخبار، گزارش‌های توسعه، معرفی بازی‌های جدید و اطلاعیه‌های انتشار به‌روزرسانی‌های تیم توسعه‌دهندگان بازی تک۱ (TAK1).'
        : `Latest development updates, release notes, and official announcements from ${OFFICIAL_BRAND_EN}.`;
    } else if (normalized === '/support') {
      title = isFa
        ? `پشتیبانی کاربران و پیگیری تیکت | ${OFFICIAL_BRAND_FA}`
        : `Player Support | ${OFFICIAL_BRAND_EN}`;
      description = isFa
        ? 'ارسال درخواست پشتیبانی فنی، گزارش خطا و پیگیری وضعیت تیکت و پاسخ کارشناسان برای بازی‌ها و اپلیکیشن‌های تک۱ (TAK1).'
        : `Submit a technical support request or track an existing support ticket for ${OFFICIAL_BRAND_EN} titles.`;
    } else if (normalized === '/feedback') {
      title = isFa
        ? `پیشنهادها و ایده‌های کاربران | ${OFFICIAL_BRAND_FA}`
        : `Feedback & Ideas | ${OFFICIAL_BRAND_EN}`;
      description = isFa
        ? 'ثبت پیشنهادهای جدید، ایده‌های ساخت بازی و نظرات کاربران برای بهبود بازی‌ها و نرم‌افزارهای تیم توسعه‌دهندگان بازی تک۱ (TAK1).'
        : `Share feature requests, new game ideas, and feedback directly with ${OFFICIAL_BRAND_EN}.`;
    } else if (normalized === '/contact') {
      title = isFa ? `تماس با ما | ${OFFICIAL_BRAND_FA}` : `Contact Us | ${OFFICIAL_BRAND_EN}`;
      description = isFa
        ? 'راه‌های ارتباط مستقیم با تیم توسعه‌دهندگان بازی تک۱ (TAK1) جهت همکاری، نشر بازی، مسائل تجاری و پرسش‌های عمومی.'
        : `Get in touch with ${OFFICIAL_BRAND_EN} for partnerships, publishing, and general inquiries.`;
    } else if (normalized === '/admin') {
      title = isFa ? `داشبورد مدیریت | ${OFFICIAL_BRAND_FA}` : `Studio Workspace | ${OFFICIAL_BRAND_EN}`;
      robots = 'noindex, nofollow';
      shouldSetCanonical = false;
    } else if (!isKnownStudioRoute(normalized)) {
      title = isFa
        ? `صفحه یافت نشد (۴۰۴) | ${OFFICIAL_BRAND_FA}`
        : `Page Not Found (404) | ${OFFICIAL_BRAND_EN}`;
      description = isFa
        ? `صفحه مورد نظر در وب‌سایت ${OFFICIAL_BRAND_FA} یافت نشد.`
        : `The requested page was not found on ${OFFICIAL_BRAND_EN}.`;
      robots = 'noindex, nofollow';
      shouldSetCanonical = false;
    }

    document.title = title;
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'robots', robots);
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:locale', isFa ? 'fa_IR' : 'en_US');
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:site_name', studioName);
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', ogImage);

    if (shouldSetCanonical) {
      setCanonicalLink(canonicalUrl);
    } else {
      removeCanonicalLink();
    }

    setStructuredData(jsonLd);
  }, [isFa, normalized, canonicalUrl, products, siteSettings, studioName]);

  return null;
}
