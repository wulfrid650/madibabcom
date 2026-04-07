'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  Edit,
  GraduationCap,
  MapPin,
  Users,
  BadgeCheck,
  ToggleRight,
} from 'lucide-react';
import { api, type Formation, type FormateurFormationSession } from '@/lib/api';

const levelConfig: Record<string, { label: string; color: string }> = {
  debutant: { label: 'Débutant', color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400' },
  intermediaire: { label: 'Intermédiaire', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400' },
  avance: { label: 'Avancé', color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400' },
};

function normalizeList(value?: string[] | string | null): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean).map((item) => item.trim()).filter(Boolean);
  }

  return value
    .split('\n')
    .map((item) => item.replace(/^-+\s*/, '').trim())
    .filter(Boolean);
}

function formatCurrency(amount?: number | string | null): string {
  const value = typeof amount === 'string' ? Number(amount) : amount ?? 0;
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${new Intl.NumberFormat('fr-FR').format(safeValue)} FCFA`;
}

function formatDate(value?: string): string {
  if (!value) {
    return 'Non défini';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('fr-FR');
}

function formatDateTime(value?: string): string {
  if (!value) {
    return 'Non défini';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('fr-FR');
}

export default function FormationDetailsPage() {
  const params = useParams<{ id: string }>();
  const formationId = params?.id;
  const [formation, setFormation] = useState<Formation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFormation = async () => {
      if (!formationId) {
        setError('Identifiant de formation manquant.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await api.getFormateurFormation(formationId);
        setFormation(data);
      } catch (loadError) {
        console.error('Erreur chargement détail formation:', loadError);
        setError('Impossible de charger le détail de la formation.');
      } finally {
        setLoading(false);
      }
    };

    void loadFormation();
  }, [formationId]);

  const objectives = normalizeList(formation?.objectives);
  const prerequisites = normalizeList(formation?.prerequisites);
  const program = normalizeList(formation?.program);
  const sessions = (formation?.sessions as FormateurFormationSession[] | undefined) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[420px]">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-madiba-red" />
      </div>
    );
  }

  if (error || !formation) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
        <p>{error || 'Formation introuvable.'}</p>
        <Link href="/formateur/formations" className="mt-4 inline-flex items-center text-sm font-medium text-madiba-red hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux formations
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="space-y-3">
          <Link href="/formateur/formations" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux formations
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelConfig[formation.level]?.color || 'bg-gray-100 text-gray-800'}`}>
              {levelConfig[formation.level]?.label || formation.level}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${formation.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'}`}>
              {formation.is_active ? 'Active' : 'Inactive'}
            </span>
            {formation.is_featured && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                Formation phare
              </span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{formation.title}</h1>
            <p className="mt-2 max-w-3xl text-gray-600 dark:text-gray-400">{formation.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/formateur/formations/${formation.id}/edit`}
            className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Link>
          <Link
            href={`/formateur/formations/${formation.id}/sessions`}
            className="inline-flex items-center rounded-lg bg-madiba-red px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Gérer les sessions
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Prix</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(formation.price)}</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Durée</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {formation.duration_days ? `${formation.duration_days} jours` : `${formation.duration_hours || 0} h`}
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Places max</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{formation.max_students || 0}</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Sessions</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{sessions.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contenu pédagogique</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">Objectifs</h3>
                {objectives.length > 0 ? (
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    {objectives.map((item) => (
                      <li key={item} className="flex gap-2">
                        <BadgeCheck className="mt-0.5 h-4 w-4 text-emerald-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Aucun objectif renseigné.</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">Prérequis</h3>
                {prerequisites.length > 0 ? (
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    {prerequisites.map((item) => (
                      <li key={item} className="flex gap-2">
                        <ToggleRight className="mt-0.5 h-4 w-4 text-amber-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Aucun prérequis renseigné.</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">Programme</h3>
              {program.length > 0 ? (
                <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  {program.map((item, index) => (
                    <li key={`${item}-${index}`} className="flex gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-200">
                        {index + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">Aucun programme détaillé renseigné.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sessions</h2>
            {sessions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-6 text-center text-gray-500 dark:text-gray-400">
                Aucune session créée pour cette formation.
                <div className="mt-4">
                  <Link href={`/formateur/formations/${formation.id}/sessions`} className="inline-flex items-center rounded-lg bg-madiba-red px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                    <Calendar className="mr-2 h-4 w-4" />
                    Créer une session
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            {session.status}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {session.enrollments_count || 0} inscrit(s)
                          </span>
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatDate(session.start_date)} au {formatDate(session.end_date)}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {session.location || 'Lieu non défini'}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {session.start_time || '--:--'} - {session.end_time || '--:--'}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {session.max_students || 0} places
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Créée le {formatDateTime(session.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informations</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Catégorie</p>
                <p className="font-medium text-gray-900 dark:text-white">{formation.category || 'Non définie'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Créée le</p>
                <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(formation.created_at)}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Statut</p>
                <p className="font-medium text-gray-900 dark:text-white">{formation.is_active ? 'Publiée' : 'En brouillon'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-madiba-red to-red-700 p-6 text-white shadow-sm">
            <h2 className="text-lg font-semibold mb-2">Action rapide</h2>
            <p className="text-sm text-red-100 mb-4">
              Passez directement à la gestion des sessions ou mettez à jour les informations de cette formation.
            </p>
            <div className="space-y-2">
              <Link href={`/formateur/formations/${formation.id}/sessions`} className="block rounded-lg bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/25">
                Gérer les sessions
              </Link>
              <Link href={`/formateur/formations/${formation.id}/edit`} className="block rounded-lg bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/25">
                Modifier la formation
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
