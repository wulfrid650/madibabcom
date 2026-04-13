
'use client';

import React, { useState } from 'react';
import * as adminApi from '@/lib/admin-api'; // Import adminApi
import { resolveMediaUrl } from '@/lib/media';
import {
  FileText,
  Download,
  Calendar,
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  Clock,
  ChevronDown,
  FileSpreadsheet,
  FileBarChart,
  Filter,
  Loader2,
  CheckCircle
} from 'lucide-react';

interface ReportType {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: 'finance' | 'projects' | 'users' | 'operations';
  formats: ('pdf' | 'csv' | 'excel')[];
}

const reportTypes: ReportType[] = [
  {
    id: 'financial-summary',
    title: 'Synthèse financière',
    description: 'Résumé des revenus, dépenses et bénéfices sur une période donnée',
    icon: DollarSign,
    category: 'finance',
    formats: ['pdf', 'excel'],
  },
  {
    id: 'payment-history',
    title: 'Historique des paiements',
    description: 'Liste détaillée de tous les paiements reçus avec statuts',
    icon: FileSpreadsheet,
    category: 'finance',
    formats: ['pdf', 'csv', 'excel'],
  },
  {
    id: 'project-progress',
    title: 'Avancement des projets',
    description: 'État d\'avancement de tous les projets en cours',
    icon: TrendingUp,
    category: 'projects',
    formats: ['pdf', 'excel'],
  },
  {
    id: 'project-budget',
    title: 'Budgets projets',
    description: 'Comparaison budgets prévus vs réels par projet',
    icon: FileBarChart,
    category: 'projects',
    formats: ['pdf', 'excel'],
  },
  {
    id: 'user-activity',
    title: 'Activité utilisateurs',
    description: 'Rapport d\'activité des utilisateurs (connexions, actions)',
    icon: Users,
    category: 'users',
    formats: ['pdf', 'csv'],
  },
  {
    id: 'personnel-hours',
    title: 'Heures du personnel',
    description: 'Récapitulatif des heures travaillées par employé',
    icon: Clock,
    category: 'operations',
    formats: ['pdf', 'excel'],
  },
  {
    id: 'client-list',
    title: 'Liste des clients',
    description: 'Export de la base clients avec informations de contact',
    icon: Building2,
    category: 'users',
    formats: ['csv', 'excel'],
  },
  {
    id: 'formations-summary',
    title: 'Synthèse formations',
    description: 'Résumé des formations, inscriptions et revenus associés',
    icon: FileText,
    category: 'operations',
    formats: ['pdf', 'excel'],
  },
];

