'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, MapPin, Plus, Users } from 'lucide-react';
import { api, type Formation, type FormateurFormationSession } from '@/lib/api';

function formatDate(value?: string): string {
  if (!value) {
    return 'Non défini';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('fr-FR');
}

function formatDateTime(value?: string): string {
  if (!value) {
    return 'Non défini';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('fr-FR');
}

export default function FormationSessionsPage() {
  const params = useParams<{ id: string }>();
  const formationId = params?.id;
  const [formation, setFormation] = useState<Formation | null>(null);
  const [sessions, setSessions] = useState<FormateurFormationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    start_time: '08:00',
    end_time: '17:00',
    location: '',
    max_students: '10',
    status: 'planned' as 'planned' | 'ongoing' | 'completed' | 'cancelled',
  });

  const loadData = async () => {
    if (!formationId) {
      setError('Identifiant de formation manquant.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [formationData, sessionData] = await Promise.all([
        api.getFormateurFormation(formationId),
        api.getFormateurFormationSessions(formationId),
      ]);

      setFormation(formationData);
      setSessions(sessionData);
      setFormData((previous) => ({
        ...previous,
        max_students: formationData.max_students?.toString() || previous.max_students,
      }));
    } catch (loadError) {
      console.error('Erreur chargement sessions formation:', loadError);
      setError('Impossible de charger les sessions de cette formation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [formationId]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formationId) {
      setError('Identifiant de formation manquant.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setNotice(null);

      await api.createFormateurFormationSession(formationId, {
        start_date: formData.start_date,
        end_date: formData.end_date,
        start_time: formData.start_time || undefined,
        end_time: formData.end_time || undefined,
        location: formData.location || undefined,
        max_students: Number(formData.max_students) || formation?.max_students || 10,
        status: formData.status,
      });

      setNotice('Session créée avec succès.');
      setFormData((previous) => ({
        ...previous,
        start_date: '',
        end_date: '',
        location: '',
        status: 'planned',
      }));
      await loadData();
    } catch (submitError) {
      console.error('Erreur création session:', submitError);
      setError('Impossible de créer la session.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[420px]">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-madiba-red" />
      </div>
    );
  }

  if (error && !formation) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
        <p>{error}</p>
        <Link href="/formateur/formations" className="mt-4 inline-flex items-center text-sm font-medium text-madiba-red hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux formations
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link href={formation ? `/formateur/formations/${formation.id}` : '/formateur/formations'} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la formation
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">Sessions de formation</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {formation?.title || 'Formation'} {formation?.max_students ? `• ${formation.max_students} places max` : ''}
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-5 py-4 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Sessions existantes</p>
          <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{sessions.length}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      )}

      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="h-5 w-5 text-madiba-red" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nouvelle session</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Début *</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-madiba-red dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Fin *</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-madiba-red dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Heure début</label>
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-madiba-red dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Heure fin</label>
                <input
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-madiba-red dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Lieu</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-madiba-red dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Douala, salle BIM"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Places</label>
                <input
                  type="number"
                  name="max_students"
                  value={formData.max_students}
                  onChange={handleChange}
                  min="1"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-madiba-red dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Statut</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-madiba-red dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="planned">Planifiée</option>
                  <option value="ongoing">En cours</option>
                  <option value="completed">Terminée</option>
                  <option value="cancelled">Annulée</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full inline-flex items-center justify-center rounded-lg bg-madiba-red px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Création...' : 'Créer la session'}
            </button>
          </form>
        </div>

        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sessions programmées</h2>

          {sessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-10 text-center text-gray-500 dark:text-gray-400">
              Aucune session créée pour le moment.
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                          {session.status}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Session #{session.id}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatDate(session.start_date)} au {formatDate(session.end_date)}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {session.start_time || '--:--'} - {session.end_time || '--:--'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {session.location || 'Lieu non défini'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {session.enrollments_count || 0} inscrit(s) / {session.max_students || formation?.max_students || 0} places
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <div className="inline-flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Créée le {formatDateTime(session.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
