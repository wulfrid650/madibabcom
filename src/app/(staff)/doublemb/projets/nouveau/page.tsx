'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Save,
    Building2,
    MapPin,
    Calendar,
    DollarSign,
    Briefcase,
    HardHat,
    FileText,
    Loader2,
} from 'lucide-react';
import {
    createPortfolioProject,
    getQuoteRequestsForProjectLink,
    getUsers,
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

export default function NewProjectPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<ProjectFormState>(initialFormState);
    const [chefOptions, setChefOptions] = useState<User[]>([]);
    const [quoteOptions, setQuoteOptions] = useState<QuoteRequestLinkOption[]>([]);
    const [loadingChefs, setLoadingChefs] = useState(true);
    const [loadingQuotes, setLoadingQuotes] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadOptions = async () => {
            try {
                const [chefsResponse, quotesResponse] = await Promise.all([
                    getUsers({ role: 'chef_chantier', per_page: 100 }),
                    getQuoteRequestsForProjectLink({ per_page: 200 }),
                ]);

                setChefOptions(chefsResponse.data || []);
                setQuoteOptions(quotesResponse.data || []);
            } catch (loadError) {
                console.error(loadError);
            } finally {
                setLoadingChefs(false);
                setLoadingQuotes(false);
            }
        };

        void loadOptions();
    }, []);

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
        setIsSaving(true);
        setError(null);

        try {
            const response = await createPortfolioProject({
                title: formData.title.trim(),
                category: 'Construction',
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

            if (!response.success || !response.data) {
                setError(response.message || 'Erreur lors de la creation du projet.');
                return;
            }

            router.push('/doublemb/projets');
            router.refresh();
        } catch (submitError) {
            console.error(submitError);
            setError('Erreur lors de la creation du projet.');
        } finally {
            setIsSaving(false);
        }
    };

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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouveau projet</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Creer un chantier reellement exploitable par le chef affecte.</p>
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
                                placeholder="Ex: Reconstruction Batiment C IUC"
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
                                placeholder="Nom du client ou de l'entreprise"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Devis lié
                            </label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <select
                                    name="linked_quote_request_id"
                                    value={formData.linked_quote_request_id}
                                    onChange={handleQuoteChange}
                                    disabled={loadingQuotes}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white disabled:opacity-60"
                                >
                                    <option value="">Aucun devis lié</option>
                                    {quoteOptions.map((quote) => (
                                        <option key={quote.id} value={quote.id}>
                                            {quote.quote_number || `Demande #${quote.id}`} - {quote.company || quote.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Optionnel. Permet de rattacher le projet à une demande de devis existante.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Localisation *
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    name="location"
                                    required
                                    value={formData.location}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                                    placeholder="Ville, Quartier"
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
                                placeholder="Details du projet..."
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
                                Statut initial
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
                                    disabled={loadingChefs}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white disabled:opacity-60"
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
                                Progression initiale (%)
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
                                Date de debut prevue
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
                        {isSaving ? 'Creation...' : 'Creer le projet'}
                    </button>
                </div>
            </form>
        </div>
    );
}
