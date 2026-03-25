'use client';

import { useRequireRole } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  FolderKanban,
  Camera,
  FileText,
  Users,
  MessageSquare,
  LogOut,
  Menu,
  X,
  HardHat
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import RoleSwitcher from '@/components/ui/RoleSwitcher';

const navigation = [
  { name: 'Tableau de bord', href: '/chef-chantier/dashboard', icon: Home },
  { name: 'Mes chantiers', href: '/chef-chantier/chantiers', icon: FolderKanban },
  { name: 'Avancements', href: '/chef-chantier/avancements', icon: Camera },
  { name: 'Équipes', href: '/chef-chantier/equipes', icon: Users },
  { name: 'Rapports', href: '/chef-chantier/rapports', icon: FileText },
  { name: 'Messages', href: '/chef-chantier/messages', icon: MessageSquare },
];

export default function ChefChantierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthorized, user } = useRequireRole('chef_chantier');
  const { logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar mobile */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-amber-900 text-white">
          <div className="flex items-center justify-between h-16 px-4 border-b border-amber-800">
            <div className="flex items-center space-x-2">
              <HardHat className="h-8 w-8 text-amber-400" />
              <span className="text-xl font-bold">Chef Chantier</span>
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
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
                      ? 'bg-amber-800 text-white'
                      : 'text-amber-100 hover:bg-amber-800 hover:text-white'
                    }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-amber-800">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-amber-700 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.name?.charAt(0) || 'C'}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-amber-300">Chef de chantier</p>
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <RoleSwitcher />
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); logout(); }}
                className="flex items-center justify-center w-full px-4 py-2 text-sm text-amber-100 hover:bg-amber-800 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-amber-900 text-white">
          <div className="flex items-center h-16 px-4 border-b border-amber-800">
            <HardHat className="h-8 w-8 text-amber-400" />
            <span className="ml-2 text-xl font-bold">Chef Chantier</span>
          </div>
          <nav className="flex-1 mt-4 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
                      ? 'bg-amber-800 text-white'
                      : 'text-amber-100 hover:bg-amber-800 hover:text-white'
                    }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-amber-800">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-amber-700 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.name?.charAt(0) || 'C'}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-amber-300">Chef de chantier</p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); logout(); }}
              className="flex items-center w-full px-4 py-2 text-sm text-amber-100 hover:bg-amber-800 rounded-lg"
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
              <HardHat className="h-6 w-6 text-amber-600" />
              <span className="ml-2 text-lg font-semibold text-gray-900">Chef Chantier</span>
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
