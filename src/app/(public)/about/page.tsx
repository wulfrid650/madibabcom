import React from 'react';
import Link from 'next/link';
import Section from '@/components/ui/Section';
import { Metadata } from 'next';
import { COMPANY_INFO, getCopyrightText, getYearsOfExperience } from '@/lib/company-info';
import { Gift } from 'lucide-react';

export const metadata: Metadata = {
  title: 'À propos | MBC Construction',
  description: 'Découvrez MBC, votre partenaire de confiance pour la construction et le génie civil au Cameroun depuis plus de 3 ans.',
};

export default function AboutPage() {
  return (
    <div className="bg-white dark:bg-madiba-black min-h-screen transition-colors">
      {/* Hero Section */}
      <div className="bg-madiba-black text-white pt-32 pb-20">
        <div className="container mx-auto px-4">
          <span className="text-madiba-red font-semibold text-sm uppercase tracking-wider">À propos</span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mt-4 mb-6 max-w-3xl">
            Madiba Building Construction <span className="text-madiba-red">MBC</span>, ensemble batissons l&apos;Afrique.
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl">
            MBC est une entreprise de construction et génie civil engagée dans le développement durable des infrastructures camerounaises.
          </p>
        </div>
      </div>

      {/* Vision & Mission */}
      <Section theme="white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl border-l-4 border-madiba-red shadow-sm h-full">
            <h2 className="text-2xl font-bold text-madiba-red mb-4 uppercase tracking-wide">Notre Vision</h2>
            <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
              Devenir une référence africaine dans le bâtiment, la construction et la formation pratique, en contribuant activement au développement des infrastructures modernes, accessibles et durables.
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl border-l-4 border-madiba-red shadow-sm h-full">
            <h2 className="text-2xl font-bold text-madiba-red mb-4 uppercase tracking-wide">Notre Mission</h2>
            <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
              Bâtir des infrastructures durables et de qualité, tout en formant une nouvelle génération de professionnels compétents, capables de répondre aux besoins réels du secteur du bâtiment et de la construction en Afrique.
            </p>
          </div>
        </div>
      </Section>

      {/* Notre Histoire */}
      <Section theme="white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-madiba-red font-semibold text-sm uppercase tracking-wider">Notre histoire</span>
            <h2 className="text-3xl md:text-4xl font-bold text-madiba-black dark:text-white mt-2 mb-6">
              Plus de 3 ans d&apos;expertise au service du développement
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
              Fondée en {COMPANY_INFO.foundedYear}, MBC ({COMPANY_INFO.fullName}) est née de la vision d&apos;un groupe d&apos;ingénieurs camerounais déterminés à contribuer au développement des infrastructures de leur pays avec des standards internationaux.
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
              Au fil des années, nous avons bâti notre réputation sur la qualité de nos réalisations, le respect des délais et notre engagement envers la satisfaction de nos clients. Des premiers chantiers résidentiels aux grands projets d&apos;infrastructure, MBC a su évoluer tout en conservant ses valeurs fondamentales.
            </p>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Aujourd&apos;hui, nous sommes fiers d&apos;être un acteur majeur du secteur de la construction au {COMPANY_INFO.country}, avec 3 régions couvertes et une équipe de plus de {COMPANY_INFO.stats.employees} professionnels dévoués.
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-8 transition-colors">
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <h3 className="text-5xl font-bold text-madiba-red mb-2">2023</h3>
                <p className="text-gray-600 dark:text-gray-400">Année de création</p>
              </div>
              <div className="text-center">
                <h3 className="text-5xl font-bold text-madiba-black dark:text-white mb-2">15+</h3>
                <p className="text-gray-600 dark:text-gray-400">Projets réalisés</p>
              </div>
              <div className="text-center">
                <h3 className="text-5xl font-bold text-madiba-black dark:text-white mb-2">50+</h3>
                <p className="text-gray-600 dark:text-gray-400">Employés</p>
              </div>
              <div className="text-center">
                <h3 className="text-5xl font-bold text-madiba-red mb-2">3</h3>
                <p className="text-gray-600 dark:text-gray-400">Régions</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Nos Valeurs */}
      <Section theme="white">
        <div className="text-center mb-12">
          <span className="text-madiba-red font-semibold text-sm uppercase tracking-wider">Nos valeurs</span>
          <h2 className="text-3xl md:text-4xl font-bold text-madiba-black dark:text-white mt-2">
            Les piliers de notre engagement
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
          {/* Excellence */}
          <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors">
            <div className="w-14 h-14 bg-madiba-red/10 rounded-lg flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-madiba-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-madiba-black dark:text-white mb-3">Excellence</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Viser la qualité et la précision dans chaque projet et chaque formation.
            </p>
          </div>

          {/* Engagement */}
          <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors">
            <div className="w-14 h-14 bg-madiba-red/10 rounded-lg flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-madiba-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-madiba-black dark:text-white mb-3">Engagement</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Respecter nos promesses envers nos clients, partenaires et apprenants.
            </p>
          </div>

          {/* Responsabilité */}
           <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors">
            <div className="w-14 h-14 bg-madiba-red/10 rounded-lg flex items-center justify-center mb-6">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-madiba-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-madiba-black dark:text-white mb-3">Responsabilité</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Construire dans le respect des normes, de l&apos;environnement et des personnes.
            </p>
          </div>

          {/* Innovation */}
           <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors">
            <div className="w-14 h-14 bg-madiba-red/10 rounded-lg flex items-center justify-center mb-6">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-madiba-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-madiba-black dark:text-white mb-3">Innovation</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Intégrer des techniques modernes, des logiciels professionnels et des solutions durables.
            </p>
          </div>

          {/* Transmission */}
           <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors">
            <div className="w-14 h-14 bg-madiba-red/10 rounded-lg flex items-center justify-center mb-6">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-madiba-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-madiba-black dark:text-white mb-3">Transmission</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Partager le savoir-faire et former des compétences locales solides.
            </p>
          </div>
        </div>
      </Section>

      {/* Notre Équipe */}
      <Section theme="black">
        <div className="text-center mb-12">
          <span className="text-madiba-red font-semibold text-sm uppercase tracking-wider">Notre équipe</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-4">
            Des professionnels passionnés
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Notre force réside dans notre équipe d&apos;ingénieurs, architectes et techniciens qualifiés, unis par la passion de bâtir.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gray-800 rounded-xl p-6 text-center border border-gray-700">
            <div className="w-20 h-20 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">ND</span>
            </div>
            <h3 className="text-lg font-bold text-white">Noumbissie Derrick</h3>
            <p className="text-madiba-red text-sm">Directeur Général</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 text-center border border-gray-700">
            <div className="w-20 h-20 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">YA</span>
            </div>
            <h3 className="text-lg font-bold text-white">Yoba Ariane</h3>
            <p className="text-madiba-red text-sm">Directeur Technique</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 text-center border border-gray-700">
            <div className="w-20 h-20 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">UT</span>
            </div>
            <h3 className="text-lg font-bold text-white">Urielle Tchoffo</h3>
            <p className="text-madiba-red text-sm">Chef de Projets</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 text-center border border-gray-700">
            <div className="w-20 h-20 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">FA</span>
            </div>
            <h3 className="text-lg font-bold text-white">Fofie Ange</h3>
            <p className="text-madiba-red text-sm">Formatrice</p>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section theme="white">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-madiba-black dark:text-white mb-4">
            Prêt à concrétiser votre projet ?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
            Contactez-nous pour discuter de votre projet de construction ou de rénovation. Notre équipe est à votre écoute.
          </p>
          
          {/* Offre promotionnelle 10% */}
          <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-madiba-red/10 to-orange-50 dark:from-madiba-red/20 dark:to-orange-900/20 border border-madiba-red/20 rounded-full">
            <Gift className="w-5 h-5 text-madiba-red" />
            <span className="text-sm font-semibold text-madiba-red">
              -{COMPANY_INFO.promos.devisReduction.percentage}% OFFRE SPÉCIALE
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              sur votre premier devis en ligne !
            </span>
          </div>
          
          <div className="block">
            <Link href="/contact?type=devis" className="inline-block bg-madiba-red hover:bg-red-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors">
              Demander un devis
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
