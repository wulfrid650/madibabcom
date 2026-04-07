'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock, Loader2, Plus, Search, Send, Trash2, X } from 'lucide-react';
import { api, ChefChantierMessage, PortfolioProject } from '@/lib/api';

type ComposerState = {
  chantier_id: string;
  subject: string;
  message: string;
};

const EMPTY_COMPOSER: ComposerState = {
  chantier_id: '',
  subject: '',
  message: '',
};

export default function MessagesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [messages, setMessages] = useState<ChefChantierMessage[]>([]);
  const [chantiers, setChantiers] = useState<PortfolioProject[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ChefChantierMessage | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [composer, setComposer] = useState<ComposerState>(EMPTY_COMPOSER);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const [messagesData, chantiersData] = await Promise.all([
        api.getChefChantierMessages(filterType),
        api.getChefChantierChantiers(),
      ]);

      setMessages(messagesData);
      setChantiers(chantiersData);
      setError(null);

      setSelectedMessage((current) => {
        if (messagesData.length === 0) {
          return null;
        }

        return current && messagesData.some((message) => message.id === current.id)
          ? current
          : messagesData[0];
      });
    } catch (loadError) {
      console.error(loadError);
      setError('Impossible de charger les messages.');
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  const filteredMessages = useMemo(() => {
    return messages.filter((message) => {
      const needle = searchTerm.toLowerCase();
      return (
        message.sender.toLowerCase().includes(needle) ||
        message.subject.toLowerCase().includes(needle) ||
        message.project.toLowerCase().includes(needle)
      );
    });
  }, [messages, searchTerm]);

  const unreadCount = messages.filter((message) => !message.read && message.type === 'received').length;

  const closeComposer = () => {
    if (sending) return;
    setShowComposer(false);
    setComposer(EMPTY_COMPOSER);
  };

  const handleSend = async () => {
    if (!composer.subject.trim() || !composer.message.trim()) {
      setError('Le sujet et le contenu du message sont obligatoires.');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const response = await api.sendChefChantierMessage({
        chantier_id: composer.chantier_id ? Number(composer.chantier_id) : undefined,
        subject: composer.subject.trim(),
        message: composer.message.trim(),
      });

      if (!response.success) {
        setError(response.message || 'Impossible d envoyer le message.');
        return;
      }

      closeComposer();
      await loadMessages();
    } catch (sendError) {
      console.error(sendError);
      setError('Impossible d envoyer le message.');
    } finally {
      setSending(false);
    }
  };

  if (loading && messages.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? `${unreadCount} non lu(s) • ` : ''}
            {filteredMessages.length} message(s)
          </p>
        </div>
        <button
          onClick={() => setShowComposer(true)}
          className="flex items-center space-x-2 rounded-lg bg-amber-600 px-4 py-2 font-medium text-white transition-colors hover:bg-amber-700"
        >
          <Plus className="h-5 w-5" />
          <span>Nouveau message</span>
        </button>
      </div>

      <div className="rounded-lg bg-white p-6 shadow space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="relative flex-1 md:mr-4">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par expediteur, sujet ou chantier..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(event) => setFilterType(event.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">Tous</option>
            <option value="received">Recus</option>
            <option value="sent">Envoyes</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="overflow-hidden rounded-lg bg-white shadow lg:col-span-1">
          <div className="max-h-96 divide-y divide-gray-200 overflow-y-auto lg:max-h-screen">
            {filteredMessages.length > 0 ? (
              filteredMessages.map((message) => (
                <button
                  key={message.id}
                  type="button"
                  onClick={() => setSelectedMessage(message)}
                  className={`w-full cursor-pointer p-4 text-left transition-colors ${
                    selectedMessage?.id === message.id
                      ? 'border-l-4 border-amber-600 bg-amber-50'
                      : 'border-l-4 border-transparent hover:bg-gray-50'
                  } ${!message.read && message.type === 'received' ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className={`truncate text-sm text-gray-900 ${!message.read && message.type === 'received' ? 'font-bold' : 'font-medium'}`}>
                        {message.sender}
                      </h3>
                      <p className="mt-1 truncate text-xs text-gray-500">{message.project}</p>
                      <p className="mt-1 truncate text-xs text-gray-600">{message.subject}</p>
                    </div>
                    {!message.read && message.type === 'received' && (
                      <span className="ml-2 mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600"></span>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-6 text-center text-sm text-gray-500">Aucun message</div>
            )}
          </div>
        </div>

        <div className="flex flex-col overflow-hidden rounded-lg bg-white shadow lg:col-span-2">
          {selectedMessage ? (
            <>
              <div className="border-b border-gray-200 p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900">{selectedMessage.subject}</h2>
                    <p className="mt-1 text-sm text-gray-600">{selectedMessage.project}</p>
                  </div>
                  <button type="button" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                    <span className="text-sm font-medium text-amber-800">{selectedMessage.sender.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{selectedMessage.sender}</p>
                    <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{selectedMessage.date} a {selectedMessage.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <p className="whitespace-pre-wrap text-gray-700">{selectedMessage.message}</p>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center">
              <p className="text-lg text-gray-500">Selectionnez un message pour afficher le detail.</p>
            </div>
          )}
        </div>
      </div>

      {showComposer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Nouveau message</h2>
                <p className="mt-1 text-sm text-gray-500">Associer le message a un chantier permet de le retrouver dans l espace du chef.</p>
              </div>
              <button type="button" onClick={closeComposer} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Chantier</label>
                <select
                  value={composer.chantier_id}
                  onChange={(event) => setComposer((prev) => ({ ...prev, chantier_id: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="">Aucun chantier specifique</option>
                  {chantiers.map((chantier) => (
                    <option key={chantier.id} value={String(chantier.id)}>
                      {chantier.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Sujet *</label>
                <input
                  type="text"
                  value={composer.subject}
                  onChange={(event) => setComposer((prev) => ({ ...prev, subject: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="Objet du message"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Message *</label>
                <textarea
                  rows={5}
                  value={composer.message}
                  onChange={(event) => setComposer((prev) => ({ ...prev, message: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="Saisir votre message..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeComposer}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={sending}
                onClick={() => void handleSend()}
                className="inline-flex items-center rounded-lg bg-amber-600 px-4 py-2 text-white hover:bg-amber-700 disabled:opacity-60"
              >
                {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {sending ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
