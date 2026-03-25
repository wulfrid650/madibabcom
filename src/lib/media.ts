const FALLBACK_API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8000/api';

function getApiOriginAndBasePath() {
  try {
    const parsed = new URL(FALLBACK_API_URL);
    const origin = parsed.origin;
    const cleanedPath = parsed.pathname.replace(/\/+$/, '');
    const basePath = cleanedPath.endsWith('/api')
      ? cleanedPath.slice(0, -4)
      : cleanedPath;

    return { origin, basePath };
  } catch {
    return { origin: 'http://localhost:8000', basePath: '' };
  }
}

export const DEFAULT_PORTFOLIO_IMAGE = '/images/hero-construction.jpg';

export function resolveMediaUrl(input?: string | null): string {
  if (!input || typeof input !== 'string') return '';

  const value = input.trim();
  if (!value) return '';

  if (value.startsWith('data:') || value.startsWith('blob:')) {
    return value;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const { origin, basePath } = getApiOriginAndBasePath();
  const appBase = `${origin}${basePath}`;

  if (value.startsWith('/storage/')) {
    return `${appBase}${value}`;
  }

  if (value.startsWith('storage/')) {
    return `${appBase}/${value}`;
  }

  // Legacy seeded values like /images/portfolio/file.jpg are now stored under /storage/portfolio.
  if (value.startsWith('/images/portfolio/')) {
    return `${appBase}/storage/portfolio/${value.split('/').pop()}`;
  }

  if (value.startsWith('/')) {
    return value;
  }

  return `${appBase}/${value}`;
}
