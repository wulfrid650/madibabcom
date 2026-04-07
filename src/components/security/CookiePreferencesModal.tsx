'use client';

import React, { useEffect, useState } from 'react';
import { getCookieConsent } from './CookieConsentModal';

const CONSENT_KEY = 'mbc_cookie_consent_v2';
const CONSENT_EVENT = 'cookie_consent_updated';
const OPEN_EVENT = 'open_cookie_preferences';

export default function CookiePreferencesModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const handleOpen = () => {
      const consent = getCookieConsent();
      if (consent) {
        setPreferences({
          essential: true,
          analytics: consent.analytics || false,
          marketing: consent.marketing || false,
        });
      }
      setIsOpen(true);
      document.body.style.overflow = 'hidden';
    };

    window.addEventListener(OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_EVENT, handleOpen);
  }, []);

  const closeModal = () => {
    setIsOpen(false);
    document.body.style.overflow = '';
  };

  const handleSave = () => {
    const consent = {
      ...preferences,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    window.dispatchEvent(new Event(CONSENT_EVENT));
    closeModal();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-preferences-title"
        className="w-full max-w-xl rounded-2xl bg-white p-6 md:p-8 shadow-2xl dark:bg-gray-900"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="cookie-preferences-title" className="text-2xl font-bold text-gray-900 dark:text-white">
            Préférences de Cookies
          </h2>
          <button
            onClick={closeModal}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Fermer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
          Nous respectons votre vie privée. Vous pouvez choisir ici les catégories de cookies que vous autorisez.
        </p>

        <div className="space-y-6">
          {/* Strictly Necessary */}
          <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Cookies Strictement Nécessaires</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Essentiels pour la sécurité et le bon fonctionnement du site (navigation, connexion). Ne peuvent être désactivés.
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <span className="text-xs font-bold text-madiba-red bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">Obligatoire</span>
            </div>
          </div>

          {/* Analytics */}
          <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
            <div className="pr-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Cookies Analytiques</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Permettent de mesurer le trafic, les visites et de comprendre comment vous interagissez avec notre site (ex: Google Analytics).
              </p>
            </div>
            <div className="ml-4 flex-shrink-0 mt-1">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-madiba-red"></div>
              </label>
            </div>
          </div>

          {/* Marketing */}
          <div className="flex items-start justify-between pb-2">
            <div className="pr-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Cookies Marketing</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Utilisés pour suivre les visiteurs et vous proposer des annonces publicitaires ciblées (ex: Pixel Facebook).
              </p>
            </div>
            <div className="ml-4 flex-shrink-0 mt-1">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={preferences.marketing}
                  onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-madiba-red"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={closeModal}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-madiba-red px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-red-700"
          >
            Enregistrer mes choix
          </button>
        </div>
      </div>
    </div>
  );
}
