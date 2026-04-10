'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

const SETTINGS_TIMEOUT_MS = 5000;
const RECAPTCHA_SCRIPT_ID = 'google-recaptcha-api';
const RECAPTCHA_SCRIPT_SRC = 'https://www.google.com/recaptcha/api.js?render=explicit';
const RECAPTCHA_SCRIPT_TIMEOUT_MS = 15000;
const RECAPTCHA_POLL_INTERVAL_MS = 100;
const ENV_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';
const DEFAULT_PROTECTED_FORMS = ['contact', 'login', 'register'];

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

let sharedSettings: ReCaptchaSettings = {
  isEnabled: !!ENV_SITE_KEY,
  siteKey: ENV_SITE_KEY,
  protectedForms: DEFAULT_PROTECTED_FORMS,
  isLoaded: false,
};

let sharedSettingsRequest: Promise<void> | null = null;
let sharedScriptRequest: Promise<void> | null = null;
const sharedSettingsListeners = new Set<(settings: ReCaptchaSettings) => void>();

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

function publishSettings(nextSettings: ReCaptchaSettings) {
  sharedSettings = nextSettings;
  sharedSettingsListeners.forEach((listener) => listener(sharedSettings));
}

async function ensureReCaptchaScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  if (window.grecaptcha?.render) {
    return;
  }

  if (sharedScriptRequest) {
    return sharedScriptRequest;
  }

  sharedScriptRequest = new Promise<void>((resolve, reject) => {
    let script = document.getElementById(RECAPTCHA_SCRIPT_ID) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.id = RECAPTCHA_SCRIPT_ID;
      script.src = RECAPTCHA_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const startedAt = Date.now();

    const cleanupAndReject = (error: Error) => {
      sharedScriptRequest = null;
      reject(error);
    };

    const waitForGrecaptcha = () => {
      if (window.grecaptcha?.render) {
        resolve();
        return;
      }

      if (Date.now() - startedAt >= RECAPTCHA_SCRIPT_TIMEOUT_MS) {
        cleanupAndReject(new Error('Impossible de charger reCAPTCHA.'));
        return;
      }

      window.setTimeout(waitForGrecaptcha, RECAPTCHA_POLL_INTERVAL_MS);
    };

    script.addEventListener('error', () => {
      cleanupAndReject(new Error('Impossible de charger le script reCAPTCHA.'));
    }, { once: true });

    waitForGrecaptcha();
  });

  return sharedScriptRequest;
}

async function loadSharedSettings() {
  if (sharedSettingsRequest) {
    return sharedSettingsRequest;
  }

  sharedSettingsRequest = (async () => {
    try {
      const payload = await api.getPublicSettings();
      if (!payload) {
        publishSettings({
          ...sharedSettings,
          isLoaded: true,
        });
        return;
      }

      const isEnabled = payload.recaptcha_enabled === true || payload.recaptcha_enabled === '1';
      const siteKey = payload.recaptcha_site_key || ENV_SITE_KEY;
      const protectedForms = parseProtectedForms(payload.recaptcha_forms);

      publishSettings({
        isEnabled: isEnabled && !!siteKey,
        siteKey,
        protectedForms: protectedForms.length > 0 ? protectedForms : DEFAULT_PROTECTED_FORMS,
        isLoaded: true,
      });
    } catch {
      publishSettings({
        ...sharedSettings,
        isLoaded: true,
      });
    }
  })();

  return sharedSettingsRequest;
}

/**
 * Hook pour récupérer les paramètres reCAPTCHA depuis l'API.
 */
export function useReCaptchaSettings(): ReCaptchaSettings {
  const [settings, setSettings] = useState<ReCaptchaSettings>(sharedSettings);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      publishSettings({
        ...sharedSettings,
        isLoaded: true,
      });
    }, SETTINGS_TIMEOUT_MS);

    const handleSettingsChange = (nextSettings: ReCaptchaSettings) => {
      clearTimeout(timeoutId);
      setSettings(nextSettings);
    };

    sharedSettingsListeners.add(handleSettingsChange);
    void loadSharedSettings().finally(() => clearTimeout(timeoutId));

    return () => {
      clearTimeout(timeoutId);
      sharedSettingsListeners.delete(handleSettingsChange);
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
      id={RECAPTCHA_SCRIPT_ID}
      src={RECAPTCHA_SCRIPT_SRC}
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
  const [isScriptReady, setIsScriptReady] = useState(() => (
    typeof window !== 'undefined' && !!window.grecaptcha?.render
  ));
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isEnabled || !protectedForms.includes(formType) || !siteKey) return;

    let isCancelled = false;

    void ensureReCaptchaScript()
      .then(() => {
        if (!isCancelled) {
          setLoadError(null);
          setIsScriptReady(true);
        }
      })
      .catch((error) => {
        console.error('reCAPTCHA script error:', error);
        if (!isCancelled) {
          setIsScriptReady(false);
          setLoadError('La vérification reCAPTCHA n’a pas pu être chargée.');
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [formType, isEnabled, isLoaded, protectedForms, siteKey]);

  useEffect(() => {
    if (!isLoaded || !isEnabled || !protectedForms.includes(formType)) return;
    if (!siteKey || !containerRef.current || renderedRef.current || !isScriptReady) return;

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
  }, [isLoaded, isEnabled, isScriptReady, siteKey, protectedForms, formType, theme, onToken]);

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
    <div className="my-2 space-y-2">
      {!isScriptReady && !loadError && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
          Chargement de la vérification reCAPTCHA...
        </div>
      )}
      {loadError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          {loadError}
        </div>
      )}
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
