'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getApprenantFormations } from '@/lib/api';

type EnrollmentStatus = 'confirmed' | 'completed' | 'pending_payment' | 'cancelled' | string;

interface LearnerFormation {
  id: number;
  status: EnrollmentStatus;
  progression?: number | null;
  created_at?: string;
  enrolled_at?: string | null;
  paid_at?: string | null;
  metadata?: Record<string, unknown> | null;
  formation?: {
    title?: string;
    description?: string;
    price?: number | string | null;
    inscription_fee?: number | string | null;
  } | null;
  session?: {
    name?: string;
    location?: string;
    start_date?: string | null;
    end_date?: string | null;
  } | null;
}

function extractFormations(payload: unknown): LearnerFormation[] {
  if (Array.isArray(payload)) {
    return payload as LearnerFormation[];
  }

  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown[] }).data)) {
    return (payload as { data: LearnerFormation[] }).data;
  }

  return [];
}

function resolvePrimaryFormation(formations: LearnerFormation[]): LearnerFormation | null {
  return (
    formations.find((formation) => formation.status === 'confirmed') ||
    formations.find((formation) => formation.status === 'completed') ||
    formations.find((formation) => formation.status === 'pending_payment') ||
    formations.find((formation) => formation.status === 'cancelled') ||
    formations[0] ||
    null
  );
}

function resolveStatusMeta(status?: EnrollmentStatus) {
  switch (status) {
    case 'completed':
      return {
        badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        label: 'Formation terminée',
        note: 'Votre parcours est terminé. Vous pouvez retrouver vos paiements et vos reçus ci-dessous.',
      };
    case 'pending_payment':
      return {
        badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
        label: 'Paiement en attente',
        note: 'Votre demande a bien été créée. Finalisez le paiement pour valider définitivement l’inscription.',
      };
    case 'cancelled':
      return {
        badgeClass: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
        label: 'Demande annulée',
        note: 'Cette demande a expiré. Elle reste visible dans votre historique, mais elle n’est plus active.',
      };
    case 'confirmed':
    default:
      return {
        badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        label: 'Inscription validée',
        note: 'Votre inscription est validée et la formation est bien rattachée à votre espace apprenant.',
      };
  }
}

