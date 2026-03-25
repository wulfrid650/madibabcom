'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Clock3, PhoneCall, RefreshCw, ShieldCheck, Wrench } from 'lucide-react';
import { tokenStorage } from '@/lib/api';

const FALLBACK_MESSAGE = 'Le site est en maintenance. Veuillez réessayer plus tard.';
const SUPPORT_PHONE_LABEL = '+237 692 65 35 90';
const SUPPORT_PHONE_LINK = 'tel:+237692653590';
const STATUS_POLL_INTERVAL_MS = 60_000;

interface MaintenanceStatusPayload {
  is_maintenance: boolean;
  message?: string;
}

function MaintenanceScreen({ message }: { message: string }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-madiba-black text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black" />
      <div className="absolute left-[-10rem] top-[-7rem] h-72 w-72 rounded-full bg-madiba-red/25 blur-3xl" />
      <div className="absolute bottom-[-8rem] right-[-10rem] h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute inset-0 opacity-[0.15] [background-image:linear-gradient(to_right,rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.22)_1px,transparent_1px)] [background-size:40px_40px]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 md:px-10">
        <header className="mb-12 flex items-center justify-between">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-2 backdrop-blur-sm">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-madiba-red font-bold text-white">
              M
            </span>
            <div>
              <p className="text-sm font-semibold tracking-wide text-white">MADIBA BUILDING CONSTRUCTION</p>
              <p className="text-xs text-gray-300">Mode maintenance</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200 md:inline-flex">
            <Wrench className="h-4 w-4" />
            Intervention
          </div>
        </header>

        <main className="grid flex-1 items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <section>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-madiba-red/40 bg-madiba-red/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-red-100">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-300" />
              Plateforme temporairement indisponible
            </span>

            <h1 className="mb-5 text-4xl font-extrabold leading-tight md:text-5xl">
              Nous renforçons l&apos;expérience MBC.
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-gray-300 md:text-lg">{message}</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <article className="rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-sm">
                <div className="mb-3 inline-flex rounded-xl bg-madiba-red/20 p-2 text-red-100">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-white">Stabilité et sécurité</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-300">
                  Mise à jour des services critiques pour garantir performance, sécurité et disponibilité.
                </p>
              </article>

              <article className="rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-sm">
                <div className="mb-3 inline-flex rounded-xl bg-white/10 p-2 text-white">
                  <Clock3 className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-white">Retour rapide</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-300">
                  Notre équipe technique reste mobilisée pour remettre la plateforme en ligne au plus vite.
                </p>
              </article>
            </div>
          </section>

          <aside className="rounded-3xl border border-white/20 bg-black/35 p-7 shadow-2xl shadow-black/40 backdrop-blur-md">
            <h3 className="text-lg font-semibold text-white">Besoin d&apos;assistance immédiate ?</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-300">
              Pour les urgences commerciales ou techniques, notre support reste joignable.
            </p>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-madiba-red px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                <RefreshCw className="h-4 w-4" />
                Actualiser la page
              </button>

              <a
                href={SUPPORT_PHONE_LINK}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <PhoneCall className="h-4 w-4" />
                Contacter le support ({SUPPORT_PHONE_LABEL})
              </a>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}

export default function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [message, setMessage] = useState(FALLBACK_MESSAGE);

  const canBypass = useMemo(() => {
    if (pathname?.startsWith('/maintenance-admin')) {
      return true;
    }

    try {
      const user = tokenStorage.getUser();
      return Boolean(
        user?.role === 'admin'
        || user?.roles?.some((role) => role.slug === 'admin')
      );
    } catch {
      return false;
    }
  }, [pathname]);

  useEffect(() => {
    let isActive = true;

    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/system/maintenance-status', {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json() as MaintenanceStatusPayload;
        if (!isActive) {
          return;
        }

        setIsMaintenance(Boolean(data.is_maintenance));
        setMessage(data.message || FALLBACK_MESSAGE);
      } catch {
        if (!isActive) {
          return;
        }

        setIsMaintenance(false);
        setMessage(FALLBACK_MESSAGE);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchStatus();
    const intervalId = window.setInterval(fetchStatus, STATUS_POLL_INTERVAL_MS);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-madiba-black">
        <div className="relative">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-madiba-red" />
          <div className="absolute inset-0 m-auto h-2 w-2 rounded-full bg-madiba-red" />
        </div>
      </div>
    );
  }

  if (isMaintenance && !canBypass) {
    return <MaintenanceScreen message={message} />;
  }

  return <>{children}</>;
}
