'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Send, Trash2, Clock, User, Loader2 } from 'lucide-react';
import { api, ChefChantierMessage } from '@/lib/api';

export default function MessagesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState<ChefChantierMessage | null>(null);
  const [showComposer, setShowComposer] = useState(false);

  const [messages, setMessages] = useState<ChefChantierMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        // filterType is passed to API
        const data = await api.getChefChantierMessages(filterType);
        setMessages(data);
        // If we have messages and none is selected, maybe we don't select any by default or select first
        if (data.length > 0 && !selectedMessage) {
          // setSelectedMessage(data[0]); // Optional: auto-select first
        }
      } catch (err) {
        console.error('Failed to load messages', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [filterType]); // Refetch when filter changes

  const filteredMessages = messages.filter((msg) => {
    const matchesSearch =
      msg.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.project.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const unreadCount = messages.filter((m) => !m.read && m.type === 'received').length;

  const handleReply = async () => {
    if (!selectedMessage || !replyContent.trim()) return;

    try {
      await api.sendChefChantierMessage({
        subject: `RE: ${selectedMessage.subject}`,
        message: replyContent,
        // We simulate recipient relation via backend logic or assume we reply to sender
      });
      setReplyContent('');
      alert('Message envoyé !'); // Simple feedback
    } catch (err) {
      alert('Erreur lors de l\'envoi');
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
      {/* Header */}
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
          className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Nouveau message</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1 md:mr-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par expéditeur, sujet ou chantier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="all">Tous</option>
            <option value="received">Reçus</option>
            <option value="sent">Envoyés</option>
          </select>
        </div>
      </div>

      {/* Messages Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-hidden">
          <div className="divide-y divide-gray-200 max-h-96 lg:max-h-screen overflow-y-auto">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                onClick={() => setSelectedMessage(message)}
                className={`p-4 cursor-pointer transition-colors ${selectedMessage?.id === message.id
                    ? 'bg-amber-50 border-l-4 border-amber-600'
                    : 'hover:bg-gray-50 border-l-4 border-transparent'
                  } ${!message.read && message.type === 'received' ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-${!message.read && message.type === 'received' ? 'bold' : 'medium'} text-gray-900 truncate`}>
                      {message.sender}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 truncate">{message.project}</p>
                    <p className="text-xs text-gray-600 mt-1 truncate">{message.subject}</p>
                  </div>
                  {!message.read && message.type === 'received' && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-1 flex-shrink-0 ml-2"></div>
                  )}
                </div>
              </div>
            ))}
            {filteredMessages.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">Aucun message</div>
            )}
          </div>
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden flex flex-col">
          {selectedMessage ? (
            <>
              {/* Message Header */}
              <div className="border-b border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedMessage.subject}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">{selectedMessage.project}</p>
                  </div>
                  <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                {/* Sender info */}
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-amber-800">
                      {selectedMessage.sender.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{selectedMessage.sender}</p>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {selectedMessage.date} à {selectedMessage.time}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Body */}
              <div className="flex-1 p-6 overflow-y-auto">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>

              {/* Reply */}
              {selectedMessage.type === 'received' && (
                <div className="border-t border-gray-200 p-6">
                  <textarea
                    placeholder="Répondre au message..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                    rows={3}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                  ></textarea>
                  <button
                    onClick={handleReply}
                    className="mt-3 flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <Send className="h-5 w-5" />
                    <span>Envoyer</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-center p-6">
              <p className="text-gray-500 text-lg">Sélectionnez un message pour afficher le détail</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
