import type { Metadata } from 'next';
import LegalPageContent, { fetchLegalPage } from '@/components/legal/LegalPageContent';

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchLegalPage('cgv');
  return {
    title: page?.meta_title || 'Conditions Générales de Vente | MBC',
    description: page?.meta_description || "Conditions Générales de Vente applicables aux formations, paiements et prestations MBC.",
  };
}

export default async function CGVPage() {
  return (
    <LegalPageContent
      slug="cgv"
      fallbackTitle="Conditions Générales de Vente"
      fallbackSubtitle="Formations, devis, paiements et certificats"
    />
  );
}
