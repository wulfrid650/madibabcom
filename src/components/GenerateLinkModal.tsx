'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getClients, type User as AdminUser } from '@/lib/admin-api';

interface GenerateLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (link: string) => void;
}

export default function GenerateLinkModal({ isOpen, onClose, onSuccess }: GenerateLinkModalProps) {
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<AdminUser[]>([]);
  const [searchClient, setSearchClient] = useState('');
  const [selectedClient, setSelectedClient] = useState<AdminUser | null>(null);
  const [showResults, setShowResults] = useState(false);

  const [formData, setFormData] = useState({
    amount: '',
    motif: '',
  });

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchClient && !selectedClient) {
        handleSearch(searchClient);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchClient, selectedClient]);

  const handleSearch = async (term: string) => {
    setSearching(true);
    try {
      const res = await getClients({ search: term, status: 'active', per_page: 5 });
      if (res.success) {
        setSearchResults(res.data);
        setShowResults(true);
      }
    } catch (err) {
      console.error('Error searching clients', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectClient = (client: AdminUser) => {
    setSelectedClient(client);
    setSearchClient(client.name);
    setShowResults(false);
  };

  const clearSelection = () => {
    setSelectedClient(null);
    setSearchClient('');
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClient) return;

    const amount = Number(formData.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;

    setLoading(true);
    try {
      const res = await api.generatePaymentLink({
        client_id: Number(selectedClient.id),
        amount,
        motif: formData.motif,
      });

      const paymentLink = (res as { link?: string }).link ?? res.payment_url ?? res.checkout_url;
      if (!paymentLink) {
        throw new Error('Lien de paiement indisponible');
      }
      onSuccess(paymentLink);
      onClose();
    } catch (err) {
      alert('Erreur lors de la generation du lien: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold mb-4 dark:text-white">Generer un Lien de Paiement</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label htmlFor="searchClient" className="block text-sm font-medium mb-1 dark:text-gray-300">Client</label>

            {selectedClient ? (
              <div className="flex items-center justify-between p-2 border border-green-500 rounded bg-green-50 dark:bg-green-900/20 dark:border-green-700">
                <div>
                  <p className="font-medium text-green-900 dark:text-green-300">{selectedClient.name}</p>
                  <p className="text-xs text-green-700 dark:text-green-400">{selectedClient.email}</p>
                </div>
                <button
                  type="button"
                  onClick={clearSelection}
                  aria-label="Retirer le client selectionne"
                  title="Retirer le client selectionne"
                  className="text-green-700 dark:text-green-400 hover:text-green-900"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <input
                  id="searchClient"
                  type="text"
                  className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Rechercher un client (nom, email)..."
                  value={searchClient}
                  onChange={(e) => {
                    setSearchClient(e.target.value);
                    if (e.target.value === '') {
                      setSearchResults([]);
                      setShowResults(false);
                    }
                  }}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowResults(true);
                  }}
                />

                {searching && (
                  <div className="absolute right-3 top-9">
                    <div className="animate-spin h-4 w-4 border-2 border-gray-500 rounded-full border-t-transparent"></div>
                  </div>
                )}

                {showResults && searchResults.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-b-lg shadow-lg max-h-60 overflow-y-auto mt-1">
                    {searchResults.map((client) => (
                      <li
                        key={client.id}
                        className="p-3 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-0"
                        onClick={() => handleSelectClient(client)}
                      >
                        <p className="font-medium dark:text-white">{client.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-300">{client.email}</p>
                        {client.company_name && <p className="text-xs text-gray-400">{client.company_name}</p>}
                      </li>
                    ))}
                  </ul>
                )}

                <p className="text-xs text-gray-500 mt-1">Saisissez au moins quelques lettres pour rechercher.</p>
              </>
            )}

            <input
              type="hidden"
              required
              value={selectedClient ? String(selectedClient.id) : ''}
              onChange={() => {}}
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium mb-1 dark:text-gray-300">Montant (FCFA)</label>
            <input
              id="amount"
              type="number"
              className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              min="100"
            />
          </div>

          <div>
            <label htmlFor="motif" className="block text-sm font-medium mb-1 dark:text-gray-300">Motif (Nature du paiement)</label>
            <textarea
              id="motif"
              className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={formData.motif}
              onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
              required
              placeholder="Ex: Tranche 1 Formation Architecture"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Annuler</button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-madiba-red text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Generation...' : 'Generer Lien'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
