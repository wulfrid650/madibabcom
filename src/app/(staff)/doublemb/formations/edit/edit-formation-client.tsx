'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ValidationError } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Formateur {
    id: number;
    name: string;
    email: string;
    speciality?: string;
}

const levels = [
    { value: 'debutant', label: 'Débutant' },
    { value: 'intermediaire', label: 'Intermédiaire' },
    { value: 'avance', label: 'Avancé' },
];
const categories = ['BIM', 'Rendu 3D', 'Architecture', 'Design intérieur', 'Structure', 'Autre'];

interface EditFormationClientProps {
    id: string;
}

export default function EditFormationClient({ id }: EditFormationClientProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formateurs, setFormateurs] = useState<Formateur[]>([]);
    const [loadingFormateurs, setLoadingFormateurs] = useState(true);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        objectives: '',
        prerequisites: '',
        program: '',
        duration_hours: '',
        duration_days: '',
        price: '',
        registration_fees: '',
        level: 'debutant',
        category: 'Rendu 3D',
        max_students: '10',
        formateur_id: '',
        is_active: true,
        is_featured: false,
    });

    useEffect(() => {
        const init = async () => {
            await Promise.all([fetchFormation(), fetchFormateurs()]);
        };
        init();
    }, [id]);

    const fetchFormation = async () => {
        try {
            const data = await api.getAdminFormation(id);

            setFormData({
                title: data.title || '',
                description: data.description || '',
                objectives: Array.isArray(data.objectives) ? data.objectives.join('\n') : (data.objectives || ''),
                prerequisites: Array.isArray(data.prerequisites) ? data.prerequisites.join('\n') : (data.prerequisites || ''),
                program: Array.isArray(data.program) ? data.program.join('\n') : (data.program || ''),
                duration_hours: data.duration_hours?.toString() || '',
                duration_days: data.duration_days?.toString() || '',
                price: data.price?.toString() || '',
                registration_fees: data.registration_fees?.toString() || '',
                level: data.level || 'debutant',
                category: data.category || 'Rendu 3D',
                max_students: data.max_students?.toString() || '10',
                formateur_id: data.formateur?.id?.toString() || (data.formateur_id?.toString() || ''),
                is_active: data.is_active || false,
                is_featured: data.is_featured || false,
            });
        } catch (err) {
            setError('Impossible de charger la formation');
            console.error(err);
        } finally {
            setFetching(false);
        }
    };

    const fetchFormateurs = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/admin/users?role=formateur`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setFormateurs(data.data || []);
            }
        } catch (err) {
            console.error('Erreur chargement formateurs:', err);
        } finally {
            setLoadingFormateurs(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Convert line breaks back to arrays for textareas
            const objectives = formData.objectives.split('\n').filter(line => line.trim() !== '');
            const prerequisites = formData.prerequisites.split('\n').filter(line => line.trim() !== '');
            const program = formData.program.split('\n').filter(line => line.trim() !== '');

            const payload = {
                ...formData,
                objectives,
                prerequisites,
                program,
                duration_hours: formData.duration_hours ? parseInt(formData.duration_hours) : null,
                duration_days: formData.duration_days ? parseInt(formData.duration_days) : null,
                price: formData.price ? parseFloat(formData.price) : 0,
                registration_fees: formData.registration_fees ? parseFloat(formData.registration_fees) : 0,
                max_students: parseInt(formData.max_students) || 10,
                formateur_id: formData.formateur_id ? parseInt(formData.formateur_id) : null,
            };

            console.log('Updating formation with payload:', payload);

            await api.updateFormation(id, payload);

            router.push('/doublemb/formations');
        } catch (err: any) {
            console.error('Update error:', err);
            if (err instanceof ValidationError) {
                // Formatting validation errors for display
                const messages = err.getAllErrors().join('\n');
                setError(`Erreur de validation:\n${messages}`);
            } else {
                setError(err.message || 'Une erreur est survenue lors de la mise à jour');
            }
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-madiba-red"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/doublemb/formations"
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Modifier la Formation</h1>
                        <p className="text-gray-500 dark:text-gray-400">Mettre à jour les informations</p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informations générales</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Titre de la formation *
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Description *
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        required
                                        rows={3}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Objectifs pédagogiques
                                    </label>
                                    <textarea
                                        name="objectives"
                                        value={formData.objectives}
                                        onChange={handleChange}
                                        rows={4}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent"
                                        placeholder="- Objectif 1&#10;- Objectif 2&#10;- Objectif 3"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Prérequis
                                    </label>
                                    <textarea
                                        name="prerequisites"
                                        value={formData.prerequisites}
                                        onChange={handleChange}
                                        rows={2}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent"
                                        placeholder="Connaissances ou équipements requis..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Programme détaillé
                                    </label>
                                    <textarea
                                        name="program"
                                        value={formData.program}
                                        onChange={handleChange}
                                        rows={6}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent"
                                        placeholder="Module 1: Introduction&#10;- Cours 1&#10;- Cours 2&#10;&#10;Module 2: Avancé&#10;- Cours 3"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Publication */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Publication</h2>

                            <div className="space-y-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={formData.is_active}
                                        onChange={handleChange}
                                        className="w-5 h-5 rounded border-gray-300 text-madiba-red focus:ring-madiba-red"
                                    />
                                    <div>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">Activer</span>
                                        <p className="text-xs text-gray-500">Visible sur le site public</p>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="is_featured"
                                        checked={formData.is_featured}
                                        onChange={handleChange}
                                        className="w-5 h-5 rounded border-gray-300 text-madiba-red focus:ring-madiba-red"
                                    />
                                    <div>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">Mise en avant</span>
                                        <p className="text-xs text-gray-500">Afficher comme formation phare</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Détails</h2>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Durée (jours)
                                        </label>
                                        <input
                                            type="number"
                                            name="duration_days"
                                            value={formData.duration_days}
                                            onChange={handleChange}
                                            min="1"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Durée (heures)
                                        </label>
                                        <input
                                            type="number"
                                            name="duration_hours"
                                            value={formData.duration_hours}
                                            onChange={handleChange}
                                            min="1"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Frais d'inscription (FCFA)
                                    </label>
                                    <input
                                        type="number"
                                        name="registration_fees"
                                        value={formData.registration_fees}
                                        onChange={handleChange}
                                        min="0"
                                        step="1000"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent"
                                        placeholder="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Frais de formation / scolarité (FCFA) *
                                    </label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleChange}
                                        required
                                        min="0"
                                        step="1000"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent"
                                        placeholder="100000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Places maximum *
                                    </label>
                                    <input
                                        type="number"
                                        name="max_students"
                                        value={formData.max_students}
                                        onChange={handleChange}
                                        required
                                        min="1"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Niveau
                                    </label>
                                    <select
                                        name="level"
                                        value={formData.level}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent"
                                    >
                                        {levels.map(level => (
                                            <option key={level.value} value={level.value}>{level.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Catégorie
                                    </label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Formateur */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Formateur</h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Assigner un formateur
                                </label>
                                <select
                                    name="formateur_id"
                                    value={formData.formateur_id}
                                    onChange={handleChange}
                                    disabled={loadingFormateurs}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent disabled:opacity-50"
                                >
                                    <option value="">-- Aucun --</option>
                                    {formateurs.map(formateur => (
                                        <option key={formateur.id} value={formateur.id}>
                                            {formateur.name} {formateur.speciality ? `(${formateur.speciality})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {loadingFormateurs && (
                                    <p className="text-xs text-gray-500 mt-1">Chargement des formateurs...</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <Link
                        href="/doublemb/formations"
                        className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        Annuler
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 rounded-lg bg-madiba-red text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Mise à jour...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Enregistrer les modifications
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
