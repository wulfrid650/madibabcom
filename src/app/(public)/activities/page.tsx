import React from 'react';
import Section from '@/components/ui/Section';

export const metadata = {
  title: 'Activités Secondaires | MBC',
  description: 'Découvrez nos activités complémentaires : commerce général, import/export, services additionnels.',
};

export default function ActivitiesPage() {
  return (
    <div className="bg-white dark:bg-madiba-black min-h-screen">
      <Section theme="white">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-madiba-black dark:text-white mb-4">Nos Activités Secondaires</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            En complément de nos services BTP, MBC propose des activités stratégiques pour accompagner vos projets.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors">
            <h2 className="text-xl font-bold text-madiba-black dark:text-white mb-3">Commerce Général</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Fourniture de matériaux, équipements et produits liés au secteur du bâtiment et de l'industrie.
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors">
            <h2 className="text-xl font-bold text-madiba-black dark:text-white mb-3">Import / Export</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Gestion logistique et administrative pour l'importation et l'exportation de marchandises, matériaux et équipements.
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors">
            <h2 className="text-xl font-bold text-madiba-black dark:text-white mb-3">Services Additionnels</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Conseil, sourcing, accompagnement sur mesure pour vos besoins spécifiques hors BTP.
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}
