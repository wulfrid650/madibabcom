'use client';

import React from 'react';
import Link from 'next/link';
import DynamicHero from '@/components/ui/DynamicHero';
import Section from '@/components/ui/Section';
import Card from '@/components/ui/Card';
import TestimonialCarousel from '@/components/ui/TestimonialCarousel';
import { useHomepageData } from '@/hooks/useApiData';

// Composant pour afficher les statistiques
function StatsGrid({ stats }: { stats: { projects_completed: number; years_experience: number; happy_clients?: number; trained_students?: number; } }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-madiba-red text-white p-6 rounded-xl">
        <h3 className="text-4xl font-bold mb-2">{stats.years_experience}+</h3>
        <p className="text-red-100">Années d&apos;expérience</p>
      </div>
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl">
        <h3 className="text-4xl font-bold text-madiba-black dark:text-white mb-2">{stats.projects_completed}+</h3>
        <p className="text-gray-600 dark:text-gray-400">Projets livrés</p>
      </div>
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl">
        <h3 className="text-4xl font-bold text-madiba-black dark:text-white mb-2">{stats.happy_clients || 50}+</h3>
        <p className="text-gray-600 dark:text-gray-400">Clients satisfaits</p>
      </div>
      <div className="bg-madiba-black dark:bg-gray-700 text-white p-6 rounded-xl">
        <h3 className="text-4xl font-bold mb-2">{stats.trained_students || 200}+</h3>
        <p className="text-gray-300">Apprenants formés</p>
      </div>
    </div>
  );
}

// Skeleton loader pour les services
function ServicesLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-stretch">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-xl mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      ))}
    </div>
  );
}

// Composant d'affichage des services dynamiques
function DynamicServices({ services }: { services: Array<{ id: number; title: string; slug: string; short_description: string; icon?: string; }> }) {
  // Si pas de services de l'API, afficher les services par défaut
  if (!services || services.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-stretch">
        <Card 
          title="Architecture & Études" 
          description="Conception de plans 2D/3D, études architecturales et structurelles, dimensionnement et calcul de structure."
        />
        <Card 
          title="Construction & BTP" 
          description="Réalisation de bâtiments résidentiels et industriels, travaux de gros œuvre et second œuvre, expertise chantier."
        />
        <Card 
          title="Génie Civil" 
          description="Ouvrages d'art, voiries, assainissement, murs de soutènement et infrastructures publiques durables."
        />
        <Card 
          title="Formations CAO & DAO" 
          description="Apprenez à maîtriser AutoCAD, Revit, ArchiCAD, SketchUp, Twinmotion et les méthodes BIM pour vos projets professionnels."
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-stretch">
      {services.slice(0, 4).map((service) => (
        <Link key={service.id} href={`/services/${service.slug}`}>
          <Card 
            title={service.title} 
            description={service.short_description}
          />
        </Link>
      ))}
    </div>
  );
}

