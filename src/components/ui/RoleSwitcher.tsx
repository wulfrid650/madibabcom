'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleSlug, UserRole } from '@/lib/auth';
import { 
  ChevronDown, 
  Check, 
  Shield, 
  Users, 
  GraduationCap, 
  Building2, 
  HardHat,
  BookOpen,
  Plus
} from 'lucide-react';
import AddRoleModal from './AddRoleModal';

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
  admin: 'text-red-600 bg-red-50 dark:bg-red-900/20',
  secretaire: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
  formateur: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20',
  chef_chantier: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  apprenant: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  client: 'text-green-600 bg-green-50 dark:bg-green-900/20',
};

interface RoleSwitcherProps {
  showAddRole?: boolean;
}

export default function RoleSwitcher({ showAddRole = true }: RoleSwitcherProps) {
  const { user, getUserRoles, hasMultipleRoles, switchRole, activeRole, isLoading, hasRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const roles = getUserRoles();
  const canAddMoreRoles = !hasRole('apprenant') || !hasRole('client');

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show button even with single role if can add more
  if (!user || !activeRole) {
    return null;
  }

  const currentRole = roles.find(r => r.slug === activeRole);
  const CurrentIcon = roleIcons[activeRole] || Users;

  const handleSwitchRole = async (roleSlug: RoleSlug) => {
    if (roleSlug === activeRole || switching) return;
    
    setSwitching(true);
    setIsOpen(false);
    
    try {
      await switchRole(roleSlug);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={switching || isLoading}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg transition-all
            ${roleColors[activeRole]}
            hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <CurrentIcon className="h-4 w-4" />
          <span className="text-sm font-medium hidden sm:inline">
            {currentRole?.name || activeRole}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {roles.length > 1 ? 'Changer de rôle' : 'Mon rôle'}
              </p>
            </div>
            
            {roles.map((role) => {
              const Icon = roleIcons[role.slug] || Users;
              const isActive = role.slug === activeRole;
              
              return (
                <button
                  key={role.slug}
                  onClick={() => handleSwitchRole(role.slug)}
                  disabled={isActive}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 text-left
                    ${isActive 
                      ? 'bg-gray-50 dark:bg-gray-700/50' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }
                    transition-colors
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded ${roleColors[role.slug]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {role.name}
                      </p>
                      {role.is_primary && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Rôle principal
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {isActive && (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                </button>
              );
            })}

            {/* Add role option */}
            {showAddRole && canAddMoreRoles && (
              <>
                <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowAddRoleModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="p-1.5 rounded bg-gray-100 dark:bg-gray-700">
                    <Plus className="h-4 w-4 text-gray-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ajouter un rôle
                  </span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Add Role Modal */}
      <AddRoleModal 
        isOpen={showAddRoleModal} 
        onClose={() => setShowAddRoleModal(false)} 
      />
    </>
  );
}
