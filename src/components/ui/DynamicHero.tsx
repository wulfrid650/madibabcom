'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface HeroSettings {
  hero_title?: string;
  hero_subtitle?: string;
  hero_image?: string;
  hero_cta_text?: string;
  company_slogan?: string;
}

interface DynamicHeroProps {
  initialSettings?: HeroSettings;
}

const HERO_SETTINGS_TIMEOUT_MS = 5000;

export default function DynamicHero({ initialSettings }: DynamicHeroProps) {
  const [settings, setSettings] = useState<HeroSettings>(initialSettings || {});
  const [isLoading, setIsLoading] = useState(!initialSettings);

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      if (!controller.signal.aborted) {
        controller.abort('hero settings timeout');
      }
    }, HERO_SETTINGS_TIMEOUT_MS);

    const fetchSettings = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        const response = await fetch(`${API_URL}/public/settings`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = await response.json();

        if (data.success && data.data) {
          setSettings(data.data);
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        console.error('Failed to load hero settings:', error);
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    };

    fetchSettings();

    return () => {
      clearTimeout(timeoutId);
      if (!controller.signal.aborted) {
        controller.abort('hero settings cleanup');
      }
    };
  }, [initialSettings]);

  // Fonction pour styliser le mot "rigueur" en rouge et italique
  const styleTitle = (title: string) => {
    const parts = title.split(/(rigueur)/gi);
    return (
      <>
        {parts.map((part, index) => {
          if (part.toLowerCase() === 'rigueur') {
            return (
              <span key={index} className="text-madiba-red italic">
                {part}
              </span>
            );
          }
          return <React.Fragment key={index}>{part}</React.Fragment>;
        })}
      </>
    );
  };

  // Image à afficher (personnalisée ou par défaut)
  const heroImage = settings.hero_image || '/engineer.png';

  return (
    <section className="bg-white dark:bg-madiba-black min-h-[90vh] text-madiba-black dark:text-white relative overflow-hidden flex items-center pt-20 transition-colors duration-300">

      <div className="container mx-auto px-6 md:px-12 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

        {/* LEFT CONTENT */}
        <div className="max-w-2xl py-12 lg:py-0">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full mt-6"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          ) : (
            <>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.15] tracking-tight text-madiba-black dark:text-white transition-colors">
                {settings.hero_title ? (
                  styleTitle(settings.hero_title)
                ) : (
                  <>
                    Construire avec <br />
                    <span className="text-madiba-red italic">rigueur</span> et vision <br />
                    durable
                  </>
                )}
              </h1>

              <p className="text-gray-600 dark:text-gray-300 mt-6 mb-8 text-base md:text-lg font-normal leading-relaxed max-w-md transition-colors">
                {settings.hero_subtitle || settings.company_slogan ||
                  "MBC accompagne vos projets de construction, de la livraison à la conception avec transparence et expertise terrain."}
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/contact" className="bg-madiba-red hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors shadow-lg shadow-red-500/20">
                  {settings.hero_cta_text || "Demander un devis"}
                </Link>

                <Link href="/portfolio" className="bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-white/10 text-madiba-black dark:text-white border border-gray-300 dark:border-gray-600 font-medium px-6 py-3 rounded-lg transition-colors">
                  Voir nos projets
                </Link>
              </div>
            </>
          )}
        </div>

        {/* RIGHT VISUAL - Desktop */}
        <div className="relative h-[550px] lg:h-[700px] w-full hidden lg:flex items-center justify-center lg:justify-end">

          {/* Large Organic Blob Background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] z-0 pointer-events-none">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-gray-100 dark:text-gray-800 fill-current transition-colors duration-300">
              <path transform="translate(100 100)" d="M44.5,-48.6C56.9,-38.7,65.8,-23.4,66.3,-8.1C66.8,7.3,58.8,22.6,48.2,34.9C37.6,47.2,24.3,56.5,9.4,59.3C-5.5,62.1,-21.9,58.4,-36.8,49.2C-51.7,40,-65.1,25.3,-66.9,9.3C-68.7,-6.7,-58.9,-24,-46.8,-34.7C-34.7,-45.4,-20.3,-49.4,-4.3,-50.8C11.7,-52.1,27.7,-50.8,44.5,-48.6Z" />
            </svg>
          </div>

          {/* Red Accent Blob (Bottom Left of image) */}
          <div className="absolute bottom-[8%] left-[5%] w-36 h-36 lg:w-56 lg:h-56 bg-madiba-red rounded-full z-10 opacity-90"></div>

          {/* Dark accent blob for depth */}
          <div className="absolute top-[10%] right-[0%] w-28 h-28 bg-gray-300 dark:bg-gray-700 rounded-full z-0 transition-colors"></div>


          {/* Image */}
          <div className="relative z-20 w-auto h-full flex items-end justify-center">
            <img
              src={heroImage}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src.indexOf('engineer.png') === -1) {
                  target.src = '/engineer.png';
                }
              }}
              alt="Ingénieur BTP"
              className="h-[145%] w-auto object-contain drop-shadow-2xl"
            />
          </div>
        </div>

        {/* Mobile version - simplified */}
        <div className="relative h-[350px] w-full flex lg:hidden items-center justify-center mt-8">
          <div className="relative w-[280px] h-[280px]">
            {/* Simple blob background for mobile */}
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 rounded-full transition-colors"></div>
            {/* Red accent */}
            <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-madiba-red rounded-full z-10"></div>
            {/* Image */}
            <img
              src={heroImage}
              alt="Ingénieur BTP"
              className="absolute inset-0 w-full h-full object-contain z-20 drop-shadow-xl"
            />
          </div>
        </div>

      </div>
    </section>
  );
}
