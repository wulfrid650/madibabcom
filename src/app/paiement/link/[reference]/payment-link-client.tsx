'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function PaymentLinkClient() {
    const params = useParams();
    const router = useRouter();
    const reference = params?.reference as string;

    const [loading, setLoading] = useState(true);
    const [payment, setPayment] = useState<any>(null);
    const [settings, setSettings] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [showBankInfo, setShowBankInfo] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [checkingPromo, setCheckingPromo] = useState(false);
    const [promoError, setPromoError] = useState<string | null>(null);
    const [promoSuccess, setPromoSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (reference) {
            Promise.all([
                fetchPaymentDetails(),
                fetchSettings()
            ]).finally(() => setLoading(false));
        }
    }, [reference]);

    const fetchSettings = async () => {
        try {
            const res = await api.getPublicSettings();
            setSettings(res);
        } catch (err) {
            console.error('Failed to load settings', err);
        }
    }

    const fetchPaymentDetails = async () => {
        try {
            const res = await api.request<any>(`/payments/${reference}`);
            setPayment(res.data);
        } catch (err: any) {
            console.error(err);
            setError('Paiement introuvable ou invalide.');
        }
    };

    const handlePay = async () => {
        setProcessing(true);
        try {
            const codeToUse = payment?.metadata?.temp_promo || promoCode.trim() || undefined;
            const res = await api.payPending(reference, codeToUse);
            if (res.checkout_url) {
                window.location.href = res.checkout_url;
            } else if (res.payment_url) {
                window.location.href = res.payment_url;
            } else {
                alert('Le paiement reste en attente. Réessayez dans quelques instants ou contactez le secrétariat avec votre référence.');
            }
        } catch (err: any) {
            alert('Erreur lors de l\'initialisation du paiement: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleApplyPromo = async () => {
        if (!promoCode || !payment) return;
        setCheckingPromo(true);
        setPromoError(null);
        setPromoSuccess(null);

        try {
            const code = promoCode.trim();
            const formationId = payment.formation_id ?? payment.metadata?.formation_id;
            const res = await api.checkPromo(code, Number(payment.amount), formationId ? Number(formationId) : undefined);

            if (res.success) {
                setPromoSuccess(`Code valide ! Réduction: ${new Intl.NumberFormat('fr-FR').format(res.data.discount)} ${payment.currency}`);
                setPayment((prev: any) => ({
                    ...prev,
                    amount: res.data.new_amount,
                    metadata: {
                        ...prev.metadata,
                        temp_promo: code,
                        temp_discount: res.data.discount,
                    },
                }));
            }
        } catch (err) {
            console.error(err);
            setPromoError(err instanceof Error ? err.message : 'Code promo invalide');
        } finally {
            setCheckingPromo(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-madiba-red"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">Erreur</h1>
                <p className="text-gray-600">{error}</p>
            </div>
        </div>
    );

    if (!payment) return null;

    if (payment.status === 'completed') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Paiement Déjà Validé</h1>
                    <p className="text-gray-600 mb-4">Ce lien de paiement a déjà été réglé le {new Date(payment.validated_at).toLocaleDateString()}.</p>
                    <div className="text-lg font-bold text-madiba-black mb-6">
                        {new Intl.NumberFormat('fr-FR').format(payment.amount)} {payment.currency}
                    </div>
                </div>
            </div>
        );
    }

    if (payment.enrollment_status === 'cancelled') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Demande expirée</h1>
                    <p className="text-gray-600 mb-4">
                        Cette demande a dépassé la fenêtre d&apos;attente et a été annulée.
                    </p>
                    <p className="text-sm text-gray-500">
                        Si vous avez déjà payé, contactez le secrétariat avec votre référence {payment.reference}.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-md w-full">
                <div className="bg-madiba-black p-6 text-white text-center">
                    <h1 className="text-xl font-bold">MBC Digital</h1>
                    <p className="opacity-80 text-sm mt-1">Paiement Sécurisé</p>
                </div>
                <div className="p-8">
                    <div className="text-center mb-8">
                        <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-1">Montant à payer</p>
                        <div className="text-4xl font-bold text-gray-900">
                            {new Intl.NumberFormat('fr-FR').format(payment.amount)} <span className="text-xl text-gray-500">{payment.currency}</span>
                        </div>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-600">Bénéficiaire</span>
                            <span className="font-medium text-gray-900">MBC SARL</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-600">Client</span>
                            <span className="font-medium text-gray-900">{payment.metadata?.customer_first_name || 'Client'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-600">Motif</span>
                            <span className="font-medium text-gray-900 text-right">{payment.description}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-600">Référence</span>
                            <span className="font-medium text-gray-500 font-mono text-sm">{payment.reference}</span>
                        </div>
                    </div>

                    {!payment.metadata?.promo_code && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Code Promo</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={promoCode}
                                    onChange={(e) => setPromoCode(e.target.value)}
                                    placeholder="Entrez votre code"
                                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-madiba-red focus:border-madiba-red text-sm"
                                />
                                <button
                                    onClick={handleApplyPromo}
                                    disabled={checkingPromo || !promoCode}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50"
                                >
                                    {checkingPromo ? '...' : 'Appliquer'}
                                </button>
                            </div>
                            {promoError && <p className="text-red-500 text-xs mt-1">{promoError}</p>}
                            {promoSuccess && <p className="text-green-600 text-xs mt-1">{promoSuccess}</p>}
                        </div>
                    )}

                    {payment.metadata?.promo_code && (
                        <div className="mb-6 bg-green-50 p-3 rounded-lg border border-green-100">
                            <p className="text-sm text-green-700 flex justify-between">
                                <span>Code promo appliqué : <strong>{payment.metadata.promo_code}</strong></span>
                                <span>-{new Intl.NumberFormat('fr-FR').format(payment.metadata.discount_amount)} {payment.currency}</span>
                            </p>
                        </div>
                    )}

                    <button
                        onClick={handlePay}
                        disabled={processing}
                        className="w-full py-4 bg-madiba-red text-white font-bold rounded-lg shadow-lg hover:bg-red-700 transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {processing ? (
                            <>PROCESSING...</>
                        ) : (
                            <>
                                <span>Payer Maintenant</span>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </>
                        )}
                    </button>

                    <div className="border-t border-gray-100 pt-4 mt-6">
                        <button
                            onClick={() => setShowBankInfo(!showBankInfo)}
                            className="text-madiba-red hover:underline text-sm font-medium w-full text-center"
                        >
                            {showBankInfo ? 'Masquer les infos bancaires' : 'Ou payer par Virement Bancaire'}
                        </button>

                        {showBankInfo && (
                            <div className="mt-4 bg-gray-50 p-4 rounded-lg text-left text-sm text-gray-700 space-y-2">
                                <h3 className="font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-2">Coordonnées Bancaires</h3>
                                {settings?.bank_info ? (
                                    <div className="whitespace-pre-wrap">{settings.bank_info}</div>
                                ) : (
                                    <p className="text-gray-500 italic">Aucune information bancaire configurée via les Paramètres.</p>
                                )}
                                <p className="text-xs text-blue-600 mt-2">
                                    Note: Une fois le virement effectué, veuillez contacter le secrétariat avec votre preuve de paiement pour validation.
                                </p>
                            </div>
                        )}
                    </div>

                    <p className="text-xs text-center text-gray-400 mt-6">
                        Paiement sécurisé par Moneroo. Vos informations sont chiffrées.
                    </p>
                </div>
            </div>
        </div>
    );
}
