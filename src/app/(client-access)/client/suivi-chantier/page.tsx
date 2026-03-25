'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { getClientProjectDetail, getClientProjectPhotos, getClientProjects } from '@/lib/api';

interface Phase {
  id: string;
  name: string;
  status: 'completed' | 'in-progress' | 'pending';
  progress: number;
  description: string;
}

interface Project {
  id: string;
  name: string;
  address: string;
  type: string;
  status: 'en-cours' | 'termine' | 'en-attente';
  progress: number;
  startDate: string;
  estimatedEndDate: string;
  lastUpdate: string;
}

function mapApiStatus(apiStatus: string): 'en-cours' | 'termine' | 'en-attente' {
  switch (apiStatus) {
    case 'in_progress':
      return 'en-cours';
    case 'completed':
      return 'termine';
    case 'planned':
    case 'pending':
    case 'on_hold':
      return 'en-attente';
    default:
      return 'en-cours';
  }
}

function toIsoDate(value?: string): string {
  if (!value) return new Date().toISOString();
  return value;
}

function normalizePhotoUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const backendBase = apiUrl.replace(/\/api\/?$/, '');
  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  return `${backendBase}${normalizedPath}`;
}

function generatePhasesFromProgress(progress: number): Phase[] {
  const phases = [
    { name: 'Études et permis', range: [0, 20], description: 'Plans architecturaux, études de sol, obtention du permis de construire' },
    { name: 'Fondations', range: [20, 35], description: 'Terrassement, coulage des fondations et mise en place des réseaux enterrés' },
    { name: 'Gros œuvre', range: [35, 60], description: 'Élévation des murs, planchers, charpente et toiture' },
    { name: 'Second œuvre', range: [60, 80], description: 'Menuiseries, plomberie, électricité, isolation' },
    { name: 'Finitions', range: [80, 95], description: 'Peinture, revêtements sols et murs, aménagements' },
    { name: 'Réception', range: [95, 100], description: 'Contrôles finaux, livraison et remise des clés' },
  ];

  return phases.map((phase, index) => {
    const [start, end] = phase.range;
    let status: 'completed' | 'in-progress' | 'pending' = 'pending';
    let phaseProgress = 0;

    if (progress >= end) {
      status = 'completed';
      phaseProgress = 100;
    } else if (progress >= start) {
      status = 'in-progress';
      phaseProgress = Math.round(((progress - start) / (end - start)) * 100);
    }

    return {
      id: (index + 1).toString(),
      name: phase.name,
      status,
      progress: phaseProgress,
      description: phase.description,
    };
  });
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'in-progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'completed':
      return 'Terminé';
    case 'in-progress':
      return 'En cours';
    case 'pending':
      return 'À venir';
    default:
      return status;
  }
}

