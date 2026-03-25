'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  FolderKanban,
  GraduationCap,
  DollarSign,
  UserPlus,
  FileText,
  ArrowLeft,
  Filter,
  Download,
  Calendar
} from 'lucide-react';
import { api } from '@/lib/api';

interface Activity {
  id: number;
  type: string;
  title: string;
  description: string;
  time: string;
  date: string;
  status: 'success' | 'warning' | 'error' | 'info';
  user?: string;
  details?: any;
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7days');

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const data = await api.getRecentActivities(dateRange);
        setActivities(data);
        setFilteredActivities(data);
      } catch (error) {
        console.error("Erreur lors de la récupération des activités", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [dateRange]);

  useEffect(() => {
    if (filterType === 'all') {
      setFilteredActivities(activities);
    } else {
      setFilteredActivities(activities.filter(act => act.type === filterType));
    }
  }, [filterType, activities]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user': return UserPlus;
      case 'project': return FolderKanban;
      case 'payment': return DollarSign;
      case 'formation': return GraduationCap;
      default: return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400';
    }
  };

  const getTypeBadge = (type: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      user: { label: 'Utilisateur', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400' },
      project: { label: 'Projet', color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400' },
      payment: { label: 'Paiement', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400' },
      formation: { label: 'Formation', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400' }
    };
    return badges[type] || { label: 'Autre', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-400' };
  };

  const exportActivities = () => {
    const csv = [
      ['Date', 'Type', 'Titre', 'Description', 'Statut'],
      ...filteredActivities.map(act => [
        act.date,
        getTypeBadge(act.type).label,
        act.title,
        act.description,
        act.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activites-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl w-1/3"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/doublemb/dashboard"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activités récentes</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Historique complet des activités de la plateforme
            </p>
          </div>
        </div>
        <button
          onClick={exportActivities}
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Exporter CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtrer par type:</span>
            <div className="flex flex-wrap gap-2">
              {['all', 'user', 'project', 'payment', 'formation'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    filterType === type
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {type === 'all' ? 'Tous' : getTypeBadge(type).label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Période:</span>
            <select
              aria-label="Filtrer les activites par periode"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-1 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-none focus:ring-2 focus:ring-red-500"
            >
              <option value="today">Aujourd'hui</option>
              <option value="7days">7 derniers jours</option>
              <option value="30days">30 derniers jours</option>
              <option value="all">Tout l'historique</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {['user', 'project', 'payment', 'formation'].map((type) => {
          const count = activities.filter(act => act.type === type).length;
          const badge = getTypeBadge(type);
          const Icon = getActivityIcon(type);
          return (
            <div
              key={type}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${badge.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{count}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{badge.label}s</p>
            </div>
          );
        })}
      </div>

      {/* Activities List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {filteredActivities.length} activité{filteredActivities.length > 1 ? 's' : ''} trouvée{filteredActivities.length > 1 ? 's' : ''}
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredActivities.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Aucune activité trouvée</p>
            </div>
          ) : (
            filteredActivities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              const badge = getTypeBadge(activity.type);
              return (
                <div key={activity.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${getStatusColor(activity.status)}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${badge.color}`}>
                          {badge.label}
                        </span>
                        <span className="text-xs text-gray-400">{activity.date}</span>
                      </div>
                      <p className="text-base font-medium text-gray-900 dark:text-white">{activity.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{activity.description}</p>
                      {activity.user && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          Par: {activity.user}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{activity.time}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
