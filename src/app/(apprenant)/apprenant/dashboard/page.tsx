'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface DashboardData {
  user: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  stats: {
    formations_actives: number;
    formations_completed: number;
    total_paid: number;
    remaining_to_pay: number;
    certificates_available: number;
  };
  current_formation?: {
    id: number;
    title: string;
    status: string;
    status_label: string;
    progress: number;
    start_date: string;
    end_date?: string;
    session?: {
      id?: number;
      name: string;
      location: string;
      start_date?: string;
      end_date?: string;
    };
    next_session?: {
      date: string;
      time: string;
    };
  };
  pending_request?: {
    id: number;
    title: string;
    status: 'pending_payment' | 'cancelled';
    status_label: string;
    expires_at: string;
    remaining_seconds: number;
    payment_reference?: string | null;
    payment_url?: string | null;
    amount: number;
    error?: string | null;
  };
  recent_activities: {
    id: number;
    type: 'session' | 'payment' | 'document' | 'enrollment';
    title: string;
    date: string;
    status: 'completed' | 'pending' | 'new';
  }[];
  payment_history: Array<{
    id: number;
    reference: string;
    label: string;
    amount: number;
    status: string;
    status_label: string;
    method: string;
    created_at?: string;
    validated_at?: string;
    receipt_available: boolean;
  }>;
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}

function formatCountdown(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, '0'))
    .join(':');
}

function formatDateTime(value?: string): string {
  if (!value) return 'Non défini';
  return new Date(value).toLocaleString('fr-FR');
}

