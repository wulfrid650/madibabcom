'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  downloadCertificat,
  getApprenantCertificats,
  type IssuedCertificate,
  type LearnerCertificateRequestItem,
  type PendingCertificate,
} from '@/lib/api';

export default function CertificatsPage() {
  const { token } = useAuth();
  const [certificates, setCertificates] = useState<IssuedCertificate[]>([]);
  const [pendingCertificates, setPendingCertificates] = useState<PendingCertificate[]>([]);
  const [requestItems, setRequestItems] = useState<LearnerCertificateRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      void fetchCertificates();
    }
  }, [token]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await getApprenantCertificats();
      if (response.success) {
        setCertificates(response.data?.issued || []);
        setPendingCertificates(response.data?.pending || []);
        setRequestItems(response.data?.requests || []);
      }
    } catch (err) {
      console.error('Error fetching certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (reference: string) => {
    try {
      const blob = await downloadCertificat(reference);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificat_${reference}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading certificate:', err);
      alert('Impossible de télécharger ce certificat pour le moment.');
    }
  };

  const handleVerify = async (certificate: IssuedCertificate) => {
    const verifyUrl = new URL(
      certificate.verification_path || `/certificats/verifier/${certificate.reference}`,
      window.location.origin,
    ).toString();

    await navigator.clipboard.writeText(verifyUrl);
    alert('Lien de vérification copié.');
  };

  const getRequestBadge = (status: LearnerCertificateRequestItem['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'pending':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      case 'rejected':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
      case 'invalidated':
        return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-madiba-red"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-madiba-black dark:text-white">Mes Certificats</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Consultez l’état de vos certificats et téléchargez ceux déjà validés par le secrétariat.
        </p>
      </div>

      {pendingCertificates.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-madiba-black dark:text-white">Formations en cours</h2>
          {pendingCertificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-lg text-madiba-black dark:text-white">{cert.formation}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Fin prévue: {cert.expectedDate}</p>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-500 dark:text-gray-400">Progression</span>
                        <span className="font-medium text-madiba-black dark:text-white">{cert.progress}%</span>
                      </div>
                      <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${cert.progress}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
                <span className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 font-semibold rounded-lg">
                  Formation en cours
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-madiba-black dark:text-white">Demandes de certificat</h2>

        {requestItems.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">
              Aucun certificat en attente de validation pour le moment.
            </p>
          </div>
        ) : (
          requestItems.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-bold text-madiba-black dark:text-white">{item.formation}</h3>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getRequestBadge(item.status)}`}>
                      {item.status_label}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Formation terminée</p>
                      <p className="font-medium text-madiba-black dark:text-white">{item.completedDate || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Demande du formateur</p>
                      <p className="font-medium text-madiba-black dark:text-white">{item.requestedDate || 'En attente du formateur'}</p>
                      {item.requested_by_name && (
                        <p className="text-gray-500 dark:text-gray-400">Soumise par {item.requested_by_name}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Décision</p>
                      <p className="font-medium text-madiba-black dark:text-white">{item.decisionDate || 'En attente'}</p>
                    </div>
                  </div>

                  {item.decision_notes && (
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-3 text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Note du secrétariat:</span> {item.decision_notes}
                    </div>
                  )}

                  {item.invalidation_reason && (
                    <div className="rounded-lg bg-rose-50 dark:bg-rose-900/20 p-3 text-sm text-rose-700 dark:text-rose-300">
                      <span className="font-semibold">Motif d’invalidation:</span> {item.invalidation_reason}
                    </div>
                  )}
                </div>

                <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-3 text-sm text-gray-700 dark:text-gray-300">
                  {item.status === 'pending' && 'Le certificat sera généré automatiquement dès validation du secrétariat.'}
                  {item.status === 'rejected' && 'Le formateur devra soumettre une nouvelle demande si la situation évolue.'}
                  {item.status === 'invalidated' && 'Ce certificat a été retiré par le staff et n’est plus téléchargeable.'}
                  {item.status === 'eligible' && 'La formation est terminée, mais aucune demande n’a encore été soumise par le formateur.'}
                  {item.status === 'approved' && 'Validation enregistrée. Le certificat va apparaître dans la section des certificats générés.'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-madiba-black dark:text-white">Certificats générés</h2>

        {certificates.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-2">Aucun certificat généré pour le moment</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Une fois la demande validée par le secrétariat, le certificat apparaît automatiquement ici.
            </p>
          </div>
        ) : (
          certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-madiba-red to-red-700 p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="relative flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      <span className="text-sm font-medium text-red-200">CERTIFICAT DE FORMATION</span>
                    </div>
                    <h3 className="text-2xl font-bold">{cert.formation}</h3>
                    <p className="text-red-200 mt-1">MBC Training Center</p>
                  </div>
                  <div className="text-right">
                    <div className="px-4 py-3 bg-white/15 rounded-xl border border-white/20">
                      <p className="text-xs uppercase tracking-[0.2em] text-red-100">Référence</p>
                      <p className="mt-2 font-mono text-sm font-semibold">{cert.reference}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Date d&apos;obtention</p>
                    <p className="font-medium text-madiba-black dark:text-white">{cert.completedDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Formateur</p>
                    <p className="font-medium text-madiba-black dark:text-white">{cert.instructor}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Numéro</p>
                    <p className="font-mono font-medium text-madiba-black dark:text-white">{cert.reference}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Statut</p>
                    <span className="inline-block px-3 py-1 text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
                      Vérifié
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => void handleDownload(cert.reference)}
                    disabled={!cert.download_available}
                    className="px-4 py-2 bg-madiba-red text-white font-medium rounded-lg hover:bg-red-700 transition-colors inline-flex items-center gap-2 disabled:opacity-60"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Télécharger le PDF
                  </button>
                  <button
                    onClick={() => void handleVerify(cert)}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-madiba-black dark:text-white font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors inline-flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Partager le lien
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">Comment fonctionne ce flux</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              1. Le formateur confirme qu’un apprenant a réellement terminé une session précise. 2. Le secrétariat approuve ou refuse.
              3. En cas d’approbation, le certificat est généré automatiquement et reste vérifiable sur le site MBC.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
