'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ChantierForm from '@/components/chef-chantier/ChantierForm';
import { api, ChefChantierChantierPayload } from '@/lib/api';

const DEFAULT_VALUES: ChefChantierChantierPayload = {
  title: '',
  description: '',
  location: '',
  category: 'Construction',
  status: 'pending',
  progress: 0,
  start_date: '',
  expected_end_date: '',
  budget: '',
};

export default function NouveauChantierPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: ChefChantierChantierPayload) => {
    try {
      setSubmitting(true);
      setError(null);
      const response = await api.createChefChantierChantier(values);

      if (!response.success || !response.data?.id) {
        throw new Error(response.message || 'Impossible de créer le chantier.');
      }

      router.push(`/chef-chantier/chantiers/${response.data.id}`);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible de créer le chantier.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ChantierForm
      heading="Nouveau chantier"
      submitLabel="Créer le chantier"
      initialValues={DEFAULT_VALUES}
      submitting={submitting}
      error={error}
      onSubmit={handleSubmit}
      onCancel={() => router.push('/chef-chantier/chantiers')}
    />
  );
}
