'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getApprenantPaiements, initiateApprenantFormationPayment } from '@/lib/api';

interface PaymentInstallment {
  id: string;
  label: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  due_date?: string | null;
  paid_date?: string | null;
  reference?: string | null;
  purpose_detail?: string | null;
  payment_url?: string | null;
}

interface PaymentActions {
  can_pay_registration: boolean;
  can_pay_installment: boolean;
  can_pay_full: boolean;
  suggested_installment_amount: number;
  remaining_training_amount: number;
  pending_training_payment?: {
    id: string;
    reference: string;
    amount: number;
    label: string;
    payment_url?: string | null;
  } | null;
}

interface PaymentData {
  enrollment_id?: number | null;
  total_amount: number;
  training_amount: number;
  paid_training_amount: number;
  remaining_training_amount: number;
  formation_name: string;
  registration_fee: {
    amount: number;
    status: 'paid' | 'pending';
    paidDate?: string | null;
    payment_url?: string | null;
  };
  installments: PaymentInstallment[];
  payment_actions: PaymentActions;
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}

function formatDate(value?: string | null): string {
  if (!value) {
    return '-';
  }

  if (value.includes('/')) {
    return value;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('fr-FR');
}

function getInstallmentStatusBadge(status: PaymentInstallment['status']) {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
    case 'pending':
      return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
    default:
      return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
  }
}

