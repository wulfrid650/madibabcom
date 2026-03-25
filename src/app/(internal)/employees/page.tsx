'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { UserPlus, Users, Mail, Copy, Check, AlertCircle, Shield, HardHat, ClipboardList, RefreshCw, GraduationCap } from 'lucide-react';

interface Employee {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  role: string;
  role_label: string;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  profile_completed: boolean;
}

interface InvitationResult {
  invitation_url: string;
  expires_at: string;
}

const EMPLOYEE_ROLES = [
  { value: 'admin', label: 'Administrateur', icon: Shield, color: 'text-red-600' },
  { value: 'secretaire', label: 'Secrétaire', icon: ClipboardList, color: 'text-purple-600' },
  { value: 'formateur', label: 'Formateur', icon: GraduationCap, color: 'text-blue-600' },
  { value: 'chef_chantier', label: 'Chef de chantier', icon: HardHat, color: 'text-amber-600' },
];

export default function EmployeesManagementPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [invitationResult, setInvitationResult] = useState<InvitationResult | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'chef_chantier',
    employee_id: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      router.push('/connexion');
      return;
    }

    const user = JSON.parse(userStr);
    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    loadEmployees();
  }, [router]);

  const loadEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/users?role=employee', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEmployees(data.users || []);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des employés:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/auth/create-employee', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Employé créé avec succès !');
        setInvitationResult({
          invitation_url: data.invitation_url,
          expires_at: data.expires_at,
        });
        setShowForm(false);
        loadEmployees();
        
        setFormData({
          name: '',
          email: '',
          role: 'chef_chantier',
          employee_id: '',
          phone: '',
          address: '',
        });
      } else {
        setError(data.message || 'Erreur lors de la création');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendInvitation = async (userId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/auth/resend-invitation/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Invitation renvoyée avec succès !');
        setInvitationResult({
          invitation_url: data.invitation_url,
          expires_at: data.expires_at,
        });
      } else {
        setError(data.message || 'Erreur lors du renvoi');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const generateEmployeeId = () => {
    const prefix = formData.role === 'admin' ? 'ADM' : formData.role === 'secretaire' ? 'SEC' : 'CDC';
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    setFormData(prev => ({ ...prev, employee_id: `${prefix}-${date}-${random}` }));
  };

  if (isLoading && employees.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Users className="h-8 w-8 text-orange-500" />
              Gestion des Employés
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Créez des comptes pour les administrateurs, secrétaires et chefs de chantier
            </p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Nouvel Employé
          </Button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
            {success}
          </div>
        )}

        {/* Invitation URL */}
        {invitationResult && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl border border-orange-200 dark:border-orange-800 overflow-hidden">
            <div className="p-6 bg-orange-50 dark:bg-orange-900/20">
              <h3 className="text-lg font-semibold text-orange-700 dark:text-orange-400 flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Lien d&apos;invitation
              </h3>
              <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">
                Envoyez ce lien à l&apos;employé pour qu&apos;il complète son profil. Le lien expire le{' '}
                {new Date(invitationResult.expires_at).toLocaleDateString('fr-FR', {
                  dateStyle: 'long',
                })}
              </p>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={invitationResult.invitation_url}
                  className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                />
                <Button
                  onClick={() => copyToClipboard(invitationResult.invitation_url)}
                  variant="outline"
                  className="flex-shrink-0"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      Copié
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copier
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Formulaire de création */}
        {showForm && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Créer un compte employé</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                L&apos;employé recevra un lien pour compléter son profil et définir son mot de passe
              </p>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Rôle */}
                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Rôle *</label>
                  <div className="grid grid-cols-3 gap-4">
                    {EMPLOYEE_ROLES.map((role) => {
                      const Icon = role.icon;
                      const isSelected = formData.role === role.value;
                      return (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, role: role.value }))}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <Icon className={`h-8 w-8 mx-auto mb-2 ${isSelected ? role.color : 'text-gray-400'}`} />
                          <span className={`text-sm font-medium block ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                            {role.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Nom et Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Nom complet *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                {/* ID Employé */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">ID Employé *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.employee_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                      placeholder="Ex: CDC-20260109-AB12"
                      className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateEmployeeId}
                    >
                      Générer
                    </Button>
                  </div>
                </div>

                {/* Téléphone et Adresse */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Téléphone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Adresse</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    {isLoading ? 'Création...' : 'Créer l\'employé'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Liste des employés */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Employés ({employees.length})</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Liste des administrateurs, secrétaires et chefs de chantier
            </p>
          </div>
          <div className="p-6">
            {employees.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun employé créé pour le moment</p>
                <p className="text-sm mt-2">Cliquez sur &quot;Nouvel Employé&quot; pour commencer</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Employé</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Rôle</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Statut</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => {
                      const roleInfo = EMPLOYEE_ROLES.find(r => r.value === employee.role);
                      const Icon = roleInfo?.icon || Users;
                      return (
                        <tr key={employee.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{employee.name}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{employee.email}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${roleInfo?.color || 'text-gray-500'}`} />
                              <span className="text-gray-700 dark:text-gray-300">{employee.role_label}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <code className="text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                              {employee.employee_id}
                            </code>
                          </td>
                          <td className="py-3 px-4">
                            {employee.profile_completed ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                <Check className="h-3 w-3 mr-1" />
                                Actif
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                En attente
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {!employee.profile_completed && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResendInvitation(employee.id)}
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Renvoyer
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