function formatDate(value?: string | null): string {
  if (!value) {
    return 'À définir';
  }

  if (value.includes('/')) {
    return value;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('fr-FR');
}

function formatPrice(amount?: number | string | null): string {
  const parsed = typeof amount === 'string' ? Number(amount) : amount ?? 0;
  const safeAmount = Number.isFinite(parsed) ? parsed : 0;

  return new Intl.NumberFormat('fr-FR').format(safeAmount) + ' FCFA';
}

function resolveProgress(formation: LearnerFormation | null): number {
  if (!formation) {
    return 0;
  }

  if (formation.status === 'completed') {
    return 100;
  }

  const progression = Number(formation.progression ?? 0);

  if (Number.isFinite(progression) && progression > 0) {
    return progression;
  }

  return formation.status === 'confirmed' ? 5 : 0;
}

function resolvePaymentUrl(formation: LearnerFormation | null): string | null {
  if (!formation?.metadata || typeof formation.metadata !== 'object') {
    return null;
  }

  const paymentReference = formation.metadata.payment_reference;

  if (typeof paymentReference !== 'string' || paymentReference.trim() === '') {
    return null;
  }

  return `/paiement/link/${paymentReference}`;
}

export default function FormationsPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'current' | 'available'>('current');
  const [formations, setFormations] = useState<LearnerFormation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchFormations();
    }
  }, [token]);

  const fetchFormations = async () => {
    try {
      const response = await getApprenantFormations();

      if (response.success) {
        setFormations(extractFormations(response.data));
        setError(null);
      } else {
        setFormations([]);
        setError(response.message || 'Erreur lors du chargement des formations');
      }
    } catch (err) {
      console.error('Error fetching formations:', err);
      setError('Erreur lors du chargement des formations');
      setFormations([]);
    } finally {
      setLoading(false);
    }
  };

  const currentFormation = resolvePrimaryFormation(formations);
  const progress = resolveProgress(currentFormation);
  const statusMeta = resolveStatusMeta(currentFormation?.status);
  const paymentUrl = resolvePaymentUrl(currentFormation);
  const showProgress = currentFormation
    ? currentFormation.status === 'confirmed' || currentFormation.status === 'completed'
    : false;
  const startLabel = currentFormation?.status === 'pending_payment' || currentFormation?.status === 'cancelled'
    ? 'Demande'
    : 'Début';
  const startValue = currentFormation?.session?.start_date || currentFormation?.enrolled_at || currentFormation?.created_at;
  const endValue = currentFormation?.session?.end_date;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-madiba-red"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-madiba-black dark:text-white">Mes Formations</h1>
        <p className="text-gray-600 dark:text-gray-400">Gérez vos formations et inscrivez-vous à de nouvelles sessions</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('current')}
          className={`px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${activeTab === 'current'
            ? 'text-madiba-red border-madiba-red'
            : 'text-gray-500 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
            }`}
        >
          Formation en cours
        </button>
        <button
          onClick={() => setActiveTab('available')}
          className={`px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${activeTab === 'available'
            ? 'text-madiba-red border-madiba-red'
            : 'text-gray-500 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
            }`}
        >
          Formations disponibles
        </button>
      </div>

      {/* Current Formation Tab */}
      {activeTab === 'current' && (
        <div className="space-y-6">
          {currentFormation ? (
            <>
              {/* Formation Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mb-2 ${statusMeta.badgeClass}`}>
                        {statusMeta.label}
                      </span>
                      <h2 className="text-xl font-bold text-madiba-black dark:text-white">{currentFormation.formation?.title || 'Formation'}</h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        {currentFormation.formation?.description || statusMeta.note}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Session</p>
                      <p className="text-lg font-semibold text-madiba-black dark:text-white">
                        {currentFormation.session?.name || 'À définir'}
                      </p>
                    </div>
                  </div>
                </div>

                {showProgress ? (
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Progression estimée</p>
                      <p className="text-2xl font-bold text-madiba-red">{progress}%</p>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-madiba-red rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <span>{startLabel}: {formatDate(startValue)}</span>
                      <span>Fin: {formatDate(endValue)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
                    <p className="text-sm text-gray-600 dark:text-gray-300">{statusMeta.note}</p>
                    <div className="flex justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <span>{startLabel}: {formatDate(startValue)}</span>
                      <span>Fin: {formatDate(endValue)}</span>
                    </div>
                  </div>
                )}

                {/* Details */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422A12.083 12.083 0 0118 20.055M12 14l-6.16-3.422A12.083 12.083 0 006 20.055" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Formation</p>
                      <p className="font-medium text-madiba-black dark:text-white">{currentFormation.formation?.title || 'Formation'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Statut</p>
                      <p className="font-medium text-madiba-black dark:text-white">{statusMeta.label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 12.414A8 8 0 1117.657 16.657z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Lieu</p>
                      <p className="font-medium text-madiba-black dark:text-white">{currentFormation.session?.location || 'À définir'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-3.314 0-6 1.79-6 4s2.686 4 6 4 6-1.79 6-4-2.686-4-6-4z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12h.01M16 19H8a2 2 0 01-2-2V7a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Montant</p>
                      <p className="font-medium text-madiba-black dark:text-white">{formatPrice(currentFormation.formation?.price)}</p>
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-6 flex flex-wrap gap-3">
                  <Link
                    href="/apprenant/paiements"
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    Voir mes paiements
                  </Link>

                  {paymentUrl && currentFormation.status === 'pending_payment' && (
                    <Link
                      href={paymentUrl}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-madiba-red text-white hover:bg-red-700 transition-colors"
                    >
                      Reprendre le paiement
                    </Link>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
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
      )}

      {/* Available Formations Tab */}
      {activeTab === 'available' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Formations disponibles
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Consultez nos formations disponibles sur la page principale
          </p>
          <Link
            href="/training"
            className="inline-block px-6 py-2 bg-madiba-red text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Voir les formations
          </Link>
        </div>
      )}
    </div>
  );
}