export default function PaiementsPage() {
  const { token } = useAuth();
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [processingMode, setProcessingMode] = useState<'installment' | 'full' | 'resume' | null>(null);

  useEffect(() => {
    if (token) {
      fetchPayments();
    }
  }, [token]);

  const fetchPayments = async () => {
    try {
      const response = await getApprenantPaiements();
      if (response.success) {
        setPaymentData(response.data as PaymentData);
        setError(null);
      } else {
        setPaymentData(null);
        setError(response.message || 'Erreur lors du chargement des paiements');
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      setPaymentData(null);
      setError('Erreur lors du chargement des paiements');
    } finally {
      setLoading(false);
    }
  };

  const redirectToPayment = (target?: string | null) => {
    if (!target) {
      throw new Error('Aucun lien de paiement disponible pour le moment.');
    }

    window.location.href = target;
  };

  const handleFormationPayment = async (mode: 'installment' | 'full') => {
    try {
      setActionError(null);
      setProcessingMode(mode);

      const response = await initiateApprenantFormationPayment(
        mode,
        `${window.location.origin}/apprenant/paiements`
      );

      redirectToPayment(response.data.checkout_url || response.data.payment_url || null);
    } catch (err) {
      console.error('Formation payment init error:', err);
      setActionError(err instanceof Error ? err.message : 'Impossible d’initialiser le paiement.');
    } finally {
      setProcessingMode(null);
    }
  };

  const handleResumePendingPayment = (paymentUrl?: string | null) => {
    try {
      setActionError(null);
      setProcessingMode('resume');
      redirectToPayment(paymentUrl || null);
    } catch (err) {
      console.error('Pending payment redirect error:', err);
      setActionError(err instanceof Error ? err.message : 'Impossible d’ouvrir le lien de paiement.');
      setProcessingMode(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-madiba-red"></div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-madiba-black dark:text-white">Paiements</h1>
          <p className="text-gray-600 dark:text-gray-400">Gérez vos paiements de formation</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">{error || 'Aucune donnée de paiement disponible.'}</p>
        </div>
      </div>
    );
  }

  const registrationFee = paymentData.registration_fee || { amount: 0, status: 'pending' as const, paidDate: null };
  const installments = paymentData.installments || [];
  const paymentActions = paymentData.payment_actions || {
    can_pay_registration: false,
    can_pay_installment: false,
    can_pay_full: false,
    suggested_installment_amount: 0,
    remaining_training_amount: 0,
    pending_training_payment: null,
  };

  const totalAmount = paymentData.total_amount || 0;
  const paidTrainingAmount = paymentData.paid_training_amount || 0;
  const totalPaidAmount = (registrationFee.status === 'paid' ? registrationFee.amount : 0) + paidTrainingAmount;
  const remainingAmount = Math.max(0, totalAmount - totalPaidAmount);
  const pendingTrainingPayment = paymentActions.pending_training_payment;
  const progressPercentage = totalAmount > 0 ? Math.round((totalPaidAmount / totalAmount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-madiba-black dark:text-white">Paiements</h1>
        <p className="text-gray-600 dark:text-gray-400">Gérez vos paiements de formation</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Montant total</p>
          <p className="text-3xl font-bold text-madiba-black dark:text-white">{formatAmount(totalAmount)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Inscription</p>
          <p className="text-3xl font-bold text-madiba-black dark:text-white">{formatAmount(registrationFee.amount || 0)}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full ${registrationFee.status === 'paid' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
            {registrationFee.status === 'paid' ? 'Payé' : 'À payer'}
          </span>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Montant payé</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{formatAmount(totalPaidAmount)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Reste à payer</p>
          <p className="text-3xl font-bold text-madiba-red">{formatAmount(remainingAmount)}</p>
        </div>
      </div>

      {registrationFee.status === 'pending' ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-yellow-900 dark:text-yellow-200 mb-1">Frais d&apos;inscription requis</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                Les frais d&apos;inscription de <strong>{formatAmount(registrationFee.amount)}</strong> doivent être payés avant de débloquer les paiements de formation.
              </p>
              {registrationFee.payment_url ? (
                <button
                  onClick={() => handleResumePendingPayment(registrationFee.payment_url)}
                  disabled={processingMode === 'resume'}
                  className="px-6 py-3 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-60"
                >
                  {processingMode === 'resume' ? 'Ouverture...' : `Payer l'inscription (${formatAmount(registrationFee.amount)})`}
                </button>
              ) : (
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Aucun lien de paiement d&apos;inscription n&apos;est disponible pour le moment. Contactez le secrétariat si nécessaire.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-green-900 dark:text-green-200">Inscription validée</p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Frais d&apos;inscription payés le {registrationFee.paidDate || '-'} • {formatAmount(registrationFee.amount)}
              </p>
            </div>
          </div>
        </div>
      )}

      {registrationFee.status === 'paid' && paymentActions.remaining_training_amount > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-lg font-bold text-madiba-black dark:text-white">Poursuivre le paiement de la formation</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Formation: {paymentData.formation_name || 'Formation'} • Solde restant: {formatAmount(paymentActions.remaining_training_amount)}
              </p>
              {pendingTrainingPayment && (
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-3">
                  Un paiement est déjà en attente: {pendingTrainingPayment.label} ({formatAmount(pendingTrainingPayment.amount)}).
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {pendingTrainingPayment?.payment_url && (
                <button
                  onClick={() => handleResumePendingPayment(pendingTrainingPayment.payment_url)}
                  disabled={processingMode === 'resume' || processingMode === 'installment' || processingMode === 'full'}
                  className="px-5 py-3 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  {processingMode === 'resume' ? 'Ouverture...' : `Reprendre le paiement (${formatAmount(pendingTrainingPayment.amount)})`}
                </button>
              )}

              <button
                onClick={() => handleFormationPayment('installment')}
                disabled={!paymentActions.can_pay_installment || processingMode !== null}
                className="px-5 py-3 rounded-lg bg-white border border-madiba-red text-madiba-red hover:bg-red-50 transition-colors disabled:opacity-60 dark:bg-transparent"
              >
                {processingMode === 'installment'
                  ? 'Préparation...'
                  : `Payer une tranche (${formatAmount(paymentActions.suggested_installment_amount)})`}
              </button>

              <button
                onClick={() => handleFormationPayment('full')}
                disabled={!paymentActions.can_pay_full || processingMode !== null}
                className="px-5 py-3 rounded-lg bg-madiba-red text-white hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {processingMode === 'full'
                  ? 'Préparation...'
                  : `Payer la totalité (${formatAmount(paymentActions.remaining_training_amount)})`}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-madiba-black dark:text-white">Progression des paiements</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {progressPercentage}% payé
          </span>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-madiba-black dark:text-white">Tranches de formation</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Formation: {paymentData.formation_name || 'Formation'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total formation</p>
              <p className="text-lg font-bold text-madiba-black dark:text-white">{formatAmount(paymentData.training_amount || 0)}</p>
            </div>
          </div>
        </div>

        {installments.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {installments.map((installment) => (
              <div key={installment.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${installment.status === 'paid'
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : installment.status === 'pending'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30'
                      : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                    {installment.status === 'paid' ? (
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : installment.status === 'pending' ? (
                      <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-madiba-black dark:text-white">{installment.label}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Créé le {formatDate(installment.due_date)}
                      {installment.paid_date && ` • Payé le ${formatDate(installment.paid_date)}`}
                    </p>
                    {installment.reference && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-1">{installment.reference}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-xl font-bold text-madiba-black dark:text-white">
                    {formatAmount(installment.amount || 0)}
                  </p>
                  {installment.status === 'paid' ? (
                    <span className={`px-4 py-2 font-semibold rounded-lg ${getInstallmentStatusBadge(installment.status)}`}>
                      Payé
                    </span>
                  ) : installment.status === 'pending' ? (
                    <button
                      onClick={() => handleResumePendingPayment(installment.payment_url)}
                      disabled={processingMode !== null}
                      className="px-4 py-2 bg-madiba-red text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
                    >
                      Payer maintenant
                    </button>
                  ) : (
                    <span className={`px-4 py-2 font-semibold rounded-lg ${getInstallmentStatusBadge(installment.status)}`}>
                      Échoué
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Aucune tranche de formation n&apos;a encore été générée.
            </p>
            {registrationFee.status === 'paid' && paymentActions.remaining_training_amount > 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Utilisez les boutons ci-dessus pour payer une tranche ou régler la totalité du solde.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="text-center">
        <Link href="/apprenant/recus" className="text-madiba-red font-semibold hover:underline inline-flex items-center gap-2">
          Voir mes reçus de paiement
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
