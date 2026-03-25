'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  FolderKanban,
  GraduationCap,
  DollarSign,
  TrendingUp,
  TrendingDown,
  UserPlus,
  FileText,
  ArrowRight,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { api } from '@/lib/api';

interface StatCard {
  title: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: any; // Lucide icon
  color: string;
  href: string;
}

interface RecentActivity {
  id: number;
  type: string;
  title: string;
  description: string;
  actor_name?: string;
  time: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

interface QuickStat {
  label: string;
  value: number;
  total: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatCard[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [quickStats, setQuickStats] = useState<QuickStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const dashboardData = await api.getAdminDashboardStats();

        setStats([
          {
            title: 'Total Utilisateurs',
            value: dashboardData.users.total,
            change: dashboardData.users.new_this_month, // Simplified logic
            changeLabel: 'nouveaux ce mois',
            icon: Users,
            color: 'blue',
            href: '/doublemb/utilisateurs'
          },
          {
            title: 'Projets Actifs',
            value: dashboardData.projects.active,
            change: 0, // Placeholder
            changeLabel: 'stable',
            icon: FolderKanban,
            color: 'green',
            href: '/doublemb/projets'
          },
          {
            title: 'Apprenants',
            value: dashboardData.apprenants.total,
            change: 0,
            changeLabel: 'total inscrits',
            icon: GraduationCap,
            color: 'purple',
            href: '/doublemb/utilisateurs?role=apprenant'
          },
          {
            title: 'Revenus du mois',
            value: new Intl.NumberFormat('fr-FR').format(dashboardData.financials.monthly_revenue) + ' FCFA',
            change: 0,
            changeLabel: 'ce mois',
            icon: DollarSign,
            color: 'yellow',
            href: '/doublemb/paiements'
          }
        ]);

        // Map activities if available, otherwise keep empty or mock
        const activities = dashboardData.activities.map((act: any) => ({
          id: act.id,
          type: act.type,
          title: act.title,
          description: act.description,
          actor_name: act.actor_name,
          time: act.time,
          status: act.status
        })) as RecentActivity[];
        setRecentActivities(activities);

        setQuickStats([
          { label: 'Administrateurs', value: dashboardData.roles.admin, total: dashboardData.users.total },
          { label: 'Staff', value: dashboardData.roles.staff, total: dashboardData.users.total },
          { label: 'Clients', value: dashboardData.roles.clients, total: dashboardData.users.total },
          { label: 'Apprenants', value: dashboardData.roles.apprenants, total: dashboardData.users.total }
        ]);

      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', icon: 'bg-blue-100 dark:bg-blue-900/40' },
      green: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', icon: 'bg-green-100 dark:bg-green-900/40' },
      purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', icon: 'bg-purple-100 dark:bg-purple-900/40' },
      yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-600 dark:text-yellow-400', icon: 'bg-yellow-100 dark:bg-yellow-900/40' }
    };
    return colors[color] || colors.blue;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user': return UserPlus;
      case 'project': return FolderKanban;
      case 'payment': return DollarSign;
      case 'formation': return GraduationCap;
      default: return FileText;
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Bienvenue sur le tableau de bord admin</h2>
            <p className="mt-1 text-red-100">
              Voici un aperçu de l'activité de votre plateforme MBC
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Link
              href="/doublemb/rapports"
              className="inline-flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              <FileText className="h-4 w-4 mr-2" />
              Voir les rapports
            </Link>
            <Link
              href="/doublemb/utilisateurs/nouveau"
              className="inline-flex items-center px-4 py-2 bg-white text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Ajouter un utilisateur
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const colors = getColorClasses(stat.color);
          return (
            <Link
              key={stat.title}
              href={stat.href}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl ${colors.icon}`}>
                  <stat.icon className={`h-6 w-6 ${colors.text}`} />
                </div>
                <div className={`flex items-center text-sm ${stat.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change >= 0 ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(stat.change)}%
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
              </div>
              <p className="mt-2 text-xs text-gray-400">{stat.changeLabel}</p>
            </Link>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activité récente</h3>
              <Link href="/doublemb/activites" className="text-sm text-red-600 hover:text-red-700 flex items-center">
                Voir tout <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentActivities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              return (
                <div key={activity.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-lg ${getStatusColor(activity.status)}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{activity.description}</p>
                      {activity.actor_name && (
                        <p className="mt-1 text-xs text-gray-400">Par {activity.actor_name}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <p className="text-xs text-gray-400">{activity.time}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Statistiques rapides</h3>
          </div>
          <div className="p-6 space-y-6">
            {quickStats.map((stat) => (
              <div key={stat.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {stat.value}/{stat.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(stat.value / stat.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Actions rapides</h4>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/doublemb/projets/nouveau"
                className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <FolderKanban className="h-6 w-6 text-gray-600 dark:text-gray-300 mb-1" />
                <span className="text-xs text-gray-600 dark:text-gray-300">Nouveau projet</span>
              </Link>
              <Link
                href="/doublemb/formations/nouvelle"
                className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <GraduationCap className="h-6 w-6 text-gray-600 dark:text-gray-300 mb-1" />
                <span className="text-xs text-gray-600 dark:text-gray-300">Nouvelle formation</span>
              </Link>
              <Link
                href="/doublemb/rapports/generer"
                className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <FileText className="h-6 w-6 text-gray-600 dark:text-gray-300 mb-1" />
                <span className="text-xs text-gray-600 dark:text-gray-300">Générer rapport</span>
              </Link>
              <Link
                href="/doublemb/settings"
                className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                title="Configuration du système"
              >
                <Settings className="h-6 w-6 text-gray-600 dark:text-gray-300 mb-1" />
                <span className="text-xs text-center text-gray-600 dark:text-gray-300">Paramètres</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Attention requise</h4>
            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
              3 paiements sont en attente de validation et 2 projets ont des retards signalés.
            </p>
            <div className="mt-3 flex space-x-4">
              <Link href="/doublemb/paiements?status=pending" className="text-sm font-medium text-yellow-800 dark:text-yellow-300 hover:underline">
                Voir les paiements →
              </Link>
              <Link href="/doublemb/projets?status=retard" className="text-sm font-medium text-yellow-800 dark:text-yellow-300 hover:underline">
                Voir les projets →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
