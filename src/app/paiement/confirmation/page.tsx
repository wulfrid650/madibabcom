'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api, PaymentStatus } from '@/lib/api';
import { PaymentStatusBadge } from '@/components/payment/PaymentComponents';
import { Loader2, CheckCircle2, XCircle, Clock, ArrowLeft, Home } from 'lucide-react';

function PaymentConfirmationContent() {
  const searchParams = useSearchParams();
  const [payment, setPayment] = useState<PaymentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reference = searchParams.get('reference') || searchParams.get('ref');
  const transactionId = searchParams.get('transaction_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!reference && !transactionId) {
        setError('Référence de paiement manquante');
        setIsLoading(false);
        return;
      }

      try {
        const result = await api.verifyPayment(reference || transactionId || '');
        setPayment(result);
      } catch (err: any) {
        setError(err.message || 'Impossible de vérifier le paiement');
      } finally {
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [reference, transactionId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-madiba-red mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Vérification du paiement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Erreur</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-madiba-red hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <Home className="w-5 h-5" />
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  const StatusIcon = {
    completed: <CheckCircle2 className="w-12 h-12 text-green-600" />,
    pending: <Clock className="w-12 h-12 text-yellow-600" />,
    failed: <XCircle className="w-12 h-12 text-red-600" />,
    refunded: <ArrowLeft className="w-12 h-12 text-gray-600" />,
  };

  const StatusMessage = {
    completed: {
      title: 'Paiement réussi !',
      description: 'Votre paiement a été traité avec succès. Vous recevrez un email de confirmation.',
    },
    pending: {
      title: 'Paiement en cours',
      description: 'Votre paiement est en cours de traitement. Veuillez patienter quelques instants.',
    },
    failed: {
      title: 'Paiement échoué',
      description: 'Le paiement n\'a pas pu être traité. Veuillez réessayer ou contacter le support.',
    },
    refunded: {
      title: 'Paiement remboursé',
      description: 'Ce paiement a été remboursé. Le montant sera crédité sous 24-48h.',
    },
  };

  const statusInfo = StatusMessage[payment?.status || 'pending'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
            payment?.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30' :
            payment?.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
            payment?.status === 'failed' ? 'bg-red-100 dark:bg-red-900/30' :
            'bg-gray-100 dark:bg-gray-700'
          }`}>
            {StatusIcon[payment?.status || 'pending']}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {statusInfo.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {statusInfo.description}
          </p>
        </div>

        {payment && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">Référence</span>
              <span className="text-sm font-mono text-gray-900 dark:text-white">{payment.reference}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">Montant</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {payment.amount.toLocaleString()} {payment.currency}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">Méthode</span>
              <span className="text-sm text-gray-900 dark:text-white">{payment.method_label}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">Statut</span>
              <PaymentStatusBadge status={payment.status} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">Date</span>
              <span className="text-sm text-gray-900 dark:text-white">
                {new Date(payment.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {payment?.status === 'completed' && (
            <Link
              href="/apprenant/dashboard"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-madiba-red hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Accéder à mon espace
            </Link>
          )}
          {payment?.status === 'failed' && (
            <button
              onClick={() => window.history.back()}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-madiba-red hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Réessayer
            </button>
          )}
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Home className="w-5 h-5" />
            Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-12 h-12 animate-spin text-madiba-red" />
      </div>
    }>
      <PaymentConfirmationContent />
    </Suspense>
  );
}
