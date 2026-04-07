'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Formation {
    id: number;
    title: string;
    slug: string;
    description: string;
    duration_hours: number | null;
    duration_days: number | null;
    price: string;
    inscription_fee: string;
    level: string;
    category: string;
    max_students: number;
    next_sessions?: {
        id: number;
        start_date: string;
        end_date: string;
        status: string;
        max_students: number;
    }[];
}

interface SiteSettings {
    contact_phone?: string;
    contact_email?: string;
    phone?: string;
    email?: string;
}

function formatPrice(price: string | number): string {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('fr-FR').format(numPrice) + ' FCFA';
}

function formatDuration(formation: Formation): string {
    if (formation.duration_days) {
        const weeks = Math.floor(formation.duration_days / 7);
        const days = formation.duration_days % 7;
        if (weeks > 0 && days === 0) {
            return `${weeks} semaine${weeks > 1 ? 's' : ''}`;
        } else if (weeks > 0) {
            return `${weeks} semaine${weeks > 1 ? 's' : ''} ${days} jour${days > 1 ? 's' : ''}`;
        }
        return `${formation.duration_days} jour${formation.duration_days > 1 ? 's' : ''}`;
    }
    if (formation.duration_hours) {
        return `${formation.duration_hours} heures`;
    }
    return 'Durée à définir';
}

