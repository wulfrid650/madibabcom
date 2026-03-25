'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Edit,
    MapPin,
    Calendar,
    Users,
    DollarSign,
    Briefcase,
    AlertCircle,
    TrendingUp,
    CheckCircle2,
    Clock,
    AlertTriangle,
    FileText
} from 'lucide-react';

export default function ShowProjectPage() {
    const searchParams = useSearchParams();
    const projectId = searchParams.get('id');
    const [project, setProject] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!projectId) {
            setError('ID du projet manquant');
            setIsLoading(false);
            return;
        }

        const fetchProject = async () => {
            try {
                await new Promise(resolve => setTimeout(resolve, 500));

                // Mock Data
                setProject({
                    id: projectId,
                    title: 'Villa Prestige Bastos',
                    client: { name: 'Paul Biya', company_name: 'Biya Construction SARL', email: 'contact@biyaconstruction.com', phone: '+237 600 000 000' },
                    chef_chantier: { name: 'Jean Kamga', email: 'jean.kamga@mbc.cm' },
                    location: 'Bastos, Yaoundé',
                    status: 'en_cours',
                    progress: 65,
                    start_date: '2025-10-01',
                    estimated_end_date: '2026-04-01',
                    budget: 150000000,
                    spent: 87500000,
                    team_size: 12,
                    description: 'Construction d\'une villa haut standing avec piscine, jardins paysagers et dépendances. Le projet inclut le gros œuvre, les finitions de luxe et les aménagements extérieurs.',
                    services: ['Architecture', 'Gros œuvre', 'Finitions', 'Paysagisme']
                });

                setIsLoading(false);
            } catch (err) {
                setError('Impossible de charger le projet');
                setIsLoading(false);
            }
        };

        fetchProject();
    }, [projectId]);

    const statusConfig: any = {
        planifie: { label: 'Planifié', color: 'bg-blue-100 text-blue-800', icon: Calendar },
        en_cours: { label: 'En cours', color: 'bg-green-100 text-green-800', icon: TrendingUp },
        en_pause: { label: 'En pause', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
        termine: { label: 'Terminé', color: 'bg-gray-100 text-gray-800', icon: CheckCircle2 },
        annule: { label: 'Annulé', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
    };

    if (isLoading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div></div>;
    if (error || !project) return <div className="p-6 text-center text-red-600">{error || 'Projet introuvable'}</div>;

    const StatusIcon = statusConfig[project.status]?.icon || AlertCircle;
    const budgetPercentage = (project.spent / project.budget) * 100;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/doublemb/projets" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                        <ArrowLeft className="h-6 w-6 text-gray-500" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            {project.title}
                            <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${statusConfig[project.status]?.color}`}>
                                <StatusIcon className="h-4 w-4" />
                                {statusConfig[project.status]?.label}
                            </span>
                        </h1>
                        <div className="flex items-center text-gray-500 dark:text-gray-400 mt-1 gap-4 text-sm">
                            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {project.location}</span>
                            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Créé le {new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <Link
                    href={`/doublemb/projets/edit?id=${project.id}`}
                    className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier le projet
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">À propos du projet</h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{project.description}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {project.services.map((service: string) => (
                                <span key={service} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300">
                                    {service}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center justify-between">
                            Avancement Global
                            <span className="text-2xl font-bold text-red-600">{project.progress}%</span>
                        </h2>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-4">
                            <div
                                className={`h-4 rounded-full transition-all duration-1000 ${project.progress >= 100 ? 'bg-green-500' : 'bg-red-600'}`}
                                style={{ width: `${project.progress}%` }}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                                <span className="text-gray-500 block mb-1">Date de début</span>
                                <span className="font-medium text-gray-900 dark:text-white">{new Date(project.start_date).toLocaleDateString()}</span>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                                <span className="text-gray-500 block mb-1">Fin estimée</span>
                                <span className="font-medium text-gray-900 dark:text-white">{new Date(project.estimated_end_date).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Client Info */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-gray-400" /> Client
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Entreprise / Nom</p>
                                <p className="font-medium text-gray-900 dark:text-white">{project.client.company_name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{project.client.name}</p>
                            </div>
                            <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{project.client.email}</p>
                                <p className="text-sm text-gray-500">{project.client.phone}</p>
                            </div>
                        </div>
                    </div>

                    {/* Team */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                            <Users className="h-5 w-5 text-gray-400" /> Équipe
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Chef de chantier</p>
                                <div className="flex items-center gap-3 mt-1">
                                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-xs">JK</div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{project.chef_chantier.name}</p>
                                        <p className="text-xs text-gray-500">{project.chef_chantier.email}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                                <span className="text-sm text-gray-500">Taille de l'équipe</span>
                                <span className="font-medium text-gray-900 dark:text-white">{project.team_size} personnes</span>
                            </div>
                        </div>
                    </div>

                    {/* Budget */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-gray-400" /> Budget
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-500">Consommé</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{budgetPercentage.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div className={`h-2 rounded-full ${budgetPercentage > 100 ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${Math.min(budgetPercentage, 100)}%` }}></div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-xs text-gray-500">Total</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{(project.budget / 1000000).toFixed(1)}M</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Dépensé</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{(project.spent / 1000000).toFixed(1)}M</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
