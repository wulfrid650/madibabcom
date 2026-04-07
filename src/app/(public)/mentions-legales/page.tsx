import type { Metadata } from 'next';
import LegalPageContent, { fetchLegalPage } from '@/components/legal/LegalPageContent';

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchLegalPage('mentions-legales');
  return {
    title: page?.meta_title || 'Mentions Légales | MBC',
    description: page?.meta_description || 'Mentions légales de la plateforme MBC.',
  };
}

export default async function MentionsLegalesPage() {
  return (
    <LegalPageContent
      slug="mentions-legales"
      fallbackTitle="Mentions Légales"
      fallbackSubtitle="Informations légales et éditoriales"
    />
  );
}
