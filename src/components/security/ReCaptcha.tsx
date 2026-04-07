'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

const SETTINGS_TIMEOUT_MS = 5000;
const ENV_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

// Types pour grecaptcha v2
declare global {
  interface Grecaptcha {
    ready: (callback: () => void) => void;
    render: (
      container: HTMLElement | string,
      options: {
        sitekey: string;
        callback?: (token: string) => void;
        'expired-callback'?: () => void;
        'error-callback'?: () => void;
        theme?: 'light' | 'dark';
        size?: 'normal' | 'compact';
      }
    ) => number;
    reset: (widgetId?: number) => void;
    getResponse: (widgetId?: number) => string;
  }

  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

interface ReCaptchaSettings {
  isEnabled: boolean;
  siteKey: string;
  protectedForms: string[];
  isLoaded: boolean;
}

function parseProtectedForms(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((item): item is string => typeof item === 'string');
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
 * Hook pour récupérer les paramètres reCAPTCHA depuis l'API.
 */
export function useReCaptchaSettings(): ReCaptchaSettings {
  const [settings, setSettings] = useState<ReCaptchaSettings>({
    isEnabled: !!ENV_SITE_KEY,
    siteKey: ENV_SITE_KEY,
    protectedForms: ['contact', 'login', 'register'],
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
        const payload = await api.getPublicSettings();
        if (!payload) return;

        const isEnabled = payload.recaptcha_enabled === true || payload.recaptcha_enabled === '1';
        const siteKey = payload.recaptcha_site_key || ENV_SITE_KEY;
        const protectedForms = parseProtectedForms(payload.recaptcha_forms);

        setSettings({
          isEnabled: isEnabled && !!siteKey,
          siteKey,
          protectedForms: protectedForms.length > 0 ? protectedForms : ['contact', 'login', 'register'],
          isLoaded: true,
        });
      } catch {
        if (controller.signal.aborted) return;
        // La BD est inaccessible, on garde les valeurs par défaut (ENV)
      } finally {
        clearTimeout(timeoutId);
        setSettings((prev) => ({ ...prev, isLoaded: true }));
      }
    };

    fetchSettings();

    return () => {
      clearTimeout(timeoutId);
      if (!controller.signal.aborted) controller.abort('recaptcha settings cleanup');
    };
  }, []);

  return settings;
}

/**
 * Charge le script reCAPTCHA v2 globalement (dans le layout).
 */
export function ReCaptchaScript() {
  const { isEnabled, siteKey } = useReCaptchaSettings();

  if (!isEnabled || !siteKey) return null;

  return (
    <Script
      src="https://www.google.com/recaptcha/api.js"
      strategy="afterInteractive"
    />
  );
}

/**
 * Widget reCAPTCHA v2 (case à cocher).
 * À placer dans le formulaire. Appelle onToken(token) quand l'utilisateur valide,
 * et onToken(null) quand le token expire.
 */
export function ReCaptchaWidget({
  formType,
  onToken,
  theme = 'light',
}: {
  formType: string;
  onToken: (token: string | null) => void;
  theme?: 'light' | 'dark';
}) {
  const { isEnabled, siteKey, protectedForms, isLoaded } = useReCaptchaSettings();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const renderedRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isEnabled || !protectedForms.includes(formType)) return;
    if (!siteKey || !containerRef.current || renderedRef.current) return;

    const render = () => {
      if (!containerRef.current || renderedRef.current) return;
      const grecaptcha = window.grecaptcha;
      if (!grecaptcha) return;

      try {
        widgetIdRef.current = grecaptcha.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          callback: (token: string) => onToken(token),
          'expired-callback': () => onToken(null),
          'error-callback': () => onToken(null),
        });
        renderedRef.current = true;
      } catch (e) {
        console.error('reCAPTCHA render error:', e);
      }
    };

    if (window.grecaptcha?.render) {
      window.grecaptcha.ready(render);
    } else {
      // Attendre que le script charge
      const interval = setInterval(() => {
        if (window.grecaptcha?.render) {
          clearInterval(interval);
          window.grecaptcha.ready(render);
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isLoaded, isEnabled, siteKey, protectedForms, formType, theme, onToken]);

  // Réinitialiser si le composant se remonte
  useEffect(() => {
    return () => {
      if (widgetIdRef.current !== null && window.grecaptcha?.reset) {
        try { window.grecaptcha.reset(widgetIdRef.current); } catch { /* ignore */ }
      }
    };
  }, []);

  if (!isEnabled || !protectedForms.includes(formType)) return null;

  return (
    <div className="flex justify-center my-2">
      <div ref={containerRef} />
    </div>
  );
}

/**
 * Exposer une fonction reset du widget via ref (optionnel).
 */
export function resetReCaptchaWidget() {
  if (window.grecaptcha?.reset) {
    try { window.grecaptcha.reset(); } catch { /* ignore */ }
  }
}
