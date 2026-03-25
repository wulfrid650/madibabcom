'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ChantierForm from '@/components/chef-chantier/ChantierForm';
import { api, ChefChantierChantierPayload, PortfolioProject } from '@/lib/api';

function formatDate(value?: string): string {
  if (!value) return '';
  return value.includes('T') ? value.split('T')[0] : value;
}

function mapProjectToFormValues(project: PortfolioProject): ChefChantierChantierPayload {
  return {
    title: project.title || '',
    description: project.description || '',
    location: project.location || '',
    category: project.category || 'Construction',
    status:
      project.status === 'in_progress' || project.status === 'completed' || project.status === 'on_hold' || project.status === 'pending'
        ? project.status
        : 'pending',
    progress: Number(project.progress || 0),
    start_date: formatDate(project.start_date),
    expected_end_date: formatDate(project.expected_end_date || project.completion_date),
    budget: typeof project.budget === 'number' ? String(project.budget) : project.budget || '',
  };
}

export default function ModifierChantierPage() {
  const params = useParams();
  const router = useRouter();
  const chantierId = useMemo(() => Number(params?.id), [params]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialValues, setInitialValues] = useState<ChefChantierChantierPayload>({
    title: '',
    status: 'pending',
    progress: 0,
  });

  useEffect(() => {
    const load = async () => {
      if (!chantierId || Number.isNaN(chantierId)) {
        setError('Identifiant du chantier invalide.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const project = await api.getChefChantierChantier(chantierId);
        setInitialValues(mapProjectToFormValues(project));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Impossible de charger le chantier.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [chantierId]);

  const handleSubmit = async (values: ChefChantierChantierPayload) => {
    try {
      setSubmitting(true);
      setError(null);
      await api.updateChefChantierChantier(chantierId, values);
      router.push(`/chef-chantier/chantiers/${chantierId}`);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible de mettre à jour ce chantier.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <ChantierForm
      heading="Modifier le chantier"
      submitLabel="Enregistrer les changements"
      initialValues={initialValues}
      submitting={submitting}
      error={error}
      onSubmit={handleSubmit}
      onCancel={() => router.push(`/chef-chantier/chantiers/${chantierId}`)}
    />
  );
}
