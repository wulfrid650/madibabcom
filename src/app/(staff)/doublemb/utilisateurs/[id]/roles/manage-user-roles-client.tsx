'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, Shield } from 'lucide-react';
import { getRoles, getUser, updateUser, type Role, type User } from '@/lib/admin-api';

export default function ManageUserRolesClient() {
  const params = useParams();
  const userId = params?.id as string | undefined;
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        setError('Identifiant utilisateur invalide.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [userResponse, rolesResponse] = await Promise.all([getUser(userId), getRoles()]);

        if (!userResponse.success || !userResponse.data) {
          setUser(null);
          setError(userResponse.message || 'Utilisateur non trouvé.');
          return;
        }

        setUser(userResponse.data);
        setSelectedRoles(userResponse.data.roles.map((role) => role.slug));

        if (rolesResponse.success && rolesResponse.data) {
          setRoles(rolesResponse.data);
        } else {
          setRoles([]);
          setError(rolesResponse.message || 'Impossible de charger les rôles.');
        }
      } catch (fetchError) {
        console.error('Error loading roles page:', fetchError);
        setUser(null);
        setRoles([]);
        setError('Impossible de charger les données utilisateur.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [userId]);

  const hasChanges = useMemo(() => {
    if (!user) return false;
    const current = [...user.roles.map((role) => role.slug)].sort().join('|');
    const next = [...selectedRoles].sort().join('|');
    return current !== next;
  }, [selectedRoles, user]);

  const toggleRole = (slug: string) => {
    setSelectedRoles((previous) =>
      previous.includes(slug)
        ? previous.filter((roleSlug) => roleSlug !== slug)
        : [...previous, slug]
    );
  };

  const handleSave = async () => {
    if (!userId) return;
    if (selectedRoles.length === 0) {
      setError('Au moins un rôle doit rester assigné.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await updateUser(userId, { roles: selectedRoles });
      if (!response.success || !response.data) {
        setError(response.message || 'Impossible de mettre à jour les rôles.');
        return;
      }

      setUser(response.data);
      setSelectedRoles(response.data.roles.map((role) => role.slug));
      router.push(`/doublemb/utilisateurs/${userId}`);
    } catch (saveError) {
      console.error('Error saving roles:', saveError);
      setError('Impossible de mettre à jour les rôles.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-400">{error || 'Utilisateur non trouvé'}</p>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gérer les rôles</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{user.name}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link
            href={`/doublemb/utilisateurs/${user.id}`}
            className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <Shield className="mr-2 h-4 w-4" />
            Voir le profil
          </Link>
          <Link
            href={`/doublemb/utilisateurs/${user.id}/modifier`}
            className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Modifier
          </Link>
        </div>

        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Rôles disponibles</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Coche les rôles à affecter à cet utilisateur.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {roles.map((role) => {
            const checked = selectedRoles.includes(role.slug);

            return (
              <label
                key={role.id}
                className={`rounded-xl border p-4 transition-colors ${
                  checked
                    ? 'border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-900/20'
                    : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleRole(role.slug)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{role.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{role.slug}</div>
                    {role.description && (
                      <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">{role.description}</div>
                    )}
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-700">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
