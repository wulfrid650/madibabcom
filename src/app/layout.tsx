import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/AuthContext"
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics"
import { ReCaptchaScript } from "@/components/security/ReCaptcha"
import CookieConsentModal from "@/components/security/CookieConsentModal"
import CookiePreferencesModal from "@/components/security/CookiePreferencesModal"
import MaintenanceGate from '@/components/system/MaintenanceGate';

export const metadata: Metadata = {
  title: 'MBC Construction',
  description: 'Application de gestion et portfolio',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="font-sans antialiased text-gray-900 bg-white dark:bg-madiba-black dark:text-gray-100 transition-colors duration-300"
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <MaintenanceGate>
              {children}
            </MaintenanceGate>
          </AuthProvider>
        </ThemeProvider>
        {/* Analytics et scripts dynamiques */}
        <CookieConsentModal />
        <CookiePreferencesModal />
        <GoogleAnalytics />
        <ReCaptchaScript />
      </body>
    </html>
  )
}
