'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Plus,
  Filter,
  Download,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  Shield,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Upload,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { getUsers, deleteUser, toggleUserStatus, getRoles, downloadCSV, type User as ApiUser, type Role } from '@/lib/admin-api';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  roles: { slug: string; name: string }[];
  active_role: { slug: string; name: string } | null;
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
  company_name?: string;
  formation?: string;
}

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400',
  secretaire: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400',
  chef_chantier: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400',
  formateur: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400',
  client: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400',
  apprenant: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-400',
};

const roleLabels: Record<string, string> = {
  admin: 'Administrateur',
  secretaire: 'Secrétaire',
  chef_chantier: 'Chef de chantier',
  formateur: 'Formateur',
  client: 'Client',
  apprenant: 'Apprenant',
};

export default function UsersPage() {
  const searchParams = useSearchParams();
  const roleFilter = searchParams.get('role') || '';

  const [users, setUsers] = useState<User[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState(roleFilter);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);


  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showActions, setShowActions] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const handlePasswordChange = async () => {
    if (!showPasswordModal || !newPassword) return;

    try {
      // Use updateUser from admin-api which supports password update
      // We need to cast or ensure updateUser exists in imports
      const { updateUser } = await import('@/lib/admin-api');

      const response = await updateUser(showPasswordModal, { password: newPassword });

      if (response.success) {
        alert('Mot de passe mis à jour avec succès');
        setShowPasswordModal(null);
        setNewPassword('');
      } else {
        alert(response.message || 'Erreur lors de la mise à jour');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la mise à jour');
    }
  };

  const itemsPerPage = 15;

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getUsers({
        role: selectedRole || undefined,
        status: selectedStatus as 'active' | 'inactive' | undefined,
        search: searchTerm || undefined,
        page: currentPage,
        per_page: itemsPerPage,
      });

      if (response.success) {
        // Transform API response to match our interface
        const transformedUsers: User[] = response.data.map((u: ApiUser) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          roles: u.roles.map(r => ({ slug: r.slug, name: r.name })),
          active_role: u.active_role ? { slug: u.active_role.slug, name: u.active_role.name } : null,
          is_active: u.is_active,
          created_at: u.created_at,
          last_login_at: u.last_login_at,
          company_name: u.company_name,
          formation: u.formation,
        }));

        setUsers(transformedUsers);
        setTotalPages(response.meta.last_page);
        setTotalUsers(response.meta.total);
      } else {
        setError('Erreur lors du chargement des utilisateurs');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  }, [selectedRole, selectedStatus, searchTerm, currentPage]);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await getRoles();
      if (response.success && response.data) {
        setAvailableRoles(response.data);
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  useEffect(() => {
    setSelectedRole(roleFilter);
  }, [roleFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRole, selectedStatus, searchTerm]);

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        const response = await deleteUser(userId);
        if (response.success) {
          fetchUsers(); // Refresh the list
        } else {
          alert(response.message || 'Erreur lors de la suppression');
        }
      } catch {
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      const response = await toggleUserStatus(userId);
      if (response.success) {
        setUsers(prev => prev.map(u =>
          u.id === userId ? { ...u, is_active: response.data?.is_active ?? !u.is_active } : u
        ));
      }
    } catch {
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const handleExport = () => {
    const exportData = users.map(u => ({
      Nom: u.name,
      Email: u.email,
      Téléphone: u.phone || '',
      Rôles: u.roles.map(r => r.name).join(', '),
      Statut: u.is_active ? 'Actif' : 'Inactif',
      'Date création': formatDate(u.created_at),
    }));
    downloadCSV(exportData, `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des utilisateurs</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {totalUsers} utilisateur{totalUsers > 1 ? 's' : ''} au total
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </button>
          <Link
            href="/doublemb/utilisateurs/nouveau"
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvel utilisateur
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email ou téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Quick filters */}
          <div className="flex items-center space-x-3">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Tous les rôles</option>
              <option value="admin">Administrateurs</option>
              <option value="staff">Staff (tous)</option>
              <option value="secretaire">Secrétaires</option>
              <option value="chef_chantier">Chefs de chantier</option>
              <option value="formateur">Formateurs</option>
              <option value="client">Clients</option>
              <option value="apprenant">Apprenants</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>

            <button
              onClick={() => fetchUsers()}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <RefreshCw className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Chargement...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-500">{error}</p>
            <button
              onClick={fetchUsers}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
            >
              Réessayer
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.length}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Rôles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Inscription
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Dernière connexion
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 font-semibold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <span
                              key={role.slug}
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roleColors[role.slug] || 'bg-gray-100 text-gray-800'}`}
                            >
                              {role.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400'
                            }`}
                        >
                          {user.is_active ? (
                            <>
                              <UserCheck className="h-3 w-3 mr-1" />
                              Actif
                            </>
                          ) : (
                            <>
                              <UserX className="h-3 w-3 mr-1" />
                              Inactif
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {user.last_login_at ? formatDate(user.last_login_at) : 'Jamais'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="relative">
                          <button
                            onClick={() => setShowActions(showActions === user.id ? null : user.id)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          >
                            <MoreVertical className="h-5 w-5 text-gray-500" />
                          </button>
                          {showActions === user.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                              <Link
                                href={`/doublemb/utilisateurs/${user.id}`}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Voir le profil
                              </Link>
                              <Link
                                href={`/doublemb/utilisateurs/${user.id}/modifier`}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </Link>
                              <Link
                                href={`/doublemb/utilisateurs/${user.id}/roles`}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Gérer les rôles
                              </Link>
                              <hr className="my-1 border-gray-200 dark:border-gray-700" />
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </button>
                              <hr className="my-1 border-gray-200 dark:border-gray-700" />
                              <button
                                onClick={() => {
                                  setShowPasswordModal(user.id);
                                  setShowActions(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                <Lock className="h-4 w-4 mr-2" />
                                Changer mot de passe
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Affichage de {(currentPage - 1) * itemsPerPage + 1} à{' '}
                {Math.min(currentPage * itemsPerPage, users.length)} sur {users.length} utilisateurs
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${currentPage === page
                      ? 'bg-red-600 text-white'
                      : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Password Change Modal */}
      {
        showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Changer le mot de passe
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Nouvel mot de passe pour {users.find(u => u.id === showPasswordModal)?.name}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Minimum 6 caractères"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowPasswordModal(null);
                    setNewPassword('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  onClick={handlePasswordChange}
                  disabled={!newPassword || newPassword.length < 6}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
                >
                  Sauvegarder
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Bulk actions */}
      {
        selectedUsers.length > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-lg flex items-center space-x-4">
            <span className="text-sm">{selectedUsers.length} utilisateur(s) sélectionné(s)</span>
            <button className="px-3 py-1 bg-red-600 rounded-lg text-sm hover:bg-red-700">
              Supprimer
            </button>
            <button className="px-3 py-1 bg-gray-700 rounded-lg text-sm hover:bg-gray-600">
              Activer/Désactiver
            </button>
            <button
              onClick={() => setSelectedUsers([])}
              className="text-gray-400 hover:text-white"
            >
              Annuler
            </button>
          </div>
        )
      }
    </div >
  );
}
