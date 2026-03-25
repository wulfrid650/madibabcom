'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Building2,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  MapPin,
  FolderOpen,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Filter,
  Grid,
  List,
  Star,
  StarOff,
  ExternalLink
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
  type: 'client' | 'partenaire' | 'fournisseur';
  email: string;
  phone: string;
  address: string;
  city: string;
  contact_name: string;
  contact_role: string;
  projects_count: number;
  total_spent: number;
  is_vip: boolean;
  status: 'active' | 'inactive';
  logo?: string;
  created_at: string;
  last_project?: string;
}

import { getClients, User } from '@/lib/admin-api';

const typeConfig: Record<string, { label: string; color: string }> = {
  client: {
    label: 'Client',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400'
  },
  partenaire: {
    label: 'Partenaire',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400'
  },
  fournisseur: {
    label: 'Fournisseur',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400'
  },
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showActions, setShowActions] = useState<string | null>(null);

  const itemsPerPage = 9;

  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const response = await getClients({
        search: searchTerm,
        status: selectedStatus as 'active' | 'inactive',
        page: currentPage,
        per_page: itemsPerPage
      });

      if (response.success) {
        // Map API users to Company interface
        const mappedCompanies: Company[] = response.data.map((user: any) => ({
          id: user.id,
          name: user.company_name || user.name, // Prefer company name
          type: 'client', // Default to client as this is the "Clients" endpoint
          email: user.email,
          phone: user.phone || '',
          address: user.company_address || user.address || '',
          city: (user.company_address || user.address || '').split(',').pop()?.trim() || 'Cameroun', // Crude city extraction
          contact_name: user.name,
          contact_role: 'Contact Principal',
          projects_count: user.projets || 0, // 'projets' count from withCount 
          total_spent: 0, // Not yet available in API
          is_vip: false, // Not yet available
          status: user.is_active ? 'active' : 'inactive',
          created_at: user.created_at,
          last_project: ''
        }));
        setCompanies(mappedCompanies);
        setTotalPages(response.meta.last_page);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [selectedType, selectedStatus, searchTerm, currentPage]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + 'M FCFA';
    }
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const toggleVIP = (companyId: string) => {
    setCompanies(prev => prev.map(c =>
      c.id === companyId ? { ...c, is_vip: !c.is_vip } : c
    ));
  };

  const paginatedCompanies = companies;

  const stats = {
    total: companies.length, // Note: This will only show count for current page, ideally should come from API meta
    clients: companies.filter(c => c.type === 'client').length,
    vip: companies.filter(c => c.is_vip).length,
    totalRevenue: companies.reduce((acc, c) => acc + c.total_spent, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Entreprises</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {companies.length} entreprise{companies.length > 1 ? 's' : ''} enregistrée{companies.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/doublemb/entreprises/nouveau"
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Ajouter entreprise
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <Building2 className="h-8 w-8 text-blue-500" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Total entreprises</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <FolderOpen className="h-8 w-8 text-green-500" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.clients}</span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Clients actifs</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <Star className="h-8 w-8 text-yellow-500" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.vip}</span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">VIP</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <DollarSign className="h-8 w-8 text-purple-500" />
            <span className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalRevenue)}</span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">CA total clients</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une entreprise..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Tous les types</option>
              {Object.entries(typeConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Tous statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
              >
                <Grid className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
              >
                <List className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Companies Grid/List */}
      {isLoading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600 mx-auto"></div>
        </div>
      ) : companies.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Aucune entreprise trouvée</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedCompanies.map((company) => {
            const type = typeConfig[company.type];
            return (
              <div
                key={company.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 relative"
              >
                {/* VIP Badge */}
                {company.is_vip && (
                  <div className="absolute top-4 right-4">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  </div>
                )}

                {/* Company Info */}
                <div className="flex items-start mb-4">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mr-4">
                    <Building2 className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {company.name}
                    </h3>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${type.color}`}>
                      {type.label}
                    </span>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{company.city}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{company.email}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{company.phone}</span>
                  </div>
                </div>

                {/* Stats */}
                {company.type === 'client' && (
                  <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Projets</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{company.projects_count}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total dépensé</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(company.total_spent)}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    href={`/doublemb/entreprises/${company.id}`}
                    className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline"
                  >
                    Voir le profil
                  </Link>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleVIP(company.id)}
                      className="p-2 text-gray-400 hover:text-yellow-500"
                      title={company.is_vip ? 'Retirer VIP' : 'Marquer VIP'}
                    >
                      {company.is_vip ? (
                        <StarOff className="h-4 w-4" />
                      ) : (
                        <Star className="h-4 w-4" />
                      )}
                    </button>
                    <Link
                      href={`/doublemb/entreprises/${company.id}/modifier`}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Entreprise
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Ville
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Projets
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedCompanies.map((company) => {
                const type = typeConfig[company.type];
                return (
                  <tr key={company.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {company.is_vip && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-2" />}
                        <span className="font-medium text-gray-900 dark:text-white">{company.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${type.color}`}>
                        {type.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">{company.contact_name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{company.contact_role}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {company.city}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {company.projects_count}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/doublemb/entreprises/${company.id}`}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/doublemb/entreprises/${company.id}/modifier`}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Page {currentPage} sur {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
