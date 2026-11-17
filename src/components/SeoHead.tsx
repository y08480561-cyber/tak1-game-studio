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

export function SeoHead() {
  const { lang, path, products, siteSettings } = useStudio();
  const isFa = lang === 'fa';
  const normalized = path === '/' ? '/' : path.replace(/\/+$/, '');
  const baseUrl = 'https://kalametgame.ir';
  const canonicalUrl = `${baseUrl}${normalized === '/' ? '/' : normalized}`;
  const studioName =
    (isFa ? siteSettings?.studioNameFa : siteSettings?.studioNameEn) || 'TAK1 Game Studio';

  useEffect(() => {
    let title = isFa
      ? 'TAK1 Game Studio | استودیوی بازی‌سازی، اپلیکیشن و وب‌سایت مدرن'
      : 'TAK1 Game Studio | Android Games, Apps & Modern Web';
    let description = isFa
      ? 'وب‌سایت رسمی استودیوی توسعه بازی و نرم‌افزار TAK1 (kalametgame.ir) — معرفی تیم، دانلود بازی‌ها و اپلیکیشن‌ها، اخبار و پشتیبانی مستقیم.'
      : 'Official website of TAK1 Game Studio (kalametgame.ir) — Android games, modern apps, studio news, team profiles, and player support.';
    let robots = 'index, follow';
    let ogImage = `${baseUrl}/assets/aistudio/image_3e0bd734.png`;
    let jsonLd: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: studioName,
      url: baseUrl,
      logo: `${baseUrl}/assets/aistudio/image_3e0bd734.png`,
      email: siteSettings?.contactEmail || 'contact@kalametgame.ir',
    };

    if (normalized === '/products') {
      title = isFa
        ? 'بازی‌ها و اپلیکیشن‌های TAK1 | kalametgame.ir'
        : 'Games & Applications | TAK1 Game Studio';
      description = isFa
        ? 'فهرست رسمی بازی‌های اندرویدی، اپلیکیشن‌ها و ابزارهای نرم‌افزاری استودیوی TAK1 همراه با لینک‌های دانلود معتبر.'
        : 'Official catalog of Android games, mobile applications, and tools developed by TAK1 Game Studio.';
    } else if (normalized.startsWith('/products/')) {
      const slug = decodeURIComponent(normalized.slice('/products/'.length));
      const product = products.find((p) => p.slug === slug);
      if (product) {
        const pTitle = isFa ? product.titleFa : product.titleEn;
        const pDesc = isFa
          ? product.shortDescFa || product.fullDescFa
          : product.shortDescEn || product.fullDescEn;
        title = `${pTitle} | TAK1 Game Studio`;
        if (pDesc) description = pDesc.slice(0, 155);
        if (product.iconUrl) {
          ogImage = product.iconUrl.startsWith('http')
            ? product.iconUrl
            : `${baseUrl}${product.iconUrl}`;
        }
        jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: pTitle,
          applicationCategory: product.category === 'game' ? 'GameApplication' : 'UtilitiesApplication',
          operatingSystem: 'Android, Web',
          softwareVersion: product.version,
          description: description,
          url: canonicalUrl,
          author: {
            '@type': 'Organization',
            name: studioName,
            url: baseUrl,
          },
        };
      } else {
        title = isFa ? `مشخصات محصول | TAK1 Game Studio` : `Product Details | TAK1 Game Studio`;
      }
    } else if (normalized === '/team') {
      title = isFa ? 'تیم توسعه TAK1 Game Studio' : 'Our Team | TAK1 Game Studio';
      description = isFa
        ? 'آشنایی با تیم مهندسی نرم‌افزار، طراحی بازی و حوزه‌های تخصصی استودیوی مستقل TAK1.'
        : 'Meet the programmers, game designers, and creators behind TAK1 Game Studio.';
    } else if (normalized === '/news') {
      title = isFa ? 'اخبار و اطلاعیه‌ها | TAK1 Game Studio' : 'News & Dispatches | TAK1 Game Studio';
      description = isFa
        ? 'آخرین اخبار، یادداشت‌های توسعه، انتشار نسخه‌های جدید و اطلاعیه‌های استودیوی TAK1.'
        : 'Latest development updates, release notes, and official announcements from TAK1 Game Studio.';
    } else if (normalized === '/support') {
      title = isFa ? 'پشتیبانی و پیگیری تیکت | TAK1 Game Studio' : 'Player Support | TAK1 Game Studio';
      description = isFa
        ? 'ثبت درخواست پشتیبانی فنی و پیگیری وضعیت تیکت برای بازی‌ها و اپلیکیشن‌های استودیوی TAK1.'
        : 'Submit a technical support request or track an existing support ticket for TAK1 titles.';
    } else if (normalized === '/feedback') {
      title = isFa ? 'پیشنهادها و ایده‌ها | TAK1 Game Studio' : 'Feedback & Ideas | TAK1 Game Studio';
      description = isFa
        ? 'ارسال ایده‌های بازی، پیشنهادهای بهبود و نظرات کاربران برای تیم توسعه TAK1.'
        : 'Share feature requests, new game ideas, and feedback directly with the TAK1 studio team.';
    } else if (normalized === '/contact') {
      title = isFa ? 'تماس با ما | TAK1 Game Studio' : 'Contact Us | TAK1 Game Studio';
      description = isFa
        ? 'راه‌های ارتباط مستقیم با استودیوی بازی‌سازی TAK1 برای همکاری، نشر و پرسش‌های تجاری.'
        : 'Get in touch with TAK1 Game Studio for partnerships, publishing, and general inquiries.';
    } else if (normalized === '/admin') {
      title = isFa ? 'داشبورد مدیریت | TAK1 Game Studio' : 'Studio Workspace | TAK1 Game Studio';
      robots = 'noindex, nofollow';
    } else if (!isKnownStudioRoute(normalized)) {
      title = isFa ? 'صفحه یافت نشد (۴۰۴) | TAK1 Game Studio' : 'Page Not Found (404) | TAK1 Game Studio';
      robots = 'noindex, nofollow';
    }

    document.title = title;
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'robots', robots);
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:site_name', studioName);
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setCanonicalLink(canonicalUrl);
    setStructuredData(jsonLd);
  }, [isFa, normalized, canonicalUrl, products, siteSettings, studioName]);

  return null;
}
