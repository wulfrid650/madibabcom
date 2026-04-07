'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { getCookieConsent } from '@/components/security/CookieConsentModal';
import { api } from '@/lib/api';

interface AnalyticsSettings {
  ga4_enabled?: boolean;
  ga4_id?: string;
  gtm_enabled?: boolean;
  gtm_id?: string;
  fb_pixel_enabled?: boolean;
  fb_pixel_id?: string;
}

const SETTINGS_TIMEOUT_MS = 5000;

/**
 * Composant pour l'injection dynamique des scripts Analytics.
 * Les paramètres sont récupérés depuis l'API backend.
 */
export function GoogleAnalytics() {
  const [settings, setSettings] = useState<AnalyticsSettings>({});
  const [loaded, setLoaded] = useState(false);
  const [consent, setConsent] = useState<{ analytics: boolean; marketing: boolean }>({
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check initial consent
    const currentConsent = getCookieConsent();
    if (currentConsent) {
      setConsent({
        analytics: currentConsent.analytics,
        marketing: currentConsent.marketing,
      });
    }

    // Listen to updates
    const handleConsentUpdate = () => {
      const updatedConsent = getCookieConsent();
      if (updatedConsent) {
        setConsent({
          analytics: updatedConsent.analytics,
          marketing: updatedConsent.marketing,
        });
      }
    };

    window.addEventListener('cookie_consent_updated', handleConsentUpdate);
    return () => {
      window.removeEventListener('cookie_consent_updated', handleConsentUpdate);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;
    const timeoutId = setTimeout(() => {
      if (!controller.signal.aborted) {
        controller.abort('analytics settings timeout');
      }
    }, SETTINGS_TIMEOUT_MS);

    const fetchSettings = async () => {
      try {
        const data = await api.getPublicSettings();

        if (data) {
          setSettings({
            ga4_enabled: data.ga4_enabled === true || data.ga4_enabled === '1',
            ga4_id: data.ga4_id,
            gtm_enabled: data.gtm_enabled === true || data.gtm_enabled === '1',
            gtm_id: data.gtm_id,
            fb_pixel_enabled: data.fb_pixel_enabled === true || data.fb_pixel_enabled === '1',
            fb_pixel_id: data.fb_pixel_id,
          });
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        console.error('Failed to load analytics settings:', error);
      } finally {
        clearTimeout(timeoutId);
        if (isActive) {
          setLoaded(true);
        }
      }
    };

    fetchSettings();

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
      if (!controller.signal.aborted) {
        controller.abort('analytics settings cleanup');
      }
    };
  }, []);

  if (!loaded) return null;

  return (
    <>
      {/* Google Analytics 4 */}
      {consent.analytics && settings.ga4_enabled && settings.ga4_id && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${settings.ga4_id}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${settings.ga4_id}', {
                page_path: window.location.pathname,
              });
            `}
          </Script>
        </>
      )}

      {/* Google Tag Manager */}
      {consent.analytics && settings.gtm_enabled && settings.gtm_id && (
        <>
          <Script id="gtm-script" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${settings.gtm_id}');
            `}
          </Script>
        </>
      )}

      {/* Facebook Pixel */}
      {consent.marketing && settings.fb_pixel_enabled && settings.fb_pixel_id && (

        <Script id="fb-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${settings.fb_pixel_id}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}

/**
 * Composant GTM NoScript (à placer après <body>).
 */
export function GTMNoScript({ gtmId }: { gtmId?: string }) {
  if (!gtmId) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  );
}
