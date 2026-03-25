'use client';

import { useRequireRole } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Users, 
  ClipboardCheck, 
  Calendar,
  LogOut,
  Menu,
  X,
  GraduationCap
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import RoleSwitcher from '@/components/ui/RoleSwitcher';

const navigation = [
  { name: 'Tableau de bord', href: '/formateur/dashboard', icon: Home },
  { name: 'Mes Apprenants', href: '/formateur/apprenants', icon: Users },
  { name: 'Évaluations', href: '/formateur/evaluations', icon: ClipboardCheck },
  { name: 'Présences', href: '/formateur/presences', icon: Calendar },
];

export default function FormateurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use a generic role requirement or 'formateur' if the role system supports it. 
  // If 'formateur' isn't in role check types, it might fallback to 'chef_chantier' in this copied code 
  // but looking at earlier files, role is a string.
  // Although `useRequireRole` hook was seen in `chef-chantier/layout.tsx`.
  const { isLoading, isAuthorized, user } = useRequireRole('formateur'); // Assuming 'formateur' is the role string
  const { logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // While loading or unauthorized, handle accordingly
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Assuming useRequireRole handles redirection for unauthorized users, 
  // but we can also return null here to avoid flash
  if (!user) {
      return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar mobile */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-indigo-900 text-white">
          <div className="flex items-center justify-between h-16 px-4 border-b border-indigo-800">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-indigo-400" />
              <span className="text-xl font-bold">Formateur</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="text-white">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="mt-4 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-800 text-white'
                      : 'text-indigo-100 hover:bg-indigo-800 hover:text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-indigo-900 text-white">
          <div className="flex items-center h-16 px-4 border-b border-indigo-800">
            <GraduationCap className="h-8 w-8 text-indigo-400" />
            <span className="ml-2 text-xl font-bold">Formateur</span>
          </div>
          <nav className="flex-1 mt-4 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-800 text-white'
                      : 'text-indigo-100 hover:bg-indigo-800 hover:text-white'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-indigo-800">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-indigo-700 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.name?.charAt(0) || 'F'}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-indigo-300">Formateur</p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); logout(); }}
              className="flex items-center w-full px-4 py-2 text-sm text-indigo-100 hover:bg-indigo-800 rounded-lg"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex items-center justify-between h-16 bg-white shadow px-4">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="ml-4 flex items-center lg:hidden">
              <GraduationCap className="h-6 w-6 text-indigo-600" />
              <span className="ml-2 text-lg font-semibold text-gray-900">Formateur</span>
            </div>
          </div>
          
          {/* Role Switcher */}
          <div className="flex items-center">
            <RoleSwitcher />
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
