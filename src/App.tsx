import { StudioProvider, useStudio } from './context/StudioContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { SeoHead } from './components/SeoHead';
import { HomePage } from './pages/HomePage';
import { TeamPage } from './pages/TeamPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { NewsPage } from './pages/NewsPage';
import { SupportPage } from './pages/SupportPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { ContactPage } from './pages/ContactPage';
import { AdminPage } from './pages/AdminPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { SupportBubble } from './components/SupportBubble';

function StudioRouter() {
  const { path, lang, siteSettings } = useStudio();
  const isFa = lang === 'fa';

  const normalized = path === '/' ? '/' : path.replace(/\/+$/, '');
  const announcement = isFa ? siteSettings?.announcementFa : siteSettings?.announcementEn;
  const showAnnouncement = normalized !== '/admin' && Boolean(announcement?.trim());
  const showMaintenance = normalized !== '/admin' && Boolean(siteSettings?.maintenanceMode);

  let content = <NotFoundPage />;
  if (normalized === '/') {
    content = <HomePage />;
  } else if (normalized === '/team') {
    content = <TeamPage />;
  } else if (normalized === '/products') {
    content = <ProductsPage />;
  } else if (normalized.startsWith('/products/') && normalized.length > '/products/'.length) {
    const slug = decodeURIComponent(normalized.slice('/products/'.length));
    content = <ProductDetailPage slug={slug} />;
  } else if (normalized === '/news') {
    content = <NewsPage />;
  } else if (normalized === '/support') {
    content = <SupportPage />;
  } else if (normalized === '/feedback') {
    content = <FeedbackPage />;
  } else if (normalized === '/contact') {
    content = <ContactPage />;
  } else if (normalized === '/admin') {
    content = <AdminPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#070709] text-[#EAECEF]">
      <SeoHead />
      {showMaintenance && (
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs font-medium text-amber-200">
          {isFa
            ? 'سایت در حال به‌روزرسانی و نگهداری دوره‌ای است.'
            : 'Scheduled studio maintenance is currently in progress.'}
        </div>
      )}
      {showAnnouncement && (
        <div className="border-b border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 py-2 text-center text-xs font-medium text-[#F2CF66]">
          {announcement}
        </div>
      )}
      <Navbar />
      <main className="flex-1">{content}</main>
      <Footer />
      <SupportBubble />
    </div>
  );
}

export default function App() {
  return (
    <StudioProvider>
      <StudioRouter />
    </StudioProvider>
  );
}
