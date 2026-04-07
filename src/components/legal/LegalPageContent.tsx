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
                className="prose prose-lg max-w-none leading-relaxed prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700 prose-strong:text-slate-900 prose-a:text-red-700 hover:prose-a:text-red-800 dark:prose-invert dark:prose-p:text-slate-300 dark:prose-li:text-slate-300 dark:prose-strong:text-white [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_p]:mb-5 [&_p]:leading-8 [&_ul]:my-6 [&_ul]:space-y-3 [&_ol]:my-6 [&_ol]:space-y-3 [&_li]:my-2 [&_li]:leading-8 [&_div.legal-block]:my-6 [&_div.legal-block]:rounded-2xl [&_div.legal-block]:border [&_div.legal-block]:border-slate-200 [&_div.legal-block]:bg-slate-50 [&_div.legal-block]:p-6 dark:[&_div.legal-block]:border-slate-700 dark:[&_div.legal-block]:bg-slate-900/40 [&_div.legal-note]:my-6 [&_div.legal-note]:rounded-2xl [&_div.legal-note]:border-l-4 [&_div.legal-note]:border-red-600 [&_div.legal-note]:bg-red-50 [&_div.legal-note]:px-5 [&_div.legal-note]:py-4 dark:[&_div.legal-note]:bg-red-950/30 [&_div.legal-table-wrap]:my-6 [&_div.legal-table-wrap]:overflow-x-auto [&_table]:w-full [&_table]:min-w-[560px] [&_table]:border-collapse [&_table]:overflow-hidden [&_table]:rounded-2xl [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-100 [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:text-sm [&_th]:font-semibold dark:[&_th]:border-slate-700 dark:[&_th]:bg-slate-800 [&_td]:border [&_td]:border-slate-200 [&_td]:px-4 [&_td]:py-3 [&_td]:align-top dark:[&_td]:border-slate-700"
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
              <Link href="/mentions-legales" className="text-madiba-red hover:underline font-medium">
                Mentions Légales
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