export default function SuiviChantierPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjectData();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    fetchSelectedProjectDetails(selectedProjectId);
    fetchSelectedProjectPhotos(selectedProjectId);
  }, [selectedProjectId]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const phases = useMemo(
    () => generatePhasesFromProgress(selectedProject?.progress || 0),
    [selectedProject?.progress]
  );

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getClientProjects();
      const source = Array.isArray(response.data) ? response.data : [];

      if (!response.success || source.length === 0) {
        setProjects([]);
        setSelectedProjectId('');
        setError('Aucun projet chantier disponible pour votre compte.');
        return;
      }

      const mappedProjects: Project[] = source.map((apiProject: any) => ({
        id: String(apiProject.id),
        name: apiProject.title || 'Projet sans titre',
        address: apiProject.location || 'Adresse non spécifiée',
        type: apiProject.category || 'Construction',
        status: mapApiStatus(String(apiProject.status || 'in_progress')),
        progress: Number(apiProject.progress || 0),
        startDate: toIsoDate(apiProject.start_date),
        estimatedEndDate: toIsoDate(apiProject.expected_end_date),
        lastUpdate: toIsoDate(apiProject?.last_update?.created_at),
      }));

      setProjects(mappedProjects);
      setSelectedProjectId((current) => (current && mappedProjects.some((p) => p.id === current) ? current : mappedProjects[0].id));
    } catch (err) {
      console.error('Erreur chargement projets client:', err);
      setError('Erreur lors du chargement des projets.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSelectedProjectDetails = async (projectId: string) => {
    try {
      const response = await getClientProjectDetail(Number(projectId));
      if (!response.success || !response.data?.project) return;

      const project = response.data.project;
      const lastUpdate = response.data.progress_updates?.[0]?.created_at;
      const currentProgress = Number(response.data.current_progress ?? project.progress ?? 0);

      setProjects((previous) =>
        previous.map((item) =>
          item.id === projectId
            ? {
                ...item,
                name: project.title || item.name,
                address: project.location || item.address,
                type: project.category || item.type,
                status: mapApiStatus(String(project.status || 'in_progress')),
                progress: currentProgress,
                startDate: toIsoDate(project.start_date || item.startDate),
                estimatedEndDate: toIsoDate(project.expected_end_date || item.estimatedEndDate),
                lastUpdate: toIsoDate(lastUpdate || item.lastUpdate),
              }
            : item
        )
      );
    } catch (err) {
      console.error('Erreur chargement détails projet:', err);
    }
  };

  const fetchSelectedProjectPhotos = async (projectId: string) => {
    try {
      setLoadingPhotos(true);
      const response = await getClientProjectPhotos(Number(projectId));
      const source = Array.isArray(response.data) ? response.data : [];
      const normalized = source
        .map((item: any) => String(item))
        .filter((item: string) => item.trim().length > 0)
        .map((item: string) => normalizePhotoUrl(item));
      setPhotos(normalized);
    } catch (err) {
      console.error('Erreur chargement photos chantier:', err);
      setPhotos([]);
    } finally {
      setLoadingPhotos(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-madiba-red"></div>
      </div>
    );
  }

  if (error || !selectedProject) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
        <p className="text-red-600 dark:text-red-400">{error || 'Aucun projet trouvé'}</p>
        <button
          onClick={fetchProjectData}
          className="mt-4 px-4 py-2 bg-madiba-red text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Suivi de chantier</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {projects.length > 1 ? `${projects.length} projets liés à votre compte` : 'Suivez l’avancement de votre projet en temps réel'}
            </p>
          </div>
          <div className="w-full lg:w-80">
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Projet affiché</label>
            <select
              value={selectedProjectId}
              onChange={(event) => setSelectedProjectId(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-madiba-red dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedProject.name}</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{selectedProject.address}</p>
              <span className="inline-block mt-2 px-3 py-1 text-xs font-medium rounded-full bg-madiba-red/10 text-madiba-red">
                {selectedProject.type}
              </span>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-madiba-red">{selectedProject.progress}%</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Avancement global</div>
            </div>
          </div>

          <div className="mb-6">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-madiba-red to-madiba-gold rounded-full transition-all duration-500"
                style={{ width: `${selectedProject.progress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Début du projet</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {new Date(selectedProject.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Livraison estimée</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {new Date(selectedProject.estimatedEndDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Résumé des phases</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Terminées</span>
              <span className="font-semibold text-gray-900 dark:text-white">{phases.filter((p) => p.status === 'completed').length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">En cours</span>
              <span className="font-semibold text-gray-900 dark:text-white">{phases.filter((p) => p.status === 'in-progress').length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">À venir</span>
              <span className="font-semibold text-gray-900 dark:text-white">{phases.filter((p) => p.status === 'pending').length}</span>
            </div>
          </div>
          <hr className="my-4 border-gray-200 dark:border-gray-700" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Dernière mise à jour: {new Date(selectedProject.lastUpdate).toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Phases du projet</h3>
        <div className="space-y-6">
          {phases.map((phase, index) => (
            <div key={phase.id} className="relative">
              {index < phases.length - 1 && (
                <div className="absolute left-[15px] top-[40px] w-0.5 h-[calc(100%)] bg-gray-200 dark:bg-gray-700" />
              )}

              <div className="flex gap-4">
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    phase.status === 'completed'
                      ? 'bg-green-500 text-white'
                      : phase.status === 'in-progress'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                  }`}
                >
                  {phase.status === 'completed' ? '✓' : phase.status === 'in-progress' ? '•' : index + 1}
                </div>

                <div className="flex-1 pb-6">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{phase.name}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(phase.status)}`}>
                        {getStatusText(phase.status)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{phase.description}</p>

                    {phase.status === 'in-progress' && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <span>Progression</span>
                          <span>{phase.progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${phase.progress}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Photos du chantier</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">{photos.length} photo(s)</span>
        </div>

        {loadingPhotos ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-madiba-red"></div>
          </div>
        ) : photos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Aucune photo disponible pour ce chantier.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <a key={`${photo}-${index}`} href={photo} target="_blank" rel="noopener noreferrer" className="group block">
                <img
                  src={photo}
                  alt={`Photo chantier ${index + 1}`}
                  loading="lazy"
                  className="aspect-square w-full rounded-lg object-cover border border-gray-200 dark:border-gray-700 group-hover:opacity-90"
                />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
