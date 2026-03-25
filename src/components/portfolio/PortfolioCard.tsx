import React from 'react';
import Link from 'next/link';
import { PortfolioProject } from '@/types';
import { DEFAULT_PORTFOLIO_IMAGE, resolveMediaUrl } from '@/lib/media';
// Card component not used directly in this implementation

// Custom implementation based on requirements
const PortfolioCard: React.FC<{ project: PortfolioProject }> = ({ project }) => {
  const coverImageUrl = resolveMediaUrl(project.cover_image) || DEFAULT_PORTFOLIO_IMAGE;

  return (
    <Link href={`/portfolio/${project.slug}`} className="group block h-full">
      <div className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-900 h-full flex flex-col border border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div className="aspect-video w-full relative bg-gray-100 dark:bg-gray-800 overflow-hidden">
             {/* Using standard img for now, opt for next/image with configured domain later */}
             <img 
                src={coverImageUrl}
                alt={project.title} 
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              />
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2">
             <span className="inline-block px-2 py-1 text-xs font-semibold bg-madiba-red/10 dark:bg-madiba-red/20 text-madiba-red rounded-full">
                {project.category}
             </span>
             {project.completion_date && (
                 <span className="text-xs text-gray-500 dark:text-gray-400">
                     {new Date(project.completion_date).getFullYear()}
                 </span>
             )}
          </div>
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-madiba-red transition-colors mb-1">
              {project.title}
          </h3>
          {project.location && (
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
               </svg>
               {project.location}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default PortfolioCard;
