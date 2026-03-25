'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  Shield,
  Building2,
  GraduationCap,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { createUser, CreateUserData } from '@/lib/admin-api';

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  roles: string[];
  is_active: boolean;
  // Client fields
  company_name: string;
  company_address: string;
  project_type: string;
  // Apprenant fields
  formation: string;
  // Staff fields
  employee_id: string;
  address: string;
  emergency_contact: string;
  emergency_phone: string;
  // Formateur fields
  speciality: string;
  bio: string;
}

const availableRoles = [
  { slug: 'admin', name: 'Administrateur', description: 'Accès complet à toutes les fonctionnalités', isStaff: true },
  { slug: 'secretaire', name: 'Secrétaire', description: 'Gestion des clients, paiements et apprenants', isStaff: true },
  { slug: 'chef_chantier', name: 'Chef de chantier', description: 'Gestion des chantiers et équipes', isStaff: true },
  { slug: 'formateur', name: 'Formateur', description: 'Gestion des formations et apprenants', isStaff: true },
  { slug: 'client', name: 'Client', description: 'Suivi des projets de construction', isStaff: false },
  { slug: 'apprenant', name: 'Apprenant', description: 'Accès aux formations', isStaff: false },
];

const formations = [
  'Maçonnerie de base',
  'Maçonnerie avancée',
  'Électricité bâtiment',
  'Plomberie',
  'Charpente et menuiserie',
  'Peinture et finition',
  'Carrelage et revêtement',
];

const projectTypes = [
  'Construction résidentielle',
  'Construction commerciale',
  'Rénovation',
  'Extension',
  'Aménagement intérieur',
];

