'use client';

import React, { useEffect, useState } from 'react';
import {
  createPortfolioProject,
  deletePortfolioProject,
  getClients,
  getPortfolioProjectsAdmin,
  uploadPortfolioImage,
  type PortfolioProjectAdmin,
  type PortfolioProjectPayload,
  type User,
  updatePortfolioProject,
} from '@/lib/admin-api';
import { resolveMediaUrl } from '@/lib/media';

const emptyForm: PortfolioProjectPayload = {
  title: '',
  category: '',
  description: '',
  client: '',
  client_id: null,
  location: '',
  cover_image: '',
  images: [],
  is_featured: false,
  is_published: true,
};

export default function PortfolioAdminPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [projects, setProjects] = useState<PortfolioProjectAdmin[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [formData, setFormData] = useState<PortfolioProjectPayload>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [coverFileName, setCoverFileName] = useState('');
  const [galleryFileCount, setGalleryFileCount] = useState(0);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
  const [galleryPreviewUrls, setGalleryPreviewUrls] = useState<string[]>([]);

  const normalizeImages = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.filter((img): img is string => typeof img === 'string');
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.filter((img): img is string => typeof img === 'string') : value ? [value] : [];
      } catch {
        return value ? [value] : [];
      }
    }
    return [];
  };

  const revokeObjectUrl = (url: string) => {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  };

  const resetLocalPreviews = () => {
    if (coverPreviewUrl) revokeObjectUrl(coverPreviewUrl);
    galleryPreviewUrls.forEach(revokeObjectUrl);
    setCoverPreviewUrl('');
    setGalleryPreviewUrls([]);
  };

  const loadProjects = async () => {
    setLoading(true);
    const res = await getPortfolioProjectsAdmin({ search, per_page: 50 });
    setProjects(res.data || []);
    setLoading(false);
  };

  const loadClients = async () => {
    const res = await getClients({ per_page: 200 });
    if (res.success) {
      setClients(res.data || []);
    }
  };

  useEffect(() => {
    loadProjects();
    loadClients();
  }, []);

  const openCreate = () => {
    resetLocalPreviews();
    setEditingId(null);
    setFormData(emptyForm);
    setIsFormOpen(true);
  };

  const openEdit = (project: PortfolioProjectAdmin) => {
    resetLocalPreviews();
    setEditingId(project.id);
    setFormData({
      title: project.title,
      category: project.category,
      description: project.description || '',
      client: project.client_name || project.client || '',
      client_id: project.client_id ? Number(project.client_id) : null,
      location: project.location || '',
      year: project.year,
      duration: project.duration || '',
      budget: project.budget || '',
      status: project.status || '',
      cover_image: project.cover_image || '',
      images: normalizeImages(project.images),
      is_featured: project.is_featured,
      is_published: project.is_published,
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    resetLocalPreviews();
    setIsFormOpen(false);
    setEditingId(null);
    setFormData(emptyForm);
    setCoverFileName('');
    setGalleryFileCount(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload: PortfolioProjectPayload = {
      ...formData,
      client_id: formData.client_id ? Number(formData.client_id) : null,
      year: formData.year ? Number(formData.year) : undefined,
      images: normalizeImages(formData.images).filter((img) => img && img.trim() !== ''),
    };

    const res = editingId
      ? await updatePortfolioProject(editingId, payload)
      : await createPortfolioProject(payload);

    if (!res.success) {
      alert(res.message || 'Erreur lors de l\'enregistrement.');
    } else {
      closeForm();
      await loadProjects();
    }

    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce projet portfolio ?')) return;
    const res = await deletePortfolioProject(id);
    if (!res.success) {
      alert(res.message || 'Erreur lors de la suppression.');
      return;
    }
    await loadProjects();
  };

  const removeGalleryImage = (index: number) => {
    const current = [...normalizeImages(formData.images)];
    current.splice(index, 1);
    setFormData({ ...formData, images: current });
  };

  const removeCoverImage = () => {
    if (coverPreviewUrl) revokeObjectUrl(coverPreviewUrl);
    setCoverPreviewUrl('');
    setFormData({ ...formData, cover_image: '' });
    setCoverFileName('');
  };

  const handleCoverUpload = async (file: File | null) => {
    if (!file) return;
    const localPreview = URL.createObjectURL(file);
    setCoverPreviewUrl((current) => {
      if (current) revokeObjectUrl(current);
      return localPreview;
    });
    setCoverFileName(file.name);
    setUploadingCover(true);
    const res = await uploadPortfolioImage(file);
    if (!res.success || (!res.data?.url && !res.data?.full_url)) {
      alert(res.message || 'Erreur lors de l\'upload de l\'image de couverture.');
    } else {
      const uploadedUrl = res.data.full_url || res.data.url;
      setFormData({ ...formData, cover_image: uploadedUrl });
    }
    setUploadingCover(false);
  };

  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const selectedFiles = Array.from(files);
    const localPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setGalleryPreviewUrls((current) => {
      current.forEach(revokeObjectUrl);
      return localPreviews;
    });
    setGalleryFileCount(files.length);
    setUploadingGallery(true);
    const current = [...normalizeImages(formData.images)];
    for (const file of selectedFiles) {
      const res = await uploadPortfolioImage(file);
      if (res.success && (res.data?.url || res.data?.full_url)) {
        current.push(res.data.full_url || res.data.url);
      }
    }
    setFormData({ ...formData, images: current });
    setUploadingGallery(false);
  };

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.location || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gestion des projets affichés sur la landing.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Nouveau projet portfolio
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <label htmlFor="portfolio_search" className="sr-only">Rechercher un projet</label>
        <input
          id="portfolio_search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par titre, categorie ou localisation..."
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-6 text-gray-500 dark:text-gray-400">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-gray-500 dark:text-gray-400">Aucun projet portfolio trouvé.</div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Titre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Catégorie</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Client lié</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Publication</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((project) => (
                <tr key={project.id} className="border-t border-gray-100 dark:border-gray-700">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{project.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{project.category}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {project.client_name || project.client ? (
                      <div>
                        <div>{project.client_name || project.client}</div>
                        {project.client_email && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">{project.client_email}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400">Non lié</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={project.is_published ? 'text-green-600' : 'text-gray-500'}>
                      {project.is_published ? 'Publié' : 'Brouillon'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => openEdit(project)}
                      className="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(project.id)}
                      className="px-3 py-1.5 text-sm rounded bg-red-600 text-white hover:bg-red-700"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingId ? 'Modifier le projet portfolio' : 'Nouveau projet portfolio'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Titre *</label>
                  <input
                    id="title"
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Catégorie *</label>
                  <input
                    id="category"
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="client_id" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Client lié</label>
                  <select
                    id="client_id"
                    value={formData.client_id ?? ''}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : null;
                      const selectedClient = clients.find((client) => Number(client.id) === value);
                      setFormData({
                        ...formData,
                        client_id: value,
                        client: selectedClient?.name || '',
                      });
                    }}
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Aucun client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} ({client.email})
                      </option>
                    ))}
                  </select>
                  {clients.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                      Aucun client chargé. Vérifiez la connexion API.
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Localisation</label>
                  <input
                    id="location"
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="year" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Année</label>
                  <input
                    id="year"
                    type="number"
                    value={formData.year || ''}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) || undefined })}
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Image de couverture</label>
                  <div className="space-y-2">
                    {coverPreviewUrl || formData.cover_image ? (
                      <div className="flex items-center gap-3 p-2 rounded border border-gray-200 dark:border-gray-700">
                        <img
                          src={coverPreviewUrl || resolveMediaUrl(formData.cover_image) || formData.cover_image}
                          alt="Apercu couverture"
                          className="w-20 h-14 object-cover rounded"
                        />
                        <div className="flex-1 text-xs text-gray-500 dark:text-gray-400 break-all">
                          {coverFileName || resolveMediaUrl(formData.cover_image) || formData.cover_image}
                        </div>
                        <button
                          type="button"
                          onClick={removeCoverImage}
                          className="px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700"
                        >
                          Retirer
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400">Aucune image de couverture.</p>
                    )}
                    <input
                      id="cover_upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleCoverUpload(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <div className="flex items-center gap-3">
                      <label
                        htmlFor="cover_upload"
                        className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
                      >
                        Choisir une image
                      </label>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {coverFileName || 'Aucun fichier choisi'}
                      </span>
                      {uploadingCover && <span className="text-xs text-gray-500">Upload...</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                  id="description"
                  rows={4}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Images du projet (galerie)
                  </label>
                  <input
                    id="gallery_upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleGalleryUpload(e.target.files)}
                    className="hidden"
                  />
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="gallery_upload"
                      className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
                    >
                      Choisir des fichiers
                    </label>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {galleryFileCount > 0 ? `${galleryFileCount} fichier(s) sélectionné(s)` : 'Aucun fichier choisi'}
                    </span>
                  </div>
                </div>
                {uploadingGallery && <span className="text-xs text-gray-500">Upload...</span>}

                {galleryPreviewUrls.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Apercus locaux des fichiers selectionnes :</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {galleryPreviewUrls.map((previewUrl, index) => (
                        <img
                          key={`${previewUrl}-${index}`}
                          src={previewUrl}
                          alt={`Apercu local ${index + 1}`}
                          className="w-full h-24 object-cover rounded border border-gray-200 dark:border-gray-700"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {normalizeImages(formData.images).length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Aucune image dans la galerie.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {normalizeImages(formData.images).map((imageUrl, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded border border-gray-200 dark:border-gray-700">
                        <img
                          src={resolveMediaUrl(imageUrl) || imageUrl}
                          alt={`Galerie ${index + 1}`}
                          className="w-20 h-14 object-cover rounded"
                        />
                        <div className="flex-1 text-xs text-gray-500 dark:text-gray-400 break-all">
                          {imageUrl}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(index)}
                          className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                        >
                          Supprimer
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={!!formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  />
                  Publié
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={!!formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  />
                  Mis en avant
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {saving ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
