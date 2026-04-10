'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { getFormateurApprenants } from '@/lib/api';
import {
  Users,
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  Eye,
  MessageSquare,
  ChevronLeft,
  UserCheck,
  UserX,
  GraduationCap
} from 'lucide-react';

interface Apprenant {
  id: number;
  name: string;
  email: string;
  phone: string;
  formation: string;
  enrollment_date: string;
  progression: number;
  taux_presence: number;
  derniere_connexion: string;
  status: 'actif' | 'inactif' | 'termine';
  notes_moyenne: number;
}

export default function FormateurApprenantsPage() {
  const router = useRouter();
  const { user, token, hasRole } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [apprenants, setApprenants] = useState<Apprenant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFormation, setFilterFormation] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (!token || !user) {
      router.push('/connexion');
      return;
    }

    if (!hasRole('formateur')) {
      router.push('/dashboard');
      return;
    }

    loadApprenants();
  }, [token, user, hasRole, router]);

  const loadApprenants = async () => {
    try {
      const response = await getFormateurApprenants();
      if (response.success) {
        setApprenants(response.data || []);
      }
    } catch (err) {
      console.error('Error loading apprenants:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formations = useMemo(() => {
    return Array.from(new Set(apprenants.map((apprenant) => apprenant.formation).filter(Boolean))).sort();
  }, [apprenants]);

  const filteredApprenants = apprenants.filter(apprenant => {
    const matchSearch = apprenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apprenant.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFormation = filterFormation === 'all' || apprenant.formation === filterFormation;
    const matchStatus = filterStatus === 'all' || apprenant.status === filterStatus;
    return matchSearch && matchFormation && matchStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'actif':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">Actif</span>;
      case 'inactif':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">Inactif</span>;
      case 'termine':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">Terminé</span>;
      default:
        return null;
    }
  };

  const getProgressColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/formateur/dashboard" className="text-purple-600 hover:underline flex items-center gap-1 mb-4">
            <ChevronLeft className="h-4 w-4" />
            Retour au tableau de bord
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Users className="h-8 w-8 text-purple-500" />
                Mes Apprenants
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {filteredApprenants.length} apprenant(s) trouvé(s)
              </p>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un apprenant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={filterFormation}
                onChange={(e) => setFilterFormation(e.target.value)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Toutes les formations</option>
                {formations.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
                <option value="termine">Terminé</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Actifs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {apprenants.filter(a => a.status === 'actif').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <UserX className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm text-gray-500">Inactifs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {apprenants.filter(a => a.status === 'inactif').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Terminés</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {apprenants.filter(a => a.status === 'termine').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Moyenne notes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {apprenants.length > 0
                    ? `${(apprenants.reduce((sum, a) => sum + a.notes_moyenne, 0) / apprenants.length).toFixed(1)}/20`
                    : '0.0/20'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des apprenants */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Apprenant</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Formation</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Progression</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Présence</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Moyenne</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Statut</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApprenants.map((apprenant) => (
                  <tr key={apprenant.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <span className="text-purple-600 dark:text-purple-400 font-semibold">
                            {apprenant.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{apprenant.name}</p>
                          <p className="text-sm text-gray-500">{apprenant.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded">
                        {apprenant.formation}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getProgressColor(apprenant.progression)} rounded-full`}
                            style={{ width: `${apprenant.progression}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{apprenant.progression}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-sm font-medium ${apprenant.taux_presence >= 80 ? 'text-green-600' :
                        apprenant.taux_presence >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                        {apprenant.taux_presence}%
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {apprenant.notes_moyenne.toFixed(1)}/20
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(apprenant.status)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                          title="Voir le profil"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                          title="Envoyer un message"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredApprenants.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun apprenant trouvé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
