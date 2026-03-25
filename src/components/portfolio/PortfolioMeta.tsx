import React from 'react';
import { PortfolioProject } from '@/types';

interface PortfolioMetaProps {
  project: PortfolioProject;
}

const PortfolioMeta: React.FC<PortfolioMetaProps> = ({ project }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-y border-gray-100 dark:border-gray-800 my-8">
      {project.client_name && (
        <div>
          <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Client</h4>
          <p className="font-medium text-gray-900 dark:text-white">{project.client_name}</p>
        </div>
      )}
      
      {project.location && (
        <div>
          <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Localisation</h4>
          <p className="font-medium text-gray-900 dark:text-white">{project.location}</p>
        </div>
      )}

      {project.completion_date && (
        <div>
           <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Année</h4>
           <p className="font-medium text-gray-900 dark:text-white">{new Date(project.completion_date).getFullYear()}</p>
        </div>
      )}

      <div>
          <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Catégorie</h4>
          <p className="font-medium text-gray-900 dark:text-white">{project.category}</p>
      </div>
    </div>
  );
};

export default PortfolioMeta;
