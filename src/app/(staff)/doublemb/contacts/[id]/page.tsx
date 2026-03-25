'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Calendar,
  FileText,
  Upload,
  Send,
  CheckCircle,
  User,
  MapPin
} from 'lucide-react';
import { api } from '@/lib/api';

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = parseInt(params.id as string);

  const [contact, setContact] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [sendByEmail, setSendByEmail] = useState(true);

  useEffect(() => {
    fetchContact();
  }, [contactId]);

  const fetchContact = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAdminContact(contactId);
      setContact(data);
      
      // Pre-fill response if exists
      if (data.response_message) {
        setResponseMessage(data.response_message);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du contact', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocumentFile(e.target.files[0]);
    }
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('response_message', responseMessage);
      formData.append('send_email', sendByEmail ? '1' : '0');
      
      if (documentFile) {
        formData.append('response_document', documentFile);
      }

      // Generate quote number if doesn't exist
      if (!contact.quote_number) {
        formData.append('generate_quote_number', '1');
      }

      await api.respondToQuote(contactId, formData);

      alert('Réponse envoyée avec succès !');
      router.push('/doublemb/contacts');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la réponse', error);
      alert('Erreur lors de l\'envoi de la réponse');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl w-1/3"></div>
        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Contact non trouvé</p>
      </div>
    );
  }

  const hasResponse = contact.status === 'responded' && (contact.response_message || contact.response_document);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Détails de la demande</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {contact.quote_number || 'Numéro à générer'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Informations du client
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nom</p>
                  <p className="font-medium text-gray-900 dark:text-white">{contact.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <a href={`mailto:${contact.email}`} className="font-medium text-red-600 hover:text-red-700">
                    {contact.email}
                  </a>
                </div>
              </div>

              {contact.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Téléphone</p>
                    <a href={`tel:${contact.phone}`} className="font-medium text-gray-900 dark:text-white">
                      {contact.phone}
                    </a>
                  </div>
                </div>
              )}

              {contact.company && (
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Entreprise</p>
                    <p className="font-medium text-gray-900 dark:text-white">{contact.company}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Date de demande</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(contact.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Request Details and Response */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Détails de la demande
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Sujet</p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">{contact.subject}</p>
              </div>

              {contact.service_type && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Type de service</p>
                  <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400 rounded-full text-sm">
                    {contact.service_type}
                  </span>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Description du projet</p>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{contact.message}</p>
              </div>
            </div>
          </div>

          {/* Response Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {hasResponse ? 'Réponse envoyée' : 'Répondre à la demande'}
            </h2>

            {hasResponse ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-4">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">
                    Réponse envoyée le {new Date(contact.response_sent_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                {contact.response_message && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Message envoyé:</p>
                    <p className="text-gray-700 dark:text-gray-300 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg whitespace-pre-wrap">
                      {contact.response_message}
                    </p>
                  </div>
                )}

                {contact.response_document && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Document envoyé:</p>
                    <a
                      href={contact.response_document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      Télécharger le document
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmitResponse} className="space-y-6">
                {/* Response Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message de réponse
                  </label>
                  <textarea
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                    placeholder="Écrivez votre réponse au client..."
                    required
                  />
                </div>

                {/* Document Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Document (devis PDF, optionnel)
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-red-500 dark:hover:border-red-500 transition-colors cursor-pointer">
                      <Upload className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {documentFile ? documentFile.name : 'Choisir un fichier'}
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Formats acceptés: PDF, DOC, DOCX (Max 10MB)
                  </p>
                </div>

                {/* Send Email Checkbox */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="sendEmail"
                    checked={sendByEmail}
                    onChange={(e) => setSendByEmail(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                  />
                  <label htmlFor="sendEmail" className="text-sm text-gray-700 dark:text-gray-300">
                    Envoyer un email de notification au client
                  </label>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        Envoyer la réponse
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
