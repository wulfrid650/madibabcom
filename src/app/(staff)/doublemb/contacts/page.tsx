'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  FileText,
  Filter,
  Download,
  Eye,
  CheckCircle,
  Clock,
  Archive,
  ArrowLeft,
  Building2
} from 'lucide-react';
import { api } from '@/lib/api';

interface ContactRequest {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  subject: string;
  service_type: string | null;
  message: string;
  status: 'new' | 'read' | 'responded' | 'archived';
  admin_notes: string | null;
  assigned_to: number | null;
  responded_at: string | null;
  created_at: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<ContactRequest | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchContacts();
  }, [filterStatus, filterType, searchTerm]);

  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterType !== 'all') params.service_type = filterType;
      if (searchTerm) params.search = searchTerm;

      const data = await api.getAdminContacts(params);
      setContacts(data.data);
      setUnreadCount(data.meta?.unread_count || 0);
    } catch (error) {
      console.error('Erreur lors de la récupération des contacts', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string; icon: any }> = {
      new: { label: 'Nouveau', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400', icon: Mail },
      read: { label: 'Lu', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400', icon: Eye },
      responded: { label: 'Répondu', color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400', icon: CheckCircle },
      archived: { label: 'Archivé', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-400', icon: Archive }
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

  const exportCSV = () => {
    const csv = [
      ['Date', 'Nom', 'Email', 'Téléphone', 'Type', 'Statut', 'Sujet'],
      ...contacts.map(c => [
        new Date(c.created_at).toLocaleDateString(),
        c.name,
        c.email,
        c.phone || '',
        getServiceTypeLabel(c.service_type),
        getStatusBadge(c.status).label,
        c.subject
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `demandes-contact-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const markAsResponded = async (id: number) => {
    try {
      await api.updateAdminContact(id, { status: 'responded' });
      fetchContacts();
    } catch (error) {
      console.error('Erreur lors de la mise à jour', error);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl w-1/3"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Demandes de contact</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestion des demandes de devis et de contact
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Exporter CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rechercher par nom, email ou sujet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="new">Nouveau</option>
            <option value="read">Lu</option>
            <option value="responded">Répondu</option>
            <option value="archived">Archivé</option>
          </select>

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
          >
            <option value="all">Tous les types</option>
            <option value="construction">Construction</option>
            <option value="renovation">Rénovation</option>
            <option value="architecture">Architecture</option>
            <option value="genie-civil">Génie civil</option>
            <option value="formation">Formation</option>
            <option value="autre">Autre</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {['new', 'read', 'responded', 'archived'].map((status) => {
          const count = contacts.filter(c => c.status === status).length;
          const badge = getStatusBadge(status);
          const Icon = badge.icon;
          return (
            <div
              key={status}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${badge.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{count}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{badge.label}</p>
            </div>
          );
        })}
      </div>

      {/* Contacts List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {contacts.length} demande{contacts.length > 1 ? 's' : ''} trouvée{contacts.length > 1 ? 's' : ''}
          </h2>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {contacts.length === 0 ? (
            <div className="p-12 text-center">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Aucune demande trouvée</p>
            </div>
          ) : (
            contacts.map((contact) => {
              const badge = getStatusBadge(contact.status);
              const StatusIcon = badge.icon;
              return (
                <div key={contact.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color} flex items-center gap-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {badge.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(contact.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {contact.subject}
                      </h3>

                      <div className="flex flex-wrap gap-4 mb-3">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <User className="h-4 w-4 mr-1" />
                          {contact.name}
                        </div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Mail className="h-4 w-4 mr-1" />
                          {contact.email}
                        </div>
                        {contact.phone && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Phone className="h-4 w-4 mr-1" />
                            {contact.phone}
                          </div>
                        )}
                        {contact.company && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Building2 className="h-4 w-4 mr-1" />
                            {contact.company}
                          </div>
                        )}
                      </div>

                      {contact.service_type && (
                        <div className="inline-block px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400 text-xs rounded mb-2">
                          {getServiceTypeLabel(contact.service_type)}
                        </div>
                      )}

                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {contact.message}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Link
                        href={`/doublemb/contacts/${contact.id}`}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Voir
                      </Link>
                      {contact.status !== 'responded' && (
                        <button
                          onClick={() => markAsResponded(contact.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Répondre
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
