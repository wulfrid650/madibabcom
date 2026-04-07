'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  Check,
  X,
  Clock,
  AlertCircle,
  Download,
  Filter
} from 'lucide-react';

interface ApprenantPresence {
  id: number;
  name: string;
  formation: string;
  status: 'present' | 'absent' | 'retard' | 'excuse' | null;
  heure_arrivee?: string;
  commentaire?: string;
}

interface JourPresence {
  date: string;
  formation: string;
  cours: string;
  apprenants: ApprenantPresence[];
}

export default function FormateurPresencesPage() {
  const router = useRouter();
  const { user, token, hasRole } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedFormation, setSelectedFormation] = useState('all');
  const [presences, setPresences] = useState<JourPresence | null>(null);
  const [showStats, setShowStats] = useState(false);

  const formations = ['BIM', 'Métrage', 'Enscape', 'Twinmotion', 'Assistant Maçon', 'Électroménager'];

  const loadPresences = useCallback(async () => {
    setIsLoading(true);
    setTimeout(() => {
      setPresences({
        date: selectedDate,
        formation: selectedFormation === 'all' ? 'BIM' : selectedFormation,
        cours: 'Introduction à Revit - Module 3',
        apprenants: [
          { id: 1, name: 'Jean Kouame', formation: 'BIM', status: 'present', heure_arrivee: '08:00' },
          { id: 2, name: 'Marie Diallo', formation: 'BIM', status: 'present', heure_arrivee: '08:05' },
          { id: 3, name: 'Paul Mensah', formation: 'BIM', status: 'retard', heure_arrivee: '08:45', commentaire: 'Transport' },
          { id: 4, name: 'Aminata Bah', formation: 'BIM', status: 'absent' },
          { id: 5, name: 'Kofi Asante', formation: 'BIM', status: 'excuse', commentaire: 'Maladie - certificat fourni' },
          { id: 6, name: 'Fatou Ndiaye', formation: 'BIM', status: null },
          { id: 7, name: 'Ibrahim Traore', formation: 'BIM', status: null },
          { id: 8, name: 'Aisha Diop', formation: 'BIM', status: 'present', heure_arrivee: '07:55' },
        ],
      });
      setIsLoading(false);
    }, 300);
  }, [selectedDate, selectedFormation]);

  useEffect(() => {
    if (!token || !user) {
      router.push('/connexion');
      return;
    }

    if (!hasRole('formateur')) {
      router.push('/dashboard');
      return;
    }

    void loadPresences();
  }, [token, user, hasRole, router, loadPresences]);

  const updatePresence = (apprenantId: number, status: 'present' | 'absent' | 'retard' | 'excuse') => {
    if (!presences) return;

    setPresences({
      ...presences,
      apprenants: presences.apprenants.map(a =>
        a.id === apprenantId
          ? { ...a, status, heure_arrivee: status === 'present' ? new Date().toTimeString().slice(0, 5) : a.heure_arrivee }
          : a
      ),
    });
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'present':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'absent':
        return <X className="h-5 w-5 text-red-500" />;
      case 'retard':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'excuse':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <span className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusLabel = (status: string | null) => {
    const labels: Record<string, string> = {
      present: 'Présent',
      absent: 'Absent',
      retard: 'Retard',
      excuse: 'Excusé',
    };
    return status ? labels[status] : 'Non marqué';
  };

  const stats = presences ? {
    presents: presences.apprenants.filter(a => a.status === 'present').length,
    absents: presences.apprenants.filter(a => a.status === 'absent').length,
    retards: presences.apprenants.filter(a => a.status === 'retard').length,
    excuses: presences.apprenants.filter(a => a.status === 'excuse').length,
    nonMarques: presences.apprenants.filter(a => a.status === null).length,
  } : null;

  if (isLoading && !presences) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/formateur/dashboard" className="text-purple-600 hover:underline flex items-center gap-1 mb-4">
            <ChevronLeft className="h-4 w-4" />
            Retour au tableau de bord
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Calendar className="h-8 w-8 text-purple-500" />
                Gestion des Présences
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Enregistrez et suivez la présence de vos apprenants
              </p>
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Sélection date et formation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => changeDate(-1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="text-center">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-center font-medium"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
              <button
                onClick={() => changeDate(1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <select
                value={selectedFormation}
                onChange={(e) => setSelectedFormation(e.target.value)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="all">Toutes les formations</option>
                {formations.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              >
                Aujourd&apos;hui
              </Button>
            </div>
          </div>
        </div>

        {/* Stats rapides */}
        {stats && (
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center border border-green-200 dark:border-green-800">
              <Check className="h-6 w-6 text-green-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.presents}</p>
              <p className="text-xs text-green-600 dark:text-green-500">Présents</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center border border-red-200 dark:border-red-800">
              <X className="h-6 w-6 text-red-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.absents}</p>
              <p className="text-xs text-red-600 dark:text-red-500">Absents</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 text-center border border-yellow-200 dark:border-yellow-800">
              <Clock className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.retards}</p>
              <p className="text-xs text-yellow-600 dark:text-yellow-500">Retards</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center border border-blue-200 dark:border-blue-800">
              <AlertCircle className="h-6 w-6 text-blue-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.excuses}</p>
              <p className="text-xs text-blue-600 dark:text-blue-500">Excusés</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-600">
              <Users className="h-6 w-6 text-gray-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{stats.nonMarques}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Non marqués</p>
            </div>
          </div>
        )}

        {/* Info cours */}
        {presences && (
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 mb-6 border border-purple-200 dark:border-purple-800">
            <p className="text-sm text-purple-600 dark:text-purple-400">Cours du jour</p>
            <p className="font-semibold text-purple-800 dark:text-purple-300">{presences.cours}</p>
            <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">Formation: {presences.formation}</p>
          </div>
        )}

        {/* Liste des apprenants */}
        {presences && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Liste des apprenants ({presences.apprenants.length})
              </h2>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => presences.apprenants.forEach(a => !a.status && updatePresence(a.id, 'present'))}
                >
                  Tous présents
                </Button>
              </div>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {presences.apprenants.map((apprenant) => (
                <div
                  key={apprenant.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <span className="text-purple-600 dark:text-purple-400 font-semibold">
                        {apprenant.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{apprenant.name}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {getStatusIcon(apprenant.status)}
                        <span>{getStatusLabel(apprenant.status)}</span>
                        {apprenant.heure_arrivee && (
                          <span className="text-xs">({apprenant.heure_arrivee})</span>
                        )}
                        {apprenant.commentaire && (
                          <span className="text-xs italic">- {apprenant.commentaire}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updatePresence(apprenant.id, 'present')}
                      className={`p-2 rounded-lg transition-colors ${apprenant.status === 'present'
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/30'
                          : 'hover:bg-green-50 text-gray-400 hover:text-green-600 dark:hover:bg-green-900/20'
                        }`}
                      title="Présent"
                    >
                      <Check className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => updatePresence(apprenant.id, 'absent')}
                      className={`p-2 rounded-lg transition-colors ${apprenant.status === 'absent'
                          ? 'bg-red-100 text-red-600 dark:bg-red-900/30'
                          : 'hover:bg-red-50 text-gray-400 hover:text-red-600 dark:hover:bg-red-900/20'
                        }`}
                      title="Absent"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => updatePresence(apprenant.id, 'retard')}
                      className={`p-2 rounded-lg transition-colors ${apprenant.status === 'retard'
                          ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30'
                          : 'hover:bg-yellow-50 text-gray-400 hover:text-yellow-600 dark:hover:bg-yellow-900/20'
                        }`}
                      title="Retard"
                    >
                      <Clock className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => updatePresence(apprenant.id, 'excuse')}
                      className={`p-2 rounded-lg transition-colors ${apprenant.status === 'excuse'
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                          : 'hover:bg-blue-50 text-gray-400 hover:text-blue-600 dark:hover:bg-blue-900/20'
                        }`}
                      title="Excusé"
                    >
                      <AlertCircle className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <Button className="bg-purple-600 hover:bg-purple-700">
                Enregistrer les présences
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
