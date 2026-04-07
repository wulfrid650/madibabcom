'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface DashboardData {
  stats: {
    totalClients: number;
    projetsEnCours: number;
    apprenants: number;
    paiementsEnAttente: number;
    recusAujourdhui: number;
  };
  paiementsRecents: {
    id: string;
    nom: string;
    formation: string;
    montant: string;
    type: string;
    date: string;
    status: string;
  }[];
  activitesRecentes: {
    id: number;
    action: string;
    detail: string;
    time: string;
    icon: string;
    color: string;
  }[];
}

export default function SecretaireDashboardPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/connexion?redirect=/secretaire/dashboard');
      return;
    }
    
    if (token) {
      fetchDashboard();
    }
  }, [user, token, authLoading]);

  const fetchDashboard = async () => {
    try {
      const response = await fetch(`${API_URL}/secretaire/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          router.push('/connexion?error=unauthorized');
          return;
        }
        throw new Error('Erreur lors du chargement des données');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Données par défaut
  const stats = data?.stats || {
    totalClients: 0,
    projetsEnCours: 0,
    apprenants: 0,
    paiementsEnAttente: 0,
    recusAujourdhui: 0,
  };

  const paiementsRecents = data?.paiementsRecents || [];
  const activitesRecentes = data?.activitesRecentes || [];

  const getIconPath = (icon: string) => {
    switch (icon) {
      case 'user-plus':
        return 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z';
      case 'check':
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'building':
        return 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4';
      case 'receipt':
        return 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z';
      default:
        return '';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button 
          onClick={fetchDashboard}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-sm p-6 text-white">
        <h1 className="text-2xl font-bold">
          Bonjour, {user?.name?.split(' ')[0] || 'Secrétaire'} 👋
        </h1>
        <p className="mt-1 text-purple-100">
          Bienvenue dans votre espace de gestion MBC
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Clients */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalClients}</span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Clients enregistrés</p>
        </div>

        {/* Projets en cours */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.projetsEnCours}</span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Projets en cours</p>
        </div>

        {/* Apprenants */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.apprenants}</span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Apprenants inscrits</p>
        </div>

        {/* Paiements en attente */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.paiementsEnAttente}</span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Paiements en attente</p>
        </div>

        {/* Reçus aujourd'hui */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.recusAujourdhui}</span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Reçus aujourd&apos;hui</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Paiements en attente */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Paiements en attente de validation
            </h2>
            <Link
              href="/secretaire/paiements"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Voir tout →
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="pb-3">Apprenant</th>
                  <th className="pb-3">Formation</th>
                  <th className="pb-3">Montant</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paiementsRecents.map((paiement) => (
                  <tr key={paiement.id}>
                    <td className="py-3">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-medium text-sm">
                          {paiement.nom.charAt(0)}
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                          {paiement.nom}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                      {paiement.formation}
                    </td>
                    <td className="py-3 text-sm font-semibold text-gray-900 dark:text-white">
                      {paiement.montant}
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        paiement.type === 'Total' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {paiement.type}
                      </span>
                    </td>
                    <td className="py-3">
                      <Link
                        href={`/secretaire/paiements?id=${paiement.id}`}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                      >
                        Valider
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activités récentes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Activités récentes
          </h2>
          <div className="space-y-4">
            {activitesRecentes.map((activite) => (
              <div key={activite.id} className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  activite.color === 'green' ? 'bg-green-100 dark:bg-green-900/30' :
                  activite.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
                  activite.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30' :
                  'bg-amber-100 dark:bg-amber-900/30'
                }`}>
                  <svg className={`w-4 h-4 ${
                    activite.color === 'green' ? 'text-green-600 dark:text-green-400' :
                    activite.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                    activite.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                    'text-amber-600 dark:text-amber-400'
                  }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getIconPath(activite.icon)} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activite.action}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {activite.detail}
                  </p>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                  {activite.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Actions rapides
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Link
            href="/secretaire/registre?action=nouveau"
            className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg mb-2">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">Nouveau Client</span>
          </Link>

          <Link
            href="/secretaire/apprenants?action=nouveau"
            className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg mb-2">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">Nouvel Apprenant</span>
          </Link>

          <Link
            href="/secretaire/paiements"
            className="flex flex-col items-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
          >
            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg mb-2">
              <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">Valider Paiement</span>
          </Link>

          <Link
            href="/secretaire/recus?action=nouveau"
            className="flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg mb-2">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">Imprimer Reçu</span>
          </Link>

          <Link
            href="/secretaire/projets"
            className="flex flex-col items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg mb-2">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">Voir Projets</span>
          </Link>

          <Link
            href="/secretaire/registre"
            className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="p-2 bg-gray-100 dark:bg-gray-600 rounded-lg mb-2">
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">Rechercher</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
