"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';

export interface SiteSettings {
  logoUrl: string;
  heroImages: string[];
}

const SiteSettingsContext = createContext<SiteSettings>({ logoUrl: '', heroImages: [] });

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>({ logoUrl: '', heroImages: [] });

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/settings`)
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (data) setSettings({ logoUrl: data.logoUrl || '', heroImages: Array.isArray(data.heroImages) ? data.heroImages : data.heroImageUrl ? [data.heroImageUrl] : [] });
      })
      .catch(() => {});
  }, []);

  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>;
}

export const useSiteSettings = () => useContext(SiteSettingsContext);