export default function NewUserPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    roles: [],
    is_active: true,
    company_name: '',
    company_address: '',
    project_type: '',
    formation: '',
    employee_id: '',
    address: '',
    emergency_contact: '',
    emergency_phone: '',
    speciality: '',
    bio: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRoleToggle = (roleSlug: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(roleSlug)
        ? prev.roles.filter(r => r !== roleSlug)
        : [...prev.roles, roleSlug]
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Le téléphone est requis';
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (formData.roles.length === 0) {
      newErrors.roles = 'Au moins un rôle est requis';
    }

    // Conditional validations
    if (formData.roles.includes('client') && !formData.company_name) {
      newErrors.company_name = 'Le nom de l\'entreprise est requis pour un client';
    }

    if (formData.roles.includes('apprenant') && !formData.formation) {
      newErrors.formation = 'La formation est requise pour un apprenant';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);
    setErrors({});
    setSuccessMessage(null);

    try {
      // Prepare data for API
      const userData: CreateUserData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        roles: formData.roles,
        is_active: formData.is_active,
      };

      // Add optional fields based on selected roles
      if (formData.roles.includes('client')) {
        userData.company_name = formData.company_name;
        userData.company_address = formData.company_address;
        userData.project_type = formData.project_type;
      }

      if (formData.roles.includes('apprenant')) {
        userData.formation = formData.formation;
      }

      if (hasStaffRole) {
        userData.employee_id = formData.employee_id;
        userData.address = formData.address;
        userData.emergency_contact = formData.emergency_contact;
        userData.emergency_phone = formData.emergency_phone;
      }

      if (formData.roles.includes('formateur')) {
        userData.speciality = formData.speciality;
        userData.bio = formData.bio;
      }

      // Call API
      const response = await createUser(userData);

      if (response.success) {
        setSuccessMessage('Utilisateur créé avec succès !');
        // Redirect after a short delay
        setTimeout(() => {
          router.push('/doublemb/utilisateurs');
        }, 1500);
      } else {
        // Handle API validation errors
        const newErrors: Record<string, string> = {};

        // Map Laravel validation errors to form fields
        if ('errors' in response && response.errors) {
          const apiErrors = response.errors as Record<string, string[]>;
          Object.entries(apiErrors).forEach(([field, messages]) => {
            // Map API field names to form field names
            const fieldMap: Record<string, string> = {
              'email': 'email',
              'name': 'name',
              'phone': 'phone',
              'password': 'password',
              'roles': 'roles',
            };
            const formField = fieldMap[field] || field;
            newErrors[formField] = messages[0]; // Take first error message
          });
        }

        // Set general error message
        if (response.message) {
          newErrors.submit = response.message;
        } else if (Object.keys(newErrors).length === 0) {
          newErrors.submit = 'Une erreur est survenue lors de la création de l\'utilisateur';
        }

        setErrors(newErrors);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setErrors({ submit: 'Une erreur est survenue lors de la création de l\'utilisateur' });
    } finally {
      setIsLoading(false);
    }
  };

  const hasStaffRole = formData.roles.some(r =>
    ['admin', 'secretaire', 'chef_chantier', 'formateur'].includes(r)
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/doublemb/utilisateurs"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouvel utilisateur</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Créer un nouveau compte utilisateur</p>
          </div>
        </div>
      </div>

      {errors.submit && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
          <span className="text-red-800 dark:text-red-300">{errors.submit}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
          <span className="text-green-800 dark:text-green-300">{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <User className="h-5 w-5 mr-2 text-gray-500" />
            Informations de base
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom complet *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                placeholder="Jean Dupont"
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  placeholder="jean@example.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Téléphone *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  placeholder="699123456"
                />
              </div>
              {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Compte actif
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mot de passe *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 pr-10 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirmer le mot de passe *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                placeholder="••••••••"
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
            </div>
          </div>
        </div>

        {/* Roles */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Shield className="h-5 w-5 mr-2 text-gray-500" />
            Rôles et permissions
          </h2>
          {errors.roles && <p className="mb-4 text-sm text-red-500">{errors.roles}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableRoles.map((role) => (
              <div
                key={role.slug}
                onClick={() => handleRoleToggle(role.slug)}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${formData.roles.includes(role.slug)
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">{role.name}</span>
                  <input
                    type="checkbox"
                    checked={formData.roles.includes(role.slug)}
                    onChange={() => { }}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{role.description}</p>
                {role.isStaff && (
                  <span className="mt-2 inline-block text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400 px-2 py-1 rounded">
                    Staff
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Client Fields */}
        {formData.roles.includes('client') && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Building2 className="h-5 w-5 mr-2 text-gray-500" />
              Informations client
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom de l'entreprise *
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors.company_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  placeholder="Mon Entreprise SARL"
                />
                {errors.company_name && <p className="mt-1 text-sm text-red-500">{errors.company_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type de projet
                </label>
                <select
                  name="project_type"
                  value={formData.project_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Sélectionner...</option>
                  {projectTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Adresse de l'entreprise
                </label>
                <input
                  type="text"
                  name="company_address"
                  value={formData.company_address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="123 Rue Example, Douala"
                />
              </div>
            </div>
          </div>
        )}

        {/* Apprenant Fields */}
        {formData.roles.includes('apprenant') && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <GraduationCap className="h-5 w-5 mr-2 text-gray-500" />
              Informations apprenant
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Formation *
              </label>
              <select
                name="formation"
                value={formData.formation}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors.formation ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
              >
                <option value="">Sélectionner une formation...</option>
                {formations.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              {errors.formation && <p className="mt-1 text-sm text-red-500">{errors.formation}</p>}
            </div>
          </div>
        )}

        {/* Staff Fields */}
        {hasStaffRole && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-gray-500" />
              Informations employé
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ID Employé
                </label>
                <input
                  type="text"
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="EMP001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Adresse personnelle
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Adresse..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contact d'urgence
                </label>
                <input
                  type="text"
                  name="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Nom du contact"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Téléphone d'urgence
                </label>
                <input
                  type="tel"
                  name="emergency_phone"
                  value={formData.emergency_phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="699000000"
                />
              </div>
            </div>
          </div>
        )}

        {/* Formateur Fields */}
        {formData.roles.includes('formateur') && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <GraduationCap className="h-5 w-5 mr-2 text-gray-500" />
              Informations formateur
            </h2>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Spécialité
                </label>
                <input
                  type="text"
                  name="speciality"
                  value={formData.speciality}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Maçonnerie, Électricité..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Décrivez votre expérience et expertise..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-4">
          <Link
            href="/doublemb/utilisateurs"
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Création...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Créer l'utilisateur
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
