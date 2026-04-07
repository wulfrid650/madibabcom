'use client';

import React, { useEffect, useState } from 'react';

const CONSENT_KEY = 'mbc_cookie_consent_v2';
const CONSENT_EVENT = 'cookie_consent_updated';

export function getCookieConsent() {
  if (typeof window === 'undefined') return null;
  const consentData = localStorage.getItem(CONSENT_KEY);
  if (!consentData) return null;
  try {
    return JSON.parse(consentData);
  } catch (e) {
    return null;
  }
}

export default function CookieConsentModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const consent = getCookieConsent();
    if (!consent) {
      setIsOpen(true);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const dispatchConsentEvent = () => {
    window.dispatchEvent(new Event(CONSENT_EVENT));
  };

  const acceptCookies = () => {
    const consent = {
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    dispatchConsentEvent();
    setIsOpen(false);
    document.body.style.overflow = '';
  };

  const rejectCookies = () => {
    const consent = {
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    dispatchConsentEvent();
    setIsOpen(false);
    document.body.style.overflow = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-consent-title"
        className="w-full max-w-xl rounded-2xl bg-white p-6 md:p-8 shadow-2xl dark:bg-gray-900"
      >
        <h2 id="cookie-consent-title" className="text-2xl font-bold text-gray-900 dark:text-white">
          Politique de Cookies 🍪
        </h2>
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
          Ce site utilise des cookies pour garantir le bon fonctionnement et améliorer votre expérience.
          Certains cookies (strictement nécessaires) sont obligatoires, mais d'autres (analytiques) nécessitent votre consentement.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              document.body.style.overflow = '';
              window.dispatchEvent(new Event('open_cookie_preferences'));
            }}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Personnaliser
          </button>
          <button
            type="button"
            onClick={rejectCookies}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Refuser (Essentiels)
          </button>
          <button
            type="button"
            onClick={acceptCookies}
            className="rounded-lg bg-madiba-red px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition"
          >
            Tout Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
