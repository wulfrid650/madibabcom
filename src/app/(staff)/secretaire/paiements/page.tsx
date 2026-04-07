'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api, downloadReceiptPDF, previewReceiptPDF } from '@/lib/api';
import GenerateLinkModal from '@/components/GenerateLinkModal';

type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
type PaymentCategory = 'formation' | 'other';

interface PaymentRow {
  id: string;
  reference: string;
  status: PaymentStatus;
  status_label: string;
  amount: number;
  description?: string;
  method_label?: string;
  created_at: string;
  validated_at?: string;
  payment_url?: string;
  category: PaymentCategory;
  formation_title?: string | null;
  session_name?: string | null;
  manual_reference?: string | null;
  link_audit_count?: number;
  link_access_count?: number;
  user?: { name?: string; email?: string; phone?: string };
  metadata?: Record<string, any>;
}

interface AuditDetails {
  reference: string;
  payment_url?: string;
  link_audit_summary?: {
    payment_url?: string;
    generated_by?: string;
    access_count?: number;
    retry_count?: number;
  };
  link_audit?: Array<{
    id: number;
    action: string;
    description: string;
    actor_name: string;
    time: string;
  }>;
}

const EMPTY_VALIDATION_FORM = { montantRecu: '', modePaiement: 'especes', reference: '', notes: '' };

const formatAmount = (amount: number) => `${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`;
const formatDate = (value?: string | null) => value ? new Date(value).toLocaleString('fr-FR') : 'Non renseigné';
const normalize = (value?: string | null) => (value || '').toLowerCase();

const badgeClass = (status: PaymentStatus) => {
  if (status === 'completed') return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
  if (status === 'pending') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
  if (status === 'failed') return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
  return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
};

