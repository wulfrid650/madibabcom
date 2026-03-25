'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Users,
  Check,
  X,
  Save,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { getRoles, createRole, updateRole, deleteRole, type Role as ApiRole } from '@/lib/admin-api';

interface Role {
  id: string;
  slug: string;
  name: string;
  description: string;
  is_staff: boolean;
  can_self_register: boolean;
  users_count: number;
  created_at: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

const defaultPermissions: Permission[] = [
  { id: '1', name: 'users.view', description: 'Voir les utilisateurs', category: 'Utilisateurs' },
  { id: '2', name: 'users.create', description: 'Créer des utilisateurs', category: 'Utilisateurs' },
  { id: '3', name: 'users.edit', description: 'Modifier les utilisateurs', category: 'Utilisateurs' },
  { id: '4', name: 'users.delete', description: 'Supprimer les utilisateurs', category: 'Utilisateurs' },
  { id: '5', name: 'projects.view', description: 'Voir les projets', category: 'Projets' },
  { id: '6', name: 'projects.create', description: 'Créer des projets', category: 'Projets' },
  { id: '7', name: 'projects.edit', description: 'Modifier les projets', category: 'Projets' },
  { id: '8', name: 'projects.delete', description: 'Supprimer les projets', category: 'Projets' },
  { id: '9', name: 'formations.view', description: 'Voir les formations', category: 'Formations' },
  { id: '10', name: 'formations.manage', description: 'Gérer les formations', category: 'Formations' },
  { id: '11', name: 'payments.view', description: 'Voir les paiements', category: 'Paiements' },
  { id: '12', name: 'payments.manage', description: 'Gérer les paiements', category: 'Paiements' },
  { id: '13', name: 'reports.view', description: 'Voir les rapports', category: 'Rapports' },
  { id: '14', name: 'reports.export', description: 'Exporter les rapports', category: 'Rapports' },
  { id: '15', name: 'settings.view', description: 'Voir les paramètres', category: 'Paramètres' },
  { id: '16', name: 'settings.manage', description: 'Gérer les paramètres', category: 'Paramètres' },
];

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Partial<Role> | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const [isSaving, setIsSaving] = useState(false);

  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getRoles();
      if (response.success && response.data) {
        const transformedRoles: Role[] = response.data.map((r: ApiRole) => ({
          id: r.id,
          slug: r.slug,
          name: r.name,
          description: r.description || '',
          is_staff: r.is_staff,
          can_self_register: r.can_self_register,
          users_count: r.users_count || 0,
          created_at: r.created_at,
        }));
        setRoles(transformedRoles);
        
        // Setup default permissions based on role slugs
        const permissionsMap: Record<string, string[]> = {};
        transformedRoles.forEach(role => {
          if (role.slug === 'admin') {
            permissionsMap[role.slug] = defaultPermissions.map(p => p.id);
          } else if (role.slug === 'secretaire') {
            permissionsMap[role.slug] = ['1', '2', '3', '5', '6', '7', '9', '11', '12', '13'];
          } else if (role.slug === 'chef_chantier') {
            permissionsMap[role.slug] = ['5', '6', '7', '13', '14'];
          } else if (role.slug === 'formateur') {
            permissionsMap[role.slug] = ['1', '9', '10', '13'];
          } else if (role.slug === 'client') {
            permissionsMap[role.slug] = ['5'];
          } else if (role.slug === 'apprenant') {
            permissionsMap[role.slug] = ['9'];
          } else {
            permissionsMap[role.slug] = [];
          }
        });
        setRolePermissions(permissionsMap);
      } else {
        setError(response.message || 'Erreur lors du chargement des rôles');
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleCreateRole = () => {
    setEditingRole({
      name: '',
      slug: '',
      description: '',
      is_staff: false,
      can_self_register: false,
    });
    setShowCreateModal(true);
  };

  const handleSaveRole = async () => {
    if (!editingRole?.name || !editingRole?.slug) return;

    setIsSaving(true);
    try {
      const response = await createRole({
        name: editingRole.name,
        slug: editingRole.slug,
        description: editingRole.description,
        is_staff: editingRole.is_staff,
        can_self_register: editingRole.can_self_register,
      });

      if (response.success) {
        await fetchRoles();
        setShowCreateModal(false);
        setEditingRole(null);
      } else {
        alert(response.message || 'Erreur lors de la création du rôle');
      }
    } catch {
      alert('Erreur lors de la création du rôle');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role && role.users_count > 0) {
      alert(`Impossible de supprimer ce rôle car ${role.users_count} utilisateur(s) l'utilisent.`);
      return;
    }
    
    if (confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) {
      try {
        const response = await deleteRole(roleId);
        if (response.success) {
          await fetchRoles();
          if (selectedRole?.id === roleId) {
            setSelectedRole(null);
          }
        } else {
          alert(response.message || 'Erreur lors de la suppression');
        }
      } catch {
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleTogglePermission = (roleSlug: string, permissionId: string) => {
    setRolePermissions(prev => {
      const current = prev[roleSlug] || [];
      const updated = current.includes(permissionId)
        ? current.filter(id => id !== permissionId)
        : [...current, permissionId];
      return { ...prev, [roleSlug]: updated };
    });
  };

  const groupedPermissions = defaultPermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          <div className="lg:col-span-2 h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={fetchRoles}
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rôles & Permissions</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gérez les rôles et leurs permissions d'accès
          </p>
        </div>
        <button
          onClick={handleCreateRole}
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau rôle
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start">
          <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" />
          <div>
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">Système de rôles multi-niveaux</h4>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
              Un utilisateur peut avoir plusieurs rôles. Les rôles "Staff" sont réservés aux employés de MBC.
              Les utilisateurs peuvent basculer entre leurs rôles via le menu de profil.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Rôles disponibles</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {roles.map((role) => (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedRole?.id === role.id
                    ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-l-red-600'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      role.is_staff 
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                        : 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
                    }`}>
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{role.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{role.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Users className="h-4 w-4 mr-1" />
                    {role.users_count}
                  </div>
                </div>
                <div className="mt-2 flex items-center space-x-2">
                  {role.is_staff && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400">
                      Staff
                    </span>
                  )}
                  {role.can_self_register && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400">
                      Auto-inscription
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Role Details & Permissions */}
        <div className="lg:col-span-2 space-y-6">
          {selectedRole ? (
            <>
              {/* Role Info */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedRole.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedRole.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                      <Edit className="h-5 w-5 text-gray-500" />
                    </button>
                    {selectedRole.users_count === 0 && (
                      <button
                        onClick={() => handleDeleteRole(selectedRole.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <Trash2 className="h-5 w-5 text-red-500" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{selectedRole.users_count}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Utilisateurs</div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {rolePermissions[selectedRole.slug]?.length || 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Permissions</div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="flex items-center">
                      {selectedRole.is_staff ? (
                        <Check className="h-6 w-6 text-green-500" />
                      ) : (
                        <X className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Rôle Staff</div>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Permissions</h3>
                  <button className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer
                  </button>
                </div>

                <div className="space-y-6">
                  {Object.entries(groupedPermissions).map(([category, permissions]) => (
                    <div key={category}>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{category}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {permissions.map((permission) => {
                          const isEnabled = rolePermissions[selectedRole.slug]?.includes(permission.id);
                          return (
                            <label
                              key={permission.id}
                              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                                isEnabled
                                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isEnabled}
                                onChange={() => handleTogglePermission(selectedRole.slug, permission.id)}
                                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                              />
                              <div className="ml-3">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {permission.description}
                                </span>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{permission.name}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Sélectionnez un rôle
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Cliquez sur un rôle dans la liste pour voir et modifier ses permissions
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Nouveau rôle</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom du rôle *
                </label>
                <input
                  type="text"
                  value={editingRole?.name || ''}
                  onChange={(e) => setEditingRole(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ex: Superviseur"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Slug (identifiant) *
                </label>
                <input
                  type="text"
                  value={editingRole?.slug || ''}
                  onChange={(e) => setEditingRole(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ex: superviseur"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={editingRole?.description || ''}
                  onChange={(e) => setEditingRole(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Description du rôle..."
                />
              </div>

              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingRole?.is_staff || false}
                    onChange={(e) => setEditingRole(prev => ({ ...prev, is_staff: e.target.checked }))}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Rôle Staff</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingRole?.can_self_register || false}
                    onChange={(e) => setEditingRole(prev => ({ ...prev, can_self_register: e.target.checked }))}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Auto-inscription</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingRole(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveRole}
                disabled={!editingRole?.name || !editingRole?.slug}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Créer le rôle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
