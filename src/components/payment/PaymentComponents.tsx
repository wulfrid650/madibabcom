'use client';

import React, { useState, useEffect } from 'react';
import { api, PaymentMethod } from '@/lib/api';
import { Loader2, CreditCard, Smartphone, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PaymentButtonProps {
  amount: number;
  currency?: string;
  description?: string;
  enrollmentId?: number;
  onSuccess?: (reference: string) => void;
  onError?: (error: string) => void;
  className?: string;
  children?: React.ReactNode;
}

// Icônes des méthodes de paiement
const PaymentIcons: Record<string, React.ReactNode> = {
  'orange_money': (
    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
      <span className="text-white font-bold text-sm">OM</span>
    </div>
  ),
  'mtn_momo': (
    <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
      <span className="text-black font-bold text-sm">MTN</span>
    </div>
  ),
  'wave': (
    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
      <span className="text-white font-bold text-sm">W</span>
    </div>
  ),
  'card': (
    <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
      <CreditCard className="w-5 h-5 text-white" />
    </div>
  ),
};

export function PaymentButton({
  amount,
  currency = 'XOF',
  description,
  enrollmentId,
  onSuccess,
  onError,
  className = '',
  children,
}: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let result;
      
      if (enrollmentId) {
        // Paiement pour une inscription à une formation
        result = await api.initiateEnrollmentPayment(
          enrollmentId,
          `${window.location.origin}/paiement/confirmation`
        );
      } else {
        // Paiement générique
        result = await api.initiatePayment({
          amount,
          currency,
          description,
          return_url: `${window.location.origin}/paiement/confirmation`,
        });
      }

      // Rediriger vers la page de paiement Moneroo
      if (result.checkout_url) {
        window.location.href = result.checkout_url;
      } else {
        throw new Error('URL de paiement non reçue');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur lors de l\'initialisation du paiement';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handlePayment}
        disabled={isLoading}
        className={`inline-flex items-center justify-center gap-2 px-6 py-3 bg-madiba-red hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Chargement...
          </>
        ) : (
          children || (
            <>
              <CreditCard className="w-5 h-5" />
              Payer {amount.toLocaleString()} {currency}
            </>
          )
        )}
      </button>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
}

interface PaymentMethodSelectorProps {
  onSelect: (method: PaymentMethod) => void;
  selectedMethod?: string;
}

export function PaymentMethodSelector({ onSelect, selectedMethod }: PaymentMethodSelectorProps) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMethods = async () => {
      try {
        const data = await api.getPaymentMethods();
        setMethods(data.filter(m => m.available));
      } catch (err) {
        console.error('Failed to load payment methods:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadMethods();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Choisissez votre méthode de paiement
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {methods.map((method) => (
          <button
            key={method.id}
            onClick={() => onSelect(method)}
            className={`flex items-center gap-3 p-4 border-2 rounded-xl transition-all ${
              selectedMethod === method.id
                ? 'border-madiba-red bg-red-50 dark:bg-red-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            {PaymentIcons[method.id] || (
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-gray-500" />
              </div>
            )}
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">{method.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{method.description}</p>
            </div>
            {selectedMethod === method.id && (
              <CheckCircle2 className="w-5 h-5 text-madiba-red ml-auto" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

interface PaymentStatusBadgeProps {
  status: 'pending' | 'completed' | 'failed' | 'refunded';
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };

  const labels: Record<string, string> = {
    pending: 'En attente',
    completed: 'Validé',
    failed: 'Échoué',
    refunded: 'Remboursé',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

interface PaymentSummaryProps {
  amount: number;
  currency?: string;
  description?: string;
  formationTitle?: string;
}

export function PaymentSummary({ amount, currency = 'XOF', description, formationTitle }: PaymentSummaryProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 space-y-4">
      <h3 className="font-semibold text-gray-900 dark:text-white">Récapitulatif</h3>
      
      {formationTitle && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Formation</span>
          <span className="text-gray-900 dark:text-white font-medium">{formationTitle}</span>
        </div>
      )}
      
      {description && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Description</span>
          <span className="text-gray-900 dark:text-white">{description}</span>
        </div>
      )}
      
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex justify-between">
          <span className="text-gray-900 dark:text-white font-semibold">Total à payer</span>
          <span className="text-2xl font-bold text-madiba-red">
            {amount.toLocaleString()} {currency}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Paiement sécurisé par Moneroo
      </div>
    </div>
  );
}
