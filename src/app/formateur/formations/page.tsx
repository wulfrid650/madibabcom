'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  Eye,
  Users,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  RefreshCw,
  BookOpen,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from 'lucide-react';
import { api, type Formation } from '@/lib/api';

type StatusFilter = 'all' | '1' | '0';

const levelConfig: Record<string, { label: string; color: string }> = {
  debutant: { label: 'Débutant', color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400' },
  intermediaire: { label: 'Intermédiaire', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400' },
  avance: { label: 'Avancé', color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400' },
};

function formatCurrency(amount?: number | string | null): string {
  const value = typeof amount === 'string' ? Number(amount) : amount ?? 0;
  const safeValue = Number.isFinite(value) ? value : 0;

  return `${new Intl.NumberFormat('fr-FR').format(safeValue)} FCFA`;
}

function formatShortDate(value?: string): string {
  if (!value) {
    return 'Non défini';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('fr-FR');
}

export default function FormateurFormationsPage() {
  const router = useRouter();
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<{ current_page: number; last_page: number; per_page: number; total: number } | null>(null);
  const [showActions, setShowActions] = useState<number | null>(null);

  const fetchFormations = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, meta } = await api.getFormateurFormations(
        currentPage,
        searchTerm,
        selectedLevel,
        selectedStatus === 'all' ? '' : selectedStatus,
      );

      setFormations(data);
      setPagination(meta);
    } catch (fetchError) {
      console.error('Erreur chargement formations formateur:', fetchError);
      setError('Impossible de charger vos formations.');
      setFormations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchFormations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, selectedLevel, selectedStatus]);

  const toggleStatus = async (formation: Formation) => {
    try {
      await api.toggleFormateurFormationStatus(formation.id);
      await fetchFormations();
    } catch (toggleError) {
      console.error('Erreur changement statut formation:', toggleError);
      setError('Impossible de modifier le statut de la formation.');
    }
  };

  const deleteFormation = async (formation: Formation) => {
    const confirmed = window.confirm(`Supprimer la formation "${formation.title}" ?`);
    if (!confirmed) {
      return;
    }

    try {
      await api.deleteFormateurFormation(formation.id);
      await fetchFormations();
    } catch (deleteError) {
      console.error('Erreur suppression formation:', deleteError);
      setError('Impossible de supprimer cette formation.');
    }
  };

  const totalActive = formations.filter((formation) => formation.is_active).length;
  const totalInactive = formations.length - totalActive;
  const totalFeatured = formations.filter((formation) => formation.is_featured).length;

  if (loading && formations.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((index) => (
            <div key={index} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total formations</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{pagination?.total || 0}</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Actives</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{totalActive}</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Inactives</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{totalInactive}</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Mises en avant</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{totalFeatured}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mes formations</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gérez vos contenus, vos sessions et la visibilité de vos formations.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={fetchFormations}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <Link
            href="/formateur/formations/nouvelle"
            className="inline-flex items-center px-4 py-2 bg-madiba-red text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle formation
          </Link>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une formation..."
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <select
          value={selectedLevel}
          onChange={(event) => {
            setSelectedLevel(event.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">Tous les niveaux</option>
          <option value="debutant">Débutant</option>
          <option value="intermediaire">Intermédiaire</option>
          <option value="avance">Avancé</option>
        </select>
        <select
          value={selectedStatus}
          onChange={(event) => {
            setSelectedStatus(event.target.value as StatusFilter);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">Tous les statuts</option>
          <option value="1">Actives</option>
          <option value="0">Inactives</option>
        </select>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {formations.length === 0 && !loading ? (
        <div className="text-center py-14 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <GraduationCap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucune formation trouvée</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Créez votre première formation pour commencer à publier vos sessions.
          </p>
          <Link
            href="/formateur/formations/nouvelle"
            className="inline-flex items-center px-4 py-2 bg-madiba-red text-white rounded-lg text-sm font-medium hover:bg-red-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Créer une formation
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {formations.map((formation) => (
            <div
              key={formation.id}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-shadow hover:shadow-md ${!formation.is_active ? 'opacity-75' : ''}`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelConfig[formation.level]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {levelConfig[formation.level]?.label || formation.level}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${formation.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'}`}>
                        {formation.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {formation.is_featured && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          Mise en avant
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{formation.title}</h3>
                    {formation.category && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{formation.category}</p>
                    )}
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowActions(showActions === formation.id ? null : formation.id)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-500" />
                    </button>

                    {showActions === formation.id && (
                      <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 overflow-hidden">
                        <Link
                          href={`/formateur/formations/${formation.id}`}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir détails
                        </Link>
                        <Link
                          href={`/formateur/formations/${formation.id}/edit`}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </Link>
                        <Link
                          href={`/formateur/formations/${formation.id}/sessions`}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          Sessions
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setShowActions(null);
                            void toggleStatus(formation);
                          }}
                          className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          {formation.is_active ? <ToggleLeft className="h-4 w-4 mr-2" /> : <ToggleRight className="h-4 w-4 mr-2" />}
                          {formation.is_active ? 'Désactiver' : 'Activer'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowActions(null);
                            void deleteFormation(formation);
                          }}
                          className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {formation.description}
                </p>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Clock className="h-4 w-4 mr-2" />
                    {formation.duration_days ? `${formation.duration_days} jours` : `${formation.duration_hours || 0}h`}
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Users className="h-4 w-4 mr-2" />
                    Max {formation.max_students || 0}
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formation.active_sessions_count || 0} session(s)
                  </div>
                  <div className="flex items-center font-semibold text-madiba-red">
                    {formatCurrency(formation.price)}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Créée le {formatShortDate(formation.created_at)}
                </span>
                <Link
                  href={`/formateur/formations/${formation.id}/sessions`}
                  className="text-sm text-madiba-red hover:underline font-medium"
                >
                  Gérer les sessions
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination && pagination.last_page > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            type="button"
            onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
            disabled={currentPage === 1}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} sur {pagination.last_page}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((value) => Math.min(pagination.last_page, value + 1))}
            disabled={currentPage === pagination.last_page}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
