'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Formation {
    id: number;
    title: string;
    slug: string;
    description: string;
    duration_hours: number | null;
    duration_days: number | null;
    price: string;
    level: string;
    category: string;
    cover_image: string | null;
    max_students: number;
    is_featured: boolean;
    formateur_id: number | null;
    formateur?: {
        id: number;
        name: string;
        speciality: string | null;
    };
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
    contact_phone_secondary?: string;
    contact_email?: string;
    address?: string;
}

// Hardcoded formation BIM structure for modules display
const formationBIMModules = [
    {
        name: 'Conception Architecturale',
        software: 'ArchiCAD',
        icon: '🏗️',
    },
    {
        name: 'Rendu Photo et Vidéo',
        software: 'SketchUp + Enscape / Lumion / Twinmotion',
        icon: '🎨',
    },
    {
        name: 'Calcul de Structure',
        software: 'Robot',
        icon: '📐',
    },
];

const formationBIMFeatures = ['Formation pratique', 'Certificat reconnu', 'Projets réels', 'Accompagnement personnalisé'];

const defaultContactInfo = {
    email: 'contact@madibabc.com',
    phones: ['+237 692 65 35 90', '+237 676 94 91 03'],
    location: 'Douala-Cameroun, Entrée principale IUC Logbesou',
    prerequis: 'Minimum une machine avec carte graphique dédiée de 4 Go, Nvidia RTX ou GTX',
};

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

