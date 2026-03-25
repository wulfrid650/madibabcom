'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Image as ImageIcon, MapPin, Calendar, User, MoreVertical, Loader2 } from 'lucide-react';
import { api, ChefChantierUpdate, PortfolioProject } from '@/lib/api';

export default function AvantementsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [updates, setUpdates] = useState<ChefChantierUpdate[]>([]);
  const [chantiers, setChantiers] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    project_id: '',
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Brouillon' as 'Publié' | 'Brouillon' | 'Archivé',
    progress: '',
  });

  useEffect(() => {
    const fetchUpdates = async () => {
      setLoading(true);
      try {
        const data = await api.getChefChantierAvancements(searchTerm);
        setUpdates(data);
        const chantierData = await api.getChefChantierChantiers();
        setChantiers(chantierData);
        setError(null);
      } catch (err) {
        setError('Impossible de charger les avancements.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search slightly
    const timer = setTimeout(() => {
      fetchUpdates();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const resetForm = () => {
    setForm({
      project_id: '',
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      status: 'Brouillon',
      progress: '',
    });
  };

  const reloadData = async () => {
    const data = await api.getChefChantierAvancements(searchTerm);
    setUpdates(data);
  };

  const handleCreateAvancement = async () => {
    if (!form.project_id || !form.title.trim() || !form.description.trim()) {
      setError('Veuillez renseigner le chantier, le titre et la description.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await api.createChefChantierAvancement({
        project_id: Number(form.project_id),
        title: form.title.trim(),
        description: form.description.trim(),
        date: form.date,
        status: form.status,
        progress: form.progress ? Number(form.progress) : undefined,
      });

      if (!response.success) {
        setError(response.message || 'Impossible de créer l’avancement.');
        return;
      }

      setShowCreateModal(false);
      resetForm();
      await reloadData();
    } catch (err) {
      console.error(err);
      setError('Impossible de créer l’avancement.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (id: number) => {
    setError(null);
    try {
      const response = await api.updateChefChantierAvancement(id, { status: 'Publié' });
      if (!response.success) {
        setError(response.message || 'Impossible de publier cet avancement.');
        return;
      }
      await reloadData();
    } catch (err) {
      console.error(err);
      setError('Impossible de publier cet avancement.');
    }
  };

  const filteredAdvancements = updates.filter((adv) => {
    // API handles search, but we handle status locally for better UI UX on small datasets or we can add status filter to API
    // Since API doesn't support status filter in getChefChantierAvancements (yet), we do it here.
    const matchesStatus = filterStatus === 'all' || adv.status === filterStatus;
    return matchesStatus;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Publié':
        return 'bg-green-100 text-green-800';
      case 'Brouillon':
        return 'bg-yellow-100 text-yellow-800';
      case 'Archivé':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && updates.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Avancements</h1>
          <p className="text-gray-600 mt-1">
            Publiez les progrès et photos de vos chantiers
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreateModal(true);
            resetForm();
          }}
          className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Nouvel avancement</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1 md:mr-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par titre ou chantier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="Publié">Publié</option>
            <option value="Brouillon">Brouillon</option>
            <option value="Archivé">Archivé</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Advancements List */}
      <div className="space-y-4">
        {filteredAdvancements.map((advancement) => (
          <div key={advancement.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {advancement.title}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                        advancement.status
                      )}`}
                    >
                      {advancement.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{advancement.project}</p>
                </div>
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>

              <p className="text-gray-700 mb-4">{advancement.description}</p>

              {/* Meta information */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(advancement.date).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>{advancement.author}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ImageIcon className="h-4 w-4" />
                  <span>{advancement.images} photo(s)</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors text-sm">
                  Voir détails
                </button>
                {advancement.status === 'Brouillon' && (
                  <>
                    <button
                      onClick={() => handlePublish(advancement.id)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm"
                    >
                      Publier
                    </button>
                    <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition-colors text-sm">
                      Éditer
                    </button>
                  </>
                )}
                <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium transition-colors text-sm">
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && filteredAdvancements.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600 text-lg">Aucun avancement trouvé</p>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-gray-900">Nouvel avancement</h2>
            <p className="mt-1 text-sm text-gray-500">Créer un avancement et le lier à un chantier.</p>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Chantier *</label>
                <select
                  value={form.project_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, project_id: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="">Sélectionner un chantier</option>
                  {chantiers.map((chantier) => (
                    <option key={chantier.id} value={String(chantier.id)}>
                      {chantier.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Date *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Statut</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as 'Publié' | 'Brouillon' | 'Archivé' }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="Brouillon">Brouillon</option>
                  <option value="Publié">Publié</option>
                  <option value="Archivé">Archivé</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Titre *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="Ex: Coulage dalle niveau 1"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Description *</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="Décrire l’état d’avancement..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Progression (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.progress}
                  onChange={(e) => setForm((prev) => ({ ...prev, progress: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleCreateAvancement}
                className="rounded-lg bg-amber-600 px-4 py-2 text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {saving ? 'Création...' : 'Créer l’avancement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
