'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getApprenantProfil, updateApprenantProfil, api } from '@/lib/api';

export default function ProfilPage() {
  const { token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    joinedDate: '',
  });
  const [originalData, setOriginalData] = useState(formData);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({
    current_password: '',
    password: '',
    password_confirmation: ''
  });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteForm, setDeleteForm] = useState({
    current_password: '',
    confirmation: '',
  });
  const [deleteMessage, setDeleteMessage] = useState({ type: '', text: '' });
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchProfil();
    }
  }, [token]);

  const fetchProfil = async () => {
    try {
      const response = await getApprenantProfil();
      if (response.success) {
        // Split name into first and last names
        const fullName = response.data?.name || '';
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const data = {
          firstName,
          lastName,
          email: response.data?.email || '',
          phone: response.data?.phone || '',
          address: response.data?.address || '',
          joinedDate: response.data?.created_at || response.data?.enrollment_date || '',
        };
        setFormData(data);
        setOriginalData(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateApprenantProfil({
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
      });
      setOriginalData(formData);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (passwords.password !== passwords.password_confirmation) {
      setPasswordMessage({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas.' });
      return;
    }

    setIsPasswordLoading(true);
    try {
      await api.updateProfile(passwords as any);
      setPasswordMessage({ type: 'success', text: 'Mot de passe mis à jour avec succès.' });
      setPasswords({ current_password: '', password: '', password_confirmation: '' });
      setTimeout(() => setShowPasswordModal(false), 2000);
    } catch (error: any) {
      setPasswordMessage({ type: 'error', text: error instanceof Error ? error.message : 'Erreur lors de la mise à jour.' });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const closeDeleteModal = () => {
    if (isDeleteLoading) return;
    setShowDeleteModal(false);
    setDeleteForm({ current_password: '', confirmation: '' });
    setDeleteMessage({ type: '', text: '' });
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteMessage({ type: '', text: '' });

    if (deleteForm.confirmation !== 'SUPPRIMER') {
      setDeleteMessage({ type: 'error', text: 'Veuillez saisir exactement SUPPRIMER pour confirmer.' });
      return;
    }

    setIsDeleteLoading(true);
    try {
      const result = await api.deleteCurrentAccount({
        current_password: deleteForm.current_password,
        confirmation: 'SUPPRIMER',
      });
      setDeleteMessage({ type: 'success', text: result.message });
      window.setTimeout(() => {
        window.location.href = '/connexion?account_deleted=true';
      }, 800);
    } catch (error) {
      setDeleteMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'La suppression du compte a échoué.',
      });
    } finally {
      setIsDeleteLoading(false);
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
      <div>
        <h1 className="text-2xl font-bold text-madiba-black dark:text-white">Mon Profil</h1>
        <p className="text-gray-600 dark:text-gray-400">Gérez vos informations personnelles</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header with avatar */}
        <div className="bg-gradient-to-r from-madiba-red to-red-700 p-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-3xl font-bold text-madiba-red">
              {formData.firstName.charAt(0)}{formData.lastName.charAt(0)}
            </div>
            <div className="text-white">
              <h2 className="text-2xl font-bold">{formData.firstName} {formData.lastName}</h2>
              <p className="text-red-200">
                Apprenant depuis le {formData.joinedDate ? new Date(formData.joinedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prénom
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-madiba-black dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-madiba-black dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-madiba-black dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-madiba-black dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Adresse
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-madiba-black dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(originalData);
                    setIsEditing(false);
                  }}
                  className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-madiba-black dark:text-white font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-madiba-red text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 bg-madiba-red text-white font-semibold rounded-lg hover:bg-red-700 transition-colors inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Modifier mes informations
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Security Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-madiba-black dark:text-white mb-4">Sécurité</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <p className="font-medium text-madiba-black dark:text-white">Mot de passe</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pour votre sécurité, changez votre mot de passe régulièrement.</p>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-madiba-black dark:text-white font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Modifier
            </button>
          </div>

          <div className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium text-madiba-black dark:text-white">Sessions actives</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">1 session active</p>
            </div>
            <button className="px-4 py-2 text-red-600 dark:text-red-400 font-medium hover:underline">
              Déconnecter partout
            </button>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-madiba-black dark:text-white mb-6">Changer le mot de passe</h3>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {passwordMessage.text && (
                <div className={`p-3 rounded-lg text-sm ${passwordMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {passwordMessage.text}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-madiba-black dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent outline-none"
                  value={passwords.current_password}
                  onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-madiba-black dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent outline-none"
                  value={passwords.password}
                  onChange={(e) => setPasswords({ ...passwords, password: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-madiba-black dark:text-white focus:ring-2 focus:ring-madiba-red focus:border-transparent outline-none"
                  value={passwords.password_confirmation}
                  onChange={(e) => setPasswords({ ...passwords, password_confirmation: e.target.value })}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPasswordLoading}
                  className="px-6 py-2 bg-madiba-red text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isPasswordLoading ? 'Mise à jour...' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-red-900 dark:text-red-200 mb-2">Zone dangereuse</h3>
        <p className="text-sm text-red-700 dark:text-red-300 mb-4">
          La suppression de votre compte est irréversible. Toutes vos données seront définitivement perdues.
        </p>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          Supprimer mon compte
        </button>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6 relative">
            <button
              onClick={closeDeleteModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-madiba-black dark:text-white mb-2">Supprimer mon compte</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Cette action est irréversible. Saisissez votre mot de passe puis tapez <span className="font-semibold text-red-600 dark:text-red-400">SUPPRIMER</span>.
            </p>

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              {deleteMessage.text && (
                <div className={`p-3 rounded-lg text-sm ${deleteMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {deleteMessage.text}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-madiba-black dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  value={deleteForm.current_password}
                  onChange={(e) => setDeleteForm({ ...deleteForm, current_password: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirmation
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-madiba-black dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  value={deleteForm.confirmation}
                  onChange={(e) => setDeleteForm({ ...deleteForm, confirmation: e.target.value.toUpperCase() })}
                  placeholder="SUPPRIMER"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isDeleteLoading}
                  className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isDeleteLoading ? 'Suppression...' : 'Confirmer la suppression'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
