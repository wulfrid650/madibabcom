'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Download, Eye, FileText, Plus, Search } from 'lucide-react';
import { api, createManualReceipt, downloadReceiptPDF, previewReceiptPDF } from '@/lib/api';

interface ReceiptRow {
  id: string;
  number: string;
  reference: string;
  date?: string;
  beneficiary: {
    name: string;
    email: string;
    type: 'apprenant' | 'client' | 'autre';
  };
  object: string;
  amount: number;
  payment_method: string;
  issuer: string;
  is_complete: boolean;
  issues: string[];
}

const EMPTY_MANUAL_RECEIPT = {
  user_id: '',
  amount: 0,
  description: '',
  payment_method: 'cash' as 'cash' | 'bank_transfer' | 'check',
  payment_date: new Date().toISOString().split('T')[0],
};

function formatAmount(amount: number) {
  return `${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`;
}

function normalize(value?: string | null) {
  return (value || '').toLowerCase();
}

export default function RecusPage() {
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [invalidReceipts, setInvalidReceipts] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'tous' | 'apprenant' | 'client' | 'autre'>('tous');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_MANUAL_RECEIPT);

  const fetchRecus = async () => {
    setLoading(true);
    try {
      const response = await api.getSecretaireRecus({ per_page: 100 });
      const rows = (response.data || []) as ReceiptRow[];
      const invalidRows = (response.invalid_receipts || []) as ReceiptRow[];

      setReceipts(rows);
      setInvalidReceipts(invalidRows);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecus();
  }, []);

  const filteredReceipts = useMemo(() => {
    return receipts.filter((receipt) => {
      const matchesSearch = [
        receipt.number,
        receipt.reference,
        receipt.beneficiary.name,
        receipt.object,
      ].some((value) => normalize(value).includes(normalize(searchTerm)));

      const matchesType = filterType === 'tous' || receipt.beneficiary.type === filterType;
      const receiptDate = receipt.date ? receipt.date.slice(0, 10) : '';
      const matchesStartDate = !dateDebut || (receiptDate && receiptDate >= dateDebut);
      const matchesEndDate = !dateFin || (receiptDate && receiptDate <= dateFin);

      return matchesSearch && matchesType && matchesStartDate && matchesEndDate;
    });
  }, [dateDebut, dateFin, filterType, receipts, searchTerm]);

  const totalAmount = filteredReceipts.reduce((sum, receipt) => sum + Number(receipt.amount || 0), 0);

  const handleCreateManual = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      await createManualReceipt({
        user_id: Number(formData.user_id),
        amount: formData.amount,
        description: formData.description,
        payment_method: formData.payment_method,
        payment_date: formData.payment_date,
      });

      setFormData(EMPTY_MANUAL_RECEIPT);
      setShowModal(false);
      await fetchRecus();
    } catch (error) {
      console.error(error);
      alert('Erreur lors de la création du reçu.');
    }
  };

  const handleIgnore = async (paymentId: string) => {
    if (!confirm('Voulez-vous vraiment ignorer les alertes pour ce reçu ? Il sera considéré comme complet.')) {
      return;
    }

    try {
      await api.ignoreReceiptWarning(paymentId);
      await fetchRecus();
    } catch (error) {
      console.error(error);
      alert('Erreur lors de l\'opération.');
    }
  };


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reçus de paiement</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Aperçu navigateur, téléchargement et suivi des reçus à corriger.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-700"
        >
          <Plus className="h-4 w-4" />
          Créer reçu manuel
        </button>
      </div>

      {invalidReceipts.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
            <div className="w-full">
              <h2 className="text-base font-semibold text-amber-900 dark:text-amber-200">Reçus à corriger</h2>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                Certains paiements validés n&apos;ont pas encore toutes les informations attendues pour un reçu propre.
              </p>

              <div className="mt-4 grid gap-3">
                {invalidReceipts.map((receipt) => (
                  <div
                    key={`invalid-${receipt.id}`}
                    className="rounded-xl border border-amber-200 bg-white/80 p-4 dark:border-amber-800 dark:bg-black/20"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{receipt.number || receipt.reference}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {receipt.beneficiary.name || 'Non renseigné'} • {receipt.object || 'Objet manquant'}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {receipt.issues.map((issue) => (
                            <span
                              key={issue}
                              className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                            >
                              {issue}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => previewReceiptPDF(receipt.id)}
                          className="inline-flex items-center gap-2 rounded-lg border border-amber-300 px-3 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30"
                        >
                          <Eye className="h-4 w-4" />
                          Voir PDF
                        </button>
                          <button
                            type="button"
                            onClick={() => downloadReceiptPDF(receipt.id)}
                            className="inline-flex items-center gap-2 rounded-lg border border-amber-300 px-3 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30"
                          >
                            <Download className="h-4 w-4" />
                            Télécharger
                          </button>
                          <button
                            type="button"
                            onClick={() => handleIgnore(receipt.id)}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                            title="Ignorer l'alerte et marquer comme complet"
                          >
                            Ignorer
                          </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{filteredReceipts.length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Reçus lisibles affichés</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
          <div className="text-2xl font-bold text-green-600">{formatAmount(totalAmount)}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Montant total</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
          <div className="text-2xl font-bold text-amber-600">{invalidReceipts.length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">À corriger</div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Numéro, référence, bénéficiaire, objet..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-900 focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <select
            value={filterType}
            onChange={(event) => setFilterType(event.target.value as typeof filterType)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="tous">Tous les types</option>
            <option value="apprenant">Apprenants</option>
            <option value="client">Clients</option>
            <option value="autre">Autres</option>
          </select>

          <input
            type="date"
            value={dateDebut}
            onChange={(event) => setDateDebut(event.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <input
            type="date"
            value={dateFin}
            onChange={(event) => setDateFin(event.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm dark:bg-gray-800">
        {filteredReceipts.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Aucun reçu lisible</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Ajuste les filtres ou consulte la section &quot;à corriger&quot;.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredReceipts.map((receipt) => (
              <div key={receipt.id} className="p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-purple-600 dark:text-purple-400">
                        {receipt.number}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        {receipt.beneficiary.type}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{receipt.beneficiary.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {receipt.beneficiary.email || 'Non renseigné'}
                      </p>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <p>{receipt.object || 'Objet non renseigné'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {receipt.payment_method || 'Mode non renseigné'} • Émis par {receipt.issuer || 'Système'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="text-left sm:text-right">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatAmount(receipt.amount)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {receipt.date ? new Date(receipt.date).toLocaleString('fr-FR') : 'Date indisponible'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => previewReceiptPDF(receipt.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                      >
                        <Eye className="h-4 w-4" />
                        Voir PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadReceiptPDF(receipt.id)}
                        className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
                      >
                        <Download className="h-4 w-4" />
                        Télécharger
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Créer un reçu manuel</h2>
            <form onSubmit={handleCreateManual} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">ID utilisateur</label>
                <input
                  type="number"
                  required
                  value={formData.user_id}
                  onChange={(event) => setFormData((previous) => ({ ...previous, user_id: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Montant</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={formData.amount}
                  onChange={(event) => setFormData((previous) => ({ ...previous, amount: Number(event.target.value) }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Objet</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(event) => setFormData((previous) => ({ ...previous, description: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Mode</label>
                  <select
                    value={formData.payment_method}
                    onChange={(event) => setFormData((previous) => ({ ...previous, payment_method: event.target.value as typeof previous.payment_method }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="cash">Espèces</option>
                    <option value="bank_transfer">Virement</option>
                    <option value="check">Chèque</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                  <input
                    type="date"
                    value={formData.payment_date}
                    onChange={(event) => setFormData((previous) => ({ ...previous, payment_date: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-700"
                >
                  Créer le reçu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
