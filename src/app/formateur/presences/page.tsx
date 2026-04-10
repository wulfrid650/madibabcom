'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { api, getPresences, savePresences, type Formation, type FormationSession } from '@/lib/api';
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  X,
} from 'lucide-react';

type PresenceStatus = 'present' | 'absent' | 'late' | 'excused' | null;

interface ApprenantPresence {
  id: number;
  name: string;
  formation: string;
  status: PresenceStatus;
  heure_arrivee?: string | null;
  commentaire?: string | null;
}

interface JourPresence {
  date: string;
  formation: string;
  cours: string;
  apprenants: ApprenantPresence[];
}

interface SessionOption {
  id: number;
  label: string;
}

function formatSessionLabel(formation: Formation, session: FormationSession): string {
  const start = new Date(session.start_date).toLocaleDateString('fr-FR');
  const end = new Date(session.end_date).toLocaleDateString('fr-FR');
  const parts = [formation.title, `${start} au ${end}`];

  if (session.location) {
    parts.push(session.location);
  }

  return parts.join(' • ');
}

function normalizePresenceStatus(status: string | null | undefined): PresenceStatus {
  if (!status) {
    return null;
  }

  if (status === 'retard') {
    return 'late';
  }

  if (status === 'excuse') {
    return 'excused';
  }

  if (status === 'late' || status === 'excused' || status === 'present' || status === 'absent') {
    return status;
  }

  return null;
}

