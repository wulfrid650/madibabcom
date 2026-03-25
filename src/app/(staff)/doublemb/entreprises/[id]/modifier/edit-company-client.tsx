'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getUser, updateUser } from '@/lib/admin-api';
import {
    ArrowLeft,
    Building2,
    Mail,
    Phone,
    MapPin,
    User as UserIcon,
    FileText,
    Save,
    Loader2
} from 'lucide-react';

// interface EditCompanyClientProps {
//     id: string;
// }

export default function EditCompanyClient() {
    const params = useParams();
    const id = params?.id as string;
    // ... rest of component
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        type: 'client',
        email: '',
        phone: '',
        address: '',
        city: '',
        postal_code: '',
        country: 'Cameroun',
        contact_name: '',
        contact_role: '',
        contact_email: '',
        contact_phone: '',
        website: '',
        tax_id: '',
        notes: '',
        is_vip: false
    });

    useEffect(() => {
        const fetchCompany = async () => {
            try {
                const response = await getUser(id);
                if (response.success && response.data) {
                    const user = response.data;
                    let notes = user.bio || '';
                    let type = 'client';

                    if (notes.startsWith('Type: ')) {
                        const typeLine = notes.split('\n')[0];
                        type = typeLine.replace('Type: ', '').toLowerCase().trim();
                        if (!['client', 'partenaire', 'fournisseur'].includes(type)) {
                            type = 'client';
                        }
                        notes = notes.split('\n').slice(1).join('\n');
                    }

                    setFormData({
                        name: user.company_name || user.name,
                        type: type,
                        email: user.email,
                        phone: user.phone || '',
                        address: user.address || '',
                        city: (user.address || '').split(',').pop()?.trim() || '',
                        postal_code: '',
                        country: 'Cameroun',
                        contact_name: user.name,
                        contact_role: '',
                        contact_email: '',
                        contact_phone: '',
                        website: '',
                        tax_id: '',
                        notes: notes,
                        is_vip: false
                    });
                } else {
                    setError(response.message || 'Impossible de charger les données');
                }
            } catch (err) {
                console.error('Error loading company:', err);
                setError('Erreur de chargement');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCompany();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const response = await updateUser(id, {
                name: formData.contact_name,
                email: formData.email,
                phone: formData.phone,
                company_name: formData.name,
                address: formData.address,
                bio: `Type: ${formData.type}\n${formData.notes}`
            });

            if (response.success) {
                router.push(`/doublemb/entreprises/${id}`);
                router.refresh();
            } else {
                alert(`Erreur: ${response.message}`);
            }
        } catch (error) {
            console.error('Error updating company:', error);
            alert('Une erreur est survenue lors de la modification');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div></div>;
    if (error) return <div className="p-6 text-center text-red-600">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link
                        href={`/doublemb/entreprises/${id}`}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-500" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Modifier l'entreprise</h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Mettre à jour les informations
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Building2 className="h-5 w-5 mr-2 text-red-600" />
                        Informations de l'entreprise
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nom de l'entreprise *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Type *
                            </label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="client">Client</option>
                                <option value="partenaire">Partenaire</option>
                                <option value="fournisseur">Fournisseur</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                <Mail className="h-4 w-4 inline mr-1" />
                                Email *
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                <Phone className="h-4 w-4 inline mr-1" />
                                Téléphone *
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <MapPin className="h-5 w-5 mr-2 text-red-600" />
                        Adresse
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Adresse complète
                            </label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <UserIcon className="h-5 w-5 mr-2 text-red-600" />
                        Personne de contact
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nom complet (Contact)
                            </label>
                            <input
                                type="text"
                                name="contact_name"
                                value={formData.contact_name}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-red-600" />
                        Notes additionnelles
                    </h2>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </div>

                <div className="flex items-center justify-end space-x-4">
                    <Link
                        href={`/doublemb/entreprises/${id}`}
                        className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        Annuler
                    </Link>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Enregistrement...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Enregistrer
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
