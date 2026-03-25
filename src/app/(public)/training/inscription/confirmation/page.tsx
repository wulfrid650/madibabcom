'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function ConfirmationContent() {
    const searchParams = useSearchParams();
    const paymentId = searchParams.get('paymentId');
    const reference = searchParams.get('reference');
    const status = searchParams.get('status');
    
    const [loading, setLoading] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending' | 'unknown'>('unknown');
    const [paymentDetails, setPaymentDetails] = useState<{
        formation?: string;
        amount?: number;
        reference?: string;
    } | null>(null);

    useEffect(() => {
        checkPaymentStatus();
    }, [paymentId, reference, status]);

    const checkPaymentStatus = async () => {
        // Si le status est passé dans l'URL par Moneroo
        if (status) {
            if (status === 'success' || status === 'successful') {
                setPaymentStatus('success');
            } else if (status === 'failed' || status === 'cancelled') {
                setPaymentStatus('failed');
            } else {
                setPaymentStatus('pending');
            }
        }

        // Vérifier le statut via l'API si on a une référence
        if (reference || paymentId) {
            try {
                const response = await fetch(`${API_URL}/payments/verify/${reference || paymentId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setPaymentStatus(data.data.status === 'completed' ? 'success' : 
                                        data.data.status === 'failed' ? 'failed' : 'pending');
                        setPaymentDetails({
                            formation: data.data.description,
                            amount: data.data.amount,
                            reference: data.data.reference,
                        });
                    }
                }
            } catch (err) {
                console.error('Error checking payment status:', err);
            }
        }

        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-madiba-red mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Vérification du paiement...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-20">
            <div className="container mx-auto px-6 max-w-2xl">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                    {/* Success State */}
                    {paymentStatus === 'success' && (
                        <>
                            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Inscription confirmée !
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Votre paiement a été effectué avec succès. Vous recevrez un email de confirmation 
                                avec tous les détails de votre inscription.
                            </p>
                            {paymentDetails && (
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6 text-left">
                                    {paymentDetails.formation && (
                                        <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600">
                                            <span className="text-gray-500 dark:text-gray-400">Formation</span>
                                            <span className="font-medium text-gray-900 dark:text-white">{paymentDetails.formation}</span>
                                        </div>
                                    )}
                                    {paymentDetails.amount && (
                                        <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600">
                                            <span className="text-gray-500 dark:text-gray-400">Montant payé</span>
                                            <span className="font-bold text-madiba-red">
                                                {new Intl.NumberFormat('fr-FR').format(paymentDetails.amount)} FCFA
                                            </span>
                                        </div>
                                    )}
                                    {paymentDetails.reference && (
                                        <div className="flex justify-between py-2">
                                            <span className="text-gray-500 dark:text-gray-400">Référence</span>
                                            <span className="font-mono text-sm text-gray-900 dark:text-white">{paymentDetails.reference}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    <strong>Prochaines étapes :</strong> Notre équipe vous contactera dans les 24-48h 
                                    pour vous communiquer les détails pratiques de la formation (dates, lieu, matériel).
                                </p>
                            </div>
                        </>
                    )}

                    {/* Failed State */}
                    {paymentStatus === 'failed' && (
                        <>
                            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Paiement échoué
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Le paiement n&apos;a pas pu être effectué. Votre place n&apos;a pas été réservée.
                                Vous pouvez réessayer ou nous contacter pour obtenir de l&apos;aide.
                            </p>
                        </>
                    )}

                    {/* Pending State */}
                    {paymentStatus === 'pending' && (
                        <>
                            <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Paiement en attente
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Votre paiement est en cours de traitement. Vous recevrez une confirmation 
                                par email une fois le paiement validé.
                            </p>
                        </>
                    )}

                    {/* Unknown State */}
                    {paymentStatus === 'unknown' && (
                        <>
                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Statut inconnu
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Nous n&apos;avons pas pu déterminer le statut de votre paiement. 
                                Si vous avez effectué un paiement, veuillez nous contacter avec votre référence.
                            </p>
                        </>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        {paymentStatus === 'failed' && (
                            <Link
                                href="/training/inscription"
                                className="px-6 py-3 bg-madiba-red text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
                            >
                                Réessayer l&apos;inscription
                            </Link>
                        )}
                        <Link
                            href="/training"
                            className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            Voir nos formations
                        </Link>
                        <Link
                            href="/"
                            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Retour à l&apos;accueil
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ConfirmationPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-madiba-red"></div>
            </div>
        }>
            <ConfirmationContent />
        </Suspense>
    );
}
