'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserCheck, Shield, AlertCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

interface PrefilledData {
  employee_id: string;
  name: string;
  email: string;
  address: string;
  role: string;
}

function CompleteProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [prefilledData, setPrefilledData] = useState<PrefilledData | null>(null);
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    confirmPassword: '',
    emergencyContact: '',
    emergencyPhone: '',
  });

  // Charger les données pré-remplies par l'admin
  useEffect(() => {
    const fetchPrefilledData = async () => {
      if (!token) {
        setError('Token d\'invitation invalide ou manquant');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/verify-invitation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (data.success && data.user) {
          setPrefilledData({
            employee_id: data.user.employee_id,
            name: data.user.name,
            email: data.user.email,
            address: data.user.address || '',
            role: data.user.role,
          });
        } else {
          setError(data.message || 'Invitation invalide ou expirée');
        }
      } catch (err) {
        setError('Erreur de connexion au serveur');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrefilledData();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      admin: 'Administrateur',
      secretaire: 'Secrétaire',
      chef_chantier: 'Chef de Chantier',
    };
    return roles[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800',
      secretaire: 'bg-purple-100 text-purple-800',
      chef_chantier: 'bg-amber-100 text-amber-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phone) {
      setError('Veuillez renseigner votre numéro de téléphone');
      return;
    }
    
    if (!formData.password || formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/complete-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          token,
          phone: formData.phone,
          password: formData.password,
          password_confirmation: formData.confirmPassword,
          emergency_contact: formData.emergencyContact || null,
          emergency_phone: formData.emergencyPhone || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // Rediriger après 2 secondes
        setTimeout(() => {
          router.push('/connexion');
        }, 2000);
      } else {
        setError(data.message || 'Erreur lors de la finalisation du profil');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full max-w-lg">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-madiba-red mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Vérification de l'invitation...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state (no valid token)
  if (!prefilledData) {
    return (
      <div className="w-full max-w-lg">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-madiba-black dark:text-white mb-2">
              Invitation invalide
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error || 'Cette invitation n\'est pas valide ou a expiré.'}
            </p>
            <Link 
              href="/connexion"
              className="px-6 py-3 bg-madiba-red text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              Aller à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="w-full max-w-lg">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-madiba-black dark:text-white mb-2">
              Profil complété !
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Votre compte est maintenant actif. Redirection vers la connexion...
            </p>
            <div className="animate-pulse text-madiba-red">●●●</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-madiba-black dark:text-white mb-2">
            Compléter votre profil
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Finalisez votre inscription employé MBC
          </p>
        </div>

        {/* Prefilled Info Card */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Informations enregistrées par l'administration
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">ID Employé</span>
              <span className="font-medium text-madiba-black dark:text-white">{prefilledData.employee_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Nom</span>
              <span className="font-medium text-madiba-black dark:text-white">{prefilledData.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-madiba-black dark:text-white">{prefilledData.email}</span>
            </div>
            {prefilledData.address && (
              <div className="flex justify-between">
                <span className="text-gray-500">Adresse</span>
                <span className="font-medium text-madiba-black dark:text-white">{prefilledData.address}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Rôle</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(prefilledData.role)}`}>
                {getRoleLabel(prefilledData.role)}
              </span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Numéro de téléphone *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-madiba-black dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              placeholder="+237 6XX XXX XXX"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Créer un mot de passe *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-madiba-black dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Minimum 8 caractères</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirmer le mot de passe *
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-madiba-black dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              placeholder="••••••••"
            />
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Contact d'urgence (optionnel)
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom du contact
              </label>
              <input
                type="text"
                id="emergencyContact"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-madiba-black dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                placeholder="Nom"
              />
            </div>
            <div>
              <label htmlFor="emergencyPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                id="emergencyPhone"
                name="emergencyPhone"
                value={formData.emergencyPhone}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-madiba-black dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                placeholder="+237..."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-6 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Finalisation...
              </span>
            ) : (
              "Activer mon compte"
            )}
          </button>
        </form>

        {/* Help text */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Besoin d'aide ? Contactez l'administration
        </p>
      </div>
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-lg">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-madiba-red mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
          </div>
        </div>
      </div>
    }>
      <CompleteProfileContent />
    </Suspense>
  );
}