export default function DashboardPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/apprenant/dashboard');
      return;
    }
    
    if (token) {
      fetchDashboard();
    }
  }, [user, token, authLoading]);

  const fetchDashboard = async () => {
    try {
      const response = await fetch(`${API_URL}/apprenant/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          router.push('/login?redirect=/apprenant/dashboard');
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

  useEffect(() => {
    const pendingRequest = data?.pending_request;

    if (!pendingRequest || pendingRequest.status !== 'pending_payment') {
      setRemainingSeconds(0);
      return;
    }

    setRemainingSeconds(pendingRequest.remaining_seconds);

    const timer = window.setInterval(() => {
      setRemainingSeconds((previous) => {
        if (previous <= 1) {
          window.clearInterval(timer);
          fetchDashboard();
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [data?.pending_request?.id, data?.pending_request?.status, data?.pending_request?.remaining_seconds]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-madiba-red"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button 
          onClick={fetchDashboard}
          className="mt-4 px-4 py-2 bg-madiba-red text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  // Données par défaut si pas encore chargées
  const userData = data?.user || { name: user?.name || 'Utilisateur', email: user?.email || '' };
  const stats = [
    { label: 'Formations actives', value: data?.stats?.formations_actives?.toString() || '0', icon: 'chart', color: 'bg-blue-500' },
    { label: 'Terminées', value: data?.stats?.formations_completed?.toString() || '0', icon: 'calendar', color: 'bg-green-500' },
    { label: 'Total payé', value: data?.stats?.total_paid ? formatPrice(data.stats.total_paid) : '0 FCFA', icon: 'credit-card', color: 'bg-yellow-500' },
    { label: 'Certificats', value: data?.stats?.certificates_available?.toString() || '0', icon: 'award', color: 'bg-purple-500' },
  ];
  const currentFormation = data?.current_formation;
  const pendingRequest = data?.pending_request;
  const recentActivities = data?.recent_activities || [];
  const paymentHistory = data?.payment_history || [];
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-madiba-red to-red-700 rounded-2xl p-6 md:p-8 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Bonjour, {userData.name.split(' ')[0]} 👋
        </h1>
        <p className="text-red-100 mb-4">
          Bienvenue dans votre espace apprenant MBC
        </p>
        {currentFormation ? (
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="bg-white/20 rounded-lg px-4 py-2">
              <span className="block text-red-200">Formation en cours</span>
              <span className="font-semibold">{currentFormation.title}</span>
            </div>
            <div className="bg-white/20 rounded-lg px-4 py-2">
              <span className="block text-red-200">Statut</span>
              <span className="font-semibold">{currentFormation.status_label}</span>
            </div>
            {currentFormation.next_session && (
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <span className="block text-red-200">Prochaine session</span>
                <span className="font-semibold">{currentFormation.next_session.date} - {currentFormation.next_session.time}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-red-200 text-sm">Aucune formation en cours</p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {stat.icon === 'chart' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />}
                {stat.icon === 'calendar' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
                {stat.icon === 'credit-card' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />}
                {stat.icon === 'award' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />}
              </svg>
            </div>
            <p className="text-2xl font-bold text-madiba-black dark:text-white">{stat.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {pendingRequest && (
        <div className={`rounded-2xl border p-6 ${
          pendingRequest.status === 'pending_payment'
            ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
            : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
        }`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  pendingRequest.status === 'pending_payment'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                }`}>
                  {pendingRequest.status_label}
                </span>
                {pendingRequest.payment_reference && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Réf. {pendingRequest.payment_reference}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-madiba-black dark:text-white">
                {pendingRequest.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {pendingRequest.status === 'pending_payment'
                  ? `Votre demande reste en attente jusqu'au ${formatDateTime(pendingRequest.expires_at)}.`
                  : `La demande a expiré le ${formatDateTime(pendingRequest.expires_at)} et reste visible pour suivi.`}
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                Frais d&apos;inscription: {formatPrice(pendingRequest.amount)}
              </p>
              {pendingRequest.error && pendingRequest.status === 'pending_payment' && (
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Dernier retour paiement: {pendingRequest.error}
                </p>
              )}
            </div>

            <div className="flex flex-col items-start gap-3 md:items-end">
              {pendingRequest.status === 'pending_payment' ? (
                <>
                  <div className="rounded-xl bg-white/80 px-4 py-3 text-center dark:bg-gray-900/40">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Temps restant
                    </p>
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                      {formatCountdown(remainingSeconds)}
                    </p>
                  </div>
                  {pendingRequest.payment_url && (
                    <Link
                      href={pendingRequest.payment_url}
                      className="inline-flex items-center justify-center rounded-lg bg-madiba-red px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                    >
                      Reprendre le paiement
                    </Link>
                  )}
                </>
              ) : (
                <Link
                  href="/training"
                  className="inline-flex items-center justify-center rounded-lg bg-madiba-red px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                >
                  Faire une nouvelle demande
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Progress & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-madiba-black dark:text-white mb-4">Ma Formation</h2>
          
          {currentFormation ? (
            <div className="space-y-4">
              <div>
                <p className="font-medium text-madiba-black dark:text-white mb-2">{currentFormation.title}</p>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Progression globale</span>
                  <span className="font-semibold text-madiba-black dark:text-white">{currentFormation.progress}%</span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-madiba-red rounded-full transition-all duration-500"
                    style={{ width: `${currentFormation.progress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Date début</p>
                  <p className="font-semibold text-madiba-black dark:text-white">{currentFormation.start_date}</p>
                </div>
                {currentFormation.end_date && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Date fin prévue</p>
                    <p className="font-semibold text-madiba-black dark:text-white">{currentFormation.end_date}</p>
                  </div>
                )}
                {currentFormation.session && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Session</p>
                      <p className="font-semibold text-madiba-black dark:text-white">{currentFormation.session.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Lieu</p>
                      <p className="font-semibold text-madiba-black dark:text-white">{currentFormation.session.location}</p>
                    </div>
                  </>
                )}
              </div>

              <Link 
                href="/apprenant/formations"
                className="block text-center py-3 bg-gray-100 dark:bg-gray-700 text-madiba-black dark:text-white font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Voir les détails
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">Vous n&apos;êtes inscrit à aucune formation</p>
              <Link 
                href="/training"
                className="inline-block px-6 py-2 bg-madiba-red text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Découvrir nos formations
              </Link>
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-madiba-black dark:text-white mb-4">Activités récentes</h2>
          
          {recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'session' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                    activity.type === 'payment' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                    activity.type === 'enrollment' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                    'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                }`}>
                  {activity.type === 'session' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  )}
                  {activity.type === 'payment' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  )}
                  {activity.type === 'document' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-madiba-black dark:text-white truncate">{activity.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{activity.date}</p>
                </div>
                {activity.status === 'new' && (
                  <span className="px-2 py-1 text-xs font-semibold bg-madiba-red/10 text-madiba-red rounded-full">
                    Nouveau
                  </span>
                )}
              </div>
            ))}
          </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Aucune activité récente</p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-madiba-black dark:text-white mb-4">Historique des paiements</h2>

        {paymentHistory.length > 0 ? (
          <div className="space-y-3">
            {paymentHistory.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-col gap-3 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold text-madiba-black dark:text-white">{payment.label}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Réf. {payment.reference} • {payment.method}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {payment.validated_at
                      ? `Validé le ${formatDateTime(payment.validated_at)}`
                      : `Créé le ${formatDateTime(payment.created_at)}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    payment.status === 'completed'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      : payment.status === 'pending'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                  }`}>
                    {payment.status_label}
                  </span>
                  <span className="font-semibold text-madiba-black dark:text-white">
                    {formatPrice(payment.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aucun paiement rattaché à cette formation pour le moment.
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-madiba-black dark:text-white mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/apprenant/paiements" className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            <div className="w-12 h-12 bg-madiba-red/10 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-madiba-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-madiba-black dark:text-white text-center">Effectuer un paiement</span>
          </Link>
          
          <Link href="/apprenant/recus" className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-madiba-black dark:text-white text-center">Mes reçus</span>
          </Link>
          
          <Link href="/apprenant/certificats" className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-madiba-black dark:text-white text-center">Certificats</span>
          </Link>
          
          <Link href="/apprenant/formations" className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="text-sm font-medium text-madiba-black dark:text-white text-center">Nouvelle formation</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