function normalizePhone(input: string): string {
    const trimmed = input.trim();
    if (!trimmed) return trimmed;
    const digits = trimmed.replace(/[^\d+]/g, '');
    if (digits.startsWith('+')) return digits;
    if (digits.startsWith('00')) return "+";
    const numeric = digits.replace(/\D/g, '');
    if (numeric.length === 9) {
        return "+237";
    }
    if (numeric.startsWith('237')) {
        return "+";
    }
    return numeric;
}
function InscriptionFormContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, token } = useAuth();
    const formationSlug = searchParams.get('formation');

    const [formations, setFormations] = useState<Formation[]>([]);
    const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [settings, setSettings] = useState<SiteSettings>({});
    const [inscriptionMode, setInscriptionMode] = useState<'guest' | 'account'>('guest');

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        formation_id: '',
        session_id: '',
        message: '',
        createAccount: false,
        password: '',
        confirmPassword: '',
    });

    // Pré-remplir si connecté
    useEffect(() => {
        if (user) {
            const nameParts = user.name?.split(' ') || ['', ''];
            setFormData(prev => ({
                ...prev,
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                email: user.email || '',
                phone: user.phone || '',
            }));
            setInscriptionMode('account');
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (formations.length > 0 && formationSlug) {
            const found = formations.find(f =>
                f.slug === formationSlug ||
                f.title.toLowerCase().includes(formationSlug.toLowerCase())
            );
            if (found) {
                setSelectedFormation(found);
                setFormData(prev => ({ ...prev, formation_id: found.id.toString() }));
            }
        }
    }, [formations, formationSlug]);

    useEffect(() => {
        if (!selectedFormation) {
            return;
        }

        if (selectedFormation.next_sessions?.length === 1) {
            const autoSessionId = selectedFormation.next_sessions[0].id.toString();
            setFormData(prev => (prev.session_id ? prev : { ...prev, session_id: autoSessionId }));
        }
    }, [selectedFormation]);

    const fetchData = async () => {
        try {
            const [formationsRes, settingsRes] = await Promise.all([
                fetch(`${API_URL}/public/formations`),
                api.getPublicSettings().catch(() => null)
            ]);

            if (formationsRes.ok) {
                const data = await formationsRes.json();
                setFormations(data.data || []);
            }

            if (settingsRes) {
                setSettings({
                    contact_phone: settingsRes.phone,
                    contact_email: settingsRes.email,
                    phone: settingsRes.phone,
                    email: settingsRes.email,
                });
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (name === 'formation_id') {
            console.log('Formation sélectionnée:', value);
            const formation = formations.find(f => f.id.toString() === value);
            setSelectedFormation(formation || null);
            setFormData(prev => ({ ...prev, formation_id: value, session_id: '' }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        // Validation de la formation
        if (!formData.formation_id || formData.formation_id === '') {
            console.error('Validation échouée: formation_id est vide', formData);
            setError('Veuillez sélectionner une formation');
            setSubmitting(false);
            return;
        }

        console.log('Soumission du formulaire avec formation_id:', formData.formation_id);

        // Validation du mot de passe si création de compte
        if (formData.createAccount && !user) {
            if (formData.password.length < 8) {
                setError('Le mot de passe doit contenir au moins 8 caractères');
                setSubmitting(false);
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setError('Les mots de passe ne correspondent pas');
                setSubmitting(false);
                return;
            }
        }

        const requiresSessionSelection = selectedFormation?.next_sessions?.length ?? 0;
        if (requiresSessionSelection > 0 && !formData.session_id) {
            setError('Veuillez sélectionner une session pour cette formation.');
            setSubmitting(false);
            return;
        }

        try {
            const normalizedPhone = normalizePhone(formData.phone);
            // Si l'utilisateur souhaite créer un compte
            if (formData.createAccount && !user) {
                // D'abord créer le compte
                const registerResponse = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: `${formData.firstName} ${formData.lastName}`,
                        email: formData.email,
                        phone: normalizedPhone,
                        password: formData.password,
                        password_confirmation: formData.confirmPassword,
                        role: 'apprenant',
                        formation: formData.formation_id,
                    }),
                });

                const registerData = await registerResponse.json();

                if (!registerResponse.ok) {
                    throw new Error(registerData.message || 'Erreur lors de la création du compte');
                }

                // Stocker le token temporairement pour l'inscription
                const tempToken = registerData.token;

                // Procéder à l'inscription avec le token
                const inscriptionPayload = {
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    email: formData.email,
                    phone: normalizedPhone,
                    formation_id: formData.formation_id,
                    session_id: formData.session_id || null,
                    message: formData.message,
                    return_url: window.location.origin + '/training/inscription/confirmation',
                };
                console.log('Envoi inscription avec compte créé:', inscriptionPayload);
                const inscriptionResponse = await fetch(`${API_URL}/public/formation-inscription`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${tempToken}`,
                    },
                    body: JSON.stringify(inscriptionPayload),
                });

                const inscriptionResult = await inscriptionResponse.json();
                console.log('Réponse inscription (compte créé):', inscriptionResult);

                if (!inscriptionResponse.ok) {
                    console.error('Erreur backend (compte créé):', inscriptionResult);
                    throw new Error(inscriptionResult.error || inscriptionResult.message || 'Erreur lors de l\'inscription');
                }

                // Rediriger vers Moneroo ou vers le lien local de reprise
                if (inscriptionResult.data?.checkout_url || inscriptionResult.data?.payment_url) {
                    window.location.href = inscriptionResult.data.checkout_url || inscriptionResult.data.payment_url;
                } else {
                    throw new Error('URL de paiement non disponible');
                }
            } else {
                // Inscription en tant qu'invité ou utilisateur connecté
                const headers: Record<string, string> = {
                    'Content-Type': 'application/json',
                };

                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const inscriptionPayload = {
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    email: formData.email,
                    phone: normalizedPhone,
                    formation_id: formData.formation_id,
                    session_id: formData.session_id || null,
                    message: formData.message,
                    return_url: window.location.origin + '/training/inscription/confirmation',
                };
                console.log('Envoi inscription (invité ou connecté):', inscriptionPayload);

                const response = await fetch(`${API_URL}/public/formation-inscription`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(inscriptionPayload),
                });

                const inscriptionResult = await response.json();
                console.log('Réponse inscription:', inscriptionResult);

                if (!response.ok) {
                    console.error('Erreur backend:', inscriptionResult);
                    throw new Error(inscriptionResult.error || inscriptionResult.message || 'Erreur lors de l\'inscription');
                }

                // Rediriger vers Moneroo ou vers le lien local de reprise
                if (inscriptionResult.data?.checkout_url || inscriptionResult.data?.payment_url) {
                    window.location.href = inscriptionResult.data.checkout_url || inscriptionResult.data.payment_url;
                } else {
                    throw new Error('URL de paiement non disponible');
                }
            }
        } catch (err) {
            console.error('Erreur lors de la soumission:', err);
            setError(err instanceof Error ? err.message : 'Une erreur est survenue');
            setSubmitting(false);
        }
    };

    // Calculer les frais d'inscription
    const inscriptionFee = selectedFormation?.inscription_fee
        ? parseFloat(selectedFormation.inscription_fee)
        : 10000;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-madiba-red"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
            <div className="container mx-auto px-6 max-w-4xl">
                {/* Header */}
                <div className="text-center mb-10">
                    <Link
                        href="/training"
                        className="inline-flex items-center gap-2 text-madiba-red hover:text-red-600 mb-4 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Retour aux formations
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Inscription à une formation
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Remplissez le formulaire et payez les frais d&apos;inscription pour valider votre place.
                    </p>
                </div>

                {/* Info Box - Paiement */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-8">
                    <div className="flex items-start gap-3">
                        <svg className="w-6 h-6 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="font-semibold text-amber-800 dark:text-amber-200">
                                Frais d&apos;inscription : {formatPrice(inscriptionFee)}
                            </p>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                Le paiement des frais d&apos;inscription est requis pour valider votre place.
                                Vous serez redirigé vers notre plateforme de paiement sécurisée (Mobile Money, Carte bancaire).
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form */}
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                                    <p className="text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            {/* Formation Selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Formation souhaitée *
                                </label>
                                <select
                                    name="formation_id"
                                    value={formData.formation_id}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent"
                                >
                                    <option value="">-- Sélectionnez une formation --</option>
                                    {formations.map(formation => (
                                        <option key={formation.id} value={formation.id}>
                                            {formation.title} - {formatPrice(formation.price)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Session Selection */}
                            {selectedFormation && selectedFormation.next_sessions && selectedFormation.next_sessions.length > 0 && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Session préférée *
                                    </label>
                                    <select
                                        name="session_id"
                                        value={formData.session_id}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent"
                                    >
                                        <option value="" disabled>-- Sélectionnez une session --</option>
                                        {selectedFormation.next_sessions.map(session => (
                                            <option key={session.id} value={session.id}>
                                                {new Date(session.start_date).toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Personal Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Prénom *
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent"
                                        placeholder="Votre prénom"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Nom *
                                    </label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent"
                                        placeholder="Votre nom"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        disabled={!!user}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
                                        placeholder="votre@email.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Téléphone *
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent"
                                        placeholder="+237 6XX XXX XXX"
                                    />
                                </div>
                            </div>

                            {/* Option création de compte (uniquement si pas connecté) */}
                            {!user && (
                                <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="createAccount"
                                            checked={formData.createAccount}
                                            onChange={handleChange}
                                            className="w-5 h-5 mt-0.5 rounded border-gray-300 text-madiba-red focus:ring-madiba-red"
                                        />
                                        <div>
                                            <span className="font-medium text-blue-800 dark:text-blue-200">
                                                Créer un compte apprenant
                                            </span>
                                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                                Accédez à votre espace personnel pour suivre vos formations,
                                                télécharger vos certificats et gérer vos paiements.
                                            </p>
                                        </div>
                                    </label>

                                    {formData.createAccount && (
                                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                                            <div>
                                                <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                                                    Mot de passe *
                                                </label>
                                                <input
                                                    type="password"
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    required={formData.createAccount}
                                                    minLength={8}
                                                    className="w-full px-4 py-3 rounded-lg border border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent"
                                                    placeholder="Min. 8 caractères"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                                                    Confirmer le mot de passe *
                                                </label>
                                                <input
                                                    type="password"
                                                    name="confirmPassword"
                                                    value={formData.confirmPassword}
                                                    onChange={handleChange}
                                                    required={formData.createAccount}
                                                    minLength={8}
                                                    className="w-full px-4 py-3 rounded-lg border border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent"
                                                    placeholder="Confirmer"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Lien connexion si pas connecté et pas de création de compte */}
                            {!user && !formData.createAccount && (
                                <div className="mb-6 text-center py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Vous avez déjà un compte ?{' '}
                                        <Link
                                            href={`/login?redirect=/training/inscription${formationSlug ? `?formation=${formationSlug}` : ''}`}
                                            className="text-madiba-red hover:underline font-medium"
                                        >
                                            Connectez-vous
                                        </Link>
                                    </p>
                                </div>
                            )}

                            {/* Info utilisateur connecté */}
                            {user && (
                                <div className="mb-6 bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                                    <div className="flex items-center gap-3">
                                        <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                            <p className="font-medium text-green-800 dark:text-green-200">
                                                Connecté en tant que {user.name}
                                            </p>
                                            <p className="text-sm text-green-700 dark:text-green-300">
                                                L&apos;inscription sera liée à votre compte.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Message (optionnel)
                                </label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent"
                                    placeholder="Questions ou informations supplémentaires..."
                                />
                            </div>

                            <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
                                En vous inscrivant à une formation, vous acceptez automatiquement les{' '}
                                <Link href="/mentions-legales" className="text-madiba-red hover:underline">
                                    mentions légales
                                </Link>
                                , les{' '}
                                <Link href="/cgv" className="text-madiba-red hover:underline">
                                    Conditions Générales de Vente
                                </Link>
                                , les{' '}
                                <Link href="/cgu" className="text-madiba-red hover:underline">
                                    Conditions Générales d&apos;Utilisation
                                </Link>{' '}
                                et la{' '}
                                <Link href="/privacy-policy" className="text-madiba-red hover:underline">
                                    Politique de Confidentialité
                                </Link>
                                .
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !formData.formation_id}
                                className="w-full bg-madiba-red text-white py-4 rounded-xl font-bold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Redirection vers le paiement...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        Payer les frais d&apos;inscription ({formatPrice(inscriptionFee)})
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                                🔒 Paiement sécurisé par Moneroo (Orange Money, MTN MoMo, Carte bancaire)
                            </p>
                        </form>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Selected Formation Info */}
                        {selectedFormation && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Formation sélectionnée</h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {selectedFormation.title}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {selectedFormation.category}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-700">
                                        <span className="text-gray-600 dark:text-gray-400">Durée</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {formatDuration(selectedFormation)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-700">
                                        <span className="text-gray-600 dark:text-gray-400">Niveau</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {selectedFormation.level || 'Tous niveaux'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-700">
                                        <span className="text-gray-600 dark:text-gray-400">Prix total</span>
                                        <span className="font-bold text-gray-900 dark:text-white">
                                            {formatPrice(selectedFormation.price)}
                                        </span>
                                    </div>
                                    <div className="bg-madiba-red/10 dark:bg-madiba-red/20 rounded-lg p-3 border border-madiba-red/20">
                                        <div className="flex items-center justify-between">
                                            <span className="text-madiba-red font-medium">Frais d&apos;inscription</span>
                                            <span className="font-bold text-madiba-red text-xl whitespace-nowrap">
                                                {new Intl.NumberFormat('fr-FR').format(inscriptionFee)}
                                                <span className="text-sm ml-1">FCFA</span>
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                            À payer aujourd&apos;hui pour réserver votre place
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Promo Box - 10% sur devis */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">-10%</span>
                                </div>
                                <h3 className="font-bold text-green-800 dark:text-green-200">Offre spéciale</h3>
                            </div>
                            <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                                Bénéficiez de <strong>10% de réduction</strong> sur votre devis construction
                                si vous demandez un devis via notre site !
                            </p>
                            <Link
                                href="/contact?type=devis"
                                className="inline-flex items-center gap-2 text-green-700 dark:text-green-300 font-semibold text-sm hover:underline"
                            >
                                Demander un devis
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                        </div>

                        {/* Contact Info */}
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Besoin d&apos;aide ?</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Notre équipe est disponible pour répondre à toutes vos questions.
                            </p>
                            <div className="space-y-3">
                                <a
                                    href={`tel:${settings.contact_phone || '+237692653590'}`}
                                    className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-madiba-red transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <span className="text-sm">{settings.contact_phone || '+237 692 65 35 90'}</span>
                                </a>
                                <a
                                    href={`mailto:${settings.contact_email || 'contact@madibabc.com'}`}
                                    className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-madiba-red transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-sm">{settings.contact_email || 'contact@madibabc.com'}</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function InscriptionFormationPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-madiba-red"></div>
            </div>
        }>
            <InscriptionFormContent />
        </Suspense>
    );
}
