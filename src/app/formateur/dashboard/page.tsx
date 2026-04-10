'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext'; // Note: Auth is handled by layout/context, but we might need user info
import { api, type FormateurDashboardStats, type TeacherApprenant } from '@/lib/api';
import {
  GraduationCap,
  Users,
  ClipboardCheck,
  Calendar,
  BookOpen,
  Award,
  TrendingUp,
  Clock,
  UserCheck,
  AlertCircle,
  ChevronRight
} from 'lucide-react';

export default function FormateurDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<FormateurDashboardStats>({
    total_apprenants: 0,
    apprenants_actifs: 0,
    cours_cette_semaine: 0,
    evaluations_a_venir: 0,
    taux_presence_moyen: 0,
    formations_assignees: [],
  });

  const [recentApprenants, setRecentApprenants] = useState<TeacherApprenant[]>([]);

  // Le layout gère déjà la protection de la route via useRequireRole
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Chargement en parallèle pour les performances
      const [statsData, apprenantsData] = await Promise.all([
        api.getFormateurStats(),
        api.getFormateurApprenants(5)
      ]);

      setStats(statsData);
      setRecentApprenants(apprenantsData);
    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
      // On ne bloque pas tout le dashboard pour une erreur, mais on pourrait afficher une notification
      setError('Impossible de charger les données à jour. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-gray-500">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Apprenants', value: stats.total_apprenants, icon: Users, color: 'bg-blue-500' },
    { label: 'Apprenants Actifs', value: stats.apprenants_actifs, icon: UserCheck, color: 'bg-green-500' },
    { label: 'Cours cette semaine', value: stats.cours_cette_semaine, icon: BookOpen, color: 'bg-purple-500' },
    { label: 'Évaluations à venir', value: stats.evaluations_a_venir, icon: ClipboardCheck, color: 'bg-orange-500' },
  ];

  const menuItems = [
    { label: 'Mes Apprenants', href: '/formateur/apprenants', icon: Users, description: 'Gérer et suivre vos apprenants' },
    { label: 'Présences', href: '/formateur/presences', icon: Calendar, description: 'Enregistrer et consulter les présences' },
    { label: 'Évaluations', href: '/formateur/evaluations', icon: ClipboardCheck, description: 'Notes et évaluations des apprenants' },
    { label: 'Cours', href: '/formateur/cours', icon: BookOpen, description: 'Planifier et gérer vos cours' },
    { label: 'Certificats', href: '/formateur/certificats', icon: Award, description: 'Valider les certificats' },
    { label: 'Rapports', href: '/formateur/rapports', icon: TrendingUp, description: 'Statistiques et rapports' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                Bonjour, {user?.name} 👋
              </h1>
              <p className="mt-2 text-purple-200">
                <GraduationCap className="inline h-5 w-5 mr-2" />
                Formateur {user?.speciality ? `- ${user.speciality}` : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-purple-200">Taux de présence moyen</p>
              <p className="text-4xl font-bold">{stats.taux_presence_moyen}%</p>
            </div>
          </div>

          {/* Formations assignées */}
          {stats.formations_assignees.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {stats.formations_assignees.map((formation) => (
                <span
                  key={formation}
                  className="px-3 py-1 bg-white/20 rounded-full text-sm"
                >
                  {formation}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg shadow-sm`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu rapide */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-purple-600" />
              Accès rapide
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 transition-all hover:shadow-md group flex flex-col justify-between"
                  >
                    <div>
                      <Icon className="h-8 w-8 text-purple-500 mb-3 group-hover:scale-110 transition-transform" />
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">
                        {item.label}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 opacity-80">
                      {item.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Apprenants récents */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Apprenants récents
              </h2>
              <Link href="/formateur/apprenants" className="text-purple-600 text-sm hover:underline flex items-center font-medium">
                Voir tous <ChevronRight className="h-4 w-4 ml-0.5" />
              </Link>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              {recentApprenants.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Aucun apprenant actif pour le moment.
                </div>
              ) : (
                recentApprenants.map((apprenant, index) => (
                  <div
                    key={apprenant.id}
                    className={`p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${index !== recentApprenants.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center relative">
                        {apprenant.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={apprenant.avatar} alt={apprenant.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-purple-600 dark:text-purple-400 font-semibold text-lg">
                            {apprenant.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{apprenant.name}</p>
                        <p className="text-xs text-gray-500">{apprenant.formation}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${apprenant.progression >= 80 ? 'bg-green-500' :
                                apprenant.progression >= 50 ? 'bg-purple-500' : 'bg-orange-500'
                              }`}
                            style={{ width: `${apprenant.progression}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 w-8">{apprenant.progression}%</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Rappels métier */}
        <div className="mt-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-300">Rappels & Notifications</h3>
              <ul className="mt-2 space-y-1 text-sm text-amber-700 dark:text-amber-400">
                {stats.evaluations_a_venir > 0 && (
                  <li>• {stats.evaluations_a_venir} évaluations planifiées ou à corriger.</li>
                )}
                {stats.cours_cette_semaine > 0 && (
                  <li>• {stats.cours_cette_semaine} sessions à suivre cette semaine.</li>
                )}
                <li>• Pensez à valider les présences de la journée.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
