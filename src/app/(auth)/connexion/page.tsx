'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useRedirectIfAuthenticated } from '@/contexts/AuthContext';
import { Building2, Eye, EyeOff, ArrowRight, Shield, FileText, Users, TrendingUp, Gift, Mail, RefreshCw } from 'lucide-react';
import { COMPANY_INFO, getCopyrightText } from '@/lib/company-info';
import { useReCaptchaSettings, ReCaptchaWidget, resetReCaptchaWidget } from '@/components/security/ReCaptcha';
import type { TwoFactorChallengePayload } from '@/lib/auth';

function resolveRetryAfter(payload: TwoFactorChallengePayload | null): number {
  if (!payload) {
    return 0;
  }

  if (typeof payload.retry_after_seconds === 'number' && payload.retry_after_seconds > 0) {
    return payload.retry_after_seconds;
  }

  if (payload.resend_available_at) {
    const availableAt = new Date(payload.resend_available_at).getTime();
    if (!Number.isNaN(availableAt)) {
      return Math.max(0, Math.ceil((availableAt - Date.now()) / 1000));
    }
  }

  return 0;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    login,
    verifyTwoFactor,
    resendTwoFactorCode,
    getPendingTwoFactorChallenge,
    clearPendingTwoFactorChallenge,
    isLoading: authLoading,
  } = useAuth();
  const { isBlocking } = useRedirectIfAuthenticated();
  const { isEnabled: recaptchaEnabled, protectedForms } = useReCaptchaSettings();
  const showRecaptcha = recaptchaEnabled && protectedForms.includes('login');
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [twoFactor, setTwoFactor] = useState<TwoFactorChallengePayload | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  const safeRedirect = useMemo(() => {
    const redirect = searchParams.get('redirect');
    if (!redirect || !redirect.startsWith('/')) {
      return null;
    }

    return redirect;
  }, [searchParams]);

  useEffect(() => {
    const pendingChallenge = getPendingTwoFactorChallenge();

    if (!pendingChallenge) {
      return;
    }

    setTwoFactor(pendingChallenge);
    setFormData((previous) => ({
      ...previous,
      email: previous.email || pendingChallenge.email || '',
    }));
  }, [getPendingTwoFactorChallenge]);

  useEffect(() => {
    const nextCountdown = resolveRetryAfter(twoFactor);
    setResendCountdown(nextCountdown);

    if (nextCountdown <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setResendCountdown((previous) => {
        if (previous <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [twoFactor?.challenge_token, twoFactor?.retry_after_seconds, twoFactor?.resend_available_at]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const redirectByRole = (role: string) => {
    if (safeRedirect) {
      router.push(safeRedirect);
      return;
    }

    const dashboardRoutes: Record<string, string> = {
      admin: '/doublemb/dashboard',
      formateur: '/formateur/dashboard',
      chef_chantier: '/chef-chantier/dashboard',
      apprenant: '/apprenant/dashboard',
      client: '/client',
      secretaire: '/secretaire/dashboard',
    };

    const targetRoute = dashboardRoutes[role];

    if (targetRoute) {
      router.push(targetRoute);
      return;
    }

    router.push('/');
  };

  const handleCredentialSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setNotice('');

    try {
      if (showRecaptcha && !recaptchaToken) {
        setError('Veuillez compléter la verification reCAPTCHA.');
        return;
      }

      const result = await login(
        formData.email,
        formData.password,
        recaptchaToken || undefined,
        formData.remember,
      );

      if (!result.success) {
        setError(result.message || 'Email ou mot de passe incorrect');
        return;
      }

      if (result.requires_two_factor) {
        const nextChallenge = result.two_factor || getPendingTwoFactorChallenge();

        if (!nextChallenge) {
          setError('Impossible de démarrer la vérification email.');
          return;
        }

        setTwoFactor(nextChallenge);
        setVerificationCode('');
        setNotice(result.message || `Un code à 6 chiffres a été envoyé à ${nextChallenge.email || formData.email}.`);
        return;
      }

      const activeRole = result.user?.role || result.user?.roles?.[0]?.slug;

      if (!activeRole) {
        setError('Aucun rôle attribué à ce compte. Contactez l\'administrateur.');
        return;
      }

      redirectByRole(activeRole);
    } catch {
      setError('Erreur inattendue lors de la connexion. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
      // Réinitialiser le widget après chaque tentative
      resetReCaptchaWidget();
      setRecaptchaToken(null);
    }
  };

  const handleVerifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setNotice('');

    try {
      const result = await verifyTwoFactor(verificationCode.trim());

      if (!result.success) {
        // Si le challenge est irrémédiablement invalide, on réinitialise l'état
        if (result.message?.includes('relancer la connexion') || result.message?.includes('plus valide')) {
          handleResetTwoFactor();
        } else {
          const pendingChallenge = getPendingTwoFactorChallenge();
          setTwoFactor(pendingChallenge);
        }
        setError(result.message || 'Le code saisi est invalide.');
        return;
      }

      const activeRole = result.user?.role || result.user?.roles?.[0]?.slug;

      if (!activeRole) {
        setError('Connexion validée, mais aucun rôle actif n\'a été trouvé.');
        return;
      }

      redirectByRole(activeRole);
    } catch {
      setError('Erreur inattendue pendant la vérification du code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setError('');
    setNotice('');

    try {
      const result = await resendTwoFactorCode();

      if (!result.success) {
        // Rediriger si le challenge est mort
        if (result.message?.includes('relancer la connexion') || result.message?.includes('plus valide')) {
          handleResetTwoFactor();
        } else if (typeof result.retry_after_seconds === 'number' && twoFactor) {
          setTwoFactor({
            ...twoFactor,
            retry_after_seconds: result.retry_after_seconds,
            cooldown_seconds: result.retry_after_seconds,
          });
        }
        setError(result.message || 'Impossible de renvoyer le code.');
        return;
      }

      const nextChallenge = result.two_factor || getPendingTwoFactorChallenge();
      setTwoFactor(nextChallenge);
      setVerificationCode('');
      setNotice(result.message || 'Un nouveau code a été envoyé.');
    } catch {
      setError('Erreur inattendue lors du renvoi du code.');
    } finally {
      setIsResending(false);
    }
  };

  const handleResetTwoFactor = () => {
    clearPendingTwoFactorChallenge();
    setTwoFactor(null);
    setVerificationCode('');
    setNotice('');
    setError('');
  };

  const features = [
    {
      icon: TrendingUp,
      title: 'Suivi en temps réel',
      description: 'Consultez l\'avancement de vos projets à tout moment',
    },
    {
      icon: FileText,
      title: 'Documents accessibles',
      description: (
        <>
          Plans, devis, factures et rapports à portée de main
          <br />
          <span className="text-xs text-gray-300">
            (Attestations, reçus, tickets, certificats, registres)
          </span>
        </>
      ),
    },
    {
      icon: Users,
      title: 'Équipe dédiée',
      description: 'Staff, formateurs et apprenants connectés',
    },
    {
      icon: Shield,
      title: 'Espace sécurisé',
      description: 'Vos données sont protégées et confidentielles',
    },
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
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-madiba-red via-red-600 to-transparent"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-madiba-red/5 rounded-full blur-3xl"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-madiba-red/5 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-white mb-12 hover:opacity-80 transition-opacity">
            <Building2 className="w-8 h-8" />
            <span className="text-2xl font-bold">{COMPANY_INFO.name}</span>
          </Link>

          <h1 className="text-4xl font-bold text-white mb-4">Bienvenue sur votre espace</h1>
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

        <div className="relative z-10 text-gray-500 text-sm">{getCopyrightText()}</div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-madiba-red">
              <Building2 className="w-8 h-8" />
              <span className="text-2xl font-bold">{COMPANY_INFO.name}</span>
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {twoFactor ? 'Vérification email' : 'Connexion'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {twoFactor
                  ? 'Confirmez le code reçu par email pour finaliser la connexion'
                  : 'Accédez à votre espace personnel'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {notice && (
              <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-300 text-sm">
                {notice}
              </div>
            )}

            {!twoFactor ? (
              <form onSubmit={handleCredentialSubmit} className="space-y-6">
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
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                      autoComplete="current-password"
                      className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-madiba-black dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent transition-colors"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((previous) => !previous)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
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

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
                  En vous connectant, vous acceptez automatiquement nos{' '}
                  <Link href="/mentions-legales" className="text-madiba-red hover:underline">mentions légales</Link>,{' '}
                  <Link href="/cgv" className="text-madiba-red hover:underline">CGV</Link>,{' '}
                  <Link href="/cgu" className="text-madiba-red hover:underline">CGU</Link>{' '}
                  et notre{' '}
                  <Link href="/privacy-policy" className="text-madiba-red hover:underline">politique de confidentialité</Link>.
                </div>

                <ReCaptchaWidget formType="login" onToken={setRecaptchaToken} />

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

              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-6">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-madiba-red/10 text-madiba-red">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="font-medium text-gray-900 dark:text-white">
                        Code envoyé à {twoFactor.email || formData.email}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Saisissez le code de 6 chiffres reçu par email. Le code expire sous 10 minutes.
                      </p>

                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Code de vérification
                  </label>
                  <input
                    type="text"
                    id="verificationCode"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="\d{6}"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-center tracking-[0.45em] text-xl font-semibold text-madiba-black dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent transition-colors"
                    placeholder="000000"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || authLoading || verificationCode.length !== 6}
                  className="w-full py-3 px-6 bg-madiba-red text-white font-semibold rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Vérification...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Confirmer le code
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  )}
                </button>

                <div className="flex flex-col gap-4">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isResending || resendCountdown > 0}
                    className="w-full inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${isResending ? 'animate-spin' : ''}`} />
                    {resendCountdown > 0 ? `Renvoyer dans ${Math.ceil(resendCountdown)}s` : 'Renvoyer le code'}
                  </button>

                  <div className="text-sm text-center text-gray-600 dark:text-gray-400">
                    Ce n'est pas vous ?{' '}
                    <button
                      type="button"
                      onClick={handleResetTwoFactor}
                      className="text-madiba-red dark:text-red-400 hover:underline hover:text-red-700 transition-colors"
                    >
                      Utilisez un autre compte
                    </button>
                  </div>
                </div>
              </form>
            )}

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

            {!twoFactor && (
              <p className="mt-6 text-center text-gray-600 dark:text-gray-400">
                Pas encore de compte ?{' '}
                <Link href="/inscription" className="text-madiba-red font-semibold hover:underline">
                  S&apos;inscrire
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
