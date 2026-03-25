import type { Metadata } from 'next';
import LegalPageContent, { fetchLegalPage } from '@/components/legal/LegalPageContent';

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchLegalPage('cgv');
  return {
    title: page?.meta_title || 'Conditions Générales de Vente | MBC Formation',
    description: page?.meta_description || "Conditions Générales de Vente applicables aux formations MBC Construction.",
  };
}

export default async function CGVPage() {
  return (
    <LegalPageContent
      slug="cgv"
      fallbackTitle="Conditions Générales de Vente"
      fallbackSubtitle="Centre de Formation MBC"
    />
  );
}