const categoryConfig: Record<string, { label: string; color: string }> = {
  finance: { label: 'Finance', color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400' },
  projects: { label: 'Projets', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400' },
  users: { label: 'Utilisateurs', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400' },
  operations: { label: 'Opérations', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400' },
};

export default function ReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [generatedReports, setGeneratedReports] = useState<string[]>([]);

  // Real Data State
  const [realReports, setRealReports] = useState<any[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);

  const [activeTab, setActiveTab] = useState<'financial' | 'construction'>('financial');
  const [projectReports, setProjectReports] = useState<any[]>([]);
  const [isLoadingProjectReports, setIsLoadingProjectReports] = useState(true);

  // Fetch Reports
  React.useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await adminApi.getFinancialReports(); // Use the new API function
        if (response.success) {
          setRealReports(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch reports", error);
      } finally {
        setIsLoadingReports(false);
      }
    };

    const fetchProjectReports = async () => {
      try {
        const response = await adminApi.getProjectReports();
        if (response.success) {
          setProjectReports(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch project reports", error);
      } finally {
        setIsLoadingProjectReports(false);
      }
    };

    fetchReports();
    fetchProjectReports();
  }, []);

  const handleGenerateMonthlyReport = async () => {
    setGeneratingReport('monthly-revenue-pdf');
    try {
      const date = new Date();
      // Generate for current month/year or selected
      await adminApi.generateFinancialReport(date.getMonth() + 1, date.getFullYear());

      // Refresh list
      const response = await adminApi.getFinancialReports();
      if (response.success) {
        setRealReports(response.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingReport(null);
    }
  };

  const filteredReports = selectedCategory
    ? reportTypes.filter(r => r.category === selectedCategory)
    : reportTypes;

  const handleGenerateReport = async (reportId: string, format: string) => {
    setGeneratingReport(`${reportId}-${format}`);

    try {
      if (reportId === 'financial-summary' && format === 'pdf') {
        await handleGenerateMonthlyReport();
        return;
      }

      let url = '';
      const params = new URLSearchParams();

      if (dateRange.start) params.append('start_date', dateRange.start);
      if (dateRange.end) params.append('end_date', dateRange.end);
      params.append('format', format);

      // Map report IDs to API endpoints
      switch (reportId) {
        case 'payment-history':
          url = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/api/admin/reports/payment-history?${params.toString()}`;
          break;
        case 'client-list':
          url = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/api/admin/reports/clients/export?${params.toString()}`;
          break;
        case 'project-progress':
          url = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/api/admin/reports/projects/progress?${params.toString()}`;
          break;
        case 'project-budget':
          url = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/api/admin/reports/projects/budget?${params.toString()}`;
          break;
        case 'user-activity':
          url = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/api/admin/reports/users/activity?${params.toString()}`;
          break;
        case 'formations-summary':
          url = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/api/admin/reports/operations/training?${params.toString()}`;
          break;
        case 'personnel-hours':
          url = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/api/admin/reports/operations/personnel?${params.toString()}`;
          break;
        default:
          // Simulate for others
          await new Promise(resolve => setTimeout(resolve, 2000));
          setGeneratedReports(prev => [...prev, `${reportId}-${format}`]);
          setTimeout(() => {
            setGeneratedReports(prev => prev.filter(r => r !== `${reportId}-${format}`));
          }, 3000);
          return;
      }


      // Trigger download
      if (url) {
        // We use window.open for direct download from GET requests returning streams/PDFs
        // Auth token? We need to handle auth token for protected routes.
        // For file downloads with Auth, it's better to use fetch with Blob or append token to URL if supported.
        // Since we are using Bearer auth, we can't just window.open without token.
        // We'll use a fetch helper to download blob.

        // Backend generates CSV for Excel reports, so we ensure the extension is .csv
        const extension = format === 'excel' ? 'csv' : format;
        await adminApi.downloadReport(url, `${reportId}.${extension}`);
      }

    } catch (e) {
      console.error(e);
      alert("Erreur lors de la génération du rapport");
    } finally {
      setGeneratingReport(null);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'csv':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'excel':
        return <FileBarChart className="h-4 w-4" />;
      default:
        return <Download className="h-4 w-4" />;
    }
  };

  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'pdf':
        return 'PDF';
      case 'csv':
        return 'CSV';
      case 'excel':
        return 'Excel';
      default:
        return format.toUpperCase();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rapports</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Générez et téléchargez des rapports détaillés
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('financial')}
            className={`${activeTab === 'financial'
              ? 'border-blue-500 text-blue-600 dark:text-blue-500'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <DollarSign className={`h-5 w-5 mr-2 ${activeTab === 'financial' ? 'text-blue-500' : 'text-gray-400'}`} />
            Rapports Financiers
          </button>
          <button
            onClick={() => setActiveTab('construction')}
            className={`${activeTab === 'construction'
              ? 'border-blue-500 text-blue-600 dark:text-blue-500'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <Building2 className={`h-5 w-5 mr-2 ${activeTab === 'construction' ? 'text-blue-500' : 'text-gray-400'}`} />
            Rapports Chantiers
          </button>
        </nav>
      </div>

      {/* Financial Reports View */}
      {activeTab === 'financial' && (
        <>
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Période
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="md:w-64">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Catégorie
                </label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none"
                  >
                    <option value="">Toutes les catégories</option>
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Report Types Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReports.map((report) => {
              const Icon = report.icon;
              const category = categoryConfig[report.category];

              return (
                <div
                  key={report.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl mr-4">
                        <Icon className="h-6 w-6 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {report.title}
                        </h3>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${category.color}`}>
                          {category.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {report.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {report.formats.map((format) => {
                      const isGenerating = generatingReport === `${report.id}-${format}`;
                      const isGenerated = generatedReports.includes(`${report.id}-${format}`);

                      return (
                        <button
                          key={format}
                          onClick={() => handleGenerateReport(report.id, format)}
                          disabled={isGenerating}
                          className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                        ${isGenerated
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                            }
                        ${isGenerating ? 'opacity-75 cursor-not-allowed' : ''}
                      `}
                        >
                          {isGenerating ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : isGenerated ? (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          ) : (
                            getFormatIcon(format)
                          )}
                          <span className="ml-1">{getFormatLabel(format)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Reports Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Rapports rapides
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
                <DollarSign className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Ce mois</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Revenus mensuels</p>
                </div>
              </button>
              <button className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
                <TrendingUp className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Projets actifs</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">État d'avancement</p>
                </div>
              </button>
              <button className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
                <Users className="h-8 w-8 text-purple-500 mr-3" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Nouveaux clients</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">30 derniers jours</p>
                </div>
              </button>
              <button className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
                <Clock className="h-8 w-8 text-orange-500 mr-3" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Timesheet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Semaine en cours</p>
                </div>
              </button>
            </div>
          </div>

          {/* Recent Exports */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Exports Financiers
            </h2>
            <div className="space-y-3">
              <div className="space-y-3">
                {isLoadingReports ? (
                  <div className="text-center py-4">Chargement...</div>
                ) : realReports.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">Aucun rapport trouvé.</div>
                ) : (
                  realReports.map((report, index) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{report.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {report.type} • {new Date(report.created_at).toLocaleDateString()} • {report.is_auto_generated ? 'Auto' : 'Manuel'}
                          </p>
                        </div>
                      </div>
                      <a
                        href={resolveMediaUrl(`/storage/${report.file_path}`)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Download className="h-5 w-5" />
                      </a>
                    </div>
                  )))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Construction Reports View */}
      {activeTab === 'construction' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Rapports de Chantiers
          </h2>
          <div className="space-y-3">
            {isLoadingProjectReports ? (
              <div className="text-center py-4">Chargement...</div>
            ) : projectReports.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>Aucun rapport de chantier trouvé.</p>
              </div>
            ) : (
              projectReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg mr-3">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">{report.title}</h3>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-2">
                        <span>{report.type}</span>
                        <span>•</span>
                        <span>{new Date(report.created_at).toLocaleDateString()}</span>
                        {report.chantier && (
                          <>
                            <span>•</span>
                            <span className="font-medium">{report.chantier.title}</span>
                          </>
                        )}
                        {report.creator && (
                          <>
                            <span>•</span>
                            <span>Par {report.creator.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <a
                    href={resolveMediaUrl(`/storage/${report.file_path}`)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <Download className="h-5 w-5" />
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
