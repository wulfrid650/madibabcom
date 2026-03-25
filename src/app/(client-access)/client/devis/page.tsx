'use client';

import { useState, useEffect } from 'react';
import { FileText, Calendar, Download, Eye, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface Quote {
  id: number;
  quote_number: string;
  subject: string;
  service_type: string | null;
  message: string;
  status: 'new' | 'read' | 'responded' | 'archived';
  created_at: string;
  responded_at: string | null;
  response_message: string | null;
  response_document: string | null;
  response_document_url: string | null;
  response_sent_at: string | null;
}

export default function MesDevisPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      setIsLoading(true);
      // Import the standalone function
      const { getClientQuotes } = await import('@/lib/api');
      const data = await getClientQuotes();
      setQuotes(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des devis', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string; icon: any }> = {
      new: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400', icon: Clock },
      read: { label: 'En traitement', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400', icon: Eye },
      responded: { label: 'Répondu', color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400', icon: CheckCircle },
      archived: { label: 'Archivé', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-400', icon: XCircle }
    };
    return badges[status] || badges.new;
  };

  const getServiceTypeLabel = (type: string | null) => {
    const types: Record<string, string> = {
      'construction': 'Construction neuve',
      'renovation': 'Rénovation',
      'architecture': 'Étude architecturale',
      'genie-civil': 'Génie civil',
      'formation': 'Formation',
      'autre': 'Autre'
    };
    return type ? types[type] || type : 'Non spécifié';
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mes demandes de devis</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Suivez l'état de vos demandes de devis et téléchargez les réponses
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { status: 'all', label: 'Total', count: quotes.length, color: 'bg-gray-100 dark:bg-gray-800' },
          { status: 'new', label: 'En attente', count: quotes.filter(q => q.status === 'new').length, color: 'bg-yellow-100 dark:bg-yellow-900/40' },
          { status: 'read', label: 'En traitement', count: quotes.filter(q => q.status === 'read').length, color: 'bg-blue-100 dark:bg-blue-900/40' },
          { status: 'responded', label: 'Répondus', count: quotes.filter(q => q.status === 'responded').length, color: 'bg-green-100 dark:bg-green-900/40' }
        ].map((stat) => (
          <div
            key={stat.status}
            className={`${stat.color} rounded-xl p-4 border border-gray-200 dark:border-gray-700`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{stat.count}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quotes List */}
      {quotes.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Aucune demande de devis
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Vous n'avez pas encore fait de demande de devis
          </p>
          <a
            href="/contact?type=devis"
            className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Demander un devis
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quotes.map((quote) => {
            const badge = getStatusBadge(quote.status);
            const StatusIcon = badge.icon;
            const hasResponse = quote.status === 'responded' && (quote.response_message || quote.response_document);

            return (
              <div
                key={quote.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                        {quote.quote_number}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color} flex items-center gap-1`}>
                        <StatusIcon className="h-3 w-3" />
                        {badge.label}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {quote.subject}
                    </h3>
                    {quote.service_type && (
                      <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400 text-xs rounded">
                        {getServiceTypeLabel(quote.service_type)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {quote.message}
                </p>

                {/* Date */}
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <Calendar className="h-4 w-4 mr-2" />
                  Demandé le {new Date(quote.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>

                {/* Response Section */}
                {hasResponse && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        Réponse reçue
                      </span>
                    </div>

                    {quote.response_sent_at && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Le {new Date(quote.response_sent_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}

                    {quote.response_message && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                        {quote.response_message}
                      </p>
                    )}

                    {quote.response_document_url && (
                      <a
                        href={quote.response_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm w-full justify-center"
                      >
                        <Download className="h-4 w-4" />
                        Télécharger le devis
                      </a>
                    )}
                  </div>
                )}

                {/* No Response Yet */}
                {!hasResponse && quote.status !== 'new' && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">
                        Votre demande est en cours de traitement
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
