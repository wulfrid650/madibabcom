'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Shield, Lock } from 'lucide-react';
import { getUser, updateUser, type User as ApiUser } from '@/lib/admin-api';

type FormState = {
  name: string;
  email: string;
  phone: string;
  company_name: string;
  company_address: string;
  project_type: string;
  formation: string;
  employee_id: string;
  address: string;
  emergency_contact: string;
  emergency_phone: string;
  speciality: string;
  bio: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  name: '',
  email: '',
  phone: '',
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
  is_active: true,
};

export default function EditUserClient() {
  const params = useParams();
  const userId = params?.id as string | undefined;
  const router = useRouter();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await getUser(userId);
        if (response.success && response.data) {
          setUser(response.data);
          setForm({
            name: response.data.name || '',
            email: response.data.email || '',
            phone: response.data.phone || '',
            company_name: response.data.company_name || '',
            company_address: response.data.company_address || '',
            project_type: response.data.project_type || '',
            formation: response.data.formation || '',
            employee_id: response.data.employee_id || '',
            address: response.data.address || '',
            emergency_contact: response.data.emergency_contact || '',
            emergency_phone: response.data.emergency_phone || '',
            speciality: response.data.speciality || '',
            bio: response.data.bio || '',
            is_active: response.data.is_active,
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId) return;
    setIsSaving(true);

    try {
      const response = await updateUser(userId, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        company_name: form.company_name || undefined,
        company_address: form.company_address || undefined,
        project_type: form.project_type || undefined,
        formation: form.formation || undefined,
        employee_id: form.employee_id || undefined,
        address: form.address || undefined,
        emergency_contact: form.emergency_contact || undefined,
        emergency_phone: form.emergency_phone || undefined,
        speciality: form.speciality || undefined,
        bio: form.bio || undefined,
        is_active: form.is_active,
      });

      if (response.success) {
        alert('Utilisateur mis à jour avec succès');
        router.push(`/doublemb/utilisateurs/${userId}`);
      } else {
        alert(response.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-72 rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="h-[42rem] rounded-2xl bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-400">Utilisateur non trouvé</p>
        <button
          onClick={() => router.push('/doublemb/utilisateurs')}
          className="mt-4 inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Modifier l'utilisateur</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{user.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/doublemb/utilisateurs/${userId}`}
            className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <Shield className="mr-2 h-4 w-4" />
            Voir le profil
          </Link>
          <Link
            href={`/doublemb/utilisateurs/${userId}/roles`}
            className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <Lock className="mr-2 h-4 w-4" />
            Gérer les rôles
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Nom</label>
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Téléphone</label>
            <input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Identifiant employé</label>
            <input
              value={form.employee_id}
              onChange={(event) => setForm({ ...form, employee_id: event.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Entreprise</label>
            <input
              value={form.company_name}
              onChange={(event) => setForm({ ...form, company_name: event.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Formation</label>
            <input
              value={form.formation}
              onChange={(event) => setForm({ ...form, formation: event.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Spécialité</label>
            <input
              value={form.speciality}
              onChange={(event) => setForm({ ...form, speciality: event.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Adresse</label>
            <input
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Contact d'urgence</label>
            <input
              value={form.emergency_contact}
              onChange={(event) => setForm({ ...form, emergency_contact: event.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Téléphone d'urgence</label>
            <input
              value={form.emergency_phone}
              onChange={(event) => setForm({ ...form, emergency_phone: event.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Adresse complète</label>
          <input
            value={form.company_address}
            onChange={(event) => setForm({ ...form, company_address: event.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Type de projet</label>
          <input
            value={form.project_type}
            onChange={(event) => setForm({ ...form, project_type: event.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Biographie / note</label>
          <textarea
            value={form.bio}
            onChange={(event) => setForm({ ...form, bio: event.target.value })}
            rows={5}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <label className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
          Compte actif
        </label>

        <div className="flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-700">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}
