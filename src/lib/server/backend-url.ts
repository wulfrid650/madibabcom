const DEFAULT_SERVER_API_BASE_URL = 'http://localhost:8000/api';

export function resolveBackendApiBaseUrlFromEnv(): string {
  const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL
    || process.env.API_URL
    || DEFAULT_SERVER_API_BASE_URL;
  const trimmedBaseUrl = rawBaseUrl.trim().replace(/\/+$/, '');

  return trimmedBaseUrl.endsWith('/api') ? trimmedBaseUrl : `${trimmedBaseUrl}/api`;
}
