'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, ArrowLeft } from 'lucide-react';
import { useReCaptchaSettings, ReCaptchaWidget, resetReCaptchaWidget } from '@/components/security/ReCaptcha';
import { useRedirectIfAuthenticated } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

interface FormData {
  // Informations personnelles
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  // Informations entreprise (optionnel)
  companyName: string;
  companyAddress: string;
  // Sécurité
  password: string;
  confirmPassword: string;
  // Projet
  projectType: string;
  projectDescription: string;
}

const projectTypes = [
  { id: 'construction', name: 'Construction neuve' },
  { id: 'renovation', name: 'Rénovation' },
  { id: 'extension', name: 'Extension' },
  { id: 'amenagement', name: 'Aménagement intérieur' },
  { id: 'genie-civil', name: 'Génie civil' },
  { id: 'autre', name: 'Autre' },
];

export default function ClientRegisterPage() {
  const router = useRouter();
  const { isBlocking } = useRedirectIfAuthenticated();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    companyAddress: '',
    password: '',
    confirmPassword: '',
    projectType: '',
    projectDescription: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { isEnabled: recaptchaEnabled, protectedForms } = useReCaptchaSettings();
  const showRecaptcha = recaptchaEnabled && protectedForms.includes('register');
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    const checked = type === 'checkbox' ? target.checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validateStep1 = () => {
    if (!formData.firstName || !formData.lastName) {
      setError('Veuillez renseigner votre nom et prénom');
      return false;
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Veuillez renseigner une adresse email valide');
      return false;
    }
    if (!formData.phone) {
      setError('Veuillez renseigner votre numéro de téléphone');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (!formData.password || formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    if (!formData.projectType) {
      setError('Veuillez sélectionner un type de projet');
      return false;
    }
    setError('');
    return true;
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const prevStep = () => {
    setStep(1);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep2()) return;
    
    setIsLoading(true);
    setError('');

    try {
      if (showRecaptcha && !recaptchaToken) {
        setError('Veuillez compléter la vérification reCAPTCHA.');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          password_confirmation: formData.password,
          role: 'client',
          company_name: formData.companyName || null,
          company_address: formData.companyAddress || null,
          project_type: formData.projectType,
          project_description: formData.projectDescription || null,
          ...(recaptchaToken ? { recaptcha_token: recaptchaToken } : {}),
        }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        localStorage.setItem('mbc_auth_token', data.token);
        localStorage.setItem('mbc_auth_user', JSON.stringify(data.user));
        router.push('/client');
      } else {
        if (data.errors) {
          const firstError = Object.values(data.errors)[0];
          setError(Array.isArray(firstError) ? firstError[0] : data.message || 'Erreur lors de l\'inscription');
        } else {
          setError(data.message || 'Erreur lors de l\'inscription');
        }
      }
    } catch {
      setError('Erreur de connexion au serveur. Vérifiez que le serveur API est démarré.');
    } finally {
      setIsLoading(false);
      resetReCaptchaWidget();
      setRecaptchaToken(null);
    }
  };

  if (isBlocking) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
        {/* Back Link */}
        <Link 
          href="/inscription" 
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au choix
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-madiba-black dark:text-white mb-2">
            Inscription Client
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Créez votre compte pour suivre vos projets
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
              1
            </span>
            <span className="hidden sm:inline text-sm font-medium">Informations</span>
          </div>
          <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
              2
            </span>
            <span className="hidden sm:inline text-sm font-medium">Projet</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-madiba-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="DUPONT"
                  />
                </div>
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prénom
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-madiba-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Marie"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Adresse email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-madiba-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="votre@email.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-madiba-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="+237 6XX XXX XXX"
                />
              </div>

              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom de l'entreprise <span className="text-gray-400">(optionnel)</span>
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-madiba-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Votre entreprise"
                />
              </div>

              <div>
                <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Adresse <span className="text-gray-400">(optionnel)</span>
                </label>
                <input
                  type="text"
                  id="companyAddress"
                  name="companyAddress"
                  value={formData.companyAddress}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-madiba-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Douala, Cameroun"
                />
              </div>

              <button
                type="button"
                onClick={nextStep}
                className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors"
              >
                Continuer
              </button>
            </div>
          )}

          {/* Step 2: Password & Project */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mot de passe
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-madiba-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="••••••••"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Minimum 8 caractères</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-madiba-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label htmlFor="projectType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type de projet
                </label>
                <select
                  id="projectType"
                  name="projectType"
                  value={formData.projectType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-madiba-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="">Sélectionner un type</option>
                  {projectTypes.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description du projet <span className="text-gray-400">(optionnel)</span>
                </label>
                <textarea
                  id="projectDescription"
                  name="projectDescription"
                  value={formData.projectDescription}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-madiba-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                  placeholder="Décrivez brièvement votre projet..."
                />
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
                En vous inscrivant sur ce site, vous acceptez automatiquement nos{' '}
                <Link href="/mentions-legales" className="text-blue-600 hover:underline">mentions légales</Link>,{' '}
                <Link href="/cgv" className="text-blue-600 hover:underline">CGV</Link>,{' '}
                <Link href="/cgu" className="text-blue-600 hover:underline">CGU</Link>{' '}
                et notre{' '}
                <Link href="/privacy-policy" className="text-blue-600 hover:underline">politique de confidentialité</Link>.
              </div>

              <ReCaptchaWidget formType="register" onToken={setRecaptchaToken} />

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 py-3 px-6 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Inscription...
                    </span>
                  ) : (
                    "S'inscrire"
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Login Link */}
        <p className="text-center text-gray-600 dark:text-gray-400 mt-8">
          Déjà un compte ?{' '}
          <Link href="/connexion" className="text-blue-600 font-semibold hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
