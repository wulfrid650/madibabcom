'use client';

import React, { useState, useEffect } from 'react';
import { useTestimonials } from '@/hooks/useApiData';
import { Testimonial } from '@/lib/api';

// Données de secours en cas d'erreur API
const fallbackTestimonials: Testimonial[] = [
  {
    id: 1,
    content: "Équipe professionnelle et réactive. Notre villa a été livrée dans les délais avec une finition impeccable.",
    author_name: "Jean-Pierre M.",
    author_role: "Propriétaire à Douala",
    rating: 5
  },
  {
    id: 2,
    content: "Excellent accompagnement du début à la fin. Je recommande MBC pour tout projet de construction.",
    author_name: "Marie K.",
    author_role: "Directrice d'entreprise",
    rating: 5
  },
  {
    id: 3,
    content: "Très satisfait des travaux de génie civil. Qualité et respect des normes au rendez-vous.",
    author_name: "Patrick L.",
    author_role: "Ingénieur civil",
    rating: 5
  },
];

export default function TestimonialCarousel() {
  const { testimonials: apiTestimonials, isLoading, error } = useTestimonials();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Utiliser les données API ou les données de secours
  const testimonials = apiTestimonials.length > 0 ? apiTestimonials : fallbackTestimonials;

  useEffect(() => {
    if (testimonials.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  // Affichage pendant le chargement
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 animate-pulse">
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <div key={star} className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div>
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <div className="relative max-w-3xl mx-auto">
      {/* Carousel Container */}
      <div className="overflow-hidden">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {testimonials.map((testimonial) => (
            <div 
              key={testimonial.id}
              className="w-full flex-shrink-0 px-4"
            >
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                {/* Stars - basé sur le rating */}
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg 
                      key={star} 
                      className={`w-5 h-5 ${star <= (testimonial.rating || 5) ? 'text-[#00B67A]' : 'text-gray-300'}`} 
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                    </svg>
                  ))}
                </div>
                {/* Quote */}
                <p className="text-gray-600 dark:text-gray-300 text-lg italic mb-6">
                  &quot;{testimonial.content}&quot;
                </p>
                {/* Author */}
                <div className="flex items-center gap-4">
                  {testimonial.author_image ? (
                    <img 
                      src={testimonial.author_image} 
                      alt={testimonial.author_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-madiba-red/10 flex items-center justify-center">
                      <span className="text-madiba-red font-bold text-lg">
                        {testimonial.author_name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-madiba-black dark:text-white">{testimonial.author_name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {testimonial.author_role}
                      {testimonial.author_company && ` - ${testimonial.author_company}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={goToPrev}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center text-madiba-black dark:text-white hover:bg-madiba-red hover:text-white transition-colors"
        aria-label="Précédent"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button 
        onClick={goToNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center text-madiba-black dark:text-white hover:bg-madiba-red hover:text-white transition-colors"
        aria-label="Suivant"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2 mt-6">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'bg-madiba-red w-6' 
                : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
            }`}
            aria-label={`Aller au témoignage ${index + 1}`}
          />
        ))}
      </div>

      {/* Trustpilot-style Badge */}
      <div className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-500 dark:text-gray-400">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#00B67A"/>
        </svg>
        <span>Avis vérifiés par MBC</span>
      </div>
    </div>
  );
}
