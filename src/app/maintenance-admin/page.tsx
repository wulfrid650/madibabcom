'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Wrench, LogIn, Power, RotateCcw, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { tokenStorage } from '@/lib/api';

interface MaintenanceStatus {
  is_maintenance: boolean;
  message?: string;
  reason?: string;
  backend_down_minutes?: number;
  manual_mode?: 'auto' | 'enabled' | 'disabled';
}

export default function MaintenanceAdminPage() {
  const router = useRouter();
  const { login, user, hasRole, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState<MaintenanceStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const isAdmin = useMemo(() => {
    return hasRole('admin');
  }, [hasRole]);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const response = await fetch('/api/system/maintenance-status', {
        cache: 'no-store',
      });
      const payload = await response.json();
      setStatus(payload);
    } catch {
      setStatus(null);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setNotice('');

    try {
      const result = await login(formData.email, formData.password);

      if (!result.success) {
        setError(result.message || 'Connexion refusée.');
        return;
      }

      const loggedUser = tokenStorage.getUser();
      const adminAccess = loggedUser?.role === 'admin'
        || loggedUser?.roles?.some((role) => role.slug === 'admin');

      if (!adminAccess) {
        tokenStorage.clear();
        setError('Cette entrée est réservée aux administrateurs.');
        return;
      }

      setNotice('Connexion administrateur établie.');
      await fetchStatus();
    } catch {
      setError('Connexion impossible pour le moment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOverride = async (mode: 'auto' | 'enabled' | 'disabled') => {
    const token = tokenStorage.getToken();
    if (!token) {
      setError('Reconnecte-toi en tant qu’administrateur.');
      return;
    }

    setSubmitting(true);
    setError('');
    setNotice('');

    try {
      const response = await fetch('/api/system/maintenance-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ mode }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Mise à jour refusée.');
      }

      setStatus(payload.data);
      setNotice(
        mode === 'enabled'
          ? 'Maintenance forcée activée.'
          : mode === 'disabled'
            ? 'Maintenance forcée désactivée.'
            : 'Retour au pilotage automatique.'
      );
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Mise à jour impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-red-100">
              <ShieldAlert className="h-4 w-4" />
              Accès admin maintenance
            </div>
            <h1 className="mt-4 text-3xl font-bold">Console de reprise MBC</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-300">
              Cette URL reste accessible pendant la maintenance pour permettre la connexion administrateur,
              la désactivation forcée et l’accès au dashboard.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-sm text-gray-300">
            <p>État actuel: <span className="font-semibold text-white">{status?.is_maintenance ? 'Maintenance active' : 'Site accessible'}</span></p>
            <p className="mt-1">Mode: <span className="font-semibold text-white">{status?.manual_mode || 'auto'}</span></p>
            {typeof status?.backend_down_minutes === 'number' && (
              <p className="mt-1">Backend indisponible: <span className="font-semibold text-white">{status.backend_down_minutes} min</span></p>
            )}
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-5 py-4 text-sm text-red-100">
            {error}
          </div>
        )}

        {notice && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
            {notice}
          </div>
        )}

        {!isAdmin ? (
          <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
              <h2 className="text-2xl font-semibold">Connexion administrateur</h2>
              <p className="mt-2 text-sm text-gray-300">
                Connecte-toi ici avec un compte ayant le rôle `admin`.
              </p>

              <form onSubmit={handleLogin} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-200">
                    Adresse email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(event) => setFormData((previous) => ({ ...previous, email: event.target.value }))}
                    className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-madiba-red"
                    placeholder="admin@exemple.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-200">
                    Mot de passe
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(event) => setFormData((previous) => ({ ...previous, password: event.target.value }))}
                    className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-madiba-red"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || authLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-madiba-red px-4 py-3 font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  <LogIn className="h-4 w-4" />
                  {submitting ? 'Connexion...' : 'Se connecter'}
                </button>
              </form>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/30 p-8">
              <h2 className="text-xl font-semibold">Statut global</h2>
              {loadingStatus ? (
                <div className="mt-6 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-madiba-red" />
              ) : (
                <div className="mt-6 space-y-4 text-sm text-gray-300">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Message</p>
                    <p className="mt-2 text-white">{status?.message || 'État indisponible'}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Raison</p>
                    <p className="mt-2 text-white">{status?.reason || 'inconnue'}</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Wrench className="h-5 w-5 text-red-200" />
                <h2 className="text-2xl font-semibold">Pilotage maintenance</h2>
              </div>
              <p className="mt-2 text-sm text-gray-300">
                Tu peux forcer l’activation, forcer la désactivation, ou remettre le site en mode automatique.
              </p>

              <div className="mt-8 grid gap-3">
                <button
                  type="button"
                  onClick={() => handleOverride('disabled')}
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  <Power className="h-4 w-4" />
                  Désactiver la maintenance
                </button>
                <button
                  type="button"
                  onClick={() => handleOverride('enabled')}
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 font-semibold text-black transition hover:bg-amber-400 disabled:opacity-60"
                >
                  <ShieldAlert className="h-4 w-4" />
                  Forcer la maintenance
                </button>
                <button
                  type="button"
                  onClick={() => handleOverride('auto')}
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
                >
                  <RotateCcw className="h-4 w-4" />
                  Revenir en mode automatique
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/30 p-8">
              <h2 className="text-xl font-semibold">Accès rapide</h2>
              <p className="mt-2 text-sm text-gray-300">
                Une fois le backend revenu, tu peux entrer directement dans l’administration.
              </p>

              <div className="mt-8 space-y-3">
                <button
                  type="button"
                  onClick={() => router.push('/doublemb/dashboard')}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-madiba-red px-4 py-3 font-semibold text-white transition hover:bg-red-700"
                >
                  Accéder au dashboard admin
                  <ArrowRight className="h-4 w-4" />
                </button>
                <Link
                  href="/secretaire/dashboard"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 font-semibold text-white transition hover:bg-white/10"
                >
                  Accéder au secrétariat
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
