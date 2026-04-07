'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import {
  ClipboardCheck,
  Search,
  Plus,
  ChevronLeft,
  Calendar,
  Users,
  FileText,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface Evaluation {
  id: number;
  titre: string;
  formation: string;
  type: 'examen' | 'tp' | 'projet' | 'quiz';
  date: string;
  duree: number;
  participants: number;
  corriges: number;
  status: 'a_venir' | 'en_cours' | 'terminee' | 'corrigee';
  moyenne?: number;
}

interface NoteApprenant {
  id: number;
  apprenant_id: number;
  apprenant_name: string;
  note: number | null;
  commentaire: string;
  date_soumission: string | null;
}

export default function FormateurEvaluationsPage() {
  const router = useRouter();
  const { user, token, hasRole } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [notes, setNotes] = useState<NoteApprenant[]>([]);
  const [showNotes, setShowNotes] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const [newEvaluation, setNewEvaluation] = useState<{
    titre: string;
    formation: string;
    type: 'examen' | 'tp' | 'projet' | 'quiz';
    date: string;
    duree: number;
  }>({
    titre: '',
    formation: 'BIM',
    type: 'examen',
    date: '',
    duree: 60,
  });

  const formations = ['BIM', 'Métrage', 'Enscape', 'Twinmotion', 'Assistant Maçon', 'Électroménager'];

  const loadEvaluations = useCallback(async () => {
    setTimeout(() => {
      setEvaluations([
        { id: 1, titre: 'Examen BIM - Module 1', formation: 'BIM', type: 'examen', date: '2026-01-15', duree: 120, participants: 12, corriges: 0, status: 'a_venir' },
        { id: 2, titre: 'TP Modélisation 3D', formation: 'BIM', type: 'tp', date: '2026-01-08', duree: 180, participants: 12, corriges: 8, status: 'terminee', moyenne: 14.2 },
        { id: 3, titre: 'Quiz Métrage - Calculs', formation: 'Métrage', type: 'quiz', date: '2026-01-10', duree: 30, participants: 8, corriges: 8, status: 'corrigee', moyenne: 15.5 },
        { id: 4, titre: 'Projet Rendu Enscape', formation: 'Enscape', type: 'projet', date: '2026-01-20', duree: 0, participants: 6, corriges: 0, status: 'a_venir' },
        { id: 5, titre: 'Examen Final Métrage', formation: 'Métrage', type: 'examen', date: '2026-01-05', duree: 180, participants: 8, corriges: 5, status: 'terminee', moyenne: 13.8 },
      ]);
      setIsLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    if (!token || !user) {
      router.push('/connexion');
      return;
    }

    if (!hasRole('formateur')) {
      router.push('/dashboard');
      return;
    }

    void loadEvaluations();
  }, [token, user, hasRole, router, loadEvaluations]);

  const loadNotes = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    setNotes([
      { id: 1, apprenant_id: 1, apprenant_name: 'Jean Kouame', note: 15, commentaire: 'Bon travail', date_soumission: '2026-01-08' },
      { id: 2, apprenant_id: 2, apprenant_name: 'Marie Diallo', note: 17, commentaire: 'Excellent', date_soumission: '2026-01-08' },
      { id: 3, apprenant_id: 3, apprenant_name: 'Paul Mensah', note: 12, commentaire: 'Peut mieux faire', date_soumission: '2026-01-08' },
      { id: 4, apprenant_id: 4, apprenant_name: 'Aminata Bah', note: null, commentaire: '', date_soumission: null },
      { id: 5, apprenant_id: 5, apprenant_name: 'Fatou Ndiaye', note: 14, commentaire: 'Bien', date_soumission: '2026-01-08' },
    ]);
    setShowNotes(true);
  };

  const updateNote = (noteId: number, value: number | null, commentaire: string) => {
    setNotes(notes.map(n =>
      n.id === noteId ? { ...n, note: value, commentaire } : n
    ));
  };

  const filteredEvaluations = evaluations.filter(e =>
    filterStatus === 'all' || e.status === filterStatus
  );

  const getStatusBadge = (status: string) => {
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
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      examen: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      tp: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      projet: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
      quiz: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    };
    const labels: Record<string, string> = { examen: 'Examen', tp: 'TP', projet: 'Projet', quiz: 'Quiz' };
    return <span className={`px-2 py-1 text-xs font-medium rounded ${styles[type]}`}>{labels[type]}</span>;
  };

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
        {/* Header */}
        <div className="mb-8">
          <Link href="/formateur/dashboard" className="text-purple-600 hover:underline flex items-center gap-1 mb-4">
            <ChevronLeft className="h-4 w-4" />
            Retour au tableau de bord
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <ClipboardCheck className="h-8 w-8 text-purple-500" />
                Évaluations
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Gérez les examens, TP, projets et quiz
              </p>
            </div>
            <Button
              onClick={() => setShowNewForm(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nouvelle évaluation
            </Button>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mb-6">
          {['all', 'a_venir', 'terminee', 'corrigee'].map((status) => {
            const labels: Record<string, string> = { all: 'Toutes', a_venir: 'À venir', terminee: 'À corriger', corrigee: 'Corrigées' };
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
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

        {/* Liste des évaluations */}
        <div className="grid gap-4">
          {filteredEvaluations.map((evaluation) => (
            <div
              key={evaluation.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
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

                  {/* Barre de progression correction */}
                  {(evaluation.status === 'terminee' || evaluation.status === 'corrigee') && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Progression correction</span>
                        <span className="font-medium">{evaluation.corriges}/{evaluation.participants}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all"
                          style={{ width: `${(evaluation.corriges / evaluation.participants) * 100}%` }}
                        />
                      </div>
                      {evaluation.moyenne && (
                        <p className="mt-2 text-sm">
                          Moyenne: <span className="font-semibold text-purple-600">{evaluation.moyenne.toFixed(1)}/20</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadNotes(evaluation)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Notes
                  </Button>
                  <button className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredEvaluations.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune évaluation trouvée</p>
          </div>
        )}

        {/* Modal Notes */}
        {showNotes && selectedEvaluation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
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
                            onChange={(e) => updateNote(note.id, e.target.value ? parseFloat(e.target.value) : null, note.commentaire)}
                            className="w-20 px-2 py-1 text-center border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            placeholder="-"
                          />
                        </td>
                        <td className="py-3">
                          <input
                            type="text"
                            value={note.commentaire}
                            onChange={(e) => updateNote(note.id, note.note, e.target.value)}
                            className="w-full px-2 py-1 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            placeholder="Ajouter un commentaire..."
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Moyenne: <span className="font-bold text-purple-600">
                    {(notes.filter(n => n.note !== null).reduce((sum, n) => sum + (n.note || 0), 0) / notes.filter(n => n.note !== null).length || 0).toFixed(1)}/20
                  </span>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowNotes(false)}>
                    Annuler
                  </Button>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    Enregistrer les notes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Nouvelle Évaluation */}
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
                    onChange={(e) => setNewEvaluation({ ...newEvaluation, titre: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    placeholder="Ex: Examen BIM - Module 2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Formation *</label>
                    <select
                      value={newEvaluation.formation}
                      onChange={(e) => setNewEvaluation({ ...newEvaluation, formation: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    >
                      {formations.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Type *</label>
                    <select
                      value={newEvaluation.type}
                      onChange={(e) => setNewEvaluation({ ...newEvaluation, type: e.target.value as 'examen' | 'tp' | 'projet' | 'quiz' })}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    >
                      <option value="examen">Examen</option>
                      <option value="tp">TP</option>
                      <option value="projet">Projet</option>
                      <option value="quiz">Quiz</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Date *</label>
                    <input
                      type="date"
                      value={newEvaluation.date}
                      onChange={(e) => setNewEvaluation({ ...newEvaluation, date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Durée (min)</label>
                    <input
                      type="number"
                      value={newEvaluation.duree}
                      onChange={(e) => setNewEvaluation({ ...newEvaluation, duree: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      placeholder="0 = sans limite"
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowNewForm(false)}>
                  Annuler
                </Button>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Créer l&apos;évaluation
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
