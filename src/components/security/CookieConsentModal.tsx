'use client';

import React, { useEffect, useState } from 'react';

const CONSENT_KEY = 'mbc_cookie_consent_v1';
const EXIT_URL = 'https://www.google.com';

export default function CookieConsentModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const consent = localStorage.getItem(CONSENT_KEY);
    if (consent !== 'accepted') {
      setIsOpen(true);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const acceptCookies = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setIsOpen(false);
    document.body.style.overflow = '';
  };

  const rejectCookies = () => {
    localStorage.setItem(CONSENT_KEY, 'rejected');
    window.location.replace(EXIT_URL);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-consent-title"
        className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900"
      >
        <h2 id="cookie-consent-title" className="text-xl font-bold text-gray-900 dark:text-white">
          Politique de Cookies
        </h2>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
          Ce site utilise des cookies pour garantir le bon fonctionnement et améliorer votre expérience.
          Vous devez accepter les cookies pour continuer la navigation.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={rejectCookies}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Refuser et quitter
          </button>
          <button
            type="button"
            onClick={acceptCookies}
            className="rounded-lg bg-madiba-red px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
