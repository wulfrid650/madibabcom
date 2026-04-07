'use client';

import { useEffect, useState } from 'react';
import { api, ChefChantierChantierPayload, ChefChantierTeam } from '@/lib/api';

type Props = {
  heading: string;
  submitLabel: string;
  initialValues: ChefChantierChantierPayload;
  submitting: boolean;
  error?: string | null;
  onSubmit: (values: ChefChantierChantierPayload) => void | Promise<void>;
  onCancel: () => void;
};

const STATUS_OPTIONS: Array<{ value: NonNullable<ChefChantierChantierPayload['status']>; label: string }> = [
  { value: 'pending', label: 'En attente' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'on_hold', label: 'En pause' },
  { value: 'completed', label: 'Terminé' },
];

const PRIORITY_OPTIONS: Array<{ value: NonNullable<ChefChantierChantierPayload['priority']>; label: string }> = [
  { value: 'high', label: 'Haute' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'low', label: 'Basse' },
];

function normalizeDate(date?: string): string {
  if (!date) return '';
  return date.includes('T') ? date.split('T')[0] : date;
}

export default function ChantierForm({
  heading,
  submitLabel,
  initialValues,
  submitting,
  error,
  onSubmit,
  onCancel,
}: Props) {
  const [values, setValues] = useState<ChefChantierChantierPayload>(initialValues);
  const [availableTeams, setAvailableTeams] = useState<ChefChantierTeam[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  useEffect(() => {
    let cancelled = false;

    const loadTeams = async () => {
      try {
        setTeamsLoading(true);
        const data = await api.getChefChantierEquipes();
        if (!cancelled) {
          setAvailableTeams(data);
        }
      } catch {
        if (!cancelled) {
          setAvailableTeams([]);
        }
      } finally {
        if (!cancelled) {
          setTeamsLoading(false);
        }
      }
    };

    void loadTeams();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (key: keyof ChefChantierChantierPayload, value: string) => {
    if (key === 'progress') {
      const parsed = Number(value);
      setValues((prev) => ({ ...prev, progress: Number.isNaN(parsed) ? 0 : parsed }));
      return;
    }

    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const toggleConstructionTeam = (teamId: number) => {
    setValues((prev) => {
      const currentIds = Array.isArray(prev.construction_team_ids) ? prev.construction_team_ids : [];
      const nextIds = currentIds.includes(teamId)
        ? currentIds.filter((id) => id !== teamId)
        : [...currentIds, teamId];

      return {
        ...prev,
        construction_team_ids: nextIds,
      };
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          ...values,
          start_date: normalizeDate(values.start_date),
          expected_end_date: normalizeDate(values.expected_end_date),
          progress: Number(values.progress ?? 0),
          priority: values.priority || 'medium',
          construction_team_ids: Array.isArray(values.construction_team_ids) ? values.construction_team_ids : [],
        });
      }}
      className="space-y-6"
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">{heading}</h1>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
            <input
              required
              value={values.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Ex: Immeuble R+4 Bonamoussadi"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
            <input
              value={values.category || ''}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Construction"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Localisation</label>
            <input
              value={values.location || ''}
              onChange={(e) => handleChange('location', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Douala, Cameroun"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              value={values.status || 'pending'}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
            <select
              value={values.priority || 'medium'}
              onChange={(e) => handleChange('priority', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Progression (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={values.progress ?? 0}
              onChange={(e) => handleChange('progress', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
            <input
              type="date"
              value={normalizeDate(values.start_date)}
              onChange={(e) => handleChange('start_date', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fin prévue</label>
            <input
              type="date"
              value={normalizeDate(values.expected_end_date)}
              onChange={(e) => handleChange('expected_end_date', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
            <input
              value={values.budget || ''}
              onChange={(e) => handleChange('budget', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Ex: 150 000 000 FCFA"
            />
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between gap-3 mb-2">
              <label className="block text-sm font-medium text-gray-700">Équipes affectées</label>
              {teamsLoading ? <span className="text-xs text-gray-500">Chargement...</span> : null}
            </div>

            {availableTeams.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500">
                Aucune équipe disponible pour le moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {availableTeams.map((team) => {
                  const selected = Array.isArray(values.construction_team_ids)
                    ? values.construction_team_ids.includes(team.id)
                    : false;

                  return (
                    <label
                      key={team.id}
                      className={`flex items-start gap-3 rounded-lg border px-4 py-3 transition-colors ${
                        selected
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-gray-200 bg-white hover:border-amber-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleConstructionTeam(team.id)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-gray-900">{team.name}</span>
                        <span className="block text-xs text-gray-500">
                          {team.specialization || 'Spécialité non renseignée'} · {team.members} membre(s)
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={5}
              value={values.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Détails du chantier..."
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {submitting ? 'Enregistrement...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
