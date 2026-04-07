'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { RoleSlug, UserRole } from '@/lib/auth';
import { 
  X, 
  Shield, 
  Users, 
  GraduationCap, 
  Building2, 
  HardHat,
  BookOpen,
  Check,
  ChevronRight,
  UserCog,
  Briefcase,
  LayoutDashboard,
  ArrowRight
} from 'lucide-react';

interface RoleSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const roleIcons: Record<RoleSlug, React.ElementType> = {
  admin: Shield,
  secretaire: Users,
  formateur: BookOpen,
  chef_chantier: HardHat,
  apprenant: GraduationCap,
  client: Building2,
};

const roleColors: Record<RoleSlug, string> = {
  admin: 'text-red-600 bg-red-50 dark:bg-red-900/20',
  secretaire: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
  formateur: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20',
  chef_chantier: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  apprenant: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  client: 'text-green-600 bg-green-50 dark:bg-green-900/20',
};

export default function RoleSwitchModal({ isOpen, onClose }: RoleSwitchModalProps) {
  const { user, getUserRoles, switchRole, activeRole, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [switching, setSwitching] = useState(false);

  if (!isOpen || !user || !activeRole) return null;

  const roles = getUserRoles();
  const isAdmin = hasRole('admin');

  const handleSwitchRole = async (roleSlug: RoleSlug) => {
    if (roleSlug === activeRole || switching) return;
    
    setSwitching(true);
    try {
      await switchRole(roleSlug);
      onClose();
      // Logic for redirection after switch is usually handled in useAuth or page layouts
    } finally {
      setSwitching(false);
    }
  };

  const handleSwitchView = (path: string) => {
    onClose();
    router.push(path);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Changer de vue / Rôle</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sélectionnez l'interface que vous souhaitez utiliser</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Admin Special Views */}
          {isAdmin && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Vues Administrateur</h3>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => handleSwitchView('/doublemb/dashboard')}
                  className={`flex items-center p-4 rounded-xl border-2 transition-all text-left ${
                    pathname.startsWith('/doublemb') 
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/10' 
                    : 'border-gray-100 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-900/30'
                  }`}
                >
                  <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/40 mr-4 text-red-600">
                    <LayoutDashboard className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 dark:text-white">Tableau de bord Admin</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Gestion complète de la plateforme, utilisateurs et réglages.</p>
                  </div>
                  {pathname.startsWith('/doublemb') && <Check className="h-5 w-5 text-red-600 ml-2" />}
                </button>

                <button
                  onClick={() => handleSwitchView('/secretaire/dashboard')}
                  className={`flex items-center p-4 rounded-xl border-2 transition-all text-left ${
                    pathname.startsWith('/secretaire') 
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10' 
                    : 'border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-900/30'
                  }`}
                >
                  <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/40 mr-4 text-purple-600">
                    <UserCog className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 dark:text-white">Vue Secrétariat</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Gestion des demandes de devis, clients et devis opérationnels.</p>
                  </div>
                  {pathname.startsWith('/secretaire') && <Check className="h-5 w-5 text-purple-600 ml-2" />}
                </button>
              </div>
            </div>
          )}

          {/* User Roles List */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Changer de rôle actif</h3>
            <div className="grid grid-cols-1 gap-2">
              {roles.map((role) => {
                const Icon = roleIcons[role.slug] || Users;
                const isActive = role.slug === activeRole;
                
                return (
                  <button
                    key={role.slug}
                    onClick={() => handleSwitchRole(role.slug)}
                    disabled={isActive || switching}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all border ${
                      isActive 
                        ? 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-transparent hover:border-gray-100 dark:hover:border-gray-700'
                    } ${switching ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${roleColors[role.slug]}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                          {role.name}
                        </p>
                        {role.is_primary && (
                          <p className="text-[10px] text-blue-500 font-medium uppercase">Rôle principal</p>
                        )}
                      </div>
                    </div>
                    
                    {isActive ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Certaines modifications peuvent nécessiter un rechargement de la page.
          </p>
        </div>
      </div>
    </div>
  );
}
