import React from 'react';
import { getPortfolioProjects } from "@/lib/api";
import PortfolioGrid from "@/components/portfolio/PortfolioGrid";
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Nos Réalisations | MBC',
  description: 'Découvrez les projets de construction et rénovation réalisés par MBC.',
};

export default async function PortfolioPage() {
  const projects = await getPortfolioProjects();

  return (
    <div className="bg-white dark:bg-madiba-black min-h-screen transition-colors duration-300">
       {/* Hero Section */}
       <div className="bg-madiba-black dark:bg-gray-900/50 py-16 md:py-24 border-b border-gray-800 dark:border-gray-800">
          <div className="container mx-auto px-4"><br></br>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 max-w-2xl">
                Nos réalisations témoignent de notre <span className="text-madiba-red">expertise</span>.
              </h1>
              <p className="text-xl text-gray-300 dark:text-gray-400 max-w-3xl">
                Parcourez notre portfolio de projets de construction, rénovation et génie civil. Chaque chantier est une preuve de notre engagement envers la qualité.
              </p>
          </div>
       </div>

       {/* Grid Section */}
       <section className="container mx-auto px-4 py-16">
          <PortfolioGrid projects={projects} />
       </section>
    </div>
  );
}

