'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useRedirectIfAuthenticated } from '@/contexts/AuthContext';
import { Building2, Eye, EyeOff, ArrowRight, Shield, FileText, Users, TrendingUp, Gift, GraduationCap } from 'lucide-react';
import { COMPANY_INFO, getCopyrightText } from '@/lib/company-info';
import { tokenStorage } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading: authLoading } = useAuth();
  const { isBlocking } = useRedirectIfAuthenticated();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  /**
   * Redirection selon le rôle actif de l'utilisateur
   * IMPORTANT: Cette fonction détermine où l'utilisateur atterrit après connexion
   */
  const redirectByRole = (role: string) => {
    // Mapping des rôles vers leurs dashboards respectifs
    const dashboardRoutes: Record<string, string> = {
      admin: '/doublemb/dashboard',    // Dashboard administrateur principal
      formateur: '/formateur/dashboard',
      chef_chantier: '/chef-chantier/dashboard',
      apprenant: '/apprenant/dashboard',
      client: '/client',
      secretaire: '/secretaire/dashboard', // Espace secrétaire
    };

    const targetRoute = dashboardRoutes[role];

    if (targetRoute) {
      console.log(`[Auth] Redirection vers ${targetRoute} pour le rôle: ${role}`);
      router.push(targetRoute);
    } else {
      // Rôle inconnu - rediriger vers l'accueil
      console.warn(`[Auth] Rôle inconnu: ${role}, redirection vers /`);
      router.push('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await login(formData.email, formData.password);

      if (!result.success) {
        setError(result.message || 'Email ou mot de passe incorrect');
        return;
      }

      // Récupérer l'utilisateur via tokenStorage après login
      const user = tokenStorage.getUser();
      if (!user) {
        setError('Session non initialisée correctement');
        return;
      }

      let activeRole: string | undefined = user.role;
      if (!activeRole && user.roles && user.roles.length > 0) {
        activeRole = user.roles[0].slug;
      }

      if (!activeRole) {
        setError('Aucun rôle attribué à ce compte. Contactez l\'administrateur.');
        return;
      }

      redirectByRole(activeRole);
    } catch {
      setError('Erreur inattendue lors de la connexion. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: TrendingUp,
      title: 'Suivi en temps réel',
      description: 'Consultez l\'avancement de vos projets à tout moment'
    },
    {
      icon: FileText,
      title: 'Documents accessibles',
      description: (
        <>
          Plans, devis, factures et rapports à portée de main<br />
          <span className="text-xs text-gray-300">
            (Attestations, reçus, tickets, certificats, registres)
          </span>
        </>
      )
    },
    {
      icon: Users,
      title: 'Équipe dédiée',
      description: 'Staff, formateurs et apprenants connectés'
    },
    {
      icon: Shield,
      title: 'Espace sécurisé',
      description: 'Vos données sont protégées et confidentielles'
    }
  ];

  if (isBlocking) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-madiba-red"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950 p-12 flex-col justify-between relative overflow-hidden">
        {/* Accent décoratif */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-madiba-red via-red-600 to-transparent"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-madiba-red/5 rounded-full blur-3xl"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-madiba-red/5 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-white mb-12 hover:opacity-80 transition-opacity">
            <Building2 className="w-8 h-8" />
            <span className="text-2xl font-bold">{COMPANY_INFO.name}</span>
          </Link>

          <h1 className="text-4xl font-bold text-white mb-4">
            Bienvenue sur votre espace
          </h1>
          <p className="text-gray-400 text-lg mb-12">
            {COMPANY_INFO.slogan}. Connectez-vous pour accéder à votre tableau de bord personnalisé.
          </p>

          <div className="grid grid-cols-1 gap-5">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-madiba-red/30 transition-colors">
                <div className="w-12 h-12 bg-madiba-red/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-madiba-red" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-gray-500 text-sm">
          {getCopyrightText()}
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-madiba-red">
              <Building2 className="w-8 h-8" />
              <span className="text-2xl font-bold">{COMPANY_INFO.name}</span>
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Connexion
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Accédez à votre espace personnel
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-madiba-black dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent transition-colors"
                  placeholder="votre@email.com"
                />
              </div>

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
                  minLength={6}
                  autoComplete="current-password"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-madiba-black dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={formData.remember}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-300 text-madiba-red focus:ring-madiba-red"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Se souvenir de moi</span>
                </label>
                <Link href="/mot-de-passe-oublie" className="text-sm text-madiba-red hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading || authLoading}
                className="w-full py-3 px-6 bg-madiba-red text-white font-semibold rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Connexion...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Se connecter
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </button>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center leading-relaxed">
                En vous connectant ou en inscrivant sur ce site vous acceptez explicitement nos{' '}
                <Link href="/cgv" className="text-madiba-red hover:underline">CGV</Link>,{' '}
                <Link href="/cgu" className="text-madiba-red hover:underline">CGU</Link>{' '}
                et notre{' '}
                <Link href="/privacy-policy" className="text-madiba-red hover:underline">politique de confidentialité</Link>.
              </p>
            </form>

            {/* Offre spéciale 10% */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="p-4 bg-gradient-to-r from-madiba-red/10 to-red-50 dark:from-madiba-red/20 dark:to-red-900/20 rounded-xl border border-madiba-red/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-madiba-red rounded-full flex items-center justify-center flex-shrink-0">
                    <Gift className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="inline-block px-2 py-0.5 bg-madiba-red text-white text-xs font-bold rounded mb-1">
                      -{COMPANY_INFO.promos.devisReduction.percentage}% OFFRE SPÉCIALE
                    </span>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {COMPANY_INFO.promos.devisReduction.message}
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/contact?type=devis"
                className="mt-4 w-full inline-flex items-center justify-center gap-2 border-2 border-madiba-red text-madiba-red py-3 rounded-lg font-semibold hover:bg-madiba-red hover:text-white transition-colors"
              >
                Demander un devis
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Register Link */}
            <p className="mt-6 text-center text-gray-600 dark:text-gray-400">
              Pas encore de compte ?{' '}
              <Link href="/inscription" className="text-madiba-red font-semibold hover:underline">
                S&apos;inscrire
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
