import type { Metadata } from 'next';
import LegalPageContent, { fetchLegalPage } from '@/components/legal/LegalPageContent';

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchLegalPage('privacy-policy');
  return {
    title: page?.meta_title || 'Politique de Confidentialité | MBC',
    description: page?.meta_description || 'Politique de confidentialité relative aux services numériques MBC.',
  };
}

export default async function PrivacyPolicyPage() {
  return (
    <LegalPageContent
      slug="privacy-policy"
      fallbackTitle="Politique de Confidentialité"
      fallbackSubtitle="Données personnelles, sécurité et cookies"
    />
  );
}
