'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import {
  api,
  createEvaluation as createFormateurEvaluation,
  getEvaluationNotes as fetchEvaluationNotes,
  getFormateurEvaluations,
  type FormateurEvaluationItem,
  type FormateurEvaluationNoteItem,
  saveEvaluationNotes as persistEvaluationNotes,
  type Formation,
  type FormationSession,
} from '@/lib/api';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ClipboardCheck,
  Clock,
  Eye,
  FileText,
  Plus,
  Users,
} from 'lucide-react';

type EvaluationType = FormateurEvaluationItem['type'];
type EvaluationStatus = FormateurEvaluationItem['status'];
type Evaluation = FormateurEvaluationItem;
type NoteApprenant = FormateurEvaluationNoteItem;

interface SessionOption {
  id: number;
  formationId: number;
  formationTitle: string;
  label: string;
}

const TYPE_LABELS: Record<EvaluationType, string> = {
  exam: 'Examen',
  practical: 'TP',
  project: 'Projet',
  quiz: 'Quiz',
};

function getTypeBadge(type: EvaluationType) {
  const styles: Record<EvaluationType, string> = {
    exam: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    practical: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    project: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    quiz: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${styles[type]}`}>
      {TYPE_LABELS[type]}
    </span>
  );
}

function getStatusBadge(status: EvaluationStatus) {
  switch (status) {
    case 'a_venir':
      return <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full"><Clock className="h-3 w-3" /> À venir</span>;
    case 'en_cours':
      return <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full"><AlertCircle className="h-3 w-3" /> En cours</span>;
    case 'terminee':
      return <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full"><FileText className="h-3 w-3" /> À corriger</span>;
    case 'corrigee':
      return <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full"><CheckCircle className="h-3 w-3" /> Corrigée</span>;
    default:
      return null;
  }
}

function formatSessionLabel(formation: Formation, session: FormationSession): string {
  const start = new Date(session.start_date).toLocaleDateString('fr-FR');
  const end = new Date(session.end_date).toLocaleDateString('fr-FR');
  const parts = [formation.title, `${start} au ${end}`];

  if (session.location) {
    parts.push(session.location);
  }

  return parts.join(' • ');
}

export default function FormateurEvaluationsPage() {
  const router = useRouter();
  const { user, token, hasRole } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isCreatingEvaluation, setIsCreatingEvaluation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [notes, setNotes] = useState<NoteApprenant[]>([]);
  const [showNotes, setShowNotes] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | EvaluationStatus>('all');
  const [newEvaluation, setNewEvaluation] = useState<{
    titre: string;
    formation_session_id: string;
    type: EvaluationType;
    date: string;
    duree: number;
  }>({
    titre: '',
    formation_session_id: '',
    type: 'exam',
    date: '',
    duree: 60,
  });

  const sessionOptions = useMemo<SessionOption[]>(() => {
    return formations.flatMap((formation) =>
      (formation.sessions || []).map((session) => ({
        id: session.id,
        formationId: formation.id,
        formationTitle: formation.title,
        label: formatSessionLabel(formation, session),
      }))
    );
  }, [formations]);

  const loadEvaluations = useCallback(async () => {
    const response = await getFormateurEvaluations(
      filterStatus === 'all' ? undefined : { status: filterStatus }
    );

    setEvaluations(Array.isArray(response.data) ? response.data : []);
  }, [filterStatus]);

  const loadFormations = useCallback(async () => {
    const response = await api.getFormateurFormations(1, '', '', '');
    const items = Array.isArray(response.data) ? response.data : [];
    setFormations(items);
  }, []);

  const loadPageData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await Promise.all([loadEvaluations(), loadFormations()]);
    } catch (loadError) {
      console.error('Error loading evaluations page:', loadError);
      setError('Impossible de charger les évaluations du formateur.');
    } finally {
      setIsLoading(false);
    }
  }, [loadEvaluations, loadFormations]);

  useEffect(() => {
    if (!token || !user) {
      router.push('/connexion');
      return;
    }

    if (!hasRole('formateur')) {
      router.push('/dashboard');
      return;
    }

    void loadPageData();
  }, [hasRole, loadPageData, router, token, user]);

  useEffect(() => {
    if (!newEvaluation.formation_session_id && sessionOptions.length > 0) {
      setNewEvaluation((current) => ({
        ...current,
        formation_session_id: String(sessionOptions[0].id),
      }));
    }
  }, [newEvaluation.formation_session_id, sessionOptions]);

  const loadNotes = async (evaluation: Evaluation) => {
    try {
      setError(null);
      setNotice(null);
      setSelectedEvaluation(evaluation);
      const response = await fetchEvaluationNotes(evaluation.id);
      setNotes(Array.isArray(response.data) ? response.data : []);
      setShowNotes(true);
    } catch (loadError) {
      console.error('Error loading evaluation notes:', loadError);
      setError('Impossible de charger les notes de cette évaluation.');
    }
  };

  const updateNote = (noteId: number, value: number | null, commentaire: string) => {
    setNotes((currentNotes) => currentNotes.map((note) =>
      note.id === noteId ? { ...note, note: value, commentaire } : note
    ));
  };

  const handleSaveNotes = async () => {
    if (!selectedEvaluation) {
      return;
    }

    try {
      setIsSavingNotes(true);
      setError(null);
      await persistEvaluationNotes(selectedEvaluation.id, notes.map((note) => ({
        id: note.id,
        note: note.note,
        commentaire: note.commentaire,
      })));
      setNotice('Les notes ont été enregistrées.');
      await loadEvaluations();
      setShowNotes(false);
    } catch (saveError) {
      console.error('Error saving evaluation notes:', saveError);
      setError('Impossible d’enregistrer les notes.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleCreateEvaluation = async () => {
    if (!newEvaluation.titre.trim() || !newEvaluation.formation_session_id || !newEvaluation.date) {
      setError('Le titre, la session et la date sont obligatoires.');
      return;
    }

    try {
      setIsCreatingEvaluation(true);
      setError(null);
      await createFormateurEvaluation({
        titre: newEvaluation.titre.trim(),
        formation_session_id: Number(newEvaluation.formation_session_id),
        type: newEvaluation.type,
        date: newEvaluation.date,
        duree: newEvaluation.duree > 0 ? newEvaluation.duree : undefined,
      });

      setNotice('Évaluation créée avec succès.');
      setShowNewForm(false);
      setNewEvaluation({
        titre: '',
        formation_session_id: sessionOptions[0] ? String(sessionOptions[0].id) : '',
        type: 'exam',
        date: '',
        duree: 60,
      });
      await loadEvaluations();
    } catch (createError) {
      console.error('Error creating evaluation:', createError);
      setError('Impossible de créer cette évaluation.');
    } finally {
      setIsCreatingEvaluation(false);
    }
  };

  const averageLabel = useMemo(() => {
    const gradedNotes = notes.filter((note) => note.note !== null);

    if (gradedNotes.length === 0) {
      return '0.0/20';
    }

    const average = gradedNotes.reduce((sum, note) => sum + (note.note || 0), 0) / gradedNotes.length;
    return `${average.toFixed(1)}/20`;
  }, [notes]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <Link href="/formateur/dashboard" className="text-purple-600 hover:underline flex items-center gap-1 mb-4">
            <ChevronLeft className="h-4 w-4" />
            Retour au tableau de bord
          </Link>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <ClipboardCheck className="h-8 w-8 text-purple-500" />
                Évaluations
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Gérez les examens, TP, projets et quiz avec les vraies sessions du formateur.
              </p>
            </div>
            <Button
              onClick={() => setShowNewForm(true)}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={sessionOptions.length === 0}
            >
              <Plus className="h-5 w-5 mr-2" />
              Nouvelle évaluation
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {notice && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-300">
            {notice}
          </div>
        )}

        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'a_venir', 'en_cours', 'terminee', 'corrigee'].map((status) => {
            const labels: Record<string, string> = {
              all: 'Toutes',
              a_venir: 'À venir',
              en_cours: 'En cours',
              terminee: 'À corriger',
              corrigee: 'Corrigées',
            };

            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status as 'all' | EvaluationStatus)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterStatus === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {labels[status]}
              </button>
            );
          })}
        </div>

        <div className="grid gap-4">
          {evaluations.map((evaluation) => (
            <div
              key={evaluation.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {evaluation.titre}
                    </h3>
                    {getTypeBadge(evaluation.type)}
                    {getStatusBadge(evaluation.status)}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(evaluation.date).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {evaluation.duree > 0 ? `${evaluation.duree} min` : 'Sans limite'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {evaluation.participants} participants
                    </span>
                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                      {evaluation.formation}
                    </span>
                  </div>

                  {(evaluation.status === 'terminee' || evaluation.status === 'corrigee') && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Progression correction</span>
                        <span className="font-medium">{evaluation.corriges}/{evaluation.participants}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all"
                          style={{ width: `${evaluation.participants > 0 ? (evaluation.corriges / evaluation.participants) * 100 : 0}%` }}
                        />
                      </div>
                      {typeof evaluation.moyenne === 'number' && (
                        <p className="mt-2 text-sm">
                          Moyenne: <span className="font-semibold text-purple-600">{evaluation.moyenne.toFixed(1)}/20</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void loadNotes(evaluation)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Notes
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {evaluations.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune évaluation trouvée</p>
          </div>
        )}

        {showNotes && selectedEvaluation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Notes - {selectedEvaluation.titre}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">{selectedEvaluation.formation}</p>
                  </div>
                  <button
                    onClick={() => setShowNotes(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">Apprenant</th>
                      <th className="text-center py-2 font-medium text-gray-700 dark:text-gray-300 w-24">Note /20</th>
                      <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">Commentaire</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notes.map((note) => (
                      <tr key={note.id} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-3">
                          <span className="font-medium text-gray-900 dark:text-white">{note.apprenant_name}</span>
                          {note.date_soumission && (
                            <span className="block text-xs text-gray-500">Soumis le {note.date_soumission}</span>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.5"
                            value={note.note ?? ''}
                            onChange={(event) => updateNote(
                              note.id,
                              event.target.value ? parseFloat(event.target.value) : null,
                              note.commentaire
                            )}
                            className="w-20 px-2 py-1 text-center border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            placeholder="-"
                          />
                        </td>
                        <td className="py-3">
                          <input
                            type="text"
                            value={note.commentaire}
                            onChange={(event) => updateNote(note.id, note.note, event.target.value)}
                            className="w-full px-2 py-1 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            placeholder="Ajouter un commentaire..."
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Moyenne: <span className="font-bold text-purple-600">{averageLabel}</span>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowNotes(false)}>
                    Annuler
                  </Button>
                  <Button
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => void handleSaveNotes()}
                    disabled={isSavingNotes}
                  >
                    {isSavingNotes ? 'Enregistrement...' : 'Enregistrer les notes'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showNewForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Nouvelle évaluation
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Titre *</label>
                  <input
                    type="text"
                    value={newEvaluation.titre}
                    onChange={(event) => setNewEvaluation((current) => ({ ...current, titre: event.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    placeholder="Ex: Examen BIM - Module 2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Session *</label>
                    <select
                      value={newEvaluation.formation_session_id}
                      onChange={(event) => setNewEvaluation((current) => ({ ...current, formation_session_id: event.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    >
                      {sessionOptions.map((session) => (
                        <option key={session.id} value={session.id}>
                          {session.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Type *</label>
                    <select
                      value={newEvaluation.type}
                      onChange={(event) => setNewEvaluation((current) => ({ ...current, type: event.target.value as EvaluationType }))}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    >
                      <option value="exam">Examen</option>
                      <option value="practical">TP</option>
                      <option value="project">Projet</option>
                      <option value="quiz">Quiz</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Date *</label>
                    <input
                      type="date"
                      value={newEvaluation.date}
                      onChange={(event) => setNewEvaluation((current) => ({ ...current, date: event.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Durée (min)</label>
                  <input
                    type="number"
                    value={newEvaluation.duree}
                    onChange={(event) => setNewEvaluation((current) => ({ ...current, duree: Number(event.target.value || 0) }))}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    placeholder="0 = sans limite"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowNewForm(false)}>
                  Annuler
                </Button>
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => void handleCreateEvaluation()}
                  disabled={isCreatingEvaluation || sessionOptions.length === 0}
                >
                  {isCreatingEvaluation ? 'Création...' : 'Créer l’évaluation'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
