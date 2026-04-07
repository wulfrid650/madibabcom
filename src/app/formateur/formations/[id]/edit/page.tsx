'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, BookOpen } from 'lucide-react';
import { api, type Formation } from '@/lib/api';

const levels = [
  { value: 'debutant', label: 'Débutant' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'avance', label: 'Avancé' },
];

const categories = ['BIM', 'Rendu 3D', 'Architecture', 'Design intérieur', 'Structure', 'Autre'];

function toText(value?: string[] | string | null): string {
  if (!value) {
    return '';
  }

  if (Array.isArray(value)) {
    return value.join('\n');
  }

  return value;
}

function toList(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.replace(/^-+\s*/, '').trim())
    .filter(Boolean);
}

export default function EditFormationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const formationId = params?.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formation, setFormation] = useState<Formation | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    objectives: '',
    prerequisites: '',
    program: '',
    duration_hours: '',
    duration_days: '',
    price: '',
    registration_fees: '',
    level: 'debutant',
    category: 'BIM',
    max_students: '10',
    is_active: true,
    is_featured: false,
  });

  useEffect(() => {
    const loadFormation = async () => {
      if (!formationId) {
        setError('Identifiant de formation manquant.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await api.getFormateurFormation(formationId);
        setFormation(data);
        setFormData({
          title: data.title || '',
          description: data.description || '',
          objectives: toText(data.objectives as string[] | string | null),
          prerequisites: toText(data.prerequisites as string[] | string | null),
          program: toText(data.program as string[] | string | null),
          duration_hours: data.duration_hours?.toString() || '',
          duration_days: data.duration_days?.toString() || '',
          price: data.price?.toString() || '',
          registration_fees: data.registration_fees?.toString() || '',
          level: data.level || 'debutant',
          category: data.category || 'BIM',
          max_students: data.max_students?.toString() || '10',
          is_active: Boolean(data.is_active),
          is_featured: Boolean(data.is_featured),
        });
        setError(null);
      } catch (loadError) {
        console.error('Erreur chargement formation à éditer:', loadError);
        setError('Impossible de charger la formation.');
      } finally {
        setLoading(false);
      }
    };

    void loadFormation();
  }, [formationId]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? (event.target as HTMLInputElement).checked : value,
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

      await api.updateFormateurFormation(formationId, {
        ...formData,
        objectives: toList(formData.objectives),
        prerequisites: toList(formData.prerequisites),
        program: toList(formData.program),
        duration_hours: formData.duration_hours ? Number(formData.duration_hours) : undefined,
        duration_days: formData.duration_days ? Number(formData.duration_days) : undefined,
        price: Number(formData.price) || 0,
        registration_fees: formData.registration_fees ? Number(formData.registration_fees) : 0,
        max_students: Number(formData.max_students) || 10,
      });

      router.push(`/formateur/formations/${formationId}`);
    } catch (saveError) {
      console.error('Erreur mise à jour formation:', saveError);
      setError('Impossible de mettre à jour la formation.');
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
      <div className="flex items-center gap-4">
        <Link
          href={formationId ? `/formateur/formations/${formationId}` : '/formateur/formations'}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Modifier la formation</h1>
          <p className="text-gray-500 dark:text-gray-400">Ajustez le contenu, la durée et la publication.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Informations générales</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Titre de la formation *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-madiba-red dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-madiba-red dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Objectifs pédagogiques</label>
                  <textarea
                    name="objectives"
                    value={formData.objectives}
                    onChange={handleChange}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-madiba-red dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Prérequis</label>
                  <textarea
                    name="prerequisites"
                    value={formData.prerequisites}
                    onChange={handleChange}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-madiba-red dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Programme</label>
                  <textarea
                    name="program"
                    value={formData.program}
                    onChange={handleChange}
                    rows={6}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-madiba-red dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Paramètres</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Durée (jours)</label>
                    <input
                      type="number"
                      name="duration_days"
                      value={formData.duration_days}
                      onChange={handleChange}
                      min="1"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-madiba-red dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Durée (heures)</label>
                    <input
                      type="number"
                      name="duration_hours"
                      value={formData.duration_hours}
                      onChange={handleChange}
                      min="1"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-madiba-red dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Prix (FCFA) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="1000"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-madiba-red dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Frais d'inscription (FCFA)</label>
                  <input
                    type="number"
                    name="registration_fees"
                    value={formData.registration_fees}
                    onChange={handleChange}
                    min="0"
                    step="1000"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-madiba-red dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Places maximum *</label>
                  <input
                    type="number"
                    name="max_students"
                    value={formData.max_students}
                    onChange={handleChange}
                    min="1"
                    max="100"
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-madiba-red dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Niveau</label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-madiba-red dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    {levels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Catégorie</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-madiba-red dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Publication</h2>
              <div className="space-y-4">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="h-5 w-5 rounded border-gray-300 text-madiba-red focus:ring-madiba-red"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Activer</span>
                    <p className="text-xs text-gray-500">Visible dans le catalogue formateur</p>
                  </div>
                </label>

                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleChange}
                    className="h-5 w-5 rounded border-gray-300 text-madiba-red focus:ring-madiba-red"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Mise en avant</span>
                    <p className="text-xs text-gray-500">Afficher comme formation phare</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-700">
          <Link
            href={formationId ? `/formateur/formations/${formationId}` : '/formateur/formations'}
            className="inline-flex items-center rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center rounded-lg bg-madiba-red px-5 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-200">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-0.5 h-4 w-4" />
          <p>
            Les listes du programme, des objectifs et des prérequis sont enregistrées comme des tableaux côté backend.
            Tu peux donc garder une ligne par point pour une lecture claire dans le détail.
          </p>
        </div>
      </div>
    </div>
  );
}
