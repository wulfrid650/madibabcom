"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

type PublicSettings = Record<string, any>;

interface PublicSettingsContextValue {
  settings: PublicSettings;
  loading: boolean;
}

const PublicSettingsContext = createContext<PublicSettingsContextValue>({
  settings: {},
  loading: true,
});

export const PublicSettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<PublicSettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;
    const timeoutId = setTimeout(() => {
      if (!controller.signal.aborted) {
        controller.abort('public settings timeout');
      }
    }, 5000);

    const fetchSettings = async () => {
      try {
        const data = await api.getPublicSettings();
        setSettings(data || {});
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        console.error('Failed to load public settings:', error);
      } finally {
        clearTimeout(timeoutId);
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchSettings();

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
      if (!controller.signal.aborted) {
        controller.abort('public settings cleanup');
      }
    };
  }, []);

  const value = useMemo(() => ({ settings, loading }), [settings, loading]);

  return (
    <PublicSettingsContext.Provider value={value}>
      {children}
    </PublicSettingsContext.Provider>
  );
};

export const usePublicSettings = () => useContext(PublicSettingsContext);
