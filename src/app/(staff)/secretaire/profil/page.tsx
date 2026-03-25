'use client';

import { useState, useEffect } from "react";
import { User, Lock, Mail, Phone, MapPin } from "lucide-react";
import { api } from "@/lib/api";

export default function SecretaireProfile() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [passwords, setPasswords] = useState({
        current_password: '',
        password: '',
        password_confirmation: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });

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

    const activeRole = user?.roles?.find((r: any) => r.slug === user?.role);
    const roleName = activeRole?.name || user?.role;

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
            setMessage({ type: 'error', text: error.response?.data?.message || 'Erreur lors de la mise à jour.' });
        }
    };

    if (loading) return <div className="p-8">Chargement...</div>;

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold font-heading text-madiba-black mb-6">Mon Profil</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Info Card */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <User className="mr-2 text-madiba-red" /> Informations Personnelles
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-500">Nom complet</label>
                            <p className="font-medium text-lg">{user?.name}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Email</label>
                            <p className="font-medium flex items-center"><Mail className="w-4 h-4 mr-2" /> {user?.email}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Rôle</label>
                            <p className="font-medium"><span className="bg-gray-100 px-2 py-1 rounded text-sm">{roleName}</span></p>
                        </div>
                        {user?.employee_id && (
                            <div>
                                <label className="text-sm text-gray-500">ID Employé</label>
                                <p className="font-medium">{user.employee_id}</p>
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
        </div>
    );
}
