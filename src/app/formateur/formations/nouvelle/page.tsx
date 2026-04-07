'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Save } from 'lucide-react';
import { api } from '@/lib/api';

const levels = [
  { value: 'debutant', label: 'Débutant' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'avance', label: 'Avancé' },
];

const categories = ['BIM', 'Rendu 3D', 'Architecture', 'Design intérieur', 'Structure', 'Autre'];

function toList(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.replace(/^-+\s*/, '').trim())
    .filter(Boolean);
}

export default function NouvelleFormationFormateurPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    is_active: false,
    is_featured: false,
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? (event.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const createdFormation = await api.createFormateurFormation({
        title: formData.title,
        description: formData.description,
        objectives: toList(formData.objectives),
        prerequisites: toList(formData.prerequisites),
        program: toList(formData.program),
        duration_hours: formData.duration_hours ? Number(formData.duration_hours) : undefined,
        duration_days: formData.duration_days ? Number(formData.duration_days) : undefined,
        price: Number(formData.price) || 0,
        registration_fees: formData.registration_fees ? Number(formData.registration_fees) : 0,
        level: formData.level,
        category: formData.category,
        max_students: Number(formData.max_students) || 10,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
      });

      router.push(`/formateur/formations/${createdFormation.id}`);
    } catch (submitError) {
      console.error('Erreur création formation formateur:', submitError);
      setError('Impossible de créer la formation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/formateur/formations"
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Créer une formation</h1>
          <p className="text-gray-500 dark:text-gray-400">Proposez un nouveau parcours et préparez vos prochaines sessions.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-200">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-0.5 h-4 w-4" />
          <p>
            Votre formation sera créée en brouillon par défaut. Vous pourrez ensuite la compléter, lui ajouter des sessions
            et l&apos;activer lorsque tout sera prêt.
          </p>
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
                    placeholder="Ex: Formation Rendu 3D avec Enscape"
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
                    placeholder="Description courte de la formation..."
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
                    placeholder="- Maîtriser les bases du rendu temps réel&#10;- Créer des visuels photoréalistes&#10;- Produire des vidéos animées"
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
                    placeholder="Connaissances requises, matériel conseillé..."
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Programme détaillé</label>
                  <textarea
                    name="program"
                    value={formData.program}
                    onChange={handleChange}
                    rows={6}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-madiba-red dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Module 1: Introduction&#10;Module 2: Mise en pratique"
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
                    required
                    min="1"
                    max="100"
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
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Activer après création</span>
                    <p className="text-xs text-gray-500">Sinon la formation reste en brouillon</p>
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
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Mettre en avant</span>
                    <p className="text-xs text-gray-500">Visible comme formation phare</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-700">
          <Link
            href="/formateur/formations"
            className="inline-flex items-center rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center rounded-lg bg-madiba-red px-5 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Création...' : 'Créer la formation'}
          </button>
        </div>
      </form>
    </div>
  );
}
