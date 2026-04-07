'use client';

import React from 'react';
import Section from '@/components/ui/Section';
import Accordion from '@/components/ui/Accordion';
import Link from 'next/link';
import { HelpCircle, Construction, GraduationCap, CreditCard, UserCircle } from 'lucide-react';
import { usePublicSettings } from '@/contexts/PublicSettingsContext';
import { COMPANY_INFO } from '@/lib/company-info';

const FAQPage = () => {
  const { settings } = usePublicSettings();
  
  const whatsappNumber = settings.whatsapp_number || settings.phone || COMPANY_INFO.social.whatsapp;
  const whatsappUrl = `https://wa.me/${String(whatsappNumber).replace(/\D/g, '')}`;

  const categories = [
    {
      id: 'general',
      title: 'Général & Construction',
      icon: <Construction className="w-6 h-6 text-madiba-red" />,
      items: [
        {
          title: "Comment initier un projet de construction avec MBC ?",
          content: "Pour démarrer votre projet, vous pouvez nous contacter via notre formulaire de devis en ligne ou par WhatsApp. Un ingénieur prendra contact avec vous pour une première étude de faisabilité et l'établissement d'un devis détaillé."
        },
        {
          title: "Quels types de bâtiments construisez-vous ?",
          content: "MBC intervient sur des projets résidentiels (villas, duplex), commerciaux (bureaux, boutiques) et industriels (entrepôts, usines) partout au Cameroun."
        },
        {
          title: "Proposez-vous des services d'études architecturales ?",
          content: "Oui, notre bureau d'études réalise les plans 2D/3D, les études de sol, les calculs de structure et les dossiers complets pour l'obtention du permis de bâtir."
        }
      ]
    },
    {
      id: 'training',
      title: 'Formations Métiers',
      icon: <GraduationCap className="w-6 h-6 text-madiba-red" />,
      items: [
        {
          title: "Quelles sont les formations proposées par MBC ?",
          content: "Nous formons aux logiciels de CAO/DAO (AutoCAD, Revit, ArchiCAD), aux méthodes BIM (Building Information Modeling), au suivi de chantier et à l'entrepreneuriat dans le BTP."
        },
        {
          title: "Les formations sont-elles accessibles en ligne ?",
          content: "Nous proposons des sessions en présentiel dans nos centres de Douala et Yaoundé, ainsi que des modules hybrides avec un accompagnement personnalisé via notre plateforme numérique."
        },
        {
          title: "Délivrez-vous des certificats en fin de formation ?",
          content: "Absolument. Chaque apprenant reçoit une attestation de fin de formation certifiant les compétences acquises, reconnue par nos partenaires professionnels."
        }
      ]
    },
    {
      id: 'payments',
      title: 'Paiements & Financements',
      icon: <CreditCard className="w-6 h-6 text-madiba-red" />,
      items: [
        {
          title: "Quels sont les modes de paiement disponibles ?",
          content: "Nous acceptons les paiements par Mobile Money (Orange Money, MTN MoMo), virements bancaires, chèques et paiements directs en agence."
        },
        {
          title: "Puis-je payer mon projet de construction par tranches ?",
          content: "Oui, MBC propose des plans de financement flexibles. Les paiements sont généralement échelonnés en fonction des phases d'avancement du chantier (approvisionnement, gros œuvre, finition)."
        }
      ]
    },
    {
      id: 'portal',
      title: 'Espace Client & Digitization',
      icon: <UserCircle className="w-6 h-6 text-madiba-red" />,
      items: [
        {
          title: "Comment puis-je suivre l'évolution de mon chantier à distance ?",
          content: "Une fois votre contrat signé, vous recevez des accès à votre Espace Client. Vous y trouverez des photos régulières du chantier, les rapports journaliers du chef de chantier et l'état d'avancement financier."
        },
        {
          title: "Où puis-je retrouver mes factures et reçus ?",
          content: "Tous vos documents comptables (factures, reçus de paiement, devis) sont archivés et téléchargeables en format PDF directement depuis votre tableau de bord personnel."
        }
      ]
    }
  ];

  return (
    <main className="bg-white dark:bg-madiba-black min-h-screen transition-colors duration-300 pt-16">
      {/* Header */}
      <section className="bg-gray-50 dark:bg-gray-900 py-16 md:py-24 border-b border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-6 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-madiba-red/10 rounded-full mb-6">
                <HelpCircle className="w-10 h-10 text-madiba-red" />
            </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-madiba-black dark:text-white mb-6">
            Comment pouvons-nous vous aider ?
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Retrouvez ici les réponses aux questions les plus fréquentes sur nos services de construction, nos formations et votre accompagnement digital.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <Section theme="white">
        <div className="max-w-4xl mx-auto">
          {categories.map((category) => (
            <div key={category.id} className="mb-16 last:mb-0">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100 dark:border-gray-800">
                {category.icon}
                <h2 className="text-2xl font-bold text-madiba-black dark:text-white">
                  {category.title}
                </h2>
              </div>
              <Accordion items={category.items} />
            </div>
          ))}
        </div>
      </Section>

      {/* CTA Section */}
      <Section theme="black">
        <div className="text-center py-8">
          <h2 className="text-3xl font-bold text-white mb-6">
            Pas trouvé la réponse à votre question ?
          </h2>
          <p className="text-gray-400 mb-10 max-w-xl mx-auto">
            Notre équipe est disponible pour vous accompagner personnellement dans votre projet ou votre formation.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/contact" 
              className="px-8 py-4 bg-madiba-red text-white rounded-xl font-bold hover:bg-red-600 transition-colors shadow-lg shadow-madiba-red/25"
            >
              Nous Contacter
            </Link>
            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
            >
              Discuter sur WhatsApp
            </a>
          </div>
        </div>
      </Section>
    </main>
  );
};

export default FAQPage;
