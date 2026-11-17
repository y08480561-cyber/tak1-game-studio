import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { translations } from '../i18n/translations';
import type { Language, NewsPost, Product, TeamMember } from '../types/studio';

interface StudioContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (typeof translations)['fa'] | (typeof translations)['en'];
  path: string;
  navigate: (to: string) => void;
  products: Product[];
  news: NewsPost[];
  team: TeamMember[];
  loadingData: boolean;
  dataError: string | null;
  storageMode: 'supabase' | 'local' | null;
  refreshPublicData: () => Promise<void>;
}

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('tak1_lang');
      return saved === 'en' ? 'en' : 'fa';
    } catch {
      return 'fa';
    }
  });

  const [path, setPath] = useState<string>(() => window.location.pathname || '/');
  const [products, setProducts] = useState<Product[]>([]);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [storageMode, setStorageMode] = useState<'supabase' | 'local' | null>(null);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    try {
      localStorage.setItem('tak1_lang', next);
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'fa' ? 'en' : 'fa');
  }, [lang, setLang]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    const handlePop = () => {
      setPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const navigate = useCallback((to: string) => {
    if (to === window.location.pathname) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.history.pushState({}, '', to);
    setPath(to);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const refreshPublicData = useCallback(async () => {
    setLoadingData(true);
    setDataError(null);
    try {
      const [healthRes, prodRes, newsRes, teamRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/products'),
        fetch('/api/news'),
        fetch('/api/team'),
      ]);

      if (!prodRes.ok || !newsRes.ok || !teamRes.ok) {
        throw new Error('Server returned an error while loading studio data.');
      }

      const [healthJson, prodJson, newsJson, teamJson] = await Promise.all([
        healthRes.ok ? healthRes.json() : Promise.resolve({ storageMode: null }),
        prodRes.json(),
        newsRes.json(),
        teamRes.json(),
      ]);

      setStorageMode(healthJson.storageMode ?? null);
      setProducts(Array.isArray(prodJson.items) ? prodJson.items : []);
      setNews(Array.isArray(newsJson.items) ? newsJson.items : []);
      setTeam(Array.isArray(teamJson.items) ? teamJson.items : []);
    } catch (err) {
      setDataError((err as Error).message || 'Connection failed');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    void refreshPublicData();
  }, [refreshPublicData]);

  return (
    <StudioContext.Provider
      value={{
        lang,
        setLang,
        toggleLang,
        t: translations[lang],
        path,
        navigate,
        products,
        news,
        team,
        loadingData,
        dataError,
        storageMode,
        refreshPublicData,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio(): StudioContextValue {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error('useStudio must be used inside StudioProvider');
  return ctx;
}
