'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  Shield,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Lock,
  Building2,
  Briefcase,
  MapPin,
  FileText,
  Calendar,
  Clock,
  History,
  Info,
  Globe,
  Monitor,
  Server
} from 'lucide-react';
import {
  deleteUser,
  getUser,
  toggleUserStatus,
  updateUser,
  getUserLoginHistory,
  sendUserPasswordReset,
  type User as ApiUser,
  type UserLoginHistory
} from '@/lib/admin-api';

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400',
  secretaire: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400',
  chef_chantier: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400',
  formateur: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400',
  client: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400',
  apprenant: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-400',
};

export default function UserProfileClient() {
  const params = useParams();
  const userId = params?.id as string | undefined;
  const router = useRouter();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  
  // Tabs & History
  const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile');
  const [loginHistory, setLoginHistory] = useState<UserLoginHistory[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await getUser(userId);
        if (response.success && response.data) {
          setUser(response.data);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const fetchHistory = async () => {
    if (!userId) return;
    setIsHistoryLoading(true);
    try {
      const response = await getUserLoginHistory(userId);
      if (response.success) {
        setLoginHistory(response.data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const refreshUser = async () => {
    if (!userId) return;

    const response = await getUser(userId);
    if (response.success && response.data) {
      setUser(response.data);
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const response = await toggleUserStatus(user.id);
      if (response.success) {
        await refreshUser();
      } else {
        alert(response.message || 'Erreur lors de la mise à jour du statut');
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await deleteUser(user.id);
      if (response.success) {
        router.push('/doublemb/utilisateurs');
      } else {
        alert(response.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendResetPasswordEmail = async () => {
    if (!user) return;

    if (!confirm(`Envoyer un e-mail de réinitialisation de mot de passe à ${user.email} ?`)) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await sendUserPasswordReset(user.id);
      if (response.success) {
        alert(response.message || 'E-mail envoyé avec succès');
      } else {
        alert(response.message || 'Erreur lors de l\'envoi');
      }
    } catch (error) {
      console.error('Error sending reset email:', error);
      alert('Erreur lors de l\'envoi');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !user) return;

    setIsSaving(true);
    try {
      const response = await updateUser(user.id, { password: newPassword });
      if (response.success) {
        alert('Mot de passe mis à jour avec succès');
        setShowPasswordModal(false);
        setNewPassword('');
      } else {
        alert(response.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      alert('Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return 'Jamais';

    return new Date(value).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const parseUA = (ua: string) => {
    let browser = 'Inconnu';
    let os = 'Inconnu';
    
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Macintosh')) os = 'macOS';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone')) os = 'iOS';
    
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';
    
    return { browser, os };
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-72 rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-96 rounded-2xl bg-gray-200 dark:bg-gray-700 lg:col-span-1" />
          <div className="h-96 rounded-2xl bg-gray-200 dark:bg-gray-700 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-400">Utilisateur non trouvé</p>
        <button
          onClick={() => router.push('/doublemb/utilisateurs')}
          className="mt-4 inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profil utilisateur</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Détails de {user.name}
            </p>
          </div>
        </div>

        <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'profile'
                ? 'bg-white text-red-600 shadow-sm dark:bg-gray-700 dark:text-red-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Info className="h-4 w-4" />
            Informations
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-white text-red-600 shadow-sm dark:bg-gray-700 dark:text-red-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <History className="h-4 w-4" />
            Historique
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-2xl font-semibold text-red-600 dark:bg-red-900/40 dark:text-red-400">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">{user.name}</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              <div className={`mt-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                user.is_active
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400'
              }`}>
                {user.is_active ? <UserCheck className="mr-1 h-3 w-3" /> : <UserX className="mr-1 h-3 w-3" />}
                {user.is_active ? 'Actif' : 'Inactif'}
              </div>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{user.phone}</span>
                </div>
              )}
              {user.company_name && (
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span>{user.company_name}</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Link
                href={`/doublemb/utilisateurs/${user.id}/modifier`}
                className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                <Edit className="mr-2 h-4 w-4" />
                Modifier le profil
              </Link>
              <Link
                href={`/doublemb/utilisateurs/${user.id}/roles`}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <Shield className="mr-2 h-4 w-4" />
                Gérer les rôles
              </Link>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <Lock className="mr-2 h-4 w-4" />
                Changer le mot de passe
              </button>
              <button
                onClick={handleSendResetPasswordEmail}
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <Mail className="mr-2 h-4 w-4" />
                Envoyer lien de réinitialisation
              </button>
              <button
                onClick={handleToggleStatus}
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                {user.is_active ? <UserX className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
                {user.is_active ? 'Désactiver' : 'Activer'}
              </button>
              <button
                onClick={handleDelete}
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/40 dark:hover:bg-red-900/20"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Rôles
            </h3>
            <div className="flex flex-wrap gap-2">
              {user.roles.length > 0 ? user.roles.map((role: { slug: string; name: string }) => (
                <span
                  key={role.slug}
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${roleColors[role.slug] || 'bg-gray-100 text-gray-800'}`}
                >
                  {role.name}
                </span>
              )) : (
                <span className="text-sm text-gray-500 dark:text-gray-400">Aucun rôle associé</span>
              )}
            </div>
            {user.active_role && (
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Rôle actif: <span className="font-medium text-gray-900 dark:text-white">{user.active_role.name}</span>
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {activeTab === 'profile' ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Informations du compte</h3>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
                    <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Créé le</p>
                    <p className="mt-2 font-medium text-gray-900 dark:text-white">{formatDate(user.created_at)}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
                    <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Dernière connexion</p>
                    <p className="mt-2 font-medium text-gray-900 dark:text-white">{formatDate(user.last_login_at)}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
                    <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Téléphone</p>
                    <p className="mt-2 font-medium text-gray-900 dark:text-white">{user.phone || 'Non renseigné'}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
                    <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Statut</p>
                    <p className="mt-2 font-medium text-gray-900 dark:text-white">{user.is_active ? 'Actif' : 'Inactif'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Informations complémentaires</h3>
                <div className="mt-6 space-y-4 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex gap-3">
                    <Briefcase className="mt-0.5 h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Entreprise / formation</p>
                      <p>{user.company_name || user.formation || 'Aucune information renseignée'}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Adresse</p>
                      <p>{user.address || 'Aucune adresse renseignée'}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <FileText className="mt-0.5 h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Biographie / note</p>
                      <p className="whitespace-pre-wrap">{user.bio || 'Aucune note disponible'}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Calendar className="mt-0.5 h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Identifiant employé</p>
                      <p>{user.employee_id || 'Non renseigné'}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Clock className="mt-0.5 h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Spécialité</p>
                      <p>{user.speciality || 'Non renseignée'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
               <div className="border-b border-gray-200 p-6 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Historique de connexion</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Liste des 15 dernières connexions détectées</p>
              </div>

              {isHistoryLoading ? (
                <div className="p-12 text-center text-gray-500">Chargement de l'historique...</div>
              ) : loginHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 dark:bg-gray-900/50">
                      <tr>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Localisation</th>
                        <th className="px-6 py-3">Appareil</th>
                        <th className="px-6 py-3">Adresse IP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {loginHistory.map((item: UserLoginHistory) => {
                        const { browser, os } = parseUA(item.user_agent);
                        return (
                          <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="font-medium text-gray-900 dark:text-white">{formatDate(item.created_at)}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-gray-400" />
                                <span>{item.city}, {item.country}</span>
                              </div>
                              <div className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                                <Server className="h-3 w-3" />
                                {item.isp}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Monitor className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">{browser}</span>
                              </div>
                              <div className="mt-1 text-xs text-gray-500">{os}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-mono text-xs">{item.ip_address}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-gray-500">Aucun historique de connexion disponible</div>
              )}
            </div>
          )}
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Changer le mot de passe</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Nouvel mot de passe pour {user.name}
            </p>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="mt-4 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Minimum 6 caractères"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={isSaving || newPassword.length < 6}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
