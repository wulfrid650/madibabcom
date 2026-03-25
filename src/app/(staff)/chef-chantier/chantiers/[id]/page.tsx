'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, MapPin, Calendar, Users, TrendingUp, 
  Upload, Image as ImageIcon, X, Loader2, CheckCircle, AlertCircle,
  Download, FileText, Clock, Pencil
} from 'lucide-react';
import { api, ProjectPhaseState } from '@/lib/api';

export default function ChantierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const chantierId = parseInt(params.id as string);

  const [chantier, setChantier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [phaseState, setPhaseState] = useState<ProjectPhaseState | null>(null);
  const [selectedPhase, setSelectedPhase] = useState('');
  const [phaseNote, setPhaseNote] = useState('');
  const [phaseSubmitting, setPhaseSubmitting] = useState(false);
  const [phaseFeedback, setPhaseFeedback] = useState<string | null>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadChantierDetails();
  }, [chantierId]);

  const loadChantierDetails = async () => {
    try {
      setLoading(true);
      const [project, phase] = await Promise.all([
        api.getChefChantierChantier(chantierId),
        api.getChefChantierPhaseState(chantierId),
      ]);
      setChantier(project);
      setPhaseState(phase);
      setSelectedPhase((current) => current || phase.current_phase);
    } catch (err) {
      console.error('Erreur chargement chantier:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhaseTransitionRequest = async () => {
    if (!selectedPhase) return;

    try {
      setPhaseSubmitting(true);
      setPhaseFeedback(null);

      const response = await api.requestChefChantierPhaseTransition(chantierId, {
        to_phase: selectedPhase,
        note: phaseNote || undefined,
      });

      if (!response.success) {
        setPhaseFeedback(response.message || 'Impossible de traiter la demande de phase.');
        return;
      }

      const updatedPhaseState = response.data?.phase_state || (await api.getChefChantierPhaseState(chantierId));
      setPhaseState(updatedPhaseState);
      setPhaseFeedback(response.message || 'Demande envoyée.');
      setPhaseNote('');
    } catch (err) {
      console.error('Erreur demande phase:', err);
      setPhaseFeedback('Erreur lors de la demande de changement de phase.');
    } finally {
      setPhaseSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadPhotos = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const response = await api.uploadChantierPhotos(chantierId, selectedFiles, description);

      if (response.success) {
        setUploadSuccess(true);
        setSelectedFiles([]);
        setFilePreviews([]);
        setDescription('');
        
        // Reload chantier details to show new photos
        await loadChantierDetails();

        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        setUploadError(response.message || 'Erreur lors de l\'upload');
      }
    } catch (err) {
      setUploadError('Une erreur est survenue lors de l\'upload');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!chantier) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Chantier introuvable</h2>
        <button
          onClick={() => router.back()}
          className="text-amber-600 hover:text-amber-700 font-medium"
        >
          Retour à la liste
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{chantier.title}</h1>
            <p className="text-gray-600 mt-1 flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {chantier.location || 'Localisation non définie'}
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push(`/chef-chantier/chantiers/${chantierId}/modifier`)}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-900 transition-colors hover:bg-gray-200"
        >
          <Pencil className="h-4 w-4" />
          Modifier
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Progression</p>
              <p className="text-2xl font-bold text-amber-600">{chantier.progress}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-amber-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Début</p>
              <p className="text-lg font-semibold text-gray-900">
                {chantier.start_date ? new Date(chantier.start_date).toLocaleDateString('fr-FR') : 'N/A'}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Fin prévue</p>
              <p className="text-lg font-semibold text-gray-900">
                {chantier.expected_end_date || chantier.completion_date
                  ? new Date(chantier.expected_end_date || chantier.completion_date).toLocaleDateString('fr-FR')
                  : 'N/A'}
              </p>
            </div>
            <Clock className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Photos</p>
              <p className="text-2xl font-bold text-green-600">
                {Array.isArray(chantier.images) ? chantier.images.length : 0}
              </p>
            </div>
            <ImageIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Phase Workflow */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Phase du chantier</h2>
            <p className="text-sm text-gray-600 mt-1">
              Phase actuelle: <span className="font-semibold">{phaseState?.current_phase_label || 'Non définie'}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Les demandes du chef chantier doivent être approuvées par un admin ou une secrétaire.
            </p>
          </div>
        </div>

        {phaseState?.pending_request && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Demande en attente: <strong>{phaseState.pending_request.to_phase_label || phaseState.pending_request.to_phase}</strong>
            {' '}({phaseState.pending_request.requested_at ? new Date(phaseState.pending_request.requested_at).toLocaleString('fr-FR') : 'date inconnue'})
          </div>
        )}

        {phaseFeedback && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {phaseFeedback}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={selectedPhase}
            onChange={(e) => setSelectedPhase(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">Sélectionner une phase</option>
            {(phaseState?.available_phases || []).map((phase) => (
              <option key={phase.key} value={phase.key}>
                {phase.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={phaseNote}
            onChange={(e) => setPhaseNote(e.target.value)}
            placeholder="Note (optionnelle)"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={handlePhaseTransitionRequest}
            disabled={phaseSubmitting || !selectedPhase}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {phaseSubmitting ? 'Envoi...' : 'Demander changement'}
          </button>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Upload className="h-6 w-6 mr-2 text-amber-600" />
          Uploader des photos
        </h2>

        {uploadSuccess && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <p className="text-sm text-green-800">Photos uploadées avec succès!</p>
          </div>
        )}

        {uploadError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
            <p className="text-sm text-red-800">{uploadError}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optionnel)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Photos de la façade nord"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Upload Zone */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-amber-500 transition-colors">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="photo-upload"
              disabled={uploading}
            />
            <label htmlFor="photo-upload" className="cursor-pointer">
              <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600 mb-2">
                <span className="text-amber-600 font-medium">Cliquez pour uploader</span> ou glissez-déposez
              </p>
              <p className="text-sm text-gray-500">
                Images JPG, PNG jusqu'à 10MB
              </p>
            </label>
          </div>

          {/* File Previews */}
          {selectedFiles.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <img
                    src={filePreviews[index]}
                    alt={file.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          {selectedFiles.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={handleUploadPhotos}
                disabled={uploading}
                className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Upload en cours...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mr-2" />
                    Uploader {selectedFiles.length} photo(s)
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Existing Photos Gallery */}
      {chantier.images && chantier.images.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <ImageIcon className="h-6 w-6 mr-2 text-amber-600" />
            Galerie photos ({chantier.images.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {chantier.images.map((imageUrl: string, index: number) => (
              <div key={index} className="relative group">
                <img
                  src={imageUrl}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                  <a
                    href={imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-900 px-3 py-2 rounded-lg text-sm font-medium flex items-center"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Télécharger
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {chantier.description && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
          <p className="text-gray-700 whitespace-pre-line">{chantier.description}</p>
        </div>
      )}
    </div>
  );
}
