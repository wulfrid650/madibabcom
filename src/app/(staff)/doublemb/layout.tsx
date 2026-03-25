'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import RoleSwitcher from '@/components/ui/RoleSwitcher';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Shield,
  Settings,
  GraduationCap,
  Building2,
  FileText,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ChevronRight,
  UserCog,
  Briefcase,
  CreditCard,
  BarChart3,
  Calendar,
  MessageSquare
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  children?: { name: string; href: string }[];
}

const navigation: NavItem[] = [
  {
    name: 'Tableau de bord',
    href: '/doublemb/dashboard',
    icon: LayoutDashboard
  },
  {
    name: 'Utilisateurs',
    href: '/doublemb/utilisateurs',
    icon: Users,
    children: [
      { name: 'Tous les utilisateurs', href: '/doublemb/utilisateurs' },
      { name: 'Administrateurs', href: '/doublemb/utilisateurs?role=admin' },
      { name: 'Employés', href: '/doublemb/utilisateurs?role=staff' },
      { name: 'Clients', href: '/doublemb/utilisateurs?role=client' },
      { name: 'Apprenants', href: '/doublemb/utilisateurs?role=apprenant' },
    ]
  },
  {
    name: 'Projets',
    href: '/doublemb/projets',
    icon: FolderKanban,
    children: [
      { name: 'Tous les projets', href: '/doublemb/projets' },
      { name: 'Portfolio public', href: '/doublemb/portfolio' },
      { name: 'En cours', href: '/doublemb/projets?status=en_cours' },
      { name: 'Terminés', href: '/doublemb/projets?status=termine' },
    ]
  },
  {
    name: 'Portfolio',
    href: '/doublemb/portfolio',
    icon: Briefcase
  },
  {
    name: 'Formations',
    href: '/doublemb/formations',
    icon: GraduationCap
  },
  {
    name: 'Entreprises',
    href: '/doublemb/entreprises',
    icon: Building2
  },
  {
    name: 'Paiements',
    href: '/doublemb/paiements',
    icon: CreditCard
  },
  {
    name: 'Rapports',
    href: '/doublemb/rapports',
    icon: BarChart3
  },
  {
    name: 'Rôles & Permissions',
    href: '/doublemb/roles',
    icon: Shield
  },
  {
    name: 'Paramètres',
    href: '/doublemb/settings',
    icon: Settings
  },
];

export default function AdminLayout({ children }: LayoutProps) {
  const { user, isLoading, logout, hasRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [notifications, setNotifications] = useState(3);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/connexion');
    } else if (!isLoading && user && !hasRole('admin')) {
      // Redirect non-admin users
      if (hasRole('secretaire')) {
        router.push('/secretaire/dashboard');
      } else if (hasRole('chef_chantier')) {
        router.push('/chef-chantier/dashboard');
      } else if (hasRole('apprenant')) {
        router.push('/apprenant/dashboard');
      } else if (hasRole('client')) {
        router.push('/client');
      } else {
        router.push('/');
      }
    }
  }, [user, isLoading, router, hasRole]);

  const toggleExpanded = (name: string) => {
    setExpandedItems(prev =>
      prev.includes(name)
        ? prev.filter(item => item !== name)
        : [...prev, name]
    );
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const isParentActive = (item: NavItem) => {
    if (isActive(item.href)) return true;
    if (item.children) {
      return item.children.some(child => isActive(child.href));
    }
    return false;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white dark:bg-gray-800 shadow-xl">
            <div className="flex h-16 items-center justify-between px-4 bg-gradient-to-r from-red-600 to-red-700">
              <span className="text-xl font-bold text-white">MBC Admin</span>
              <button onClick={() => setSidebarOpen(false)} className="text-white hover:text-red-200">
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
              {navigation.map((item) => (
                <div key={item.name}>
                  {item.children ? (
                    <>
                      <button
                        onClick={() => toggleExpanded(item.name)}
                        className={`w-full group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isParentActive(item)
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                      >
                        <div className="flex items-center">
                          <item.icon className="mr-3 h-5 w-5" />
                          {item.name}
                        </div>
                        {expandedItems.includes(item.name) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      {expandedItems.includes(item.name) && (
                        <div className="ml-8 mt-1 space-y-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setSidebarOpen(false)}
                              className={`block px-3 py-2 text-sm rounded-lg transition-colors ${isActive(child.href)
                                ? 'bg-red-600 text-white'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive(item.href)
                        ? 'bg-red-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center mb-3">
                <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{user.name}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Administrateur</p>
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <RoleSwitcher />
                <button
                  onClick={logout}
                  className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="flex h-16 items-center px-6 bg-gradient-to-r from-red-600 to-red-700">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-red-600 font-bold text-sm">MBC</span>
              </div>
              <span className="text-xl font-bold text-white">Administration</span>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {navigation.map((item) => (
              <div key={item.name}>
                {item.children ? (
                  <>
                    <button
                      onClick={() => toggleExpanded(item.name)}
                      className={`w-full group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isParentActive(item)
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                      <div className="flex items-center">
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </div>
                      {expandedItems.includes(item.name) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {expandedItems.includes(item.name) && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`block px-3 py-2 text-sm rounded-lg transition-colors ${isActive(child.href)
                              ? 'bg-red-600 text-white'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive(item.href)
                      ? 'bg-red-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* User section */}
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{user.name}</p>
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">Administrateur</p>
              </div>
            </div>
            <div className="mt-3 flex space-x-2">
              <RoleSwitcher />
              <button
                onClick={logout}
                className="flex-1 flex items-center justify-center px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex h-16 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden px-4 text-gray-500 hover:text-gray-900 dark:hover:text-white"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 justify-between px-4 lg:px-8">
            <div className="flex flex-1 items-center">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {navigation.find(item => isActive(item.href))?.name || 'Administration'}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              {/* Notifications */}
              <button
                onClick={() => alert("Fonctionnalité en cours de développement")}
                className="relative p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <span className="absolute top-0 right-0 h-5 w-5 flex items-center justify-center text-xs font-bold text-white bg-red-600 rounded-full">
                    {notifications}
                  </span>
                )}
              </button>

              {/* Quick actions */}
              <Link
                href="/doublemb/utilisateurs/nouveau"
                className="hidden sm:flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                <Users className="h-4 w-4 mr-2" />
                Nouvel utilisateur
              </Link>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
