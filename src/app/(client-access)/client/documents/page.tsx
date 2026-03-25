'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getClientProjectPhotos, getClientProjects } from '@/lib/api';

interface Document {
    type: 'photo' | 'plan';
    url: string;
    project_name: string;
    title?: string;
    date: string;
}

export default function DocumentsPage() {
    const { user, token } = useAuth();
    const router = useRouter();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            router.push('/connexion?redirect=/client/documents');
            return;
        }
        fetchDocuments();
    }, [token]);

    const fetchDocuments = async () => {
        try {
            // Récupérer tous les projets avec leurs photos
            const response = await getClientProjects();

            if (response.success && response.data) {
                const allDocs: Document[] = [];

                // Parcourir tous les projets pour extraire les photos
                for (const project of response.data) {
                    // Récupérer les photos du projet
                    try {
                        const photosResponse = await getClientProjectPhotos(project.id);
                        if (photosResponse.success && photosResponse.data) {
                            const photos = photosResponse.data as string[];
                            photos.forEach((photoUrl: string) => {
                                allDocs.push({
                                    type: 'photo',
                                    url: photoUrl,
                                    project_name: project.title,
                                    date: project.last_update?.created_at || new Date().toISOString(),
                                });
                            });
                        }
                    } catch (err) {
                        console.error(`Error fetching photos for project ${project.id}:`, err);
                    }
                }

                setDocuments(allDocs);
            } else {
                setError('Aucun document trouvé');
            }
        } catch (err) {
            console.error('Error fetching documents:', err);
            setError('Erreur lors du chargement des documents');
        } finally {
            setLoading(false);
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
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Mes documents
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Photos et documents de vos projets
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            {/* Documents Grid */}
            {documents.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
                    <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Aucun document
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        Aucune photo ou document disponible pour le moment
                    </p>
                </div>
            ) : (
                <>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Photos du chantier
                            </h2>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {documents.length} {documents.length > 1 ? 'photos' : 'photo'}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {documents.map((doc, index) => (
                                <div
                                    key={index}
                                    onClick={() => setSelectedImage(doc.url)}
                                    className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-madiba-red transition-all group"
                                >
                                    <img
                                        src={doc.url}
                                        alt={doc.title || doc.project_name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="absolute bottom-0 left-0 right-0 p-3">
                                            <p className="text-white text-sm font-medium truncate">
                                                {doc.project_name}
                                            </p>
                                            <p className="text-white/80 text-xs">
                                                {new Date(doc.date).toLocaleDateString('fr-FR')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                        </svg>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Lightbox */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
                    >
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <img
                        src={selectedImage}
                        alt="Photo"
                        className="max-w-full max-h-full object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
