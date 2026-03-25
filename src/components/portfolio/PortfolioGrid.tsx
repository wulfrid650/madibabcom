import React from 'react';
import { PortfolioProject } from '@/types';
import PortfolioCard from './PortfolioCard';

interface PortfolioGridProps {
  projects: PortfolioProject[];
}

const PortfolioGrid: React.FC<PortfolioGridProps> = ({ projects }) => {
  if (!projects || projects.length === 0) {
    return (
        <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Aucun projet trouvé.</p>
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {projects.map((project) => (
        <PortfolioCard key={project.id} project={project} />
      ))}
    </div>
  );
};

export default PortfolioGrid;