export default function FormateurPresencesPage() {
  const router = useRouter();
  const { user, token, hasRole } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [presences, setPresences] = useState<JourPresence | null>(null);
  const [formations, setFormations] = useState<Formation[]>([]);

  const sessionOptions = useMemo<SessionOption[]>(() => {
    return formations.flatMap((formation) =>
      (formation.sessions || []).map((session) => ({
        id: session.id,
        label: formatSessionLabel(formation, session),
      }))
    );
  }, [formations]);

  const loadSessions = useCallback(async () => {
    const response = await api.getFormateurFormations(1, '', '', '');
    const items = Array.isArray(response.data) ? response.data : [];
    setFormations(items);
  }, []);

  const loadPresences = useCallback(async () => {
    if (!selectedSessionId) {
      setPresences(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await getPresences({
        date: selectedDate,
        formation_session_id: Number(selectedSessionId),
      });

      const data = response.data;
      setPresences({
        date: data.date,
        formation: data.formation,
        cours: data.cours,
        apprenants: Array.isArray(data.apprenants)
          ? data.apprenants.map((apprenant: ApprenantPresence) => ({
            ...apprenant,
            status: normalizePresenceStatus(apprenant.status),
          }))
          : [],
      });
    } catch (loadError) {
      console.error('Error loading presences:', loadError);
      setError('Impossible de charger les présences pour cette session.');
      setPresences(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, selectedSessionId]);

  useEffect(() => {
    if (!token || !user) {
      router.push('/connexion');
      return;
    }

    if (!hasRole('formateur')) {
      router.push('/dashboard');
      return;
    }

    const initializePage = async () => {
      try {
        setIsLoading(true);
        await loadSessions();
      } catch (loadError) {
        console.error('Error loading sessions:', loadError);
        setError('Impossible de charger les sessions du formateur.');
        setIsLoading(false);
      }
    };

    void initializePage();
  }, [hasRole, loadSessions, router, token, user]);

  useEffect(() => {
    if (!selectedSessionId && sessionOptions.length > 0) {
      setSelectedSessionId(String(sessionOptions[0].id));
    }
  }, [selectedSessionId, sessionOptions]);

  useEffect(() => {
    if (!selectedSessionId) {
      return;
    }

    void loadPresences();
  }, [loadPresences, selectedSessionId]);

  const updatePresence = (apprenantId: number, status: Exclude<PresenceStatus, null>) => {
    if (!presences) {
      return;
    }

    setPresences({
      ...presences,
      apprenants: presences.apprenants.map((apprenant) => {
        if (apprenant.id !== apprenantId) {
          return apprenant;
        }

        return {
          ...apprenant,
          status,
          heure_arrivee: status === 'present' || status === 'late'
            ? (apprenant.heure_arrivee || new Date().toTimeString().slice(0, 5))
            : null,
        };
      }),
    });
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleSavePresences = async () => {
    if (!presences || !selectedSessionId) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await savePresences({
        date: selectedDate,
        formation_session_id: Number(selectedSessionId),
        presences: presences.apprenants
          .filter((apprenant) => apprenant.status !== null)
          .map((apprenant) => ({
            user_id: apprenant.id,
            status: apprenant.status as Exclude<PresenceStatus, null>,
            heure_arrivee: apprenant.heure_arrivee || undefined,
            commentaire: apprenant.commentaire || undefined,
          })),
      });
      setNotice('Les présences ont été enregistrées.');
      await loadPresences();
    } catch (saveError) {
      console.error('Error saving presences:', saveError);
      setError('Impossible d’enregistrer les présences.');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusIcon = (status: PresenceStatus) => {
    switch (status) {
      case 'present':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'absent':
        return <X className="h-5 w-5 text-red-500" />;
      case 'late':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'excused':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <span className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusLabel = (status: PresenceStatus) => {
    const labels: Record<Exclude<PresenceStatus, null>, string> = {
      present: 'Présent',
      absent: 'Absent',
      late: 'Retard',
      excused: 'Excusé',
    };
    return status ? labels[status] : 'Non marqué';
  };

  const stats = presences ? {
    presents: presences.apprenants.filter((apprenant) => apprenant.status === 'present').length,
    absents: presences.apprenants.filter((apprenant) => apprenant.status === 'absent').length,
    retards: presences.apprenants.filter((apprenant) => apprenant.status === 'late').length,
    excuses: presences.apprenants.filter((apprenant) => apprenant.status === 'excused').length,
    nonMarques: presences.apprenants.filter((apprenant) => apprenant.status === null).length,
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
        <div className="mb-8">
          <Link href="/formateur/dashboard" className="text-purple-600 hover:underline flex items-center gap-1 mb-4">
            <ChevronLeft className="h-4 w-4" />
            Retour au tableau de bord
          </Link>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Calendar className="h-8 w-8 text-purple-500" />
                Gestion des Présences
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Enregistrez et suivez la présence réelle de vos apprenants.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {notice && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-300">
            {notice}
          </div>
        )}

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
                  onChange={(event) => setSelectedDate(event.target.value)}
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
                value={selectedSessionId}
                onChange={(event) => setSelectedSessionId(event.target.value)}
                className="min-w-[280px] px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                {sessionOptions.length === 0 ? (
                  <option value="">Aucune session disponible</option>
                ) : (
                  sessionOptions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.label}
                    </option>
                  ))
                )}
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

        {presences && (
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 mb-6 border border-purple-200 dark:border-purple-800">
            <p className="text-sm text-purple-600 dark:text-purple-400">Cours du jour</p>
            <p className="font-semibold text-purple-800 dark:text-purple-300">{presences.cours}</p>
            <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">Formation: {presences.formation}</p>
          </div>
        )}

        {!selectedSessionId && sessionOptions.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            Aucune session n’est encore affectée à ce formateur.
          </div>
        ) : presences ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Liste des apprenants ({presences.apprenants.length})
              </h2>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => presences.apprenants.forEach((apprenant) => {
                    if (!apprenant.status) {
                      updatePresence(apprenant.id, 'present');
                    }
                  })}
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
                      onClick={() => updatePresence(apprenant.id, 'late')}
                      className={`p-2 rounded-lg transition-colors ${apprenant.status === 'late'
                        ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30'
                        : 'hover:bg-yellow-50 text-gray-400 hover:text-yellow-600 dark:hover:bg-yellow-900/20'
                      }`}
                      title="Retard"
                    >
                      <Clock className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => updatePresence(apprenant.id, 'excused')}
                      className={`p-2 rounded-lg transition-colors ${apprenant.status === 'excused'
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
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => void handleSavePresences()}
                disabled={isSaving}
              >
                {isSaving ? 'Enregistrement...' : 'Enregistrer les présences'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            Aucune présence disponible pour cette session et cette date.
          </div>
        )}
      </div>
    </div>
  );
}
