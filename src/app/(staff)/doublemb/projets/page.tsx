'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Plus,
  Download,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  MapPin,
  Calendar,
  Users,
  Building2,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { getPortfolioProjectsAdmin, type PortfolioProjectAdmin } from '@/lib/admin-api';

interface Project {
  id: string;
  title: string;
  slug: string;
  client: {
    id: string;
    name: string;
    company_name?: string;
  };
  chef_chantier?: {
    id: string;
    name: string;
  };
  location: string;
  status: 'planifie' | 'en_cours' | 'en_pause' | 'termine' | 'annule';
  progress: number;
  start_date: string;
  end_date?: string;
  estimated_end_date: string;
  budget: number;
  spent: number;
  team_size: number;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  planifie: {
    label: 'Planifié',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400',
    icon: Calendar
  },
  en_cours: {
    label: 'En cours',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400',
    icon: TrendingUp
  },
  en_pause: {
    label: 'En pause',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400',
    icon: PauseCircle
  },
  termine: {
    label: 'Terminé',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    icon: CheckCircle2
  },
  annule: {
    label: 'Annulé',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400',
    icon: AlertTriangle
  },
};

export default function ProjectsPage() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status') || '';

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(statusFilter);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showActions, setShowActions] = useState<string | null>(null);

  const itemsPerPage = 9;

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getPortfolioProjectsAdmin({ search: searchTerm || undefined, per_page: 200 });
      const source = (response.data || []) as PortfolioProjectAdmin[];

      const mappedProjects: Project[] = source.map((p) => {
        const normalizedStatus = p.status || 'planned';
        const mappedStatus: Project['status'] =
          normalizedStatus === 'in_progress' ? 'en_cours'
            : normalizedStatus === 'on_hold' ? 'en_pause'
              : normalizedStatus === 'completed' ? 'termine'
                : normalizedStatus === 'cancelled' ? 'annule'
                  : 'planifie';
        const assignedPeopleCount =
          typeof p.assigned_people_count === 'number'
            ? p.assigned_people_count
            : Array.isArray(p.team_ids) ? p.team_ids.length : 0;

        return {
          id: String(p.id),
          title: p.title,
          slug: p.slug,
          client: {
            id: p.client_id ? String(p.client_id) : '',
            name: p.client_name || p.client || 'Client non lié',
            company_name: p.client_name || p.client || undefined,
          },
          chef_chantier: p.chef_chantier_id
            ? { id: String(p.chef_chantier_id), name: p.chef_chantier_name || `Chef #${p.chef_chantier_id}` }
            : undefined,
          location: p.location || 'Localisation non définie',
          status: mappedStatus,
          progress: Number(p.progress ?? 0),
          start_date: p.start_date || p.created_at,
          end_date: p.completion_date || undefined,
          estimated_end_date: p.expected_end_date || p.completion_date || p.created_at,
          budget: Number(p.budget || 0),
          spent: 0,
          team_size: assignedPeopleCount,
          created_at: p.created_at,
        };
      });

      let filteredProjects = mappedProjects;

      if (selectedStatus) {
        filteredProjects = filteredProjects.filter(p => p.status === selectedStatus);
      }

      if (searchTerm && !response.success) {
        const term = searchTerm.toLowerCase();
        filteredProjects = filteredProjects.filter(p =>
          p.title.toLowerCase().includes(term) ||
          p.location.toLowerCase().includes(term) ||
          p.client.name.toLowerCase().includes(term) ||
          p.client.company_name?.toLowerCase().includes(term)
        );
      }

      setProjects(filteredProjects);
      setTotalPages(Math.ceil(filteredProjects.length / itemsPerPage));
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, searchTerm]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    setSelectedStatus(statusFilter);
  }, [statusFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const paginatedProjects = projects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDeleteProject = async (projectId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      setProjects(prev => prev.filter(p => p.id !== projectId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des projets</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {projects.length} projet{projects.length > 1 ? 's' : ''} au total
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </button>
          <Link
            href="/doublemb/projets/nouveau"
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau projet
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(statusConfig).map(([key, config]) => {
          const count = projects.filter(p => p.status === key).length;
          const Icon = config.icon;
          return (
            <button
              key={key}
              onClick={() => setSelectedStatus(selectedStatus === key ? '' : key)}
              className={`p-4 rounded-xl border transition-all ${selectedStatus === key
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`h-5 w-5 ${selectedStatus === key ? 'text-red-600' : 'text-gray-400'}`} />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{count}</span>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{config.label}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un projet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-red-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-500'}`}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-red-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-500'}`}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>

            <button
              onClick={() => fetchProjects()}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <RefreshCw className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid/List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucun projet trouvé</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Commencez par créer votre premier projet</p>
          <Link
            href="/doublemb/projets/nouveau"
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Créer un projet
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedProjects.map((project) => {
            const status = statusConfig[project.status];
            const StatusIcon = status.icon;
            const budgetPercentage = (project.spent / project.budget) * 100;

            return (
              <div
                key={project.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Project Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                        {project.title}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {project.location}
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setShowActions(showActions === project.id ? null : project.id)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <MoreVertical className="h-5 w-5 text-gray-500" />
                      </button>
                      {showActions === project.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                          <Link
                            href={`/doublemb/projets/show?id=${project.id}`}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Voir les détails
                          </Link>
                          <Link
                            href={`/doublemb/projets/edit?id=${project.id}`}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </Link>
                          <hr className="my-1 border-gray-200 dark:border-gray-700" />
                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </span>

                  {/* Progress */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-500 dark:text-gray-400">Progression</span>
                      <span className="font-medium text-gray-900 dark:text-white">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${project.progress >= 100 ? 'bg-green-500' :
                          project.progress >= 50 ? 'bg-blue-500' :
                            'bg-yellow-500'
                          }`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Client */}
                  <div className="mt-4 flex items-center text-sm">
                    <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {project.client.company_name || project.client.name}
                    </span>
                  </div>

                  {/* Dates */}
                  <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(project.start_date)} → {formatDate(project.estimated_end_date)}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-gray-600 dark:text-gray-300">{project.team_size}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Budget: </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(project.budget)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">Dépensé</span>
                      <span className={`font-medium ${budgetPercentage > 90 ? 'text-red-600' : 'text-gray-600 dark:text-gray-300'}`}>
                        {budgetPercentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${budgetPercentage > 90 ? 'bg-red-500' :
                          budgetPercentage > 75 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                        style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // List View
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Projet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Progression</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Budget</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedProjects.map((project) => {
                const status = statusConfig[project.status];
                const StatusIcon = status.icon;
                return (
                  <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{project.title}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {project.location}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {project.client.company_name || project.client.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                          <div
                            className="bg-red-600 h-2 rounded-full"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {formatCurrency(project.budget)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/doublemb/projets/show?id=${project.id}`}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                          <Eye className="h-4 w-4 text-gray-500" />
                        </Link>
                        <Link
                          href={`/doublemb/projets/edit?id=${project.id}`}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                          <Edit className="h-4 w-4 text-gray-500" />
                        </Link>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${currentPage === page
                ? 'bg-red-600 text-white'
                : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
