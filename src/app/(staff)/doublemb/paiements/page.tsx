'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPayments } from '@/lib/admin-api';
import { Payment } from '@/lib/admin-api';

export default function PaiementsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all'); // all, completed, pending/failed
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<any>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchPayments();
    }, [page, statusFilter]);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            // Map filter tab to API status param
            let statusParam = undefined;
            if (statusFilter === 'completed') statusParam = 'completed';
            if (statusFilter === 'pending') statusParam = 'pending'; // 'failed' or 'pending' handling might need backend adjustment or multiple status support

            // If we want "Failed or Pending", we might need to handle it.
            // For now, let's map: 
            // "Validés" -> completed
            // "En attente/Échoués" -> pending (since backend failed usually stays pending or we need explicit failed support)

            const res = await getPayments({
                status: statusParam,
                page: page,
                search: search,
                per_page: 15
            });

            if (res.success) {
                setPayments(res.data);
                setMeta(res.meta);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchPayments();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Historique des Paiements</h1>
                <div className="flex gap-2">
                    {/* Export button could go here */}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <button
                        onClick={() => { setStatusFilter('all'); setPage(1); }}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all 
                            ${statusFilter === 'all'
                                ? 'bg-white dark:bg-gray-600 text-madiba-black dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    >
                        Tout
                    </button>
                    <button
                        onClick={() => { setStatusFilter('completed'); setPage(1); }}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all 
                            ${statusFilter === 'completed'
                                ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    >
                        Validés
                    </button>
                    <button
                        onClick={() => { setStatusFilter('pending'); setPage(1); }}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all 
                            ${statusFilter === 'pending'
                                ? 'bg-white dark:bg-gray-600 text-yellow-600 dark:text-yellow-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    >
                        En attente / Échoués
                    </button>
                </div>

                <form onSubmit={handleSearch} className="relative w-full md:w-64">
                    <input
                        type="text"
                        placeholder="Rechercher référence ou client..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-madiba-red focus:border-madiba-red text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
                    />
                    <svg className="w-5 h-5 text-gray-400 dark:text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </form>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                <th className="px-6 py-4">Référence</th>
                                <th className="px-6 py-4">Client</th>
                                <th className="px-6 py-4">Montant</th>
                                <th className="px-6 py-4">Méthode</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Statut</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex justify-center mb-2">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-madiba-red"></div>
                                        </div>
                                        Chargement des paiements...
                                    </td>
                                </tr>
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        Aucun paiement trouvé.
                                    </td>
                                </tr>
                            ) : (
                                payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">{payment.reference}</span>
                                            {payment.description && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-[200px]">{payment.description}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {payment.metadata?.customer_first_name || payment.user?.name || 'Inconnu'}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{payment.user?.email || payment.metadata?.customer_email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                                            {new Intl.NumberFormat('fr-FR').format(payment.amount)} {payment.currency}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                            {payment.method_label || payment.method}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                            {new Date(payment.created_at).toLocaleDateString()}
                                            <div className="text-xs text-gray-400">{new Date(payment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                ${payment.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                                                    payment.status === 'failed' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                                                        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'}`}>
                                                {payment.status === 'completed' ? 'Validé' :
                                                    payment.status === 'failed' ? 'Échoué' : 'En attente'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-gray-400 dark:text-gray-500 hover:text-madiba-red dark:hover:text-madiba-red transition-colors">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {meta && meta.last_page > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-white disabled:opacity-50"
                        >
                            Précédent
                        </button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Page {meta.current_page} sur {meta.last_page}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                            disabled={page === meta.last_page}
                            className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-white disabled:opacity-50"
                        >
                            Suivant
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
