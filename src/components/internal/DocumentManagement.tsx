'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Mail,
  FileSpreadsheet,
  Award,
  Receipt,
  BookOpen,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { COMPANY_INFO } from '@/lib/company-info';
import {
  generateDevisHTML,
  generateAttestationHTML,
  generateContactRegistryHTML,
  generateReceiptHTML,
  downloadDocument,
  DevisData,
  AttestationData,
  ContactRegistryEntry
} from '@/lib/document-generator';

type DocumentType = 'devis' | 'attestation' | 'registry' | 'receipt';

interface DocumentDownloadButtonProps {
  type: DocumentType;
  data: DevisData | AttestationData | { entries: ContactRegistryEntry[]; period: { start: Date; end: Date } } | {
    reference: string;
    date: Date;
    client: { name: string; email?: string };
    description: string;
    amount: number;
    paymentMethod: string;
    transactionId?: string;
  };
  filename: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  label?: string;
}

export function DocumentDownloadButton({
  type,
  data,
  filename,
  variant = 'primary',
  size = 'md',
  showIcon = true,
  label
}: DocumentDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      let html: string;
      
      switch (type) {
        case 'devis':
          html = generateDevisHTML(data as DevisData);
          break;
        case 'attestation':
          html = generateAttestationHTML(data as AttestationData);
          break;
        case 'registry':
          const registryData = data as { entries: ContactRegistryEntry[]; period: { start: Date; end: Date } };
          html = generateContactRegistryHTML(registryData.entries, registryData.period);
          break;
        case 'receipt':
          html = generateReceiptHTML(data as {
            reference: string;
            date: Date;
            client: { name: string; email?: string };
            description: string;
            amount: number;
            paymentMethod: string;
            transactionId?: string;
          });
          break;
        default:
          throw new Error('Type de document non supporté');
      }
      
      await downloadDocument(html, filename, 'html');
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const icons = {
    devis: FileSpreadsheet,
    attestation: Award,
    registry: BookOpen,
    receipt: Receipt
  };
  const Icon = icons[type];

  const defaultLabels = {
    devis: 'Télécharger le devis',
    attestation: 'Télécharger l\'attestation',
    registry: 'Exporter le registre',
    receipt: 'Télécharger le reçu'
  };

  const variantClasses = {
    primary: 'bg-madiba-red hover:bg-red-700 text-white',
    secondary: 'bg-gray-800 hover:bg-gray-900 text-white',
    outline: 'border-2 border-madiba-red text-madiba-red hover:bg-madiba-red hover:text-white'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isLoading}
      className={`
        inline-flex items-center gap-2 rounded-lg font-medium transition-all
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
      `}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isSuccess ? (
        <CheckCircle className="w-4 h-4" />
      ) : showIcon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {label || defaultLabels[type]}
    </button>
  );
}

interface DocumentPreviewProps {
  type: DocumentType;
  data: DevisData | AttestationData | { entries: ContactRegistryEntry[]; period: { start: Date; end: Date } } | {
    reference: string;
    date: Date;
    client: { name: string; email?: string };
    description: string;
    amount: number;
    paymentMethod: string;
    transactionId?: string;
  };
}

export function DocumentPreview({ type, data }: DocumentPreviewProps) {
  const [html, setHtml] = useState<string>('');

  React.useEffect(() => {
    let generatedHtml: string;
    
    switch (type) {
      case 'devis':
        generatedHtml = generateDevisHTML(data as DevisData);
        break;
      case 'attestation':
        generatedHtml = generateAttestationHTML(data as AttestationData);
        break;
      case 'registry':
        const registryData = data as { entries: ContactRegistryEntry[]; period: { start: Date; end: Date } };
        generatedHtml = generateContactRegistryHTML(registryData.entries, registryData.period);
        break;
      case 'receipt':
        generatedHtml = generateReceiptHTML(data as {
          reference: string;
          date: Date;
          client: { name: string; email?: string };
          description: string;
          amount: number;
          paymentMethod: string;
          transactionId?: string;
        });
        break;
      default:
        generatedHtml = '<p>Type de document non supporté</p>';
    }
    
    setHtml(generatedHtml);
  }, [type, data]);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white">
      <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Aperçu du document</span>
        <div className="flex gap-2">
          <button 
            onClick={() => window.print()}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="Imprimer"
          >
            <Printer className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>
      <iframe
        srcDoc={html}
        className="w-full h-[600px] border-0"
        title="Aperçu du document"
      />
    </div>
  );
}

interface DocumentActionsCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  actions: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    icon?: React.ReactNode;
  }[];
}

export function DocumentActionsCard({ title, description, icon, actions }: DocumentActionsCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-madiba-red/10 rounded-lg">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{description}</p>
          <div className="flex flex-wrap gap-2">
            {actions.map((action, index) => {
              const variantClasses = {
                primary: 'bg-madiba-red hover:bg-red-700 text-white',
                secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300',
                outline: 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              };
              
              return (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`
                    inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                    ${variantClasses[action.variant || 'secondary']}
                  `}
                >
                  {action.icon}
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Export par défaut d'une section complète de gestion des documents
export default function DocumentManagementSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Documents</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Générez et téléchargez les documents officiels {COMPANY_INFO.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DocumentActionsCard
          title="Devis & Factures"
          description="Créez des devis professionnels avec la charte MBC"
          icon={<FileSpreadsheet className="w-6 h-6 text-madiba-red" />}
          actions={[
            { label: 'Nouveau devis', onClick: () => {}, variant: 'primary', icon: <FileText className="w-4 h-4" /> },
            { label: 'Liste des devis', onClick: () => {}, variant: 'outline' }
          ]}
        />

        <DocumentActionsCard
          title="Attestations"
          description="Générez des attestations de formation ou de travail"
          icon={<Award className="w-6 h-6 text-madiba-red" />}
          actions={[
            { label: 'Nouvelle attestation', onClick: () => {}, variant: 'primary', icon: <Award className="w-4 h-4" /> },
            { label: 'Modèles', onClick: () => {}, variant: 'outline' }
          ]}
        />

        <DocumentActionsCard
          title="Registre des Contacts"
          description="Exportez le registre des demandes et contacts"
          icon={<BookOpen className="w-6 h-6 text-madiba-red" />}
          actions={[
            { label: 'Exporter', onClick: () => {}, variant: 'primary', icon: <Download className="w-4 h-4" /> },
            { label: 'Filtrer par période', onClick: () => {}, variant: 'outline' }
          ]}
        />

        <DocumentActionsCard
          title="Reçus de Paiement"
          description="Générez des reçus pour les paiements reçus"
          icon={<Receipt className="w-6 h-6 text-madiba-red" />}
          actions={[
            { label: 'Nouveau reçu', onClick: () => {}, variant: 'primary', icon: <Receipt className="w-4 h-4" /> },
            { label: 'Historique', onClick: () => {}, variant: 'outline' }
          ]}
        />
      </div>

      <div className="bg-gradient-to-r from-madiba-red/5 to-orange-50 dark:from-madiba-red/10 dark:to-orange-900/10 rounded-xl p-6 border border-madiba-red/20">
        <div className="flex items-center gap-3 mb-3">
          <Mail className="w-5 h-5 text-madiba-red" />
          <span className="font-semibold text-gray-900 dark:text-white">Envoi par email</span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Tous les documents peuvent être envoyés directement par email aux clients depuis cette interface.
          Les documents sont générés avec l&apos;en-tête officiel {COMPANY_INFO.fullName}.
        </p>
      </div>
    </div>
  );
}
