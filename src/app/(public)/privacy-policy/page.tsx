import type { Metadata } from 'next';
import LegalPageContent, { fetchLegalPage } from '@/components/legal/LegalPageContent';

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchLegalPage('privacy-policy');
  return {
    title: page?.meta_title || 'Politique de Confidentialité | MBC Construction',
    description: page?.meta_description || 'Politique de confidentialité de MBC Construction.',
  };
}

export default async function PrivacyPolicyPage() {
  return (
    <LegalPageContent
      slug="privacy-policy"
      fallbackTitle="Politique de Confidentialité"
      fallbackSubtitle="Dernière mise à jour"
    />
  );
}
