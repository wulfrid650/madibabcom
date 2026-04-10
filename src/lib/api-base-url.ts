const DEFAULT_LOCAL_API_BASE_URL = 'http://127.0.0.1:8000/api';

export function normalizeApiBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export function isLocalHostname(hostname: string): boolean {
  return hostname === 'localhost'
    || hostname === '127.0.0.1'
    || hostname.endsWith('.local');
}

export function getConfiguredApiBaseUrl(): string {
  return normalizeApiBaseUrl(
    process.env.NEXT_PUBLIC_API_URL
      || process.env.API_URL
      || DEFAULT_LOCAL_API_BASE_URL,
  );
}

export function getClientApiBaseUrl(): string {
  return getConfiguredApiBaseUrl();
}

export { DEFAULT_LOCAL_API_BASE_URL };