export default function ValidationPaiementsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | PaymentCategory>('all');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRow | null>(null);
  const [validationForm, setValidationForm] = useState(EMPTY_VALIDATION_FORM);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showGenerateLinkModal, setShowGenerateLinkModal] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditDetails, setAuditDetails] = useState<AuditDetails | null>(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await api.getSecretairePaiements({ per_page: 100 });
      const rows = (response.data || []).map((payment: any) => {
        const metadata = payment.metadata || {};
        return {
          ...payment,
          id: String(payment.id),
          amount: Number(payment.amount || 0),
          category: payment.category || (payment.formation_title ? 'formation' : 'other'),
          user: {
            name: payment.user?.name || payment.payer_name || metadata.customer_full_name || 'Client inconnu',
            email: payment.user?.email || payment.payer_email || metadata.customer_email || 'Non renseigné',
            phone: payment.user?.phone || payment.payer_phone || metadata.customer_phone || 'Non renseigné',
          },
        } satisfies PaymentRow;
      });
      setPayments(rows);
    } catch (error) {
      console.error(error);
      setNotice('Service temporairement indisponible');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  const filteredPayments = useMemo(() => payments.filter((payment) => {
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || payment.category === categoryFilter;
    const matchesSearch = [
      payment.reference,
      payment.user?.name,
      payment.user?.email,
      payment.description,
      payment.formation_title,
    ].some((value) => normalize(value).includes(normalize(searchTerm)));
    return matchesStatus && matchesCategory && matchesSearch;
  }), [payments, searchTerm, statusFilter, categoryFilter]);

  const counts = useMemo(() => ({
    total: payments.length,
    pending: payments.filter((p) => p.status === 'pending').length,
    completed: payments.filter((p) => p.status === 'completed').length,
    failed: payments.filter((p) => p.status === 'failed').length,
  }), [payments]);

  const waitForValidationResult = async (paymentId: string) => {
    setNotice('Validation en cours. Vérification automatique du statut...');
    for (let attempt = 0; attempt < 6; attempt += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 4000));
      try {
        const payment = await api.getSecretairePaiement(paymentId);
        if (payment.status === 'completed') {
          setShowValidationModal(false);
          setSelectedPayment(null);
          setProofFile(null);
          setNotice('Paiement validé avec succès.');
          await fetchPayments();
          return;
        }
      } catch (error) {
        console.error(error);
      }
    }
    await fetchPayments();
    setNotice('Validation lancée. Vérifie la liste si le statut ne s’est pas encore mis à jour.');
  };

  const openValidation = (payment: PaymentRow) => {
    setSelectedPayment(payment);
    setValidationForm({ ...EMPTY_VALIDATION_FORM, montantRecu: String(payment.amount) });
    setProofFile(null);
    setShowValidationModal(true);
  };

  const confirmValidation = async () => {
    if (!selectedPayment || !proofFile || !validationForm.reference.trim() || !validationForm.notes.trim()) {
      alert('Justificatif, référence et note interne sont obligatoires.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('notes', validationForm.notes.trim());
      payload.append('amount', Number(validationForm.montantRecu).toString());
      payload.append('method', validationForm.modePaiement);
      payload.append('reference', validationForm.reference.trim());
      payload.append('proof', proofFile);
      await api.validateSecretairePaiement(selectedPayment.id, payload);
      setShowValidationModal(false);
      setSelectedPayment(null);
      setProofFile(null);
      setNotice('Paiement validé avec succès.');
      await fetchPayments();
    } catch (error: any) {
      const message = String(error?.message || '').toLowerCase();
      if (message.includes('temporairement indisponible') || message.includes('deja valide') || message.includes('déjà validé')) {
        await waitForValidationResult(selectedPayment.id);
      } else {
        alert(`Erreur lors de la validation: ${error?.message || 'Erreur inconnue'}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const confirmReject = async () => {
    if (!selectedPayment || !rejectReason.trim()) return;
    setSubmitting(true);
    try {
      await api.rejectSecretairePaiement(selectedPayment.id, rejectReason.trim());
      setShowRejectModal(false);
      setSelectedPayment(null);
      setNotice('Paiement rejeté.');
      await fetchPayments();
    } catch (error: any) {
      alert(`Erreur lors du rejet: ${error?.message || 'Erreur inconnue'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAudit = async (payment: PaymentRow) => {
    setShowAuditModal(true);
    setAuditLoading(true);
    try {
      const details = await api.getSecretairePaiement(payment.id);
      setAuditDetails(details as AuditDetails);
    } catch (error) {
      console.error(error);
      setNotice('Impossible de charger l’audit de ce paiement.');
      setShowAuditModal(false);
    } finally {
      setAuditLoading(false);
    }
  };

  const exportCsv = () => {
    const lines = [
      ['Reference', 'Statut', 'Categorie', 'Client', 'Email', 'Montant', 'Description'],
      ...filteredPayments.map((payment) => [
        payment.reference,
        payment.status_label,
        payment.category,
        payment.user?.name || '',
        payment.user?.email || '',
        String(payment.amount),
        payment.description || '',
      ]),
    ];
    const csv = lines.map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'suivi-paiements.csv';
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-purple-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Suivi des paiements</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Tous les paiements du site avec filtre formation/autres, audit, reçus et export.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setShowGenerateLinkModal(true)} className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">Générer un lien</button>
          <button type="button" onClick={exportCsv} className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">Exporter</button>
        </div>
      </div>

      {notice && <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">{notice}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800"><div className="text-2xl font-bold text-gray-900 dark:text-white">{counts.total}</div><div className="text-sm text-gray-500 dark:text-gray-400">Paiements chargés</div></div>
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800"><div className="text-2xl font-bold text-amber-600">{counts.pending}</div><div className="text-sm text-gray-500 dark:text-gray-400">En attente</div></div>
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800"><div className="text-2xl font-bold text-green-600">{counts.completed}</div><div className="text-sm text-gray-500 dark:text-gray-400">Validés</div></div>
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800"><div className="text-2xl font-bold text-red-600">{counts.failed}</div><div className="text-sm text-gray-500 dark:text-gray-400">Refusés / échoués</div></div>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-2xl bg-white p-4 shadow-sm lg:grid-cols-4 dark:bg-gray-800">
        <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Référence, nom, email..." className="rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
          <option value="all">Tous les statuts</option><option value="pending">En attente</option><option value="completed">Validés</option><option value="failed">Refusés</option><option value="refunded">Remboursés</option>
        </select>
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as typeof categoryFilter)} className="rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
          <option value="all">Toutes les catégories</option><option value="formation">Paiements de formation</option><option value="other">Autres paiements</option>
        </select>
        <button type="button" onClick={fetchPayments} className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">Actualiser</button>
      </div>

      <div className="rounded-2xl bg-white shadow-sm dark:bg-gray-800">
        {filteredPayments.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-500 dark:text-gray-400">Aucun paiement ne correspond aux filtres actuels.</div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredPayments.map((payment) => (
              <div key={payment.id} className="p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-purple-600 dark:text-purple-400">{payment.reference}</span>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass(payment.status)}`}>{payment.status_label}</span>
                      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">{payment.category === 'formation' ? 'Formation' : 'Autre'}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{payment.user?.name || 'Client inconnu'}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{payment.user?.email || 'Non renseigné'} • {payment.user?.phone || 'Non renseigné'}</p>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <p>{payment.description || payment.formation_title || 'Paiement'}</p>
                      {payment.formation_title && <p className="text-xs text-purple-600 dark:text-purple-400">{payment.formation_title}{payment.session_name ? ` • ${payment.session_name}` : ''}</p>}
                      {payment.manual_reference && <p className="text-xs text-gray-500 dark:text-gray-400">Réf. manuelle: {payment.manual_reference}</p>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 xl:items-end">
                    <div className="text-left xl:text-right">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatAmount(payment.amount)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Déclaré le {formatDate(payment.created_at)}</p>
                      {payment.validated_at && <p className="text-xs text-gray-500 dark:text-gray-400">Validé le {formatDate(payment.validated_at)}</p>}
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Audit: {payment.link_audit_count || 0} évènement(s) • {payment.link_access_count || 0} consultation(s)</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {payment.payment_url && <button type="button" onClick={() => window.open(payment.payment_url, '_blank', 'noopener,noreferrer')} className="rounded-lg border border-blue-300 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20">Ouvrir le lien</button>}
                      <button type="button" onClick={() => handleAudit(payment)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">Audit</button>
                      {payment.status === 'completed' && (
                        <>
                          <button type="button" onClick={() => previewReceiptPDF(payment.id)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">Voir reçu</button>
                          <button type="button" onClick={() => downloadReceiptPDF(payment.id)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">Télécharger</button>
                        </>
                      )}
                      {payment.status === 'pending' && (
                        <>
                          <button type="button" onClick={() => openValidation(payment)} className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700">Valider</button>
                          <button type="button" onClick={() => { setSelectedPayment(payment); setRejectReason(''); setShowRejectModal(true); }} className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20">Rejeter</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showValidationModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Valider le paiement</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Action enregistrée au nom de {user?.name || 'l’utilisateur connecté'}.</p>
            <div className="mt-4 rounded-xl bg-gray-50 p-4 dark:bg-gray-700/40">
              <p className="font-semibold text-gray-900 dark:text-white">{selectedPayment.user?.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{selectedPayment.reference}</p>
              <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">{formatAmount(selectedPayment.amount)}</p>
            </div>
            <form onSubmit={(event) => { event.preventDefault(); confirmValidation(); }} className="mt-6 space-y-4">
              <input type="number" required value={validationForm.montantRecu} onChange={(event) => setValidationForm((prev) => ({ ...prev, montantRecu: event.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="Montant reçu" />
              <select value={validationForm.modePaiement} onChange={(event) => setValidationForm((prev) => ({ ...prev, modePaiement: event.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                <option value="especes">Espèces</option><option value="mobile_money">Mobile Money</option><option value="virement">Virement bancaire</option><option value="cheque">Chèque</option>
              </select>
              <input type="text" required value={validationForm.reference} onChange={(event) => setValidationForm((prev) => ({ ...prev, reference: event.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="Référence" />
              <textarea required rows={3} value={validationForm.notes} onChange={(event) => setValidationForm((prev) => ({ ...prev, notes: event.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="Note interne" />
              <input type="file" required accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(event) => setProofFile(event.target.files?.[0] || null)} className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowValidationModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">Annuler</button>
                <button type="submit" disabled={submitting} className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-60">{submitting ? 'Validation...' : 'Valider'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRejectModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Rejeter le paiement</h2>
            <textarea rows={4} value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder="Motif du rejet" className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowRejectModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">Annuler</button>
              <button type="button" onClick={confirmReject} disabled={submitting} className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-60">{submitting ? 'Rejet...' : 'Confirmer le rejet'}</button>
            </div>
          </div>
        </div>
      )}

      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Audit du paiement</h2>
                {auditDetails?.reference && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Référence {auditDetails.reference}</p>}
              </div>
              <button type="button" onClick={() => setShowAuditModal(false)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">Fermer</button>
            </div>
            {auditLoading ? (
              <div className="flex items-center justify-center py-16"><div className="h-10 w-10 animate-spin rounded-full border-b-2 border-purple-500" /></div>
            ) : (
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/40"><p className="text-xs uppercase tracking-[0.18em] text-gray-400">Lien</p><p className="mt-2 break-all text-sm text-gray-900 dark:text-white">{auditDetails?.link_audit_summary?.payment_url || auditDetails?.payment_url || 'Non disponible'}</p></div>
                  <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/40"><p className="text-xs uppercase tracking-[0.18em] text-gray-400">Généré par</p><p className="mt-2 text-sm text-gray-900 dark:text-white">{auditDetails?.link_audit_summary?.generated_by || 'Non renseigné'}</p></div>
                  <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/40"><p className="text-xs uppercase tracking-[0.18em] text-gray-400">Consultations</p><p className="mt-2 text-sm text-gray-900 dark:text-white">{auditDetails?.link_audit_summary?.access_count || 0}</p></div>
                  <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/40"><p className="text-xs uppercase tracking-[0.18em] text-gray-400">Relances</p><p className="mt-2 text-sm text-gray-900 dark:text-white">{auditDetails?.link_audit_summary?.retry_count || 0}</p></div>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 dark:border-gray-700 dark:text-white">Chronologie</div>
                  <div className="max-h-80 divide-y divide-gray-200 overflow-y-auto dark:divide-gray-700">
                    {(auditDetails?.link_audit || []).length > 0 ? auditDetails?.link_audit?.map((entry) => (
                      <div key={entry.id} className="px-4 py-3">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div><p className="font-medium text-gray-900 dark:text-white">{entry.action}</p><p className="text-sm text-gray-500 dark:text-gray-400">{entry.description}</p></div>
                          <div className="text-xs text-gray-500 dark:text-gray-400"><p>{entry.actor_name}</p><p>{entry.time}</p></div>
                        </div>
                      </div>
                    )) : <div className="px-4 py-8 text-sm text-gray-500 dark:text-gray-400">Aucun événement d’audit pour ce paiement.</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <GenerateLinkModal isOpen={showGenerateLinkModal} onClose={() => setShowGenerateLinkModal(false)} onSuccess={(link) => { setNotice(`Lien généré: ${link}`); setShowGenerateLinkModal(false); fetchPayments(); }} />
    </div>
  );
}
