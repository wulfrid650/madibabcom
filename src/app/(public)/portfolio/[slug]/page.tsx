import React from 'react';
import { notFound } from 'next/navigation';
import { getPortfolioProject } from "@/lib/api";
import PortfolioGallery from "@/components/portfolio/PortfolioGallery";
import PortfolioMeta from "@/components/portfolio/PortfolioMeta";
import Link from 'next/link';
import { DEFAULT_PORTFOLIO_IMAGE, resolveMediaUrl } from '@/lib/media';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
     try {
        const { slug } = await params;
        const project = await getPortfolioProject(slug);
        if (!project) {
            return {
                title: 'Project Not Found | MBC'
            };
        }
        return {
            title: `${project.title} | MBC Portfolio`,
            description: project.description ? project.description.substring(0, 160) : 'Projet MBC',
        };
     } catch (e) {
        return {
            title: 'Project Not Found | MBC'
        }
     }
}

export default async function PortfolioDetail({ params }: PageProps) {
  const { slug } = await params;
  let project;
  try {
     project = await getPortfolioProject(slug);
  } catch (error) {
     notFound();
  }

  if (!project) notFound();
  const coverImageUrl = resolveMediaUrl(project.cover_image) || DEFAULT_PORTFOLIO_IMAGE;

  return (
    <article className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
        {/* Cover Section */}
        <div className="relative h-[50vh] w-full bg-gray-900">
            <img
                src={coverImageUrl}
                alt={project.title}
                className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 flex items-end">
                <div className="container mx-auto px-4 pb-12">
                     <Link href="/portfolio" className="text-white/80 hover:text-white mb-4 inline-flex items-center gap-2 transition-colors">
                        &larr; Retour au portfolio
                     </Link>
                     <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                        {project.title}
                     </h1>
                     <p className="text-xl text-white/90 font-light">
                        {project.category}
                     </p>
                </div>
            </div>
        </div>

        <div className="container mx-auto px-4 py-12">
            <PortfolioMeta project={project} />

            <div className="grid md:grid-cols-3 gap-12">
                <div className="md:col-span-2">
                    <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">À propos du projet</h2>
                    <div className="prose max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                        {project.description}
                    </div>

                    <PortfolioGallery images={project.images} />
                </div>
                
                <div className="md:col-span-1">
                     <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 sticky top-24">
                        <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">Besoin d'un projet similaire ?</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
                            Notre équipe est prête à réaliser vos ambitions de construction avec la même rigueur.
                        </p>
                        <Link
                          href="/contact"
                          className="block w-full text-center py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Demander un devis
                        </Link>
                     </div>
                </div>
            </div>
        </div>
    </article>
  );
}
