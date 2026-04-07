'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Clock3,
  Search,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import {
  getFormateurCertificats,
  requestFormateurCertificat,
  type FormateurCertificateEnrollment,
} from '@/lib/api';

export default function FormateurCertificatsPage() {
  const [items, setItems] = useState<FormateurCertificateEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyEnrollmentId, setBusyEnrollmentId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    void loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await getFormateurCertificats();
      setItems(response.data || []);
    } catch (error) {
      console.error('Error loading formateur certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = !searchTerm
        || item.learner_name.toLowerCase().includes(searchTerm.toLowerCase())
        || item.learner_email?.toLowerCase().includes(searchTerm.toLowerCase())
        || item.formation.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || item.workflow_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [items, searchTerm, statusFilter]);

  const handleRequest = async (item: FormateurCertificateEnrollment) => {
    const notes = window.prompt('Note pour le secrétariat (optionnelle) :', '') ?? '';

    try {
      setBusyEnrollmentId(item.enrollment_id);
      await requestFormateurCertificat(item.enrollment_id, notes.trim() || undefined);
      await loadItems();
    } catch (error) {
      console.error('Error requesting certificate:', error);
      alert('Impossible de transmettre cette demande de certificat.');
    } finally {
      setBusyEnrollmentId(null);
    }
  };

  const getStatusBadge = (status: FormateurCertificateEnrollment['workflow_status']) => {
    switch (status) {
      case 'generated':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'pending_secretary':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      case 'rejected':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
      case 'invalidated':
        return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
      case 'ready_for_request':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const stats = {
    ready: items.filter((item) => item.workflow_status === 'ready_for_request' || item.workflow_status === 'in_progress').length,
    pending: items.filter((item) => item.workflow_status === 'pending_secretary').length,
    generated: items.filter((item) => item.workflow_status === 'generated').length,
    invalidated: items.filter((item) => item.workflow_status === 'invalidated').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Certificats apprenants</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Signalez les apprenants qui ont réellement terminé leur session. Le secrétariat valide ensuite la demande.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <UserCheck className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">À traiter</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.ready}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Clock3 className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">En attente secrétariat</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Générés</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.generated}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-slate-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Invalidés</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.invalidated}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Rechercher un apprenant ou une formation..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Tous les statuts</option>
            <option value="in_progress">Formation en cours</option>
            <option value="ready_for_request">Formation terminée, demande possible</option>
            <option value="pending_secretary">En attente du secrétariat</option>
            <option value="generated">Certificat généré</option>
            <option value="rejected">Refusé</option>
            <option value="invalidated">Invalidé</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[320px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-500 dark:text-gray-400">
          Aucun apprenant ne correspond à ces filtres.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div
              key={item.enrollment_id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{item.learner_name}</h2>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(item.workflow_status)}`}>
                      {item.workflow_label}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Formation</p>
                      <p className="font-medium text-gray-900 dark:text-white">{item.formation}</p>
                      <p className="text-gray-500 dark:text-gray-400">{item.learner_email || 'Email non renseigné'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Session</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.session_start_date || 'N/A'} au {item.session_end_date || 'N/A'}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">{item.session_location || 'Lieu non renseigné'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Certificat</p>
                      <p className="font-mono font-medium text-gray-900 dark:text-white">{item.certificate_reference || 'Non généré'}</p>
                      <p className="text-gray-500 dark:text-gray-400">Terminé: {item.completedDate || 'Pas encore clôturé'}</p>
                    </div>
                  </div>

                  {item.decision_notes && (
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-3 text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Note du secrétariat:</span> {item.decision_notes}
                    </div>
                  )}

                  {item.invalidation_reason && (
                    <div className="rounded-lg bg-rose-50 dark:bg-rose-900/20 p-3 text-sm text-rose-700 dark:text-rose-300">
                      <span className="font-semibold">Motif d’invalidation:</span> {item.invalidation_reason}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 xl:justify-end">
                  {item.can_request && (
                    <button
                      onClick={() => void handleRequest(item)}
                      disabled={busyEnrollmentId === item.enrollment_id}
                      className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-60"
                    >
                      {busyEnrollmentId === item.enrollment_id ? 'Envoi...' : 'Demander le certificat'}
                    </button>
                  )}

                  {item.workflow_status === 'generated' && item.certificate_reference && (
                    <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      <Award className="h-4 w-4" />
                      Certificat visible côté apprenant
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
