'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { DEFAULT_PORTFOLIO_IMAGE, resolveMediaUrl } from '@/lib/media';

interface PortfolioGalleryProps {
  images?: string[] | string;
}

const PortfolioGallery: React.FC<PortfolioGalleryProps> = ({ images }) => {
  // Parse images if it's a JSON string
  let imageArray: string[] = [];
  
  if (images) {
    if (typeof images === 'string') {
      try {
        imageArray = JSON.parse(images);
      } catch {
        // If parsing fails, treat as single image or empty
        imageArray = images ? [images] : [];
      }
    } else if (Array.isArray(images)) {
      imageArray = images;
    }
  }

  const resolvedImages = useMemo(
    () => imageArray.map((img) => resolveMediaUrl(img) || DEFAULT_PORTFOLIO_IMAGE),
    [imageArray]
  );

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (activeIndex === null) return;
      if (event.key === 'Escape') setActiveIndex(null);
      if (event.key === 'ArrowRight') {
        setActiveIndex((prev) => (prev === null ? 0 : (prev + 1) % resolvedImages.length));
      }
      if (event.key === 'ArrowLeft') {
        setActiveIndex((prev) =>
          prev === null ? 0 : (prev - 1 + resolvedImages.length) % resolvedImages.length
        );
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, resolvedImages.length]);

  if (resolvedImages.length === 0) {
    return null;
  }

  return (
    <div className="my-12">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Galerie Photos</h2>
      {/* 
        Note: To implement "Before/After" separation, the images prop needs to be 
        structured objects (e.g., { url: string, type: 'before' | 'after' }[]).
        For now, we display all images in a responsive grid. 
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resolvedImages.map((img, idx) => (
          <div key={idx} className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
            <button
              type="button"
              onClick={() => setActiveIndex(idx)}
              className="block w-full h-full"
              aria-label={`Ouvrir l'image ${idx + 1} en grand format`}
            >
              <img
                src={img}
                alt={`Project image ${idx + 1}`}
                className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </button>
          </div>
        ))}
      </div>

      {activeIndex !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu image"
          onClick={() => setActiveIndex(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white text-sm px-3 py-2 rounded bg-white/10 hover:bg-white/20"
            onClick={() => setActiveIndex(null)}
            aria-label="Fermer l'aperçu"
          >
            Fermer
          </button>

          {resolvedImages.length > 1 && (
            <>
              <button
                type="button"
                className="absolute left-3 md:left-6 text-white text-2xl px-3 py-2 rounded bg-white/10 hover:bg-white/20"
                onClick={(event) => {
                  event.stopPropagation();
                  setActiveIndex((prev) =>
                    prev === null ? 0 : (prev - 1 + resolvedImages.length) % resolvedImages.length
                  );
                }}
                aria-label="Image précédente"
              >
                ‹
              </button>
              <button
                type="button"
                className="absolute right-3 md:right-6 text-white text-2xl px-3 py-2 rounded bg-white/10 hover:bg-white/20"
                onClick={(event) => {
                  event.stopPropagation();
                  setActiveIndex((prev) => (prev === null ? 0 : (prev + 1) % resolvedImages.length));
                }}
                aria-label="Image suivante"
              >
                ›
              </button>
            </>
          )}

          <img
            src={resolvedImages[activeIndex]}
            alt={`Project image ${activeIndex + 1}`}
            className="max-h-[90vh] max-w-[95vw] object-contain rounded-lg"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default PortfolioGallery;
