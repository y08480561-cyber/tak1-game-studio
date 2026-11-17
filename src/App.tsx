import { StudioProvider, useStudio } from './context/StudioContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { TeamPage } from './pages/TeamPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { NewsPage } from './pages/NewsPage';
import { SupportPage } from './pages/SupportPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { ContactPage } from './pages/ContactPage';
import { AdminPage } from './pages/AdminPage';

function StudioRouter() {
  const { path } = useStudio();

  const normalized = path === '/' ? '/' : path.replace(/\/+$/, '');

  let content = <HomePage />;
  if (normalized === '/team') {
    content = <TeamPage />;
  } else if (normalized === '/products') {
    content = <ProductsPage />;
  } else if (normalized.startsWith('/products/')) {
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
      <Navbar />
      <main className="flex-1">{content}</main>
      <Footer />
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
