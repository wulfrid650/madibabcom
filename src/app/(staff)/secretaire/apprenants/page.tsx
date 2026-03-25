'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';

// Types
interface Apprenant {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  formation: string;
  dateInscription: string;
  status: 'en-cours' | 'termine' | 'abandonne';
  progression: number;
  paiementStatus: 'complet' | 'partiel' | 'en-attente';
  montantPaye: number;
  montantTotal: number;
}

import { api } from '@/lib/api';

// Types
interface Apprenant {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  formation: string;
  dateInscription: string;
  status: 'en-cours' | 'termine' | 'abandonne';
  progression: number;
  paiementStatus: 'complet' | 'partiel' | 'en-attente';
  montantPaye: number;
  montantTotal: number;
}

export default function ApprenantsPage() {
  const [apprenants, setApprenants] = useState<Apprenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFormation, setFilterFormation] = useState<string>('tous');
  const [filterStatus, setFilterStatus] = useState<string>('tous');
  const [filterPaiement, setFilterPaiement] = useState<string>('tous');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    formation_id: '',
  });
  const [formationsList, setFormationsList] = useState<any[]>([]); // To store actual formations objects if needed, or just strings from existing view

  // Fetch formations list for dropdown if possible, or we can use the existing unique list logic if we had IDs.
  // Ideally we should fetch formations from API to get IDs. Let's assume we can fetch them.
  // For now, I will add a fetchFormations in useEffect.

  useEffect(() => {
    fetchApprenants();
    fetchFormations();
  }, []);

  const fetchFormations = async () => {
    try {
      const response = await api.getFormations();
      setFormationsList(response);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchApprenants = async () => {
    try {
      setLoading(true);
      const data = await api.getSecretaireEnrollments(); // Actually returns enrollments

      const mappedApprenants: Apprenant[] = data.data.map((e: any) => {
        let status: Apprenant['status'] = 'en-cours';
        if (e.status === 'completed') status = 'termine';
        if (e.status === 'cancelled') status = 'abandonne';

        let paiementStatus: Apprenant['paiementStatus'] = 'en-attente';
        if (e.status === 'confirmed' || e.paid_at) paiementStatus = 'complet';
        // 'partiel' logic would require checking amount_paid < price. Assuming strictly Paid or Not Paid for now or if backend provides 'amount_paid'

        const metadata = (e && typeof e === 'object' && e.metadata && typeof e.metadata === 'object') ? e.metadata : {};
        const fullNameFromFields = [e.first_name, e.last_name].filter(Boolean).join(' ').trim();
        const fallbackNameFromMetadata = [metadata.participant_name, metadata.customer_full_name]
          .find((value) => typeof value === 'string' && value.trim().length > 0);
        const fallbackEmailFromMetadata = [metadata.participant_email, metadata.customer_email, metadata.payer_email]
          .find((value) => typeof value === 'string' && value.trim().length > 0);
        const fallbackPhoneFromMetadata = [metadata.participant_phone, metadata.customer_phone, metadata.payer_phone]
          .find((value) => typeof value === 'string' && value.trim().length > 0);
        const formationTitle = e.formation?.title
          || metadata.formation_title
          || metadata.formation_name
          || 'Formation inconnue';
        const enrollmentCreatedAt = e.created_at || e.enrolled_at || new Date().toISOString();
        const amountPaid = Number(
          e.amount_paid
          ?? metadata.amount_paid
          ?? metadata.paid_amount
          ?? (e.paid_at ? (e.formation?.price ?? metadata.total_amount ?? 0) : 0)
        );
        const totalAmount = Number(
          e.formation?.price
          ?? metadata.total_amount
          ?? metadata.amount_due
          ?? metadata.expected_amount
          ?? amountPaid
        );

        return {
          id: e.id.toString(),
          nom: e.user?.name
            || (typeof fullNameFromFields === 'string' && fullNameFromFields.length ? fullNameFromFields : null)
            || fallbackNameFromMetadata
            || 'Anonyme',
          email: e.user?.email
            || e.email
            || fallbackEmailFromMetadata
            || 'non-renseigne@exemple.com',
          telephone: e.user?.phone
            || e.phone
            || fallbackPhoneFromMetadata
            || 'N/A',
          formation: formationTitle,
          dateInscription: enrollmentCreatedAt,
          status: status,
          progression: 0, // Mocked for now as Enrollment model doesn't track module progress
          paiementStatus: paiementStatus,
          montantPaye: amountPaid,
          montantTotal: totalAmount
        };
      });
      setApprenants(mappedApprenants);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.createApprenant(formData);
      if (response.success) {
        alert(response.message);
        setShowModal(false);
        setFormData({ name: '', email: '', phone: '', formation_id: '' });
        fetchApprenants();
      }
    } catch (e: any) {
      console.error(e);
      alert('Erreur: ' + (e.message || 'Erreur inconnue'));
    }
  };

  const formations = Array.from(new Set(apprenants.map(a => a.formation)));

  const filteredApprenants = apprenants.filter(apprenant => {
    const matchSearch = apprenant.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apprenant.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFormation = filterFormation === 'tous' || apprenant.formation === filterFormation;
    const matchStatus = filterStatus === 'tous' || apprenant.status === filterStatus;
    const matchPaiement = filterPaiement === 'tous' || apprenant.paiementStatus === filterPaiement;
    return matchSearch && matchFormation && matchStatus && matchPaiement;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en-cours': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'termine': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'abandonne': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaiementColor = (status: string) => {
    switch (status) {
      case 'complet': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'partiel': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'en-attente': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestion des Apprenants
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Suivez les inscriptions et les paiements des apprenants
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nouvel Apprenant
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{apprenants.length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total apprenants</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{apprenants.filter(a => a.status === 'en-cours').length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">En formation</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{apprenants.filter(a => a.paiementStatus === 'complet').length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Paiements complets</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-amber-600">{apprenants.filter(a => a.paiementStatus !== 'complet').length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Paiements en attente</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher un apprenant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <select
            value={filterFormation}
            onChange={(e) => setFilterFormation(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="tous">Toutes les formations</option>
            {formations.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="tous">Tous les statuts</option>
            <option value="en-cours">En cours</option>
            <option value="termine">Terminé</option>
            <option value="abandonne">Abandonné</option>
          </select>
          <select
            value={filterPaiement}
            onChange={(e) => setFilterPaiement(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="tous">Tous les paiements</option>
            <option value="complet">Complet</option>
            <option value="partiel">Partiel</option>
            <option value="en-attente">En attente</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Apprenant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Formation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Progression</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Paiement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredApprenants.map((apprenant) => (
                <tr key={apprenant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
                        {(apprenant.nom?.charAt(0) ?? '?').toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{apprenant.nom}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{apprenant.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">{apprenant.formation}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Depuis le {new Date(apprenant.dateInscription).toLocaleDateString('fr-FR')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-600 rounded-full"
                          style={{ width: `${apprenant.progression}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{apprenant.progression}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatMontant(apprenant.montantPaye)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      sur {formatMontant(apprenant.montantTotal)}
                    </div>
                    <span className={`inline-flex mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${getPaiementColor(apprenant.paiementStatus)}`}>
                      {apprenant.paiementStatus === 'complet' ? 'Complet' : apprenant.paiementStatus === 'partiel' ? 'Partiel' : 'En attente'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(apprenant.status)}`}>
                      {apprenant.status === 'en-cours' ? 'En cours' : apprenant.status === 'termine' ? 'Terminé' : 'Abandonné'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400" title="Voir">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400" title="Modifier">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredApprenants.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucun apprenant trouvé</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Modifiez vos critères de recherche.
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Ajouter un Apprenant</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nom Complet</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Téléphone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Formation Initiale</label>
                <select
                  value={formData.formation_id}
                  onChange={e => setFormData({ ...formData, formation_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Sélectionner une formation (optionnel)</option>
                  {formationsList.map(f => (
                    <option key={f.id} value={f.id}>{f.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowModal(false)} type="button">Annuler</Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">Créer</Button>
              </div>
            </form>
          </div>
        </div>
      )
      }
    </div >
  );
}
