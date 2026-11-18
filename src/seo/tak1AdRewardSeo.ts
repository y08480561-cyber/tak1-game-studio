import type { Product } from '../types/studio';

export const TAK1_AD_REWARD_SLUG = 'tak1-1794944495410';
export const TAK1_AD_REWARD_CANONICAL = `https://kalametgame.ir/products/${TAK1_AD_REWARD_SLUG}`;
export const TAK1_AD_REWARD_ICON =
  'https://yurjxomeneunqorgqbyg.supabase.co/storage/v1/object/public/studio-media/icons/1794944591892-03264f036f5b.png';
export const TAK1_AD_REWARD_MYKET_URL = 'https://myket.ir/app/com.aistudio.reqabat.trophy';

export const TAK1_AD_REWARD_SEO = {
  fa: {
    title: 'دانلود بازی تبلیغ ببین جایزه ببر اندروید | توسعه‌دهندگان بازی تک۱',
    description:
      'دانلود بازی تبلیغ ببین جایزه ببر برای اندروید از مایکت؛ بازی جایزه‌دار ایرانی از توسعه‌دهندگان بازی تک۱ (TAK1 Game Studio) با جدول رتبه‌بندی زنده.',
    h1: 'بازی تبلیغ ببین جایزه ببر',
    shortSummary:
      'بازی تبلیغ ببین جایزه ببر یک بازی جایزه‌دار ایرانی برای اندروید از توسعه‌دهندگان بازی تک۱ (TAK1 Game Studio) است که با چالش ۱۰۰ مربع روزانه، جدول رتبه‌بندی زنده و انتشار رسمی در مایکت ارائه شده است.',
  },
  en: {
    title: 'Tabligh Bebin Jayeze Bebar Android | TAK1 Game Studio',
    description:
      'Download Tabligh Bebin Jayeze Bebar for Android on Myket — an Iranian reward-based mobile game by TAK1 Game Studio featuring daily challenges and a live leaderboard.',
    h1: 'Tabligh Bebin Jayeze Bebar',
    shortSummary:
      'Tabligh Bebin Jayeze Bebar is an Android game by TAK1 Game Studio featuring a 100-square daily challenge, live leaderboard competition, and official Myket distribution.',
  },
} as const;

export const TAK1_AD_REWARD_FALLBACK_PRODUCT: Product = {
  id: '9e13cd7a-bbf6-4d6b-a4bc-8c8fbb546a37',
  slug: TAK1_AD_REWARD_SLUG,
  category: 'app',
  titleFa: 'برنامه تبلیغ ببین جایزه ببر',
  titleEn: 'Tabligh Bebin Jayeze Bebar',
  shortDescFa: TAK1_AD_REWARD_SEO.fa.shortSummary,
  shortDescEn: TAK1_AD_REWARD_SEO.en.shortSummary,
  fullDescFa:
    'در این برنامه با مشاهده ویدئوهای تبلیغاتی جایزه‌دار و تکمیل ۱۰۰ مربع امتیاز روزانه در چرخه ۲۴ ساعته، امتیاز کسب کنید و در جدول رتبه‌بندی زنده رقابت نمایید.',
  fullDescEn:
    'Earn points by watching rewarded ad videos and completing 100 daily score squares on a 24-hour cycle while competing on a live leaderboard.',
  version: '1.1.0',
  releaseDate: '2026-11-17',
  iconUrl: TAK1_AD_REWARD_ICON,
  screenshots: [],
  links: {
    myket: TAK1_AD_REWARD_MYKET_URL,
  },
  featured: true,
  published: true,
  createdAt: '2026-11-17T19:41:35.502337+00:00',
  updatedAt: '2026-11-17T19:52:27.810611+00:00',
};

export function buildTak1AdRewardJsonLd(options?: {
  isFa?: boolean;
  version?: string;
  releaseDate?: string;
  iconUrl?: string;
  myketUrl?: string;
  directUrl?: string;
  contactEmail?: string;
}): Record<string, unknown> {
  const isFa = options?.isFa ?? true;
  const baseUrl = 'https://kalametgame.ir';
  const imageUrl = options?.iconUrl || TAK1_AD_REWARD_ICON;
  const downloadUrl = options?.myketUrl || options?.directUrl || TAK1_AD_REWARD_MYKET_URL;
  const version = options?.version || TAK1_AD_REWARD_FALLBACK_PRODUCT.version;
  const releaseDate = options?.releaseDate || TAK1_AD_REWARD_FALLBACK_PRODUCT.releaseDate;
  const description = isFa
    ? TAK1_AD_REWARD_SEO.fa.description
    : TAK1_AD_REWARD_SEO.en.description;
  const gameName = isFa ? TAK1_AD_REWARD_SEO.fa.h1 : TAK1_AD_REWARD_SEO.en.h1;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: 'توسعه‌دهندگان بازی تک۱',
        alternateName: 'TAK1 Game Studio',
        url: baseUrl,
        logo: `${baseUrl}/assets/aistudio/image_3e0bd734.png`,
        description:
          'تیم توسعه‌دهندگان بازی تک۱ (TAK1)، سازنده بازی‌های اندرویدی، اپلیکیشن و نرم‌افزارهای کاربردی.',
        email: options?.contactEmail || 'contact@kalametgame.ir',
      },
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        name: 'توسعه‌دهندگان بازی تک۱',
        alternateName: 'TAK1 Game Studio',
        url: `${baseUrl}/`,
        inLanguage: isFa ? 'fa-IR' : 'en-US',
        publisher: {
          '@id': `${baseUrl}/#organization`,
        },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${TAK1_AD_REWARD_CANONICAL}#software`,
        name: gameName,
        alternateName: 'برنامه تبلیغ ببین جایزه ببر',
        applicationCategory: 'GameApplication',
        operatingSystem: 'Android',
        softwareVersion: version,
        datePublished: releaseDate,
        inLanguage: isFa ? 'fa-IR' : 'en-US',
        description,
        url: TAK1_AD_REWARD_CANONICAL,
        downloadUrl,
        installUrl: downloadUrl,
        image: imageUrl,
        author: {
          '@id': `${baseUrl}/#organization`,
        },
        publisher: {
          '@id': `${baseUrl}/#organization`,
        },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'IRR',
          availability: 'https://schema.org/InStock',
          url: downloadUrl,
        },
      },
      {
        '@type': 'Product',
        '@id': `${TAK1_AD_REWARD_CANONICAL}#product`,
        name: gameName,
        alternateName: 'برنامه تبلیغ ببین جایزه ببر',
        description,
        image: [imageUrl],
        sku: TAK1_AD_REWARD_SLUG,
        category: isFa ? 'بازی اندروید / بازی جایزه‌دار ایرانی' : 'Android Game',
        url: TAK1_AD_REWARD_CANONICAL,
        brand: {
          '@type': 'Brand',
          name: 'توسعه‌دهندگان بازی تک۱ (TAK1 Game Studio)',
        },
        manufacturer: {
          '@id': `${baseUrl}/#organization`,
        },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'IRR',
          availability: 'https://schema.org/InStock',
          url: downloadUrl,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: isFa ? 'خانه' : 'Home',
            item: `${baseUrl}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: isFa ? 'محصولات' : 'Products',
            item: `${baseUrl}/products`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: gameName,
            item: TAK1_AD_REWARD_CANONICAL,
          },
        ],
      },
    ],
  };
}