function formatNextSessionDate(sessions?: Formation['next_sessions']): string {
    if (!sessions || sessions.length === 0) {
        return 'Prochainement';
    }
    const nextSession = sessions[0];
    const date = new Date(nextSession.start_date);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

export default function TrainingPage() {
    const [formations, setFormations] = useState<Formation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [contactInfo, setContactInfo] = useState(defaultContactInfo);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch formations and settings in parallel
                const [formationsRes, settingsRes] = await Promise.all([
                    fetch(`${API_URL}/public/formations`),
                    fetch(`${API_URL}/public/settings`).catch(() => null)
                ]);

                if (!formationsRes.ok) {
                    throw new Error('Erreur lors du chargement des formations');
                }

                const formationsData = await formationsRes.json();
                setFormations(formationsData.data || []);

                // Update contact info from settings if available
                if (settingsRes && settingsRes.ok) {
                    const settingsData = await settingsRes.json();
                    const settings: SiteSettings = settingsData.data || {};
                    setContactInfo({
                        email: settings.contact_email || defaultContactInfo.email,
                        phones: [
                            settings.contact_phone || defaultContactInfo.phones[0],
                            settings.contact_phone_secondary || defaultContactInfo.phones[1]
                        ].filter(Boolean),
                        location: settings.address || defaultContactInfo.location,
                        prerequis: defaultContactInfo.prerequis,
                    });
                }
            } catch (err) {
                console.error('Error fetching formations:', err);
                setError('Impossible de charger les formations');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Separate featured formation (BIM) from others
    const featuredFormation = formations.find(f => f.is_featured || f.category === 'BIM');
    const otherFormations = formations.filter(f => f.id !== featuredFormation?.id);

    return (
        <div className="bg-white dark:bg-madiba-black min-h-screen">
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-red-50 to-white dark:from-madiba-red/10 dark:to-madiba-black py-20 lg:py-24">
                <div className="container mx-auto px-6 md:px-12">
                    <div className="max-w-3xl">
                        <span className="inline-block bg-madiba-red/10 dark:bg-madiba-red/20 text-madiba-red px-4 py-2 rounded-full text-sm font-bold mb-6 tracking-wide">
                            Madiba Building Construction
                        </span>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                            <span className="text-madiba-black dark:text-white">Formations </span>
                            <span className="text-madiba-red">Professionnelles</span>
                            <span className="text-madiba-black dark:text-white"> BTP & 3D</span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-2xl">
                            Devenez un professionnel du bâtiment avec nos formations en BIM, ArchiCAD, SketchUp, Enscape et Twinmotion.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link
                                href="#bim"
                                className="bg-madiba-red hover:bg-red-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                            >
                                Formation BIM
                            </Link>
                            <Link
                                href="#rendu3d"
                                className="border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white hover:border-madiba-red hover:text-madiba-red px-8 py-4 rounded-xl font-semibold transition-all duration-300"
                            >
                                Rendu 3D
                            </Link>
                            <Link
                                href="/connexion"
                                className="border-2 border-madiba-red text-madiba-red hover:bg-madiba-red hover:text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Espace Apprenant
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Info Banner */}
            <section className="bg-madiba-red text-white py-3">
                <div className="container mx-auto px-6 md:px-12">
                    <div className="flex flex-wrap justify-center items-center gap-6 text-sm md:text-base">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="font-medium">{contactInfo.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span className="font-medium">INFOLINE: {contactInfo.phones[0]}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Loading State */}
            {loading && (
                <section className="py-20">
                    <div className="container mx-auto px-6 md:px-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-madiba-red mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Chargement des formations...</p>
                    </div>
                </section>
            )}

            {/* Error State */}
            {error && !loading && (
                <section className="py-20">
                    <div className="container mx-auto px-6 md:px-12 text-center">
                        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-madiba-red text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Réessayer
                        </button>
                    </div>
                </section>
            )}

            {/* No Formations State */}
            {!loading && !error && formations.length === 0 && (
                <section className="py-20">
                    <div className="container mx-auto px-6 md:px-12 text-center">
                        <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                            Aucune formation disponible pour le moment.
                        </p>
                        <p className="text-gray-500 dark:text-gray-500">
                            Revenez bientôt pour découvrir nos nouvelles formations !
                        </p>
                    </div>
                </section>
            )}

            {/* Featured Formation (BIM) Section */}
            {!loading && !error && featuredFormation && (
                <section id="bim" className="py-16 lg:py-24">
                    <div className="container mx-auto px-6 md:px-12">
                        <div className="bg-gradient-to-br from-red-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-3xl overflow-hidden shadow-2xl">
                            <div className="grid lg:grid-cols-2 gap-0">
                                {/* Content */}
                                <div className="p-8 md:p-12 lg:p-16">
                                    <span className="inline-block bg-madiba-red/20 border border-madiba-red/30 text-madiba-red px-5 py-2 rounded-full text-sm font-bold mb-6 uppercase tracking-wider">
                                        ⭐ Formation Phare
                                    </span>
                                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-madiba-black dark:text-white mb-3">
                                        {featuredFormation.title}
                                    </h2>
                                    <p className="text-xl text-gray-700 dark:text-gray-300 mb-2">Deviens un professionnel du bâtiment</p>
                                    <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm">{featuredFormation.description}</p>

                                    {/* Modules */}
                                    <div className="space-y-3 mb-8">
                                        {formationBIMModules.map((module, index) => (
                                            <div key={index} className="bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl p-4 transition-colors border border-gray-100 dark:border-white/10">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{module.icon}</span>
                                                    <div>
                                                        <h4 className="text-madiba-black dark:text-white font-semibold">{module.name}</h4>
                                                        <p className="text-madiba-red text-sm font-medium">{module.software}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Features */}
                                    <div className="flex flex-wrap gap-2 mb-8">
                                        {formationBIMFeatures.map((feature, index) => (
                                            <span key={index} className="bg-gray-100 dark:bg-white/10 text-madiba-black dark:text-gray-300 px-3 py-1.5 rounded-full text-xs font-medium">
                                                ✓ {feature}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Pricing */}
                                    <div className="bg-gradient-to-r from-madiba-red/10 to-red-50 dark:from-madiba-red/30 dark:to-madiba-red/10 rounded-2xl p-6 mb-6 border border-madiba-red/20">
                                        <div className="flex flex-wrap justify-between items-end gap-4">
                                            <div>
                                                <p className="text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider mb-1">Durée</p>
                                                <p className="text-madiba-black dark:text-white text-2xl font-bold">{formatDuration(featuredFormation)}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider mb-1">Coût total</p>
                                                <p className="text-madiba-red text-4xl md:text-5xl font-black">{formatPrice(featuredFormation.price)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider mb-1">Places</p>
                                                <p className="text-madiba-black dark:text-gray-300 text-lg">{featuredFormation.max_students} max</p>
                                            </div>
                                        </div>
                                    </div>

                                    <Link
                                        href={`/training/inscription?formation=${featuredFormation.slug}`}
                                        className="inline-flex items-center justify-center gap-2 bg-madiba-red hover:bg-red-600 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 w-full md:w-auto shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                                    >
                                        S&apos;inscrire maintenant
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </Link>
                                </div>

                                {/* Visual */}
                                <div className="bg-gradient-to-br from-gray-100 to-white dark:from-madiba-red/20 dark:to-gray-900 p-8 md:p-12 lg:p-16 flex flex-col items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-8xl md:text-9xl font-black text-gray-200 dark:text-white/10 mb-6">BIM</div>
                                        {/* Software icons */}
                                        <div className="grid grid-cols-3 gap-4 mb-6">
                                            <div className="bg-gray-100 dark:bg-white/10 rounded-xl p-4 text-center">
                                                <p className="text-madiba-black dark:text-white font-bold text-sm">ArchiCAD</p>
                                            </div>
                                            <div className="bg-gray-100 dark:bg-white/10 rounded-xl p-4 text-center">
                                                <p className="text-madiba-black dark:text-white font-bold text-sm">SketchUp</p>
                                            </div>
                                            <div className="bg-gray-100 dark:bg-white/10 rounded-xl p-4 text-center">
                                                <p className="text-madiba-black dark:text-white font-bold text-sm">Robot</p>
                                            </div>
                                            <div className="bg-gray-100 dark:bg-white/10 rounded-xl p-4 text-center">
                                                <p className="text-madiba-black dark:text-white font-bold text-sm">Enscape</p>
                                            </div>
                                            <div className="bg-gray-100 dark:bg-white/10 rounded-xl p-4 text-center">
                                                <p className="text-madiba-black dark:text-white font-bold text-sm">Lumion</p>
                                            </div>
                                            <div className="bg-gray-100 dark:bg-white/10 rounded-xl p-4 text-center">
                                                <p className="text-madiba-black dark:text-white font-bold text-sm">Twinmotion</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Other Formations (Rendu 3D) Section */}
            {!loading && !error && otherFormations.length > 0 && (
                <section id="rendu3d" className="py-16 lg:py-24 bg-gray-50 dark:bg-gray-900/50">
                    <div className="container mx-auto px-6 md:px-12">
                        <div className="text-center mb-12">
                            <span className="inline-block bg-madiba-red text-white px-5 py-2 rounded-full text-sm font-bold mb-4">
                                🗓 Prochainement • Places limitées
                            </span>
                            <h2 className="text-3xl md:text-4xl font-bold text-madiba-black dark:text-white mb-4">
                                Formation en Rendu d&apos;Intérieur
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                                Pour architectes d&apos;intérieur, designers 3D et artistes numériques.
                            </p>
                        </div>

                        {/* Pré-requis */}
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 mb-10 max-w-2xl mx-auto">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">💻</span>
                                <div>
                                    <p className="font-bold text-amber-800 dark:text-amber-200 text-sm">Pré-requis matériel</p>
                                    <p className="text-amber-700 dark:text-amber-300 text-sm">{contactInfo.prerequis}</p>
                                </div>
                            </div>
                        </div>

                        {/* Cards Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                            {otherFormations.map((formation) => (
                                <div
                                    key={formation.id}
                                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 group hover:-translate-y-1"
                                >
                                    {/* Header */}
                                    <div className="bg-gradient-to-r from-madiba-red to-red-600 p-5 text-white">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="bg-white text-madiba-red px-3 py-1 rounded-full text-xs font-bold">
                                                {formatNextSessionDate(formation.next_sessions)}
                                            </span>
                                            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
                                                {formation.max_students} places
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold">{formation.title}</h3>
                                        <p className="text-white/90 text-sm mt-1">{formatDuration(formation)}</p>
                                    </div>

                                    <div className="p-5">
                                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 min-h-[40px]">
                                            {formation.description}
                                        </p>

                                        {/* Level badge */}
                                        {formation.level && (
                                            <div className="mb-4">
                                                <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-medium">
                                                    Niveau: {formation.level}
                                                </span>
                                            </div>
                                        )}

                                        {/* Formateur */}
                                        {formation.formateur && (
                                            <div className="mb-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                <span>Par {formation.formateur.name}</span>
                                            </div>
                                        )}

                                        {/* Price */}
                                        <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                                            <div className="flex justify-between items-end mb-4">
                                                <div>
                                                    <p className="text-3xl font-black text-madiba-red">{formatPrice(formation.price)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-500">Catégorie</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">{formation.category || 'Rendu 3D'}</p>
                                                </div>
                                            </div>
                                            <Link
                                                href={`/training/inscription?formation=${formation.slug}`}
                                                className="block text-center bg-madiba-red hover:bg-red-700 text-white py-3 rounded-xl font-bold transition-all duration-300"
                                            >
                                                S&apos;inscrire
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Methodology Section */}
            <section className="py-16 bg-white dark:bg-madiba-black">
                <div className="container mx-auto px-6 md:px-12">
                    <div className="text-center mb-16">
                        <span className="text-madiba-red font-semibold text-sm uppercase tracking-wider">Notre Approche</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-madiba-black dark:text-white mt-2 mb-4">
                            Une pédagogie orientée terrain
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Nous ne formons pas seulement aux logiciels. Nous formons aux métiers de la construction.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">🏗️</div>
                            <h3 className="font-bold text-lg text-madiba-black dark:text-white mb-2">100% Pratique</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Ateliers concrets basés sur des projets réels du cabinet.</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">👷</div>
                            <h3 className="font-bold text-lg text-madiba-black dark:text-white mb-2">Immersion Chantier</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Visites de chantiers en cours pour lier la théorie à la pratique.</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">💻</div>
                            <h3 className="font-bold text-lg text-madiba-black dark:text-white mb-2">Logiciels de Pointe</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Apprentissage sur les dernières versions des logiciels BIM.</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">🎓</div>
                            <h3 className="font-bold text-lg text-madiba-black dark:text-white mb-2">Suivi Personnalisé</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Petits groupes de 10 personnes pour un accompagnement sur mesure.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 lg:py-20">
                <div className="container mx-auto px-6 md:px-12">
                    <div className="bg-gradient-to-br from-madiba-red to-red-700 rounded-3xl p-10 md:p-16 text-white shadow-2xl">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-bold mb-3">
                                    Prêt à vous former ?
                                </h2>
                                {/* Réassurance */}
                                <div className="flex flex-wrap gap-2 mb-6">
                                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm">✓ Certificat reconnu</span>
                                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm">✓ Formateurs experts</span>
                                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm">✓ Places limitées</span>
                                </div>
                                <p className="text-white/90 mb-8 text-lg">
                                    Inscriptions ouvertes · Places limitées
                                </p>
                                <div className="space-y-3">
                                    <a href={`mailto:${contactInfo.email}`} className="flex items-center gap-3 text-white hover:text-white/80 transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        <span className="font-medium">{contactInfo.email}</span>
                                    </a>
                                    {contactInfo.phones.map((phone, index) => (
                                        <a key={index} href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-center gap-3 text-white hover:text-white/80 transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            <span className="font-medium">{phone}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-center">
                                <div className="bg-white/10 backdrop-blur rounded-3xl p-10 text-center border border-white/20">
                                    <p className="text-7xl md:text-8xl font-black text-white mb-2">10</p>
                                    <p className="text-xl font-medium mb-2">places par session</p>
                                    <p className="text-white/70 text-sm">Inscrivez-vous vite !</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Legal Note */}
            <section className="pb-8">
                <div className="container mx-auto px-6 md:px-12">
                    <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-4">
                        <Link
                            href="/connexion"
                            className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-madiba-red hover:text-white text-madiba-black dark:text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Accéder à mon espace apprenant
                        </Link>
                    </div>
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                        En vous inscrivant, vous acceptez nos{' '}
                        <Link href="/cgv" className="text-madiba-red hover:underline font-medium">
                            Conditions Générales de Vente
                        </Link>{' '}
                        applicables aux formations.
                    </p>
                </div>
            </section>
        </div>
    );
}
