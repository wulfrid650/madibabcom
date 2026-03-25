'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getClientMessages, sendClientMessage } from '@/lib/api';

interface Message {
    id: number;
    subject: string;
    message: string;
    status: 'new' | 'read' | 'responded';
    created_at: string;
    responded_at?: string;
}

export default function MessagesPage() {
    const { user, token } = useAuth();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showNewMessage, setShowNewMessage] = useState(false);
    const [sending, setSending] = useState(false);

    const [newMessage, setNewMessage] = useState({
        subject: '',
        message: '',
    });

    useEffect(() => {
        if (!token) {
            router.push('/connexion?redirect=/client/messages');
            return;
        }
        fetchMessages();
    }, [token]);

    const fetchMessages = async () => {
        try {
            const response = await getClientMessages();
            if (response.success) {
                setMessages(response.data?.data || []);
            } else {
                setError('Erreur lors du chargement des messages');
            }
        } catch (err) {
            console.error('Error fetching messages:', err);
            setError('Erreur lors du chargement des messages');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newMessage.subject.trim() || !newMessage.message.trim()) {
            alert('Veuillez remplir tous les champs');
            return;
        }

        setSending(true);
        try {
            await sendClientMessage(newMessage);
            setNewMessage({ subject: '', message: '' });
            setShowNewMessage(false);
            fetchMessages();
            alert('Message envoyé avec succès');
        } catch (err) {
            console.error('Error sending message:', err);
            alert('Erreur lors de l\'envoi du message');
        } finally {
            setSending(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'responded':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'read':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'new':
                return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'responded':
                return 'Répondu';
            case 'read':
                return 'Lu';
            case 'new':
                return 'Nouveau';
            default:
                return status;
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
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Mes messages
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Communiquez avec l'équipe MBC
                        </p>
                    </div>
                    <button
                        onClick={() => setShowNewMessage(!showNewMessage)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-madiba-red text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nouveau message
                    </button>
                </div>
            </div>

            {/* New Message Form */}
            {showNewMessage && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Nouveau message
                    </h2>
                    <form onSubmit={handleSendMessage} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Sujet
                            </label>
                            <input
                                type="text"
                                value={newMessage.subject}
                                onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent"
                                placeholder="Objet de votre message"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Message
                            </label>
                            <textarea
                                value={newMessage.message}
                                onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                                rows={6}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent resize-none"
                                placeholder="Votre message..."
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowNewMessage(false)}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={sending}
                                className="px-4 py-2 bg-madiba-red text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {sending ? 'Envoi...' : 'Envoyer'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            {/* Messages List */}
            {messages.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
                    <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Aucun message
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Vous n'avez envoyé aucun message pour le moment
                    </p>
                    <button
                        onClick={() => setShowNewMessage(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-madiba-red text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Envoyer un message
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between gap-4 mb-3">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {msg.subject}
                                </h3>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(msg.status)}`}>
                                    {getStatusText(msg.status)}
                                </span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-4 whitespace-pre-wrap">
                                {msg.message}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                <span>
                                    Envoyé le {new Date(msg.created_at).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                                {msg.responded_at && (
                                    <span>
                                        • Répondu le {new Date(msg.responded_at).toLocaleDateString('fr-FR')}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
