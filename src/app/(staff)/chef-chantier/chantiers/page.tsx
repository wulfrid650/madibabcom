'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, MoreVertical, MapPin, Users, Calendar, TrendingUp } from 'lucide-react';
import { api, PortfolioProject } from '@/lib/api';

export default function ChantiersPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]); // Using any[] temporarily for mapped UI object, or I could define an interface UIProject
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChantiers();
  }, []);

  const loadChantiers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getChefChantierChantiers();

      // Map API data to UI format
      const mappedProjects = data.map((p: PortfolioProject) => {
        // Status mapping
        let uiStatus = 'En cours';
        if (p.status === 'completed') uiStatus = 'Terminé';
        if (p.status === 'on_hold') uiStatus = 'En attente';
        if (p.status === 'planned' || p.status === 'pending') uiStatus = 'À venir';
        // Simulate 'Presque terminé' based on progress?
        if (p.status === 'in_progress' && (p.progress as number) > 90) uiStatus = 'Presque terminé';

        // Priority mapping (mock or from metadata if available)
        const priority = 'Moyenne';

        return {
          id: p.id,
          name: p.title,
          location: p.location || 'Localisation inconnue',
          startDate: p.start_date || '',
          endDate: p.expected_end_date || p.completion_date || '',
          team: Array.isArray((p as any).team_ids) ? (p as any).team_ids.length : 0,
          progress: p.progress || 0,
          status: uiStatus,
          priority: priority,
        };
      });

      setProjects(mappedProjects);
    } catch (err) {
      console.error('Erreur chargement chantiers:', err);
      setError('Impossible de charger les chantiers.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En cours':
        return 'bg-blue-100 text-blue-800';
      case 'Presque terminé':
        return 'bg-green-100 text-green-800';
      case 'Terminé':
        return 'bg-gray-100 text-gray-800';
      case 'En attente':
        return 'bg-yellow-100 text-yellow-800';
      case 'À venir':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Haute':
        return 'text-red-600';
      case 'Moyenne':
        return 'text-yellow-600';
      case 'Basse':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Erreur!</strong>
        <span className="block sm:inline"> {error}</span>
        <button onClick={loadChantiers} className="mt-2 text-sm underline hover:text-red-800">Réessayer</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes chantiers</h1>
          <p className="text-gray-600 mt-1">
            {filteredProjects.length} chantier(s) en gestion
          </p>
        </div>
        <button
          onClick={() => router.push('/chef-chantier/chantiers/nouveau')}
          className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Nouveau chantier</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1 md:mr-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom ou localisation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="En cours">En cours</option>
            <option value="Presque terminé">Presque terminé</option>
            <option value="Terminé">Terminé</option>
            <option value="En attente">En attente</option>
            <option value="À venir">À venir</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
        {filteredProjects.map((project) => (
          <div key={project.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {project.name}
                  </h3>
                  <div className="flex items-center text-gray-600 text-sm mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    {project.location}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      project.status
                    )}`}
                  >
                    {project.status}
                  </span>
                  <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Progression
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {project.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-amber-600 h-3 rounded-full transition-all"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Project details */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Équipe</p>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4 text-gray-600" />
                    <p className="font-semibold text-gray-900">{project.team}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Priorité</p>
                  <p className={`font-semibold text-sm ${getPriorityColor(project.priority)}`}>
                    {project.priority}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Fin prévue</p>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <p className="font-semibold text-sm text-gray-900">
                      {project.endDate ? new Date(project.endDate).toLocaleDateString('fr-FR', {
                        month: 'short',
                        year: '2-digit',
                      }) : 'Non définie'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 flex items-center space-x-2">
                <button 
                  onClick={() => router.push(`/chef-chantier/chantiers/${project.id}`)}
                  className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  Voir détails
                </button>
                <button
                  onClick={() => router.push(`/chef-chantier/chantiers/${project.id}/modifier`)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium transition-colors text-sm"
                >
                  Modifier
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600 text-lg">Aucun chantier trouvé</p>
        </div>
      )}
    </div>
  );
}
