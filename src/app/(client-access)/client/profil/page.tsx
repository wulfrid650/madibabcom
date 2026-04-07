'use client';

import { useState, useEffect } from "react";
import { User, Lock, Mail, Building, FileText } from "lucide-react";
import { api } from "@/lib/api";

export default function ClientProfile() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [passwords, setPasswords] = useState({
        current_password: '',
        password: '',
        password_confirmation: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteForm, setDeleteForm] = useState({
        current_password: '',
        confirmation: '',
    });
    const [deleteMessage, setDeleteMessage] = useState({ type: '', text: '' });
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const userData = await api.getMe();
            setUser(userData);
        } catch (error) {
            console.error("Failed to fetch profile", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (passwords.password !== passwords.password_confirmation) {
            setMessage({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas.' });
            return;
        }

        try {
            await api.changePassword(passwords);
            setMessage({ type: 'success', text: 'Mot de passe mis à jour avec succès.' });
            setPasswords({ current_password: '', password: '', password_confirmation: '' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Erreur lors de la mise à jour.' });
        }
    };

    const closeDeleteModal = () => {
        if (isDeleting) return;
        setShowDeleteModal(false);
        setDeleteForm({ current_password: '', confirmation: '' });
        setDeleteMessage({ type: '', text: '' });
    };

    const handleDeleteAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setDeleteMessage({ type: '', text: '' });

        if (deleteForm.confirmation !== 'SUPPRIMER') {
            setDeleteMessage({ type: 'error', text: 'Veuillez saisir exactement SUPPRIMER pour confirmer.' });
            return;
        }

        setIsDeleting(true);
        try {
            const result = await api.deleteCurrentAccount({
                current_password: deleteForm.current_password,
                confirmation: 'SUPPRIMER',
            });
            setDeleteMessage({ type: 'success', text: result.message });
            window.setTimeout(() => {
                window.location.href = '/connexion?account_deleted=true';
            }, 800);
        } catch (error) {
            setDeleteMessage({
                type: 'error',
                text: error instanceof Error ? error.message : 'La suppression du compte a échoué.',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) return <div className="p-8">Chargement...</div>;

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold font-heading text-madiba-black mb-6">Mon Profil Client</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Info Card */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <User className="mr-2 text-madiba-red" /> Informations du Compte
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-500">Nom du contact</label>
                            <p className="font-medium text-lg">{user?.name}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Email</label>
                            <p className="font-medium flex items-center"><Mail className="w-4 h-4 mr-2" /> {user?.email}</p>
                        </div>
                        {user?.company_name && (
                            <div>
                                <label className="text-sm text-gray-500">Entreprise</label>
                                <p className="font-medium flex items-center"><Building className="w-4 h-4 mr-2" /> {user.company_name}</p>
                            </div>
                        )}
                        {user?.project_type && (
                            <div>
                                <label className="text-sm text-gray-500">Type de Projet</label>
                                <p className="font-medium flex items-center"><FileText className="w-4 h-4 mr-2" /> {user.project_type}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Password Change Card */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <Lock className="mr-2 text-madiba-red" /> Sécurité
                    </h2>

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        {message.text && (
                            <div className={`p-3 rounded text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {message.text}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe actuel</label>
                            <input
                                type="password"
                                required
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-madiba-red focus:border-transparent outline-none"
                                value={passwords.current_password}
                                onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-madiba-red focus:border-transparent outline-none"
                                value={passwords.password}
                                onChange={(e) => setPasswords({ ...passwords, password: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le nouveau mot de passe</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-madiba-red focus:border-transparent outline-none"
                                value={passwords.password_confirmation}
                                onChange={(e) => setPasswords({ ...passwords, password_confirmation: e.target.value })}
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                className="w-full bg-madiba-black text-white py-2 rounded hover:bg-gray-800 transition-colors font-medium"
                            >
                                Mettre à jour le mot de passe
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-red-900 mb-2">Zone dangereuse</h2>
                <p className="text-sm text-red-700 mb-4">
                    La suppression de votre compte est définitive. Vos accès et vos données associées seront supprimés.
                </p>
                <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors font-medium"
                >
                    Supprimer mon compte
                </button>
            </div>

            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                        <h2 className="text-xl font-semibold text-madiba-black mb-2">Supprimer mon compte</h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Cette action est irréversible. Saisissez votre mot de passe puis tapez <span className="font-semibold">SUPPRIMER</span>.
                        </p>

                        <form onSubmit={handleDeleteAccount} className="space-y-4">
                            {deleteMessage.text && (
                                <div className={`p-3 rounded text-sm ${deleteMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {deleteMessage.text}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe actuel</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                                    value={deleteForm.current_password}
                                    onChange={(e) => setDeleteForm({ ...deleteForm, current_password: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmation</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                                    value={deleteForm.confirmation}
                                    onChange={(e) => setDeleteForm({ ...deleteForm, confirmation: e.target.value.toUpperCase() })}
                                    placeholder="SUPPRIMER"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeDeleteModal}
                                    className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isDeleting}
                                    className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                    {isDeleting ? 'Suppression...' : 'Confirmer la suppression'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
