import Link from 'next/link';

export interface LegalPageData {
  slug: string;
  title: string;
  subtitle?: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
  last_updated?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export async function fetchLegalPage(slug: string): Promise<LegalPageData | null> {
  try {
    const response = await fetch(`${API_URL}/public/legal/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data?.success || !data?.data) return null;
    return data.data as LegalPageData;
  } catch {
    return null;
  }
}

export default async function LegalPageContent({
  slug,
  fallbackTitle,
  fallbackSubtitle,
}: {
  slug: string;
  fallbackTitle: string;
  fallbackSubtitle?: string;
}) {
  const page = await fetchLegalPage(slug);
  const title = page?.title || fallbackTitle;
  const subtitle = page?.subtitle || fallbackSubtitle;
  const lastUpdated = page?.last_updated
    ? new Date(page.last_updated).toLocaleDateString('fr-FR')
    : null;

  return (
    <main className="pt-24 bg-white dark:bg-madiba-black min-h-screen">
      <section className="py-16 border-b border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-6 md:px-12">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold text-madiba-black dark:text-white mb-4">
              {title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {subtitle || 'Dernière mise à jour'}{lastUpdated ? ` : ${lastUpdated}` : ''}
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-6 md:px-12">
          <div className="max-w-4xl">
            {page?.content ? (
              <div
                className="prose prose-lg dark:prose-invert max-w-none leading-relaxed [&_h2]:mt-12 [&_h2]:mb-4 [&_h3]:mt-10 [&_h3]:mb-3 [&_p]:mb-6 [&_p]:leading-8 [&_ul]:my-6 [&_ul]:space-y-3 [&_ol]:my-6 [&_ol]:space-y-3 [&_li]:leading-8 [&_li]:my-2"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
            ) : (
              <div className="text-gray-600 dark:text-gray-400">
                Le contenu de cette page n&apos;est pas encore disponible.
              </div>
            )}
          </div>

          <div className="max-w-4xl mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
            <p className="text-gray-600 dark:text-gray-400 mb-4">Voir aussi :</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/cgu" className="text-madiba-red hover:underline font-medium">
                Conditions Générales d&apos;Utilisation
              </Link>
              <Link href="/cgv" className="text-madiba-red hover:underline font-medium">
                Conditions Générales de Vente
              </Link>
              <Link href="/privacy-policy" className="text-madiba-red hover:underline font-medium">
                Politique de Confidentialité
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
