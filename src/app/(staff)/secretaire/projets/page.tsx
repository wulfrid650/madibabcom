'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

type ValidationStatus = 'pending' | 'approved' | 'rejected';
type ProjectStatus = 'en-attente' | 'en-cours' | 'termine' | 'suspendu';

interface Projet {
  id: number;
  nom: string;
  description?: string | null;
  client: string;
  clientId: number | null;
  clientEmail: string | null;
  validationStatus: ValidationStatus;
  validationNote?: string | null;
  clientType: 'particulier' | 'entreprise';
  type: string;
  adresse: string;
  dateDebut: string;
  dateFinEstimee: string;
  progression: number;
  status: ProjectStatus;
  budget: number;
  chefProjet: string;
  phaseCurrent?: string | null;
  phasePending?: {
    to_phase?: string;
    to_phase_label?: string;
    requested_at?: string;
    requested_by_role?: string;
  } | null;
}

interface ProjetDetail extends Projet {
  clientPhone?: string | null;
  createdAt?: string | null;
  createdByName?: string | null;
  validation?: { note?: string | null; validated_at?: string | null } | null;
  phaseHistory?: Array<{
    from_phase?: string;
    from_phase_label?: string;
    to_phase?: string;
    to_phase_label?: string;
    requested_at?: string;
    requested_by_role?: string;
    approved_at?: string;
    approved_by_role?: string;
  }>;
}

interface ClientOption { id: number; name: string; email: string; }

const PHASE_SEQUENCE = ['etudes_permis', 'fondations', 'gros_oeuvre', 'second_oeuvre', 'finitions', 'reception'];
const PHASE_LABELS: Record<string, string> = {
  etudes_permis: 'Etudes et permis',
  fondations: 'Fondations',
  gros_oeuvre: 'Gros oeuvre',
  second_oeuvre: 'Second oeuvre',
  finitions: 'Finitions',
  reception: 'Reception',
};

function fmtDate(value?: string | null) {
  if (!value) return '-';
  if (value.includes('/')) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('fr-FR');
}

function fmtDateTime(value?: string | null) {
  if (!value) return '-';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('fr-FR');
}

function fmtBudget(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
}

function mapProjet(project: any): Projet {
  const validationStatus: ValidationStatus = ['pending', 'rejected'].includes(String(project.creation_validation_status))
    ? String(project.creation_validation_status) as ValidationStatus
    : 'approved';
  const clientLabel = project.client_name || project.client || 'Client non lie';
  const normalized = String(clientLabel).toUpperCase();
  const clientType = normalized.includes('SARL') || normalized.includes('SA') || normalized.includes('LTD') || normalized.includes('ENTREPRISE') || normalized.includes('SOCIETE')
    ? 'entreprise'
    : 'particulier';

  return {
    id: Number(project.id),
    nom: project.title,
    description: project.description || null,
    client: clientLabel,
    clientId: project.client_id ? Number(project.client_id) : null,
    clientEmail: project.client_email || null,
    validationStatus,
    validationNote: project.creation_validation_note || null,
    clientType,
    type: project.category || 'Construction',
    adresse: project.location || 'Lieu non specifie',
    dateDebut: project.start_date || project.created_at || new Date().toISOString(),
    dateFinEstimee: project.expected_end_date || project.completion_date || project.created_at || new Date().toISOString(),
    progression: Number(project.progress) || 0,
    status: (project.status === 'in_progress' ? 'en-cours' : project.status === 'completed' ? 'termine' : project.status === 'on_hold' ? 'suspendu' : 'en-attente') as ProjectStatus,
    budget: Number(project.budget) || 0,
    chefProjet: project.chef_chantier_id ? `Chef #${project.chef_chantier_id}` : 'Non assigne',
    phaseCurrent: project.phase_current || null,
    phasePending: project.phase_pending || null,
  };
}

