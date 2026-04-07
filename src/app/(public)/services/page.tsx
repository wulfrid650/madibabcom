import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import {
  Award,
  CheckCircle2,
  ClipboardCheck,
  Construction,
  HardHat,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import Section from '@/components/ui/Section';
import { getYearsOfExperience } from '@/lib/company-info';

export const metadata: Metadata = {
  title: 'Nos Services | MBC',
  description: 'Découvrez nos services en Architecture, Construction BTP, Génie Civil et Accompagnement de projet.',
};

const TRUSTPILOT_REVIEW_URL = 'https://fr.trustpilot.com/review/madibabc.com';

export default function ServicesPage() {
  return (
    <div className="bg-white dark:bg-madiba-black min-h-screen">
      {/* Hero */}
      <div className="bg-madiba-black text-white py-20">
        <div className="container mx-auto px-4">
            <br></br>
          <span className="text-madiba-red font-semibold text-sm uppercase tracking-wider">Ce que nous faisons</span>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Nos Prestations</h1>
          <p className="text-xl text-gray-300 max-w-2xl">
            De la conception architecturale à la réalisation d&apos;ouvrages complexes, nous maîtrisons chaque étape.
          </p>
          {/* Réassurance */}
          <div className="flex flex-wrap gap-6 mt-10 text-sm">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-madiba-red" aria-hidden="true" />
              <span className="text-gray-300">+{getYearsOfExperience()} ans d&apos;expérience</span>
            </div>
            <div className="flex items-center gap-2">
              <HardHat className="h-5 w-5 text-madiba-red" aria-hidden="true" />
              <span className="text-gray-300">Équipe qualifiée</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-madiba-red" aria-hidden="true" />
              <span className="text-gray-300">Suivi technique rigoureux</span>
            </div>
          </div>
        </div>
      </div>

      {/* Architecture */}
      <Section theme="white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-madiba-red font-semibold text-sm uppercase tracking-wider">01</span>
            <h2 id="architecture-etudes" className="text-3xl md:text-4xl font-bold text-madiba-black dark:text-white mt-2 mb-4 scroll-mt-32">Architecture & Études</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              Conceptions modernes et fonctionnelles, respectant les normes les plus strictes.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <span className="w-6 h-6 rounded-full bg-madiba-red/10 flex items-center justify-center text-madiba-red text-sm">✓</span>
                Conception de plans 2D et 3D
              </li>
              <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <span className="w-6 h-6 rounded-full bg-madiba-red/10 flex items-center justify-center text-madiba-red text-sm">✓</span>
                Études architecturales et structurelles
              </li>
              <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <span className="w-6 h-6 rounded-full bg-madiba-red/10 flex items-center justify-center text-madiba-red text-sm">✓</span>
                Dimensionnement et calcul de structure
              </li>
              <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <span className="w-6 h-6 rounded-full bg-madiba-red/10 flex items-center justify-center text-madiba-red text-sm">✓</span>
                Rendu réaliste et visites virtuelles
              </li>
            </ul>
            <Link href="/portfolio" className="text-madiba-red font-semibold hover:underline inline-flex items-center gap-2">
              Voir nos réalisations →
            </Link>
          </div>
          <div className="relative h-72 md:h-[400px] rounded-2xl overflow-hidden shadow-2xl bg-gray-200 dark:bg-gray-800">
            {/* Image Architecture - À remplacer */}
            <Image
              src="/etude.jpg"
              alt="Service d'architecture et etudes techniques"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </Section>

      {/* Construction & BTP */}
      <Section theme="black">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 relative h-72 md:h-[400px] rounded-2xl overflow-hidden shadow-2xl bg-gray-700">
            <Image
              src="/construction.jpg"
              alt="Service de construction BTP"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div className="order-1 md:order-2">
            <span className="text-madiba-red font-semibold text-sm uppercase tracking-wider">02</span>
            <h2 id="construction-btp" className="text-3xl md:text-4xl font-bold text-white mt-2 mb-4 scroll-mt-32">Construction & BTP</h2>
            <p className="text-lg text-gray-300 mb-6">
              Exécution rigoureuse pour des ouvrages durables. Réalisation intégrale de vos chantiers.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-gray-300">
                <span className="w-6 h-6 rounded-full bg-madiba-red/20 flex items-center justify-center text-madiba-red text-sm">✓</span>
                Gros œuvre et second œuvre
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <span className="w-6 h-6 rounded-full bg-madiba-red/20 flex items-center justify-center text-madiba-red text-sm">✓</span>
                Suivi et expertise des travaux
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <span className="w-6 h-6 rounded-full bg-madiba-red/20 flex items-center justify-center text-madiba-red text-sm">✓</span>
                Location de matériel de génie civil
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <span className="w-6 h-6 rounded-full bg-madiba-red/20 flex items-center justify-center text-madiba-red text-sm">✓</span>
                Maçonnerie, carrelage, peinture
              </li>
            </ul>
            <div className="flex flex-wrap gap-4">
              <Link href="/contact" className="inline-block px-6 py-3 bg-madiba-red text-white font-semibold rounded-lg hover:bg-red-700 transition-colors">
                Demander un devis
              </Link>
              <Link href="/portfolio" className="text-madiba-red font-semibold hover:underline inline-flex items-center gap-2 py-3">
                Voir nos réalisations →
              </Link>
            </div>
          </div>
        </div>
      </Section>

      {/* Génie Civil */}
      <Section theme="white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-madiba-red font-semibold text-sm uppercase tracking-wider">03</span>
            <h2 id="genie-civil" className="text-3xl md:text-4xl font-bold text-madiba-black dark:text-white mt-2 mb-4 scroll-mt-32">Génie Civil</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              Solutions d&apos;ingénierie pour infrastructures publiques et privées.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <span className="w-6 h-6 rounded-full bg-madiba-red/10 flex items-center justify-center text-madiba-red text-sm">✓</span>
                Ouvrages d&apos;art (ponts, dalots)
              </li>
              <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <span className="w-6 h-6 rounded-full bg-madiba-red/10 flex items-center justify-center text-madiba-red text-sm">✓</span>
                Assainissement et caniveaux
              </li>
              <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <span className="w-6 h-6 rounded-full bg-madiba-red/10 flex items-center justify-center text-madiba-red text-sm">✓</span>
                Murs de soutènement
              </li>
              <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <span className="w-6 h-6 rounded-full bg-madiba-red/10 flex items-center justify-center text-madiba-red text-sm">✓</span>
                Voiries et Réseaux Divers (VRD)
              </li>
            </ul>
            <div className="flex flex-wrap gap-4">
              <Link href="/contact" className="inline-block px-6 py-3 bg-madiba-red text-white font-semibold rounded-lg hover:bg-red-700 transition-colors">
                Demander un devis
              </Link>
              <Link href="/portfolio" className="text-madiba-red font-semibold hover:underline inline-flex items-center gap-2 py-3">
                Voir nos réalisations →
              </Link>
            </div>
          </div>
          <div className="relative h-72 md:h-[400px] rounded-2xl overflow-hidden shadow-2xl bg-gray-200 dark:bg-gray-800">
            {/* Image Génie Civil - À remplacer */}
            <Image
              src="/geniecivil.webp"
              alt="Service de genie civil"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </Section>

      {/* Accompagnement - Valorisé */}
      <Section theme="black">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 bg-madiba-red/20 text-madiba-red font-semibold text-sm uppercase tracking-wider rounded-full mb-4">
              Notre avantage
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Un Accompagnement Complet</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              De la première idée à la remise des clés : nous sommes à vos côtés à chaque étape clé.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-700 hover:border-madiba-red/50 transition-colors group">
              <div className="w-14 h-14 rounded-full bg-madiba-red/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MapPin className="h-7 w-7 text-madiba-red" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-white mb-2 text-lg">Choix du Terrain</h3>
              <p className="text-sm text-gray-400">Conseil et expertise pour le choix optimal de votre site.</p>
            </div>
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-700 hover:border-madiba-red/50 transition-colors group">
              <div className="w-14 h-14 rounded-full bg-madiba-red/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Construction className="h-7 w-7 text-madiba-red" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-white mb-2 text-lg">Achat Matériaux</h3>
              <p className="text-sm text-gray-400">Sélection et fourniture de matériaux de qualité.</p>
            </div>
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-700 hover:border-madiba-red/50 transition-colors group">
              <div className="w-14 h-14 rounded-full bg-madiba-red/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ClipboardCheck className="h-7 w-7 text-madiba-red" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-white mb-2 text-lg">Permis de Bâtir</h3>
              <p className="text-sm text-gray-400">Assistance complète dans les démarches administratives.</p>
            </div>
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-700 hover:border-madiba-red/50 transition-colors group">
              <div className="w-14 h-14 rounded-full bg-madiba-red/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="h-7 w-7 text-madiba-red" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-white mb-2 text-lg">Contrôle Technique</h3>
              <p className="text-sm text-gray-400">Suivi rigoureux de la conformité des travaux.</p>
            </div>
          </div>
        </div>
      </Section>

      {/* Avis Clients - Trustpilot */}
      <Section theme="white">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-madiba-red font-semibold text-sm uppercase tracking-wider">Témoignages</span>
          <h2 className="text-3xl md:text-4xl font-bold text-madiba-black dark:text-white mt-2 mb-4">Ce que disent nos clients</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-10">
            La satisfaction de nos clients est notre meilleure carte de visite.
          </p>

          <Script
            src="https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
            strategy="afterInteractive"
          />

          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 mb-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#00B67A"/>
              </svg>
              <span className="text-2xl font-bold text-madiba-black dark:text-white">Trustpilot</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
              Consultez ou déposez un avis sur notre page officielle Trustpilot.
            </p>

            <div
              className="trustpilot-widget"
              data-locale="fr-FR"
              data-template-id="56278e9abfbbba0bdcd568bc"
              data-businessunit-id="69d15fd1bf61deb19eec400e"
              data-style-height="52px"
              data-style-width="100%"
              data-token="fb1ed5ca-3ba2-4483-8908-9d3054f49767"
            >
              <a href={TRUSTPILOT_REVIEW_URL} target="_blank" rel="noopener">
                Trustpilot
              </a>
            </div>
          </div>
        </div>
      </Section>

      {/* Lien vers Activités Secondaires */}
      <Section theme="black">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Nos Activités Secondaires</h2>
          <p className="text-gray-300 mb-6 max-w-xl mx-auto">
            En plus de nos services BTP, MBC propose également des activités de commerce général, import/export et accompagnement sur mesure.
          </p>
          <Link
            href="/activities"
            className="inline-block px-8 py-3 bg-madiba-red text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            Découvrir nos activités
          </Link>
        </div>
      </Section>

      {/* CTA Final */}
      <Section theme="white">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-madiba-black dark:text-white mb-4">Prêt à démarrer votre projet ?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Contactez-nous dès aujourd&apos;hui pour discuter de vos besoins et obtenir un devis personnalisé.
          </p>
          {/* Offre promotionnelle 10% */}
          <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-madiba-red/10 to-orange-50 dark:from-madiba-red/20 dark:to-orange-900/20 border border-madiba-red/20 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-madiba-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 12v10H4V12" /><path d="M2 7h20v5H2z" /><path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
            </svg>
            <span className="text-sm font-semibold text-madiba-red">
              -10% OFFRE SPÉCIALE
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              sur votre premier devis en ligne !
            </span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact?type=devis"
              className="inline-block px-8 py-4 bg-madiba-red text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              Demander un devis
            </Link>
            <Link
              href="/portfolio"
              className="inline-block px-8 py-4 border-2 border-madiba-black dark:border-white text-madiba-black dark:text-white font-semibold rounded-lg hover:bg-madiba-black hover:text-white dark:hover:bg-white dark:hover:text-madiba-black transition-colors"
            >
              Voir nos réalisations
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
