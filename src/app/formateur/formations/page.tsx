'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { tokenStorage } from '@/lib/api';
import Link from 'next/link';
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
  BookOpen
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Formation {
  id: number;
  title: string;
  slug: string;
  description: string;
  duration_hours: number;
  duration_days: number;
  level: 'debutant' | 'intermediaire' | 'avance';
  price: number;
  category: string;
  max_students: number;
  is_active: boolean;
  is_featured: boolean;
  active_sessions_count: number;
  created_at: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const levelConfig: Record<string, { label: string; color: string }> = {
  debutant: { label: 'Débutant', color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400' },
  intermediaire: { label: 'Intermédiaire', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400' },
  avance: { label: 'Avancé', color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400' },
};

export default function FormateurFormationsPage() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showActions, setShowActions] = useState<number | null>(null);

  const fetchFormations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = tokenStorage.getToken();
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`${API_URL}/formateur/formations?${params}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'Accept': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Erreur lors du chargement');

      const data = await response.json();
      if (data.success) {
        setFormations(data.data.data || []);
        setPagination({
          current_page: data.data.current_page,
          last_page: data.data.last_page,
          per_page: data.data.per_page,
          total: data.data.total,
        });
      }
    } catch (err) {
      setError('Impossible de charger les formations');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchFormations();
  }, [fetchFormations]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  if (isLoading && formations.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mes formations</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {pagination?.total || 0} formation{(pagination?.total || 0) > 1 ? 's' : ''} à gérer
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchFormations}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <Link
            href="/formateur/formations/nouvelle"
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Créer une formation
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une formation..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Grid */}
      {formations.length === 0 && !isLoading ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <GraduationCap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucune formation</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Vous n'avez pas encore de formation assignée ou créée.
          </p>
          <Link
            href="/formateur/formations/nouvelle"
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Créer une formation
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formations.map((formation) => (
            <div
              key={formation.id}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow ${!formation.is_active ? 'opacity-60' : ''}`}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelConfig[formation.level]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {levelConfig[formation.level]?.label || formation.level}
                      </span>
                      {!formation.is_active && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-full text-xs">
                          Inactive
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formation.title}
                    </h3>
                    {formation.category && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{formation.category}</p>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setShowActions(showActions === formation.id ? null : formation.id)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-500" />
                    </button>
                    {showActions === formation.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                        <Link
                          href={`/formateur/formations/${formation.id}`}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <Eye className="h-4 w-4 mr-2" /> Voir détails
                        </Link>
                        <Link
                          href={`/formateur/formations/${formation.id}/edit`}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <Edit className="h-4 w-4 mr-2" /> Modifier
                        </Link>
                        <Link
                          href={`/formateur/formations/${formation.id}/sessions`}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <BookOpen className="h-4 w-4 mr-2" /> Gérer sessions
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {formation.description}
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Clock className="h-4 w-4 mr-2" />
                    {formation.duration_days ? `${formation.duration_days} jours` : `${formation.duration_hours}h`}
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Users className="h-4 w-4 mr-2" />
                    Max {formation.max_students}
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formation.active_sessions_count} session(s)
                  </div>
                  <div className="flex items-center font-semibold text-madiba-red">
                    {formatCurrency(formation.price)}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href={`/formateur/formations/${formation.id}/sessions`}
                  className="text-sm text-madiba-red hover:underline font-medium"
                >
                  Gérer les sessions →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.last_page > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} sur {pagination.last_page}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(pagination.last_page, p + 1))}
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
