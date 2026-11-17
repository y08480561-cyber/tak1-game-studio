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
const LEGACY_FA_BRAND = 'استودیوی بازی‌سازی TAK1';

export function SeoHead() {
  const { lang, path, products, siteSettings } = useStudio();
  const isFa = lang === 'fa';
  const normalized = path === '/' ? '/' : path.replace(/\/+$/, '');
  const baseUrl = 'https://kalametgame.ir';
  const canonicalUrl = `${baseUrl}${normalized === '/' ? '/' : normalized}`;
  const customFa = siteSettings?.studioNameFa?.trim();
  const studioNameFa = customFa && customFa !== LEGACY_FA_BRAND ? customFa : OFFICIAL_BRAND_FA;
  const studioNameEn = siteSettings?.studioNameEn?.trim() || OFFICIAL_BRAND_EN;
  const studioName = isFa ? studioNameFa : studioNameEn;

  useEffect(() => {
    let title = isFa
      ? `${studioNameFa} | طراحی و توسعه بازی`
      : `${studioNameEn} | Game Design & Development`;
    let description = isFa
      ? `وب‌سایت رسمی ${studioNameFa} (${studioNameEn}) در دامنه kalametgame.ir — طراحی و توسعه بازی، معرفی تیم، دانلود بازی‌ها و اپلیکیشن‌ها، اخبار و پشتیبانی مستقیم.`
      : `Official website of ${studioNameEn} (${studioNameFa}) on kalametgame.ir — Android games, modern apps, studio news, team profiles, and player support.`;
    let robots = 'index, follow';
    let ogImage = `${baseUrl}/assets/aistudio/image_3e0bd734.png`;

    const baseGraphNodes: Record<string, unknown>[] = [
      {
        '@type': 'Organization',
        name: studioNameFa,
        alternateName: studioNameEn,
        url: baseUrl,
        logo: `${baseUrl}/assets/aistudio/image_3e0bd734.png`,
        email: siteSettings?.contactEmail || 'contact@kalametgame.ir',
      },
      {
        '@type': 'WebSite',
        name: studioNameFa,
        alternateName: studioNameEn,
        url: `${baseUrl}/`,
        inLanguage: isFa ? 'fa-IR' : 'en-US',
      },
    ];

    let jsonLd: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@graph': baseGraphNodes,
    };

    if (normalized === '/products') {
      title = isFa
        ? `بازی‌ها و اپلیکیشن‌ها | ${studioNameFa}`
        : `Games & Applications | ${studioNameEn}`;
      description = isFa
        ? `فهرست رسمی بازی‌های اندرویدی، اپلیکیشن‌ها و ابزارهای نرم‌افزاری ${studioNameFa} همراه با لینک‌های دانلود معتبر.`
        : `Official catalog of Android games, mobile applications, and tools developed by ${studioNameEn}.`;
    } else if (normalized.startsWith('/products/')) {
      const slug = decodeURIComponent(normalized.slice('/products/'.length));
      const product = products.find((p) => p.slug === slug);
      if (product) {
        const pTitle = isFa ? product.titleFa : product.titleEn;
        const pDesc = isFa
          ? product.shortDescFa || product.fullDescFa
          : product.shortDescEn || product.fullDescEn;
        title = `${pTitle} | ${studioName}`;
        if (pDesc) description = pDesc.slice(0, 155);
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
                '@type': 'Organization',
                name: studioNameFa,
                alternateName: studioNameEn,
                url: baseUrl,
              },
            },
          ],
        };
      } else {
        title = isFa ? `مشخصات محصول | ${studioNameFa}` : `Product Details | ${studioNameEn}`;
      }
    } else if (normalized === '/team') {
      title = isFa ? `تیم توسعه | ${studioNameFa}` : `Our Team | ${studioNameEn}`;
      description = isFa
        ? `آشنایی با تیم مهندسی نرم‌افزار، طراحی بازی و حوزه‌های تخصصی ${studioNameFa} (${studioNameEn}).`
        : `Meet the programmers, game designers, and creators behind ${studioNameEn}.`;
    } else if (normalized === '/news') {
      title = isFa ? `اخبار و اطلاعیه‌ها | ${studioNameFa}` : `News & Dispatches | ${studioNameEn}`;
      description = isFa
        ? `آخرین اخبار، یادداشت‌های توسعه، انتشار نسخه‌های جدید و اطلاعیه‌های ${studioNameFa}.`
        : `Latest development updates, release notes, and official announcements from ${studioNameEn}.`;
    } else if (normalized === '/support') {
      title = isFa
        ? `پشتیبانی و پیگیری تیکت | ${studioNameFa}`
        : `Player Support | ${studioNameEn}`;
      description = isFa
        ? `ثبت درخواست پشتیبانی فنی و پیگیری وضعیت تیکت برای بازی‌ها و اپلیکیشن‌های ${studioNameFa}.`
        : `Submit a technical support request or track an existing support ticket for ${studioNameEn} titles.`;
    } else if (normalized === '/feedback') {
      title = isFa ? `پیشنهادها و ایده‌ها | ${studioNameFa}` : `Feedback & Ideas | ${studioNameEn}`;
      description = isFa
        ? `ارسال ایده‌های بازی، پیشنهادهای بهبود و نظرات کاربران برای ${studioNameFa}.`
        : `Share feature requests, new game ideas, and feedback directly with ${studioNameEn}.`;
    } else if (normalized === '/contact') {
      title = isFa ? `تماس با ما | ${studioNameFa}` : `Contact Us | ${studioNameEn}`;
      description = isFa
        ? `راه‌های ارتباط مستقیم با ${studioNameFa} (${studioNameEn}) برای همکاری، نشر و پرسش‌های تجاری.`
        : `Get in touch with ${studioNameEn} for partnerships, publishing, and general inquiries.`;
    } else if (normalized === '/admin') {
      title = isFa ? `داشبورد مدیریت | ${studioNameFa}` : `Studio Workspace | ${studioNameEn}`;
      robots = 'noindex, nofollow';
    } else if (!isKnownStudioRoute(normalized)) {
      title = isFa
        ? `صفحه یافت نشد (۴۰۴) | ${studioNameFa}`
        : `Page Not Found (404) | ${studioNameEn}`;
      robots = 'noindex, nofollow';
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
    setCanonicalLink(canonicalUrl);
    setStructuredData(jsonLd);
  }, [isFa, normalized, canonicalUrl, products, siteSettings, studioName, studioNameFa, studioNameEn]);

  return null;
}
