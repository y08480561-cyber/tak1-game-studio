import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { translations } from '../i18n/translations';
import type { Language, NewsPost, Product, SiteSettings, SupabaseStatus, TeamMember } from '../types/studio';

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
  siteSettings: SiteSettings | null;
  loadingData: boolean;
  dataError: string | null;
  storageMode: 'supabase' | 'unconfigured' | null;
  supabaseStatus: SupabaseStatus | null;
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
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [storageMode, setStorageMode] = useState<'supabase' | 'unconfigured' | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseStatus | null>(null);

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
      const [healthRes, prodRes, newsRes, teamRes, settingsRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/products'),
        fetch('/api/news'),
        fetch('/api/team'),
        fetch('/api/settings'),
      ]);

      const healthJson = healthRes.ok ? await healthRes.json() : null;
      if (healthJson) {
        setStorageMode(healthJson.storageMode ?? null);
        setSupabaseStatus(healthJson.supabaseStatus ?? null);
      }

      if (!prodRes.ok || !newsRes.ok || !teamRes.ok) {
        const errPayload = await (prodRes.ok ? newsRes : prodRes).json().catch(() => null);
        setProducts([]);
        setNews([]);
        setTeam([]);
        setSiteSettings(null);
        throw new Error(errPayload?.error || 'Unable to load studio data from database.');
      }

      const [prodJson, newsJson, teamJson, settingsJson] = await Promise.all([
        prodRes.json(),
        newsRes.json(),
        teamRes.json(),
        settingsRes.ok ? settingsRes.json() : Promise.resolve({ settings: null }),
      ]);

      setProducts(Array.isArray(prodJson.items) ? prodJson.items : []);
      setNews(Array.isArray(newsJson.items) ? newsJson.items : []);
      setTeam(Array.isArray(teamJson.items) ? teamJson.items : []);
      setSiteSettings(settingsJson?.settings ?? null);
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
        siteSettings,
        loadingData,
        dataError,
        storageMode,
        supabaseStatus,
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
