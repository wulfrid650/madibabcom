'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getUser, User } from '@/lib/admin-api';
import {
    ArrowLeft,
    Building2,
    Mail,
    Phone,
    MapPin,
    User as UserIcon,
    Edit,
    FolderOpen
} from 'lucide-react';

const typeConfig: Record<string, { label: string; color: string }> = {
    client: {
        label: 'Client',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400'
    },
    partenaire: {
        label: 'Partenaire',
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400'
    },
    fournisseur: {
        label: 'Fournisseur',
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400'
    },
};

export default function CompanyDetailsClient() {
    const params = useParams();
    const id = params?.id as string;

    // ... rest of component
    const router = useRouter();
    const [company, setCompany] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCompany = async () => {
            setIsLoading(true);
            try {
                const response = await getUser(id);
                if (response.success && response.data) {
                    setCompany(response.data);
                } else {
                    setError(response.message || 'Impossible de charger les informations');
                }
            } catch (err) {
                console.error('Error loading company:', err);
                setError('Erreur lors du chargement');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCompany();
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
        );
    }

    if (error || !company) {
        return (
            <div className="p-6 text-center">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 inline-block">
                    <p className="text-red-600 dark:text-red-400">{error || 'Entreprise introuvable'}</p>
                    <Link
                        href="/doublemb/entreprises"
                        className="mt-4 inline-block text-sm font-medium text-red-600 hover:text-red-800 underline"
                    >
                        Retour à la liste
                    </Link>
                </div>
            </div>
        );
    }

    const companyName = company.company_name || company.name;
    const contactName = company.name;
    const type = 'client';
    const typeInfo = typeConfig[type] || typeConfig['client'];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/doublemb/entreprises"
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6 text-gray-500" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            {companyName}
                            <span className={`px-2.5 py-0.5 rounded-full text-sm font-medium ${typeInfo.color}`}>
                                {typeInfo.label}
                            </span>
                        </h1>
                        <div className="flex items-center text-gray-500 dark:text-gray-400 mt-1 gap-4 text-sm">
                            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {company.address || 'Adresse non spécifiée'}</span>
                            <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> {company.email}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link
                        href={`/doublemb/entreprises/${company.id}/modifier`}
                        className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-gray-400" /> Informations Générales
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <span className="block text-sm text-gray-500 dark:text-gray-400">Nom de l'entreprise</span>
                                <span className="block text-gray-900 dark:text-white font-medium">{companyName}</span>
                            </div>
                            <div>
                                <span className="block text-sm text-gray-500 dark:text-gray-400">Email Contact</span>
                                <span className="block text-gray-900 dark:text-white font-medium">{company.email}</span>
                            </div>
                            <div>
                                <span className="block text-sm text-gray-500 dark:text-gray-400">Téléphone</span>
                                <span className="block text-gray-900 dark:text-white font-medium">{company.phone || '-'}</span>
                            </div>
                            <div>
                                <span className="block text-sm text-gray-500 dark:text-gray-400">Site Web</span>
                                <a href="#" className="block text-blue-600 hover:underline font-medium">-</a>
                            </div>
                        </div>
                        {company.bio && (
                            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                                <span className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Notes</span>
                                <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                                    {company.bio}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                            <FolderOpen className="h-5 w-5 text-gray-400" /> Projets Récents
                        </h2>
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                            Aucun projet associé pour le moment.
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                            <UserIcon className="h-5 w-5 text-gray-400" /> Contact Principal
                        </h2>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 bg-red-100 text-red-700 rounded-full flex items-center justify-center font-bold text-lg">
                                {contactName?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white">{contactName}</p>
                                <p className="text-sm text-gray-500">Contact</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                {company.email}
                            </div>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                {company.phone || '-'}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-gray-400" /> Adresse
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            {company.address || 'Non renseignée'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
