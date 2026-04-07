'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleSlug } from '@/lib/auth';
import { 
  ChevronDown, 
  Shield, 
  Users, 
  GraduationCap, 
  Building2, 
  HardHat,
  BookOpen
} from 'lucide-react';
import RoleSwitchModal from './RoleSwitchModal';

// Icons for each role
const roleIcons: Record<RoleSlug, React.ElementType> = {
  admin: Shield,
  secretaire: Users,
  formateur: BookOpen,
  chef_chantier: HardHat,
  apprenant: GraduationCap,
  client: Building2,
};

// Colors for each role
const roleColors: Record<RoleSlug, string> = {
  admin: 'text-red-700 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30',
  secretaire: 'text-purple-700 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-900/30',
  formateur: 'text-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-900/30',
  chef_chantier: 'text-amber-700 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/30',
  apprenant: 'text-blue-700 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/30',
  client: 'text-green-700 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/30',
};

interface RoleSwitcherProps {
  showAddRole?: boolean; // Kept for prop compatibility but unused in this modal version
}

export default function RoleSwitcher({ showAddRole = true }: RoleSwitcherProps) {
  const { user, getUserRoles, activeRole, isLoading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const roles = getUserRoles();

  if (!user || !activeRole) {
    return null;
  }

  const currentRole = roles.find(r => r.slug === activeRole);
  const CurrentIcon = roleIcons[activeRole] || Users;

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={isLoading}
          className={`
            w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl transition-all border-2
            ${roleColors[activeRole]}
            hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <div className="flex items-center gap-2">
            <CurrentIcon className="h-4 w-4" />
            <span className="text-sm font-bold truncate">
              {currentRole?.name || activeRole}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
      </div>

      {/* Role Switch Modal (Replaces the absolute dropdown) */}
      <RoleSwitchModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