export default function HomePage() {
  const { data, isLoading, error } = useHomepageData();

  // Valeurs par défaut si les données ne sont pas encore chargées
  const heroSettings = data ? {
    hero_title: data.hero?.title,
    hero_subtitle: data.hero?.subtitle,
    hero_image: data.hero?.image,
    hero_cta_text: data.hero?.cta_text,
    company_slogan: data.company?.slogan,
  } : undefined;

  const stats = data?.stats || {
    years_experience: 3,
    projects_completed: 15,
    happy_clients: 50,
    trained_students: 200,
  };

  const companyDescription = data?.company?.description || 
    "Depuis plus de 3 ans, MBC s'impose comme un acteur majeur du secteur de la construction au Cameroun. Notre mission est de contribuer au développement des infrastructures du pays avec des standards internationaux.";

  return (
    <div>
      <DynamicHero initialSettings={heroSettings} />
      
      {/* Services Section */}
      <Section theme="white">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-madiba-black dark:text-white mb-4">Nos Domaines d&apos;Expertise</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto whitespace-nowrap">
            De la conception architecturale à la réalisation d'ouvrages complexes, nous maîtrisons chaque étape.
          </p>
        </div>

        {isLoading ? (
          <ServicesLoading />
        ) : (
          <DynamicServices services={data?.services || []} />
        )}
      </Section>

      {/* About Section */}
      <Section theme="white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-madiba-red font-semibold text-sm uppercase tracking-wider">À propos de nous</span>
            <h2 className="text-3xl md:text-4xl font-bold text-madiba-black dark:text-white mt-2 mb-6">
              Une entreprise bâtie sur l&apos;excellence et l&apos;intégrité
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
              {companyDescription}
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              Notre équipe d&apos;ingénieurs et de techniciens qualifiés met son expertise au service de projets ambitieux, de la conception à la livraison, en garantissant qualité, sécurité et respect des normes les plus strictes.
            </p>
            <Link href="/about" className="inline-flex items-center gap-2 text-madiba-red font-semibold hover:underline">
              En savoir plus sur MBC
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
          <StatsGrid stats={stats} />
        </div>
      </Section>

      {/* Trust Section */}
      <Section theme="black">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6 text-white">Pourquoi choisir <span className="text-madiba-red">MBC</span> ?</h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="text-madiba-red text-xl">✓</span>
                <p className="text-gray-300">Approche 100% pratique et orientée terrain.</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-madiba-red text-xl">✓</span>
                <p className="text-gray-300">Équipe jeune, qualifiée et expérimentée.</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-madiba-red text-xl">✓</span>
                <p className="text-gray-300">Utilisation de logiciels professionnels de pointe.</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-madiba-red text-xl">✓</span>
                <p className="text-gray-300">Accompagnement complet : de l&apos;étude à la réalisation.</p>
              </li>
            </ul>
          </div>
          <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 text-center">
            <h3 className="text-5xl font-bold text-white mb-2">{stats.years_experience}+</h3>
            <p className="text-gray-400 mb-8">Années d&apos;expérience</p>
            
            <h3 className="text-5xl font-bold text-white mb-2">{stats.projects_completed}+</h3>
            <p className="text-gray-400">Projets livrés</p>
          </div>
        </div>
      </Section>

      {/* Client Portal Section - Suivi de Projet */}
      <Section theme="white">
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 rounded-3xl p-8 md:p-12">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
          </div>
          
          {/* Accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-madiba-red via-red-500 to-madiba-red"></div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-block px-4 py-1.5 bg-madiba-red text-white rounded-full text-sm font-medium mb-4">
                Espace Client
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                Suivez votre projet en temps réel
              </h2>
              <p className="text-gray-300 mb-6 text-lg leading-relaxed">
                Accédez à votre espace personnel pour consulter l&apos;avancement de vos travaux, 
                vos documents et communiquer avec notre équipe.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-madiba-red/20 border border-madiba-red/30 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-madiba-red" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-200">Suivi d&apos;avancement en temps réel</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-madiba-red/20 border border-madiba-red/30 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-madiba-red" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-200">Accès aux plans et documents</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-madiba-red/20 border border-madiba-red/30 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-madiba-red" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-200">Photos et rapports de chantier</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-madiba-red/20 border border-madiba-red/30 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-madiba-red" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-200">Messagerie directe avec l&apos;équipe</span>
                </li>
              </ul>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/client/login" 
                  className="inline-flex items-center justify-center gap-2 bg-madiba-red text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors shadow-lg shadow-madiba-red/25"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Se connecter
                </Link>
                <Link 
                  href="/contact" 
                  className="inline-flex items-center justify-center gap-2 bg-gray-600/50 border border-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                >
                  Devenir client
                </Link>
              </div>
            </div>
            
            {/* Illustration */}
            <div className="hidden lg:block">
              <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-600/50 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-700/60 rounded-lg p-4 border border-gray-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300 text-sm">Avancement global</span>
                      <span className="text-white font-bold">68%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div className="bg-gradient-to-r from-madiba-red to-red-500 rounded-full h-2" style={{ width: '68%' }}></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-700/60 rounded-lg p-3 text-center border border-gray-600/30">
                      <span className="block text-2xl font-bold text-white">12</span>
                      <span className="text-gray-400 text-xs">Documents</span>
                    </div>
                    <div className="bg-gray-700/60 rounded-lg p-3 text-center border border-gray-600/30">
                      <span className="block text-2xl font-bold text-white">5</span>
                      <span className="text-gray-400 text-xs">Rapports</span>
                    </div>
                  </div>
                  <div className="bg-gray-700/60 rounded-lg p-3 border border-gray-600/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <span className="text-white text-sm font-medium">Fondations terminées</span>
                        <span className="block text-gray-400 text-xs">Il y a 2 jours</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Témoignages Carousel */}
      <Section theme="white">
        <div className="text-center mb-10">
          <span className="text-madiba-red font-semibold text-sm uppercase tracking-wider">Témoignages</span>
          <h2 className="text-3xl md:text-4xl font-bold text-madiba-black dark:text-white mt-2 mb-4">
            Ce que disent nos clients
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            La satisfaction de nos clients est notre meilleure carte de visite.
          </p>
        </div>
        <TestimonialCarousel />
      </Section>
    </div>
  );
}

