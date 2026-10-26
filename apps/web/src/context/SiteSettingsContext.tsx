"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { DEFAULT_HOME_CONTENT, type HomeContent } from '@/types/home-content';

export interface SiteSettings {
  logoUrl: string;
  heroImages: string[];
  homeContent: HomeContent;
}

const SiteSettingsContext = createContext<SiteSettings>({ logoUrl: '', heroImages: [], homeContent: DEFAULT_HOME_CONTENT });

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>({ logoUrl: '', heroImages: [], homeContent: DEFAULT_HOME_CONTENT });

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/settings`)
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (data) setSettings({ logoUrl: data.logoUrl || '', heroImages: Array.isArray(data.heroImages) ? data.heroImages : data.heroImageUrl ? [data.heroImageUrl] : [], homeContent: { ...DEFAULT_HOME_CONTENT, ...(data.homeContent || {}) } });
      })
      .catch(() => {});
  }, []);

  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>;
}

export const useSiteSettings = () => useContext(SiteSettingsContext);
