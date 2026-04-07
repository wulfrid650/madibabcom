'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    AlertCircle,
    ArrowLeft,
    Building2,
    Calendar,
    DollarSign,
    Briefcase,
    HardHat,
    Loader2,
    MapPin,
    Save,
} from 'lucide-react';
import {
    getPortfolioProjectAdmin,
    getQuoteRequestsForProjectLink,
    getUsers,
    updatePortfolioProject,
    type PortfolioProjectAdmin,
    type QuoteRequestLinkOption,
    type User,
} from '@/lib/admin-api';

type ProjectFormState = {
    title: string;
    client_name: string;
    linked_quote_request_id: string;
    chef_chantier_id: string;
    location: string;
    status: 'planned' | 'in_progress' | 'on_hold' | 'completed';
    progress: string;
    start_date: string;
    expected_end_date: string;
    budget: string;
    description: string;
};

const initialFormState: ProjectFormState = {
    title: '',
    client_name: '',
    linked_quote_request_id: '',
    chef_chantier_id: '',
    location: '',
    status: 'planned',
    progress: '0',
    start_date: '',
    expected_end_date: '',
    budget: '',
    description: '',
};

const statusOptions: Array<{ value: ProjectFormState['status']; label: string }> = [
    { value: 'planned', label: 'Planifie' },
    { value: 'in_progress', label: 'En cours' },
    { value: 'on_hold', label: 'En pause' },
    { value: 'completed', label: 'Termine' },
];

function normalizeStatus(status?: string): ProjectFormState['status'] {
    if (status === 'in_progress' || status === 'on_hold' || status === 'completed') {
        return status;
    }

    return 'planned';
}

function mapProjectToForm(project: PortfolioProjectAdmin): ProjectFormState {
    return {
        title: project.title || '',
        client_name: project.client_name || project.client || '',
        linked_quote_request_id: project.linked_quote_request_id ? String(project.linked_quote_request_id) : '',
        chef_chantier_id: project.chef_chantier_public_id || (project.chef_chantier_id ? String(project.chef_chantier_id) : ''),
        location: project.location || '',
        status: normalizeStatus(project.status),
        progress: String(project.progress ?? 0),
        start_date: project.start_date || '',
        expected_end_date: project.expected_end_date || '',
        budget: project.budget || '',
        description: project.description || '',
    };
}

export default function EditProjectPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const projectId = useMemo(() => Number(searchParams.get('id')), [searchParams]);

    const [formData, setFormData] = useState<ProjectFormState>(initialFormState);
    const [chefOptions, setChefOptions] = useState<User[]>([]);
    const [quoteOptions, setQuoteOptions] = useState<QuoteRequestLinkOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            if (!projectId || Number.isNaN(projectId)) {
                setError('ID du projet manquant ou invalide.');
                setIsLoading(false);
                return;
            }

            try {
                const [projectResponse, chefsResponse, quotesResponse] = await Promise.all([
                    getPortfolioProjectAdmin(projectId),
                    getUsers({ role: 'chef_chantier', per_page: 100 }),
                    getQuoteRequestsForProjectLink({ per_page: 200 }),
                ]);

                if (!projectResponse.success || !projectResponse.data) {
                    setError(projectResponse.message || 'Impossible de charger le projet.');
                    return;
                }

                setFormData(mapProjectToForm(projectResponse.data));
                setChefOptions(chefsResponse.data || []);
                const nextQuoteOptions = quotesResponse.data || [];
                const linkedQuote = projectResponse.data.linked_quote_request;
                setQuoteOptions(
                    linkedQuote && !nextQuoteOptions.some((quote) => quote.id === linkedQuote.id)
                        ? [linkedQuote, ...nextQuoteOptions]
                        : nextQuoteOptions
                );
            } catch (loadError) {
                console.error(loadError);
                setError('Impossible de charger le projet.');
            } finally {
                setIsLoading(false);
            }
        };

        void load();
    }, [projectId]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleQuoteChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const { value } = event.target;
        const selectedQuote = quoteOptions.find((quote) => String(quote.id) === value);

        setFormData((prev) => ({
            ...prev,
            linked_quote_request_id: value,
            client_name: prev.client_name || !selectedQuote
                ? prev.client_name
                : (selectedQuote.company || selectedQuote.name),
        }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!projectId || Number.isNaN(projectId)) {
            setError('ID du projet manquant ou invalide.');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const response = await updatePortfolioProject(projectId, {
                title: formData.title.trim(),
                client: formData.client_name.trim() || undefined,
                linked_quote_request_id: formData.linked_quote_request_id || null,
                description: formData.description.trim() || undefined,
                location: formData.location.trim() || undefined,
                status: formData.status,
                progress: Number(formData.progress || 0),
                start_date: formData.start_date || undefined,
                expected_end_date: formData.expected_end_date || undefined,
                budget: formData.budget.trim() || undefined,
                chef_chantier_id: formData.chef_chantier_id || null,
            });

            if (!response.success) {
                setError(response.message || 'Erreur lors de la sauvegarde.');
                return;
            }

            router.push('/doublemb/projets');
            router.refresh();
        } catch (saveError) {
            console.error(saveError);
            setError('Erreur lors de la sauvegarde.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-red-600" />
            </div>
        );
    }

    if (error && !formData.title) {
        return (
            <div className="p-6 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{error}</h3>
                <Link
                    href="/doublemb/projets"
                    className="text-red-600 hover:text-red-700 font-medium"
                >
                    Retour aux projets
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/doublemb/projets"
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <ArrowLeft className="h-6 w-6 text-gray-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Modifier le projet</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Mettre a jour les informations vraiment utilisees dans l'espace chantier.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Building2 className="h-5 w-5 mr-2 text-red-500" />
                        Informations generales
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nom du projet *
                            </label>
                            <input
                                type="text"
                                name="title"
                                required
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Client
                            </label>
                            <input
                                type="text"
                                name="client_name"
                                value={formData.client_name}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Devis lié
                            </label>
                            <select
                                name="linked_quote_request_id"
                                value={formData.linked_quote_request_id}
                                onChange={handleQuoteChange}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">Aucun devis lié</option>
                                {quoteOptions.map((quote) => (
                                    <option key={quote.id} value={quote.id}>
                                        {quote.quote_number || `Demande #${quote.id}`} - {quote.company || quote.name}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Optionnel. Le projet peut exister sans devis rattaché.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Localisation
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Description
                            </label>
                            <textarea
                                name="description"
                                rows={4}
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Briefcase className="h-5 w-5 mr-2 text-blue-500" />
                        Organisation
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Statut
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                            >
                                {statusOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Chef de chantier
                            </label>
                            <div className="relative">
                                <HardHat className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <select
                                    name="chef_chantier_id"
                                    value={formData.chef_chantier_id}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="">Aucun chef affecte</option>
                                    {chefOptions.map((chef) => (
                                        <option key={chef.id} value={chef.id}>
                                            {chef.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Progression (%)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                name="progress"
                                value={formData.progress}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-green-500" />
                        Planning et budget
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Date de debut
                            </label>
                            <input
                                type="date"
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Date de fin estimee
                            </label>
                            <input
                                type="date"
                                name="expected_end_date"
                                value={formData.expected_end_date}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Budget estime (FCFA)
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="number"
                                    min="0"
                                    name="budget"
                                    value={formData.budget}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                    <Link
                        href="/doublemb/projets"
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        Annuler
                    </Link>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </form>
        </div>
    );
}
