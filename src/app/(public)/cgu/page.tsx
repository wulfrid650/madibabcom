import type { Metadata } from 'next';
import LegalPageContent, { fetchLegalPage } from '@/components/legal/LegalPageContent';

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchLegalPage('cgu');
  return {
    title: page?.meta_title || "Conditions Générales d'Utilisation | MBC Construction",
    description: page?.meta_description || "Conditions Générales d'Utilisation de la plateforme MBC Construction.",
  };
}

export default async function CGUPage() {
  return (
    <LegalPageContent
      slug="cgu"
      fallbackTitle="Conditions Générales d'Utilisation"
      fallbackSubtitle="Plateforme MBC Construction"
    />
  );
}
