import Link from 'next/link';
import { verifyPublicCertificate } from '@/lib/api';

type VerifyCertificatePageProps = {
  params: Promise<{ reference: string }>;
};

function formatDate(date?: string | null): string {
  if (!date) return 'N/A';

  const value = new Date(date);
  if (Number.isNaN(value.getTime())) {
    return date;
  }

  return value.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default async function VerifyCertificatePage({ params }: VerifyCertificatePageProps) {
  const { reference } = await params;

  let payload = null;
  let errorMessage = 'Certificat introuvable.';

  try {
    const response = await verifyPublicCertificate(reference);
    payload = response.data;
  } catch (error) {
    if (error instanceof Error && error.message) {
      errorMessage = error.message;
    }
  }

  const isValid = payload?.valid === true;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fee2e2,transparent_40%),linear-gradient(180deg,#fff7ed_0%,#ffffff_60%)] py-20">
      <div className="mx-auto max-w-4xl px-6">
        <div className="rounded-3xl border border-red-100 bg-white/90 shadow-[0_20px_80px_rgba(153,27,27,0.12)] backdrop-blur">
          <div className="border-b border-red-100 px-8 py-10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-700">Vérification MBC</p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">Authenticité d&apos;un certificat</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Cette page confirme si le certificat présenté a bien été émis par MBC et s&apos;il est toujours valide.
            </p>
          </div>

          <div className="px-8 py-8">
            <div className={`rounded-2xl border p-6 ${isValid ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className={`text-sm font-semibold uppercase tracking-[0.24em] ${isValid ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {payload ? payload.status_label : 'Vérification impossible'}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    Référence: <span className="font-mono">{payload?.reference || reference}</span>
                  </p>
                </div>
                <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${isValid ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
                  {isValid ? '✓' : '!'}
                </div>
              </div>
            </div>

            {payload ? (
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Titulaire</h2>
                  <p className="mt-3 text-2xl font-bold text-slate-900">{payload.learner_name}</p>
                  <p className="mt-4 text-sm text-slate-600">Formation</p>
                  <p className="font-semibold text-slate-900">{payload.formation || 'Formation MBC'}</p>
                  <p className="mt-4 text-sm text-slate-600">Formateur</p>
                  <p className="font-semibold text-slate-900">{payload.instructor || 'Équipe pédagogique MBC'}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Émission</h2>
                  <div className="mt-4 space-y-4 text-sm">
                    <div>
                      <p className="text-slate-500">Date d&apos;émission</p>
                      <p className="font-semibold text-slate-900">{formatDate(payload.issued_at)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Fin de session</p>
                      <p className="font-semibold text-slate-900">{formatDate(payload.completed_at || payload.session?.end_date)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Lieu</p>
                      <p className="font-semibold text-slate-900">{payload.session?.location || 'Non renseigné'}</p>
                    </div>
                    {payload.revoked_at && (
                      <div>
                        <p className="text-slate-500">Révocation</p>
                        <p className="font-semibold text-slate-900">
                          {formatDate(payload.revoked_at)}
                          {payload.revoked_reason ? ` • ${payload.revoked_reason}` : ''}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
                {errorMessage}
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/training"
                className="rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-800"
              >
                Voir les formations MBC
              </Link>
              <Link
                href="/"
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Retour au site
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
