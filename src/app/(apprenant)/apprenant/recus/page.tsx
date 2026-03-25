'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getApprenantRecus, downloadRecu, previewApprenantRecu } from '@/lib/api';

export default function RecusPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'receipts' | 'tickets'>('receipts');
  const [receipts, setReceipts] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchRecus();
    }
  }, [token]);

  const fetchRecus = async () => {
    try {
      const response = await getApprenantRecus();
      if (response.success) {
        setReceipts(response.data?.receipts || []);
        setTickets(response.data?.tickets || []);
      }
    } catch (err) {
      console.error('Error fetching receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id: string | number, type: string) => {
    try {
      const blob = await downloadRecu(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading:', err);
    }
  };

  const handlePreview = async (id: string | number) => {
    try {
      await previewApprenantRecu(id);
    } catch (err) {
      console.error('Error previewing receipt:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-madiba-red"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-madiba-black dark:text-white">Reçus & Tickets</h1>
        <p className="text-gray-600 dark:text-gray-400">Consultez et téléchargez vos documents</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('receipts')}
          className={`px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${activeTab === 'receipts'
            ? 'text-madiba-red border-madiba-red'
            : 'text-gray-500 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
            }`}
        >
          Reçus de paiement
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${activeTab === 'tickets'
            ? 'text-madiba-red border-madiba-red'
            : 'text-gray-500 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
            }`}
        >
          Tickets d&apos;inscription
        </button>
      </div>

      {/* Receipts Tab */}
      {activeTab === 'receipts' && (
        <div className="space-y-4">
          {receipts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400">Aucun reçu disponible</p>
            </div>
          ) : (
            receipts.map((receipt) => (
              <div
                key={receipt.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-madiba-black dark:text-white">{receipt.label}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {receipt.date} • {receipt.paymentMethod}
                      </p>
                      {receipt.description && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 italic mt-1">
                          Motif: {receipt.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Réf: {receipt.receipt_number || receipt.reference || receipt.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-xl font-bold text-madiba-black dark:text-white">
                      {Number(receipt.amount || 0).toLocaleString()} FCFA
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePreview(receipt.id)}
                        className="px-4 py-2 bg-white dark:bg-gray-900 text-madiba-black dark:text-white font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
                      >
                        Voir PDF
                      </button>
                      <button
                        onClick={() => handleDownload(receipt.id, 'receipt')}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-madiba-black dark:text-white font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors inline-flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Télécharger
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tickets Tab */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400">Aucun ticket disponible</p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Ticket Header with decoration */}
                <div className="bg-madiba-red p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-200">Ticket d&apos;inscription</p>
                      <p className="font-bold text-lg">{ticket.formation}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-red-200">Réf</p>
                      <p className="font-mono font-bold">{ticket.id}</p>
                    </div>
                  </div>
                </div>

                {/* Ticket Content */}
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Date d&apos;inscription</p>
                      <p className="font-medium text-madiba-black dark:text-white">{ticket.date}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Début de formation</p>
                      <p className="font-medium text-madiba-black dark:text-white">{ticket.startDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Statut</p>
                      <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${ticket.status === 'active'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                        {ticket.status === 'active' ? 'Actif' : 'Terminé'}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleDownload(ticket.id, 'ticket')}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-madiba-black dark:text-white font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors inline-flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Télécharger le ticket
                    </button>
                  </div>
                </div>

                {/* Ticket Footer decoration */}
                <div className="h-4 bg-gray-50 dark:bg-gray-900 border-t border-dashed border-gray-300 dark:border-gray-700" />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
