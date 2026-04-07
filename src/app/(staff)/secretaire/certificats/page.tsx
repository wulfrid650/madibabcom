'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { api, type SecretariatCertificateRequest } from '@/lib/api';

export default function SecretaireCertificatsPage() {
  const [requests, setRequests] = useState<SecretariatCertificateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formationFilter, setFormationFilter] = useState<string>('all');
  const [formations, setFormations] = useState<Array<{ id: number; title: string }>>([]);

  const fetchFormations = useCallback(async () => {
    try {
      const data = await api.getFormations();
      setFormations(Array.isArray(data) ? data.map((formation: any) => ({ id: formation.id, title: formation.title })) : []);
    } catch (error) {
      console.error('Error fetching formations:', error);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getSecretaireCertificateRequests({
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        formation_id: formationFilter !== 'all' ? Number(formationFilter) : undefined,
      });
      setRequests(response.data || []);
    } catch (error) {
      console.error('Error fetching certificate requests:', error);
    } finally {
      setLoading(false);
    }
  }, [formationFilter, searchTerm, statusFilter]);

  useEffect(() => {
    void fetchFormations();
  }, [fetchFormations]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (request: SecretariatCertificateRequest) => {
    const notes = window.prompt('Note d’approbation (optionnelle) :', '') ?? '';
    try {
      setBusyId(request.id);
      await api.approveSecretaireCertificateRequest(request.id, notes.trim() || undefined);
      await fetchRequests();
    } catch (error) {
      console.error('Error approving certificate request:', error);
      alert('Impossible d’approuver cette demande.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (request: SecretariatCertificateRequest) => {
    const notes = window.prompt('Motif du rejet :', '');
    if (!notes || !notes.trim()) {
      return;
    }

    try {
      setBusyId(request.id);
      await api.rejectSecretaireCertificateRequest(request.id, notes.trim());
      await fetchRequests();
    } catch (error) {
      console.error('Error rejecting certificate request:', error);
      alert('Impossible de rejeter cette demande.');
    } finally {
      setBusyId(null);
    }
  };

  const handleInvalidate = async (request: SecretariatCertificateRequest) => {
    const reason = window.prompt('Motif d’invalidation du certificat :', '');
    if (!reason || !reason.trim()) {
      return;
    }

    try {
      setBusyId(request.id);
      await api.invalidateSecretaireCertificateRequest(request.id, reason.trim());
      await fetchRequests();
    } catch (error) {
      console.error('Error invalidating certificate:', error);
      alert('Impossible d’invalider ce certificat.');
    } finally {
      setBusyId(null);
    }
  };

  const getBadgeClass = (status: SecretariatCertificateRequest['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'pending':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      case 'rejected':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
      case 'invalidated':
        return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const pendingCount = requests.filter((item) => item.status === 'pending').length;
  const approvedCount = requests.filter((item) => item.status === 'approved').length;
  const invalidatedCount = requests.filter((item) => item.status === 'invalidated').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Demandes de certificat</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Validez les demandes transmises par les formateurs, puis invalidez les certificats si nécessaire.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">En attente</div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{pendingCount}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Approuvées</div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{approvedCount}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Invalidées</div>
          <div className="mt-2 text-2xl font-bold text-slate-700 dark:text-slate-200">{invalidatedCount}</div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Rechercher un apprenant, une formation, une référence..."
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="approved">Approuvées</option>
            <option value="rejected">Rejetées</option>
            <option value="invalidated">Invalidées</option>
          </select>

          <select
            value={formationFilter}
            onChange={(event) => setFormationFilter(event.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Toutes les formations</option>
            {formations.map((formation) => (
              <option key={formation.id} value={formation.id}>
                {formation.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[320px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-500 dark:text-gray-400">
          Aucune demande de certificat pour ces filtres.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{request.formation}</h2>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getBadgeClass(request.status)}`}>
                      {request.status_label}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Apprenant</p>
                      <p className="font-medium text-gray-900 dark:text-white">{request.learner_name}</p>
                      <p className="text-gray-500 dark:text-gray-400">{request.learner_email || 'Email non renseigné'}</p>
                      {request.requested_by_name && (
                        <p className="text-gray-500 dark:text-gray-400">Formateur demandeur: {request.requested_by_name}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Session</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {request.session_start_date || 'N/A'} au {request.session_end_date || 'N/A'}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">Formation terminée: {request.completedDate || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Référence</p>
                      <p className="font-mono font-medium text-gray-900 dark:text-white">{request.certificate_reference || 'Non générée'}</p>
                      <p className="text-gray-500 dark:text-gray-400">Demande: {request.requestedDate || 'N/A'}</p>
                    </div>
                  </div>

                  {request.decision_notes && (
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-3 text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Note:</span> {request.decision_notes}
                    </div>
                  )}

                  {request.invalidation_reason && (
                    <div className="rounded-lg bg-rose-50 dark:bg-rose-900/20 p-3 text-sm text-rose-700 dark:text-rose-300">
                      <span className="font-semibold">Motif d’invalidation:</span> {request.invalidation_reason}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 xl:justify-end">
                  {request.can_approve && (
                    <button
                      onClick={() => void handleApprove(request)}
                      disabled={busyId === request.id}
                      className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60"
                    >
                      {busyId === request.id ? 'Traitement...' : 'Approuver'}
                    </button>
                  )}

                  {request.can_reject && (
                    <button
                      onClick={() => void handleReject(request)}
                      disabled={busyId === request.id}
                      className="px-4 py-2 bg-rose-600 text-white font-medium rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-60"
                    >
                      {busyId === request.id ? 'Traitement...' : 'Rejeter'}
                    </button>
                  )}

                  {request.can_invalidate && (
                    <button
                      onClick={() => void handleInvalidate(request)}
                      disabled={busyId === request.id}
                      className="px-4 py-2 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-60"
                    >
                      {busyId === request.id ? 'Traitement...' : 'Invalider'}
                    </button>
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
