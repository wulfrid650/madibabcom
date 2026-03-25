'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Users, FolderKanban, Camera, AlertCircle, CheckCircle2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface DashboardData {
  stats: {
    chantiersActifs: number;
    equipes: number;
    avancements: number;
    alertes: number;
  };
  projectsData: { name: string; completed: number; inProgress: number; pending: number }[];
  statusData: { name: string; value: number }[];
  recentProjects: {
    id: number;
    name: string;
    progress: number;
    team: number;
    status: string;
  }[];
  recentUpdates: {
    id: number;
    project: string;
    update: string;
    date: string;
    author: string;
  }[];
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export default function ChefChantierDashboard() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/chef-chantier/dashboard');
      return;
    }
    
    if (token) {
      fetchDashboard();
    }
  }, [user, token, authLoading]);

  const fetchDashboard = async () => {
    try {
      const response = await fetch(`${API_URL}/chef-chantier/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          router.push('/chef-chantier/unauthorized');
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
  const stats = data?.stats || { chantiersActifs: 0, equipes: 0, avancements: 0, alertes: 0 };
  const projectsData = data?.projectsData || [
    { name: 'Jan', completed: 0, inProgress: 0, pending: 0 },
  ];
  const statusData = data?.statusData || [
    { name: 'Complétés', value: 0 },
    { name: 'En cours', value: 0 },
    { name: 'En attente', value: 0 },
  ];
  const recentProjects = data?.recentProjects || [];
  const recentUpdates = data?.recentUpdates || [];

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button 
          onClick={fetchDashboard}
          className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Tableau de bord - Chef de Chantier
          </h1>
          <p className="text-gray-600 mt-1">
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Chantiers actifs</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.chantiersActifs}</p>
              <p className="text-xs text-gray-500 mt-2">En cours</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FolderKanban className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Équipes</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.equipes}</p>
              <p className="text-xs text-gray-500 mt-2">Ouvriers actifs</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Avancements</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.avancements}</p>
              <p className="text-xs text-gray-500 mt-2">Ce mois</p>
            </div>
            <div className="bg-amber-100 p-3 rounded-lg">
              <Camera className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Alertes</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.alertes}</p>
              <p className="text-xs text-gray-500 mt-2">À traiter</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Progression des chantiers
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projectsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill="#10b981" name="Complétés" />
              <Bar dataKey="inProgress" fill="#f59e0b" name="En cours" />
              <Bar dataKey="pending" fill="#ef4444" name="En attente" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            État global
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Chantiers récents
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentProjects.map((project) => (
              <div key={project.id} className="px-6 py-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{project.name}</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {project.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">
                    Équipe: {project.team} personnes
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{project.progress}% complété</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Updates */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Avancements récents
            </h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {recentUpdates.map((update) => (
              <div key={update.id} className="px-6 py-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {update.project}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {update.update}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(update.date).toLocaleDateString('fr-FR')} • {update.author}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
