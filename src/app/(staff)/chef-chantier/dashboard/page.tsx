'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api, ChefChantierDashboardData } from '@/lib/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Users, FolderKanban, Camera, AlertCircle, CheckCircle2 } from 'lucide-react';

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

const EMPTY_DASHBOARD: ChefChantierDashboardData = {
  stats: {
    chantiersActifs: 0,
    equipes: 0,
    avancements: 0,
    alertes: 0,
  },
  projectsData: [],
  statusData: [],
  recentProjects: [],
  recentUpdates: [],
};

function getProjectStatusClass(status: string): string {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus.includes('term')) {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (normalizedStatus.includes('pause') || normalizedStatus.includes('attente')) {
    return 'bg-amber-100 text-amber-700';
  }

  if (normalizedStatus.includes('plan')) {
    return 'bg-slate-100 text-slate-700';
  }

  return 'bg-blue-100 text-blue-700';
}

export default function ChefChantierDashboard() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<ChefChantierDashboardData>(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const dashboardData = await api.getChefChantierDashboard();

      setData({
        ...EMPTY_DASHBOARD,
        ...dashboardData,
        stats: {
          ...EMPTY_DASHBOARD.stats,
          ...dashboardData.stats,
        },
        projectsData: dashboardData.projectsData ?? [],
        statusData: dashboardData.statusData ?? [],
        recentProjects: dashboardData.recentProjects ?? [],
        recentUpdates: dashboardData.recentUpdates ?? [],
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';

      if (message.includes('permissions')) {
        router.push('/chef-chantier/unauthorized');
        return;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/connexion?redirect=/chef-chantier/dashboard');
      return;
    }

    if (token) {
      void fetchDashboard();
    }
  }, [authLoading, fetchDashboard, router, token, user]);

  const { stats, projectsData, statusData, recentProjects, recentUpdates } = data;
  const hasProgressData = projectsData.some((entry) => entry.completed > 0 || entry.inProgress > 0 || entry.pending > 0);
  const hasStatusData = statusData.some((entry) => entry.value > 0);
  const totalStatusCount = statusData.reduce((sum, entry) => sum + entry.value, 0);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-amber-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchDashboard}
          className="mt-4 rounded-lg bg-amber-600 px-4 py-2 text-white transition-colors hover:bg-amber-700"
        >
          Reessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Tableau de bord - Chef de Chantier
          </h1>
          <p className="mt-1 text-gray-600">
            Bienvenue, {user?.name}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Chantiers actifs</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.chantiersActifs}</p>
              <p className="mt-2 text-xs text-gray-500">En cours</p>
            </div>
            <div className="rounded-lg bg-blue-100 p-3">
              <FolderKanban className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Equipes</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.equipes}</p>
              <p className="mt-2 text-xs text-gray-500">Ouvriers mobilises</p>
            </div>
            <div className="rounded-lg bg-green-100 p-3">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avancements</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.avancements}</p>
              <p className="mt-2 text-xs text-gray-500">Publies</p>
            </div>
            <div className="rounded-lg bg-amber-100 p-3">
              <Camera className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Alertes</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.alertes}</p>
              <p className="mt-2 text-xs text-gray-500">A traiter</p>
            </div>
            <div className="rounded-lg bg-red-100 p-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Progression des chantiers
          </h2>
          {hasProgressData ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#10b981" name="Completes" />
                <Bar dataKey="inProgress" fill="#f59e0b" name="En cours" />
                <Bar dataKey="pending" fill="#ef4444" name="En attente" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
              Aucun chantier assigne n alimente encore ce graphique.
            </div>
          )}
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            État global
          </h2>
          {hasStatusData ? (
            <div className="space-y-5">
              <div className="relative h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={82}
                      paddingAngle={3}
                      stroke="#ffffff"
                      strokeWidth={3}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number | string) => [`${value}`, 'Chantiers']} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full bg-white/95 px-4 py-3 text-center shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{totalStatusCount}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {statusData.map((entry, index) => {
                  const percentage = totalStatusCount > 0
                    ? Math.round((entry.value / totalStatusCount) * 100)
                    : 0;

                  return (
                    <div
                      key={`${entry.name}-${index}`}
                      className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="h-3 w-3 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></span>
                        <span className="truncate text-sm font-medium text-gray-700">{entry.name}</span>
                      </div>
                      <div className="ml-3 text-right">
                        <p className="text-sm font-semibold text-gray-900">{entry.value}</p>
                        <p className="text-xs text-gray-500">{percentage}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
              Aucun chantier disponible pour calculer une répartition.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Chantiers recents
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentProjects.length > 0 ? (
              recentProjects.map((project) => (
                <div key={project.id} className="px-6 py-4">
                  <div className="mb-2 flex items-start justify-between gap-4">
                    <h3 className="font-medium text-gray-900">{project.name}</h3>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getProjectStatusClass(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Equipe: {project.team} personne{project.team > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-blue-600 transition-all"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{project.progress}% complete</p>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-sm text-gray-500">
                Aucun chantier recent disponible pour ce compte.
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Avancements recents
            </h2>
          </div>
          <div className="max-h-96 divide-y divide-gray-200 overflow-y-auto">
            {recentUpdates.length > 0 ? (
              recentUpdates.map((update) => (
                <div key={update.id} className="px-6 py-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {update.project}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        {update.update}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(update.date).toLocaleDateString('fr-FR')} • {update.author}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-sm text-gray-500">
                Aucun avancement recent n a encore ete publie.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
