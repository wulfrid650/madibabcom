'use client';

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Download, FileText, Loader2, Plus, Search, Upload, X } from 'lucide-react';
import { api, ChefChantierReport, PortfolioProject } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/media';

type ReportFormState = {
  chantier_id: string;
  title: string;
  type: 'Avancement' | 'Securite';
  content: string;
};

const EMPTY_FORM: ReportFormState = {
  chantier_id: '',
  title: '',
  type: 'Avancement',
  content: '',
};

function getTypeColor(type: string) {
  if (type.toLowerCase().includes('secur')) {
    return 'bg-red-100 text-red-800';
  }

  return 'bg-blue-100 text-blue-800';
}

export default function RapportsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [reports, setReports] = useState<ChefChantierReport[]>([]);
  const [chantiers, setChantiers] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<ReportFormState>(EMPTY_FORM);
  const [attachment, setAttachment] = useState<File | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const [reportsData, chantiersData] = await Promise.all([
        api.getChefChantierRapports(searchTerm, filterType),
        api.getChefChantierChantiers(),
      ]);

      setReports(reportsData);
      setChantiers(chantiersData);
      setError(null);
    } catch (loadError) {
      console.error(loadError);
      setError('Impossible de charger les rapports.');
    } finally {
      setLoading(false);
    }
  }, [filterType, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadReports();
    }, 250);

    return () => clearTimeout(timer);
  }, [loadReports]);

  const filteredReports = useMemo(() => {
    if (filterType === 'all') {
      return reports;
    }

    return reports.filter((report) => report.type === filterType);
  }, [filterType, reports]);

  const closeModal = () => {
    if (isSubmitting) return;
    setShowCreateModal(false);
    setForm(EMPTY_FORM);
    setAttachment(null);
  };

  const handleAttachment = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setAttachment(file);
  };

  const handleSubmitReport = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.chantier_id || !form.title.trim() || !form.content.trim()) {
      setError('Le chantier, le titre et le contenu sont obligatoires.');
      return;
    }

    if (!attachment) {
      setError('Ajoute un fichier PDF, DOC ou DOCX pour creer le rapport.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await api.createChefChantierRapport({
        chantier_id: Number(form.chantier_id),
        title: form.title.trim(),
        type: form.type,
        content: form.content.trim(),
        attachments: [attachment],
      });

      if (!response.success) {
        setError(response.message || 'Erreur lors de la creation du rapport.');
        return;
      }

      closeModal();
      await loadReports();
    } catch (submitError) {
      console.error(submitError);
      setError('Une erreur est survenue lors de la creation du rapport.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && reports.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rapports</h1>
          <p className="text-gray-600 mt-1">{filteredReports.length} rapport(s) disponible(s)</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 rounded-lg bg-amber-600 px-4 py-2 font-medium text-white transition-colors hover:bg-amber-700"
        >
          <Plus className="h-5 w-5" />
          <span>Nouveau rapport</span>
        </button>
      </div>

      <div className="rounded-lg bg-white p-6 shadow space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="relative flex-1 md:mr-4">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par titre ou chantier..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(event) => setFilterType(event.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">Tous les types</option>
            <option value="Avancement">Avancement</option>
            <option value="Securite">Securite</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Titre</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Chantier</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Auteur</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Pages</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{report.title}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{report.project}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeColor(report.type)}`}>
                      {report.type}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{report.author}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{new Date(report.date).toLocaleDateString('fr-FR')}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{report.pages} p.</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    {report.file_url ? (
                      <a
                        href={resolveMediaUrl(report.file_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-amber-600 transition-colors hover:text-amber-800"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Ouvrir
                      </a>
                    ) : (
                      <span className="text-gray-400">Indisponible</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && filteredReports.length === 0 && (
        <div className="rounded-lg bg-white py-12 text-center shadow">
          <p className="text-lg text-gray-600">Aucun rapport trouve</p>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Nouveau rapport</h2>
                <p className="mt-1 text-sm text-gray-500">Le rapport doit etre rattache a un chantier accessible par ce chef.</p>
              </div>
              <button type="button" onClick={closeModal} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="mt-4 grid grid-cols-1 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Chantier *</label>
                <select
                  value={form.chantier_id}
                  onChange={(event) => setForm((prev) => ({ ...prev, chantier_id: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="">Selectionner un chantier</option>
                  {chantiers.map((chantier) => (
                    <option key={chantier.id} value={String(chantier.id)}>
                      {chantier.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Titre *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    placeholder="Ex: Rapport hebdomadaire chantier"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={form.type}
                    onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as ReportFormState['type'] }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  >
                    <option value="Avancement">Avancement</option>
                    <option value="Securite">Securite</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Contenu *</label>
                <textarea
                  rows={5}
                  value={form.content}
                  onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="Resume du rapport..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Fichier PDF/DOC/DOCX *</label>
                <label className="flex cursor-pointer items-center rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50">
                  <Upload className="mr-2 h-4 w-4" />
                  <span>{attachment ? attachment.name : 'Choisir un fichier'}</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleAttachment}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center rounded-lg bg-amber-600 px-4 py-2 text-white hover:bg-amber-700 disabled:opacity-60"
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  {isSubmitting ? 'Creation...' : 'Creer le rapport'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
