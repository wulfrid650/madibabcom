'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { X, UserPlus, GraduationCap, Building2, Check, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';

interface AddRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formations = [
  'BIM (Building Information Modeling)',
  'Métrage et Estimation',
  'Enscape - Visualisation 3D',
  'Twinmotion - Visualisation',
  'Assistant Maçon',
  'Électroménager',
  'Plomberie',
  'Électricité Bâtiment',
];

export default function AddRoleModal({ isOpen, onClose }: AddRoleModalProps) {
  const { user, addRole, hasRole, isLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'apprenant' | 'client' | null>(null);
  const [formation, setFormation] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [projectType, setProjectType] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const hasApprenant = hasRole('apprenant');
  const hasClient = hasRole('client');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedRole) {
      setError('Veuillez sélectionner un rôle');
      return;
    }

    if (selectedRole === 'apprenant' && !formation) {
      setError('Veuillez sélectionner une formation');
      return;
    }

    const result = await addRole(selectedRole, {
      formation: selectedRole === 'apprenant' ? formation : undefined,
      company_name: selectedRole === 'client' ? companyName : undefined,
      project_type: selectedRole === 'client' ? projectType : undefined,
    });

    if (result.success) {
      setSuccess(result.message || 'Rôle ajouté avec succès !');
      setTimeout(() => {
        onClose();
        // Redirect to the new role's dashboard
        window.location.href = selectedRole === 'client' ? '/client' : '/apprenant/dashboard';
      }, 1500);
    } else {
      setError(result.message || 'Erreur lors de l\'ajout du rôle');
    }
  };

  const canAddRole = (!hasApprenant || !hasClient);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-madiba-red" />
            Ajouter un rôle
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {!canAddRole ? (
            <div className="text-center py-6">
              <Check className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                Vous avez déjà tous les rôles disponibles (Apprenant et Client).
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Ajoutez un nouveau rôle à votre compte pour accéder à plus de fonctionnalités.
              </p>

              {/* Role Selection */}
              <div className="space-y-3">
                {!hasApprenant && (
                  <button
                    type="button"
                    onClick={() => setSelectedRole('apprenant')}
                    className={`w-full p-4 rounded-lg border-2 transition-all flex items-start gap-3 text-left ${
                      selectedRole === 'apprenant'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${selectedRole === 'apprenant' ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
                      <GraduationCap className={`h-6 w-6 ${selectedRole === 'apprenant' ? 'text-blue-600' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Devenir Apprenant</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Accédez aux formations MBC et suivez votre progression
                      </p>
                    </div>
                  </button>
                )}

                {!hasClient && (
                  <button
                    type="button"
                    onClick={() => setSelectedRole('client')}
                    className={`w-full p-4 rounded-lg border-2 transition-all flex items-start gap-3 text-left ${
                      selectedRole === 'client'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${selectedRole === 'client' ? 'bg-green-100 dark:bg-green-900/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
                      <Building2 className={`h-6 w-6 ${selectedRole === 'client' ? 'text-green-600' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Devenir Client</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Suivez l'avancement de votre projet de construction
                      </p>
                    </div>
                  </button>
                )}
              </div>

              {/* Role-specific fields */}
              {selectedRole === 'apprenant' && (
                <div className="space-y-3 pt-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Formation souhaitée *
                  </label>
                  <select
                    value={formation}
                    onChange={(e) => setFormation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionnez une formation</option>
                    {formations.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedRole === 'client' && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nom de l'entreprise (optionnel)
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Votre entreprise ou particulier"
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Type de projet
                    </label>
                    <select
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Sélectionnez un type</option>
                      <option value="construction_neuve">Construction neuve</option>
                      <option value="renovation">Rénovation</option>
                      <option value="extension">Extension</option>
                      <option value="amenagement">Aménagement intérieur</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Error/Success messages */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-sm">
                  {success}
                </div>
              )}

              {/* Submit button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={!selectedRole || isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Ajout en cours...
                    </>
                  ) : (
                    'Ajouter ce rôle'
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