export default function ProjetsPage() {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingClients, setLoadingClients] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [validating, setValidating] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedProjet, setSelectedProjet] = useState<Projet | null>(null);
  const [detailProjet, setDetailProjet] = useState<ProjetDetail | null>(null);
  const [validationProjet, setValidationProjet] = useState<Projet | null>(null);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [validationDecision, setValidationDecision] = useState<'approved' | 'rejected'>('approved');
  const [validationNote, setValidationNote] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('tous');
  const [filterType, setFilterType] = useState('tous');
  const [clientSearch, setClientSearch] = useState('');

  useEffect(() => {
    void fetchProjets();
    void fetchClients();
  }, []);

  const fetchProjets = async () => {
    try {
      setLoading(true);
      const data = await api.getSecretaireProjets();
      setProjets(data.map((item: any) => mapProjet(item)));
    } catch (error) {
      console.error(error);
      setFeedback('Impossible de charger les projets.');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async (search = '') => {
    try {
      setLoadingClients(true);
      const response = await api.getSecretaireClients({ page: 1, per_page: 100, search });
      setClients((response.data || []).map((client: any) => ({ id: Number(client.id), name: client.name, email: client.email })));
    } catch (error) {
      console.error(error);
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  };

  const filteredProjets = projets.filter((projet) => {
    const text = searchTerm.toLowerCase();
    const matchSearch = projet.nom.toLowerCase().includes(text) || projet.client.toLowerCase().includes(text);
    const matchStatus = filterStatus === 'tous' || projet.status === filterStatus;
    const matchType = filterType === 'tous' || projet.type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const filteredClients = useMemo(() => {
    const text = clientSearch.trim().toLowerCase();
    if (!text) return clients;
    return clients.filter((client) => client.name.toLowerCase().includes(text) || client.email.toLowerCase().includes(text));
  }, [clientSearch, clients]);

  const typesUniques = Array.from(new Set(projets.map((projet) => projet.type)));

  const getPhaseLabel = (phaseKey?: string | null) => phaseKey ? (PHASE_LABELS[phaseKey] || phaseKey) : 'Non definie';
  const getNextPhase = (phaseKey?: string | null) => {
    const current = phaseKey || PHASE_SEQUENCE[0];
    const index = PHASE_SEQUENCE.indexOf(current);
    return index < 0 ? PHASE_SEQUENCE[0] : (PHASE_SEQUENCE[index + 1] || null);
  };

  const getStatusColor = (status: ProjectStatus) => status === 'en-cours'
    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    : status === 'termine'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : status === 'suspendu'
        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';

  const getStatusText = (status: ProjectStatus) => status === 'en-cours' ? 'En cours' : status === 'termine' ? 'Termine' : status === 'suspendu' ? 'Suspendu' : 'En attente';

  const getValidationBadge = (status: ValidationStatus) => status === 'approved'
    ? { label: 'Creation validee', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' }
    : status === 'rejected'
      ? { label: 'Creation rejetee', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
      : { label: 'Validation en attente', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };

  const openAssignModal = async (projet: Projet) => {
    if (projet.validationStatus !== 'approved') {
      setFeedback('Validez d abord la creation du chantier avant de lier un client.');
      return;
    }

    setSelectedProjet(projet);
    setSelectedClientId(projet.clientId ? String(projet.clientId) : '');
    setClientSearch('');
    setFeedback(null);

    if (clients.length === 0) {
      await fetchClients();
    }
  };

  const handleAssignClient = async () => {
    if (!selectedProjet || !selectedClientId) {
      setFeedback('Selectionnez un client avant de confirmer.');
      return;
    }

    try {
      setAssigning(true);
      const response = await api.assignSecretaireProjetClient(selectedProjet.id, Number(selectedClientId));
      if (!response.success) {
        setFeedback(response.message || 'Impossible de lier ce client.');
        return;
      }
      setFeedback('Client lie avec succes.');
      setSelectedProjet(null);
      await fetchProjets();
    } catch (error) {
      console.error(error);
      setFeedback('Erreur lors de la liaison du client.');
    } finally {
      setAssigning(false);
    }
  };

  const openValidationModal = (projet: Projet) => {
    setValidationProjet(projet);
    setValidationDecision('approved');
    setValidationNote(projet.validationNote || '');
    setFeedback(null);
  };

  const handleValidateCreation = async () => {
    if (!validationProjet) return;

    try {
      setValidating(true);
      const response = await api.validateSecretaireProjetCreation(validationProjet.id, validationDecision, validationNote);
      if (!response.success) {
        setFeedback(response.message || 'Impossible de traiter la validation.');
        return;
      }
      setFeedback(validationDecision === 'approved' ? 'Creation du chantier validee.' : 'Creation du chantier rejetee.');
      setValidationProjet(null);
      await fetchProjets();
    } catch (error) {
      console.error(error);
      setFeedback('Erreur lors de la validation du chantier.');
    } finally {
      setValidating(false);
    }
  };

  const openDetailModal = async (projet: Projet) => {
    setDetailProjet({ ...projet, validation: { note: projet.validationNote || null }, phaseHistory: [] });
    setDetailLoading(true);
    setFeedback(null);

    try {
      const response = await api.getSecretaireProjet(projet.id);
      setDetailProjet({
        ...mapProjet(response),
        clientPhone: response.client_phone || null,
        createdAt: response.created_at || null,
        createdByName: response.created_by_name || null,
        validation: response.validation || null,
        phaseHistory: Array.isArray(response.phase_history) ? response.phase_history : [],
      });
    } catch (error) {
      console.error(error);
      setFeedback('Impossible de charger le detail complet du chantier.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApplyNextPhase = async (projet: Projet) => {
    const nextPhase = getNextPhase(projet.phaseCurrent);
    if (!nextPhase) {
      setFeedback('Ce chantier est deja a la derniere phase.');
      return;
    }

    try {
      const response = await api.updateSecretaireProjetPhase(projet.id, { action: 'apply', to_phase: nextPhase });
      if (!response.success) {
        setFeedback(response.message || 'Impossible de changer la phase.');
        return;
      }
      setFeedback(`Phase mise a jour: ${getPhaseLabel(nextPhase)}.`);
      await fetchProjets();
    } catch (error) {
      console.error(error);
      setFeedback('Erreur lors du changement de phase.');
    }
  };

  const handleApprovePhaseRequest = async (projet: Projet) => {
    try {
      const response = await api.updateSecretaireProjetPhase(projet.id, { action: 'approve' });
      if (!response.success) {
        setFeedback(response.message || 'Impossible d approuver la demande de phase.');
        return;
      }
      setFeedback('Demande de phase approuvee.');
      await fetchProjets();
    } catch (error) {
      console.error(error);
      setFeedback('Erreur lors de l approbation de phase.');
    }
  };

  const handleRejectPhaseRequest = async (projet: Projet) => {
    try {
      const response = await api.updateSecretaireProjetPhase(projet.id, { action: 'reject' });
      if (!response.success) {
        setFeedback(response.message || 'Impossible de rejeter la demande de phase.');
        return;
      }
      setFeedback('Demande de phase rejetee.');
      await fetchProjets();
    } catch (error) {
      console.error(error);
      setFeedback('Erreur lors du rejet de phase.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projets en Cours</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Suivi des projets de construction MBC</p>
      </div>

      {feedback && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900/60 dark:bg-blue-900/20 dark:text-blue-300">
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4"><div className="text-2xl font-bold text-gray-900 dark:text-white">{projets.length}</div><div className="text-sm text-gray-500 dark:text-gray-400">Total projets</div></div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4"><div className="text-2xl font-bold text-blue-600">{projets.filter((p) => p.status === 'en-cours').length}</div><div className="text-sm text-gray-500 dark:text-gray-400">En cours</div></div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4"><div className="text-2xl font-bold text-amber-600">{projets.filter((p) => p.status === 'en-attente').length}</div><div className="text-sm text-gray-500 dark:text-gray-400">En attente</div></div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4"><div className="text-2xl font-bold text-green-600">{projets.filter((p) => p.status === 'termine').length}</div><div className="text-sm text-gray-500 dark:text-gray-400">Termines</div></div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Rechercher un projet ou client..." className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500" />
          <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="tous">Tous les statuts</option>
            <option value="en-cours">En cours</option>
            <option value="en-attente">En attente</option>
            <option value="termine">Termines</option>
            <option value="suspendu">Suspendus</option>
          </select>
          <select value={filterType} onChange={(event) => setFilterType(event.target.value)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="tous">Tous les types</option>
            {typesUniques.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProjets.map((projet) => (
          <div key={projet.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{projet.nom}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${projet.clientType === 'entreprise' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>{projet.client}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${projet.clientId ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>{projet.clientId ? 'Lie' : 'Non lie'}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(projet.status)}`}>{getStatusText(projet.status)}</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getValidationBadge(projet.validationStatus).className}`}>{getValidationBadge(projet.validationStatus).label}</span>
                </div>
              </div>

              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div>{projet.adresse}</div>
                <div>{fmtDate(projet.dateDebut)} - {fmtDate(projet.dateFinEstimee)}</div>
                <div>{projet.chefProjet}</div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Progression</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{projet.progression}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${projet.progression >= 80 ? 'bg-green-500' : projet.progression >= 50 ? 'bg-blue-500' : projet.progression >= 25 ? 'bg-amber-500' : 'bg-gray-400'}`} style={{ width: `${projet.progression}%` }} />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <div className="flex items-center justify-between"><span className="text-sm text-gray-500 dark:text-gray-400">Budget</span><span className="text-sm font-semibold text-gray-900 dark:text-white">{fmtBudget(projet.budget)}</span></div>
                <div className="flex items-center justify-between"><span className="text-sm text-gray-500 dark:text-gray-400">Phase actuelle</span><span className="text-sm font-semibold text-gray-900 dark:text-white">{getPhaseLabel(projet.phaseCurrent)}</span></div>
                {projet.phasePending && <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">Demande chef en attente vers <strong>{projet.phasePending.to_phase_label || getPhaseLabel(projet.phasePending.to_phase)}</strong></div>}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 flex justify-end gap-2 flex-wrap">
              <button type="button" onClick={() => openDetailModal(projet)} className="px-3 py-1.5 text-sm font-medium rounded border border-purple-300 dark:border-purple-700 text-purple-700 hover:bg-purple-50 dark:text-purple-300 dark:hover:bg-purple-900/20">Voir details</button>
              <button type="button" onClick={() => handleApplyNextPhase(projet)} className="px-3 py-1.5 text-sm font-medium rounded border border-indigo-300 dark:border-indigo-700 text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-900/20">Passer phase suivante</button>
              {projet.phasePending && (
                <>
                  <button type="button" onClick={() => handleApprovePhaseRequest(projet)} className="px-3 py-1.5 text-sm font-medium rounded border border-green-300 dark:border-green-700 text-green-700 hover:bg-green-50 dark:text-green-300 dark:hover:bg-green-900/20">Approuver phase chef</button>
                  <button type="button" onClick={() => handleRejectPhaseRequest(projet)} className="px-3 py-1.5 text-sm font-medium rounded border border-red-300 dark:border-red-700 text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/20">Rejeter</button>
                </>
              )}
              <button type="button" onClick={() => openValidationModal(projet)} className="px-3 py-1.5 text-sm font-medium rounded border border-blue-300 dark:border-blue-700 text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-900/20">{projet.validationStatus === 'approved' ? 'Revalider' : 'Valider creation'}</button>
              <button type="button" onClick={() => openAssignModal(projet)} className={`px-3 py-1.5 text-sm font-medium rounded border ${projet.validationStatus === 'approved' ? 'border-gray-300 dark:border-gray-600 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700' : 'border-amber-300 dark:border-amber-700 text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-900/20'}`}>{projet.validationStatus === 'approved' ? 'Lier client' : 'Valider puis lier'}</button>
            </div>
          </div>
        ))}
      </div>

      {filteredProjets.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">Aucun projet trouve</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Aucun projet ne correspond a vos criteres de recherche.</p>
        </div>
      )}

      {selectedProjet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Lier un client au chantier</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Chantier: <span className="font-medium">{selectedProjet.nom}</span></p>
            <div className="mt-4 space-y-4">
              <input value={clientSearch} onChange={(event) => setClientSearch(event.target.value)} placeholder="Nom ou email du client..." className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              <select value={selectedClientId} onChange={(event) => setSelectedClientId(event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                <option value="">Selectionner un client</option>
                {filteredClients.map((client) => <option key={client.id} value={client.id}>{client.name} ({client.email})</option>)}
              </select>
              {loadingClients && <p className="text-xs text-gray-500 dark:text-gray-400">Chargement des clients...</p>}
              {!loadingClients && filteredClients.length === 0 && <p className="text-xs text-amber-600 dark:text-amber-400">Aucun compte client ne correspond a cette recherche.</p>}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setSelectedProjet(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">Annuler</button>
              <button type="button" onClick={handleAssignClient} disabled={assigning || loadingClients} className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50">{assigning ? 'Liaison...' : 'Confirmer la liaison'}</button>
            </div>
          </div>
        </div>
      )}

      {validationProjet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Validation de creation</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Chantier: <span className="font-medium">{validationProjet.nom}</span></p>
            <div className="mt-4 space-y-3">
              <select value={validationDecision} onChange={(event) => setValidationDecision(event.target.value as 'approved' | 'rejected')} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                <option value="approved">Approuver</option>
                <option value="rejected">Rejeter</option>
              </select>
              <textarea rows={3} value={validationNote} onChange={(event) => setValidationNote(event.target.value)} placeholder="Commentaire de validation..." className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setValidationProjet(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">Annuler</button>
              <button type="button" onClick={handleValidateCreation} disabled={validating} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">{validating ? 'Traitement...' : validationDecision === 'approved' ? 'Approuver' : 'Rejeter'}</button>
            </div>
          </div>
        </div>
      )}

      {detailProjet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{detailProjet.nom}</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{detailProjet.type}</p>
              </div>
              <button type="button" onClick={() => setDetailProjet(null)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">Fermer</button>
            </div>
            {detailLoading && <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">Chargement du detail complet...</div>}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700 space-y-2 text-sm">
                <p className="font-semibold text-gray-900 dark:text-white">Informations generales</p>
                <p className="text-gray-600 dark:text-gray-400">Adresse: <span className="font-medium text-gray-900 dark:text-white">{detailProjet.adresse}</span></p>
                <p className="text-gray-600 dark:text-gray-400">Debut: <span className="font-medium text-gray-900 dark:text-white">{fmtDate(detailProjet.dateDebut)}</span></p>
                <p className="text-gray-600 dark:text-gray-400">Fin estimee: <span className="font-medium text-gray-900 dark:text-white">{fmtDate(detailProjet.dateFinEstimee)}</span></p>
                <p className="text-gray-600 dark:text-gray-400">Budget: <span className="font-medium text-gray-900 dark:text-white">{fmtBudget(detailProjet.budget)}</span></p>
                <p className="text-gray-600 dark:text-gray-400">Progression: <span className="font-medium text-gray-900 dark:text-white">{detailProjet.progression}%</span></p>
                <p className="text-gray-600 dark:text-gray-400">Phase actuelle: <span className="font-medium text-gray-900 dark:text-white">{getPhaseLabel(detailProjet.phaseCurrent)}</span></p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700 space-y-2 text-sm">
                <p className="font-semibold text-gray-900 dark:text-white">Client et validation</p>
                <p className="text-gray-600 dark:text-gray-400">Client: <span className="font-medium text-gray-900 dark:text-white">{detailProjet.client}</span></p>
                <p className="text-gray-600 dark:text-gray-400">Email: <span className="font-medium text-gray-900 dark:text-white">{detailProjet.clientEmail || 'Non renseigne'}</span></p>
                <p className="text-gray-600 dark:text-gray-400">Telephone: <span className="font-medium text-gray-900 dark:text-white">{detailProjet.clientPhone || 'Non renseigne'}</span></p>
                <p className="text-gray-600 dark:text-gray-400">Valide le: <span className="font-medium text-gray-900 dark:text-white">{fmtDateTime(detailProjet.validation?.validated_at)}</span></p>
                <p className="text-gray-600 dark:text-gray-400">Note: <span className="font-medium text-gray-900 dark:text-white">{detailProjet.validation?.note || detailProjet.validationNote || 'Aucune note'}</span></p>
                <p className="text-gray-600 dark:text-gray-400">Cree par: <span className="font-medium text-gray-900 dark:text-white">{detailProjet.createdByName || 'Non renseigne'}</span></p>
                <p className="text-gray-600 dark:text-gray-400">Cree le: <span className="font-medium text-gray-900 dark:text-white">{fmtDateTime(detailProjet.createdAt)}</span></p>
              </div>
            </div>
            {detailProjet.description && <div className="mt-4 rounded-lg border border-gray-200 p-4 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">{detailProjet.description}</div>}
            {detailProjet.phasePending && <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">Demande en attente vers <strong>{detailProjet.phasePending.to_phase_label || getPhaseLabel(detailProjet.phasePending.to_phase)}</strong> depuis le {fmtDateTime(detailProjet.phasePending.requested_at)}.</div>}
            {detailProjet.phaseHistory && detailProjet.phaseHistory.length > 0 && (
              <div className="mt-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <p className="font-semibold text-gray-900 dark:text-white mb-3">Historique des phases</p>
                <div className="space-y-3">
                  {detailProjet.phaseHistory.slice(-5).reverse().map((entry, index) => (
                    <div key={`${entry.to_phase || 'phase'}-${entry.requested_at || index}`} className="rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-900/40">
                      <p className="font-medium text-gray-900 dark:text-white">{entry.from_phase_label || getPhaseLabel(entry.from_phase)} -&gt; {entry.to_phase_label || getPhaseLabel(entry.to_phase)}</p>
                      <p className="text-gray-600 dark:text-gray-400">Demande: {fmtDateTime(entry.requested_at)} ({entry.requested_by_role || 'role inconnu'})</p>
                      {entry.approved_at && <p className="text-gray-600 dark:text-gray-400">Validation: {fmtDateTime(entry.approved_at)} ({entry.approved_by_role || 'role inconnu'})</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
