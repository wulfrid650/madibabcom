import { afterEach, describe, expect, it, vi } from 'vitest';

const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

async function loadMediaModule(apiUrl?: string) {
  if (apiUrl) {
    process.env.NEXT_PUBLIC_API_URL = apiUrl;
  } else {
    delete process.env.NEXT_PUBLIC_API_URL;
  }

  vi.resetModules();
  return import('@/lib/media');
}

afterEach(() => {
  if (originalApiUrl) {
    process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
  } else {
    delete process.env.NEXT_PUBLIC_API_URL;
  }

  vi.resetModules();
});

describe('resolveMediaUrl', () => {
  it('returns an empty string for empty values', async () => {
    const { resolveMediaUrl } = await loadMediaModule();

    expect(resolveMediaUrl()).toBe('');
    expect(resolveMediaUrl(null)).toBe('');
    expect(resolveMediaUrl('   ')).toBe('');
  });

  it('keeps external, data, and blob URLs untouched', async () => {
    const { resolveMediaUrl } = await loadMediaModule('https://api.mbc.test/api');

    expect(resolveMediaUrl('https://cdn.example.com/file.png')).toBe('https://cdn.example.com/file.png');
    expect(resolveMediaUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
    expect(resolveMediaUrl('blob:http://localhost/file')).toBe('blob:http://localhost/file');
  });

  it('resolves storage paths against the backend origin', async () => {
    const { resolveMediaUrl } = await loadMediaModule('https://api.mbc.test/api');

    expect(resolveMediaUrl('/storage/quotes/file.pdf')).toBe('https://api.mbc.test/storage/quotes/file.pdf');
    expect(resolveMediaUrl('storage/quotes/file.pdf')).toBe('https://api.mbc.test/storage/quotes/file.pdf');
    expect(resolveMediaUrl('quotes/file.pdf')).toBe('https://api.mbc.test/quotes/file.pdf');
  });

  it('rewrites legacy portfolio image paths to storage portfolio paths', async () => {
    const { resolveMediaUrl } = await loadMediaModule('https://api.mbc.test/api');

    expect(resolveMediaUrl('/images/portfolio/projet-1.jpg')).toBe('https://api.mbc.test/storage/portfolio/projet-1.jpg');
  });

  it('keeps application absolute paths untouched', async () => {
    const { resolveMediaUrl } = await loadMediaModule('https://api.mbc.test/api');

    expect(resolveMediaUrl('/images/logo.png')).toBe('/images/logo.png');
  });
});
