'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

interface ReCaptchaContextValue {
  isEnabled: boolean;
  siteKey: string;
  protectedForms: string[];
  executeRecaptcha: (action: string) => Promise<string | null>;
  isLoaded: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const SETTINGS_TIMEOUT_MS = 5000;

// Déclaration du type grecaptcha global
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

function parseProtectedForms(raw: unknown): string[] {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === 'string');
  }

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      return [];
    }
  }

  return [];
}

/**
 * Hook pour utiliser reCAPTCHA dans les composants.
 */
export function useReCaptcha() {
  const [settings, setSettings] = useState<ReCaptchaContextValue>({
    isEnabled: false,
    siteKey: '',
    protectedForms: [],
    executeRecaptcha: async () => null,
    isLoaded: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      if (!controller.signal.aborted) {
        controller.abort('recaptcha settings timeout');
      }
    }, SETTINGS_TIMEOUT_MS);

    const fetchSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/public/settings`, {
          signal: controller.signal,
        });

        if (!response.ok) return;

        const data = await response.json();
        const payload = data?.data;

        if (!data?.success || !payload) return;

        const isEnabled = payload.recaptcha_enabled === true || payload.recaptcha_enabled === '1';
        const siteKey = payload.recaptcha_site_key || '';
        const protectedForms = parseProtectedForms(payload.recaptcha_forms);

        setSettings({
          isEnabled,
          siteKey,
          protectedForms: protectedForms.length > 0 ? protectedForms : ['contact', 'login', 'register'],
          executeRecaptcha: async (action: string) => {
            if (!isEnabled || !siteKey) return null;

            try {
              if (typeof window !== 'undefined' && window.grecaptcha) {
                return new Promise((resolve) => {
                  window.grecaptcha.ready(async () => {
                    try {
                      const token = await window.grecaptcha.execute(siteKey, { action });
                      resolve(token);
                    } catch {
                      resolve(null);
                    }
                  });
                });
              }
            } catch (error) {
              console.error('reCAPTCHA execution failed:', error);
            }

            return null;
          },
          isLoaded: true,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        console.error('Failed to load reCAPTCHA settings:', error);
      } finally {
        clearTimeout(timeoutId);
        setSettings((prev) => ({ ...prev, isLoaded: true }));
      }
    };

    fetchSettings();

    return () => {
      clearTimeout(timeoutId);
      if (!controller.signal.aborted) {
        controller.abort('recaptcha settings cleanup');
      }
    };
  }, []);

  return settings;
}

/**
 * Composant pour charger le script reCAPTCHA.
 */
export function ReCaptchaScript() {
  const [siteKey, setSiteKey] = useState<string>('');
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      if (!controller.signal.aborted) {
        controller.abort('recaptcha script timeout');
      }
    }, SETTINGS_TIMEOUT_MS);

    const fetchSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/public/settings`, {
          signal: controller.signal,
        });

        if (!response.ok) return;

        const data = await response.json();
        const payload = data?.data;

        if (!data?.success || !payload) return;

        const enabled = payload.recaptcha_enabled === true || payload.recaptcha_enabled === '1';
        setIsEnabled(enabled);
        setSiteKey(payload.recaptcha_site_key || '');
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        console.error('Failed to load reCAPTCHA settings:', error);
      } finally {
        clearTimeout(timeoutId);
      }
    };

    fetchSettings();

    return () => {
      clearTimeout(timeoutId);
      if (!controller.signal.aborted) {
        controller.abort('recaptcha script cleanup');
      }
    };
  }, []);

  if (!isEnabled || !siteKey) return null;

  return (
    <Script
      src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`}
      strategy="afterInteractive"
    />
  );
}

/**
 * Badge reCAPTCHA (optionnel, pour afficher l'info de protection).
 */
export function ReCaptchaBadge({ formType }: { formType: string }) {
  const { isEnabled, protectedForms } = useReCaptcha();

  if (!isEnabled || !protectedForms.includes(formType)) {
    return null;
  }

  return (
    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
      Ce formulaire est protégé par reCAPTCHA et les{' '}
      <a
        href="https://policies.google.com/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="text-red-600 hover:underline"
      >
        Règles de confidentialité
      </a>{' '}
      et{' '}
      <a
        href="https://policies.google.com/terms"
        target="_blank"
        rel="noopener noreferrer"
        className="text-red-600 hover:underline"
      >
        Conditions d'utilisation
      </a>{' '}
      de Google s'appliquent.
    </p>
  );
}
