'use client';

import React, { useState, useRef } from 'react';
import * as adminApi from '@/lib/admin-api';
import {
    FileText,
    Download,
    Upload,
    Calendar,
    Loader2,
    CheckCircle,
    AlertCircle
} from 'lucide-react';

export default function SecretaryReportsPage() {
    const [reports, setReports] = useState<adminApi.FinancialReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form State
    const [title, setTitle] = useState('');
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);

    // Fetch Reports
    const fetchReports = async () => {
        setIsLoading(true);
        try {
            // Secretary can use the same list endpoint
            const response = await adminApi.getFinancialReportsSecretary();
            if (response.success) {
                setReports(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch reports", error);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchReports();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            // Auto-fill title if empty
            if (!title) {
                const fileName = e.target.files[0].name.split('.')[0];
                setTitle(fileName.replace(/_/g, ' ').replace(/-/g, ' '));
            }
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploadError(null);
        setUploadSuccess(null);

        if (!fileInputRef.current?.files?.length) {
            setUploadError("Veuillez sélectionner un fichier");
            return;
        }

        const file = fileInputRef.current.files[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('period_start', reportDate); // Simplified for now
        formData.append('type', 'manual');

        setIsUploading(true);

        try {
            const response = await adminApi.uploadFinancialReport(formData);

            if (response.success) {
                setUploadSuccess("Rapport importé avec succès !");
                setTitle('');
                if (fileInputRef.current) fileInputRef.current.value = '';
                fetchReports(); // Refresh list
            } else {
                setUploadError(response.message || "Erreur lors de l'import");
            }
        } catch (err) {
            setUploadError("Une erreur est survenue lors de l'envoi");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rapports Financiers</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Consultez et importez les rapports financiers.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    {/* Generate Report Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                            <FileText className="h-5 w-5 mr-2" />
                            Générer un rapport
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Générer le rapport financier du mois en cours.
                        </p>
                        <button
                            onClick={async () => {
                                setIsLoading(true); // reusing list loading state or create a new one?
                                // Better create a local loading state for this button if needed, but here simple toast or refresh is fine.
                                // Let's reuse isLoading for simplicity or better, just fire and refresh.
                                try {
                                    const date = new Date();
                                    const response = await adminApi.generateFinancialReportSecretary(date.getMonth() + 1, date.getFullYear());
                                    if (response.success) {
                                        fetchReports();
                                        setUploadSuccess("Rapport généré avec succès !");
                                        // Clear success after 3s
                                        setTimeout(() => setUploadSuccess(null), 3000);
                                    } else {
                                        setUploadError("Erreur lors de la génération");
                                    }
                                } catch (e) {
                                    setUploadError("Erreur lors de la génération");
                                } finally {
                                    setIsLoading(false);
                                }
                            }}
                            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            Générer le rapport du mois
                        </button>
                    </div>

                    {/* Upload Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                            <Upload className="h-5 w-5 mr-2" />
                            Importer un rapport
                        </h2>

                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Titre du rapport
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ex: Rapport Janvier 2026"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Date de référence
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="date"
                                        required
                                        value={reportDate}
                                        onChange={(e) => setReportDate(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Fichier (PDF, Excel)
                                </label>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".pdf,.xlsx,.xls,.csv"
                                    className="w-full text-sm text-gray-500 dark:text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    dark:file:bg-blue-900/30 dark:file:text-blue-300
                  "
                                />
                            </div>

                            {uploadError && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-2" />
                                    {uploadError}
                                </div>
                            )}

                            {uploadSuccess && (
                                <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm flex items-center">
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    {uploadSuccess}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isUploading}
                                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                        Import en cours...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="-ml-1 mr-2 h-4 w-4" />
                                        Importer
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Rapports disponibles
                        </h2>

                        <div className="space-y-3">
                            {isLoading ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                    Chargement...
                                </div>
                            ) : reports.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                                    <p>Aucun rapport disponible</p>
                                </div>
                            ) : (
                                reports.map((report) => (
                                    <div
                                        key={report.id}
                                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        <div className="flex items-center">
                                            <div className={`p-2 rounded-lg mr-4 ${report.type === 'manual'
                                                ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                                                : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                                }`}>
                                                <FileText className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {report.title}
                                                </h3>
                                                <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400 space-x-2">
                                                    <span>{new Date(report.created_at).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <span className={`${report.is_auto_generated ? 'text-green-600' : 'text-purple-600'
                                                        }`}>
                                                        {report.is_auto_generated ? 'Automatique' : 'Manuel'}
                                                    </span>
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
                                            href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage/${report.file_path}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                            title="Télécharger"
                                        >
                                            <Download className="h-5 w-5" />
                                        </a>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
