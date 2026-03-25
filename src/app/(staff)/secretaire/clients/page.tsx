'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';

interface Client {
    id: number;
    name: string;
    email: string;
    phone: string;
    projets: number;
    created_at: string;
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        client_type: 'particulier',
        name: '',
        email: '',
        phone: '',
        address: '',
        company_name: '',
        company_address: '',
    });

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const response = await api.request<any>('/secretaire/clients');
            if (response.success && response.data) {
                setClients(response.data.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.createClient(formData);
            if (response.success) {
                alert(response.message);
                setShowModal(false);
                setFormData({
                    client_type: 'particulier',
                    name: '',
                    email: '',
                    phone: '',
                    address: '',
                    company_name: '',
                    company_address: ''
                });
                fetchClients();
            }
        } catch (e: any) {
            console.error(e);
            alert('Erreur lors de la création du client: ' + (e.message || 'Erreur inconnue'));
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Gestion des Clients
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Gérez les clients (Particuliers et Entreprises)
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Ajouter Client
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[200px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nom</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Projets</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date Ajout</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {clients.map((client) => (
                                    <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                                    {client.name.charAt(0)}
                                                </div>
                                                <div className="ml-3">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{client.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 dark:text-white">{client.email}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{client.phone}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                                {client.projets} projets
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(client.created_at).toLocaleDateString('fr-FR')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {clients.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Aucun client trouvé.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Ajouter un Client</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Type de Client</label>
                                <div className="flex gap-4 mb-4">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            className="form-radio text-purple-600"
                                            name="client_type"
                                            value="particulier"
                                            checked={formData.client_type === 'particulier'}
                                            onChange={e => setFormData({ ...formData, client_type: e.target.value })}
                                        />
                                        <span className="ml-2 dark:text-gray-300">Particulier</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            className="form-radio text-purple-600"
                                            name="client_type"
                                            value="entreprise"
                                            checked={formData.client_type === 'entreprise'}
                                            onChange={e => setFormData({ ...formData, client_type: e.target.value })}
                                        />
                                        <span className="ml-2 dark:text-gray-300">Entreprise</span>
                                    </label>
                                </div>
                            </div>

                            {formData.client_type === 'entreprise' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nom de l&apos;Entreprise</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.company_name}
                                        onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="Ex: MBC Construction"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                                    {formData.client_type === 'entreprise' ? 'Nom du Contact' : 'Nom Complet'}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Téléphone</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Adresse</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>

                            {formData.client_type === 'entreprise' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Adresse de l&apos;Entreprise</label>
                                    <input
                                        type="text"
                                        value={formData.company_address}
                                        onChange={e => setFormData({ ...formData, company_address: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                            )}
                            <div className="flex justify-end gap-3 mt-6">
                                <Button variant="outline" onClick={() => setShowModal(false)} type="button">Annuler</Button>
                                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">Créer</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
