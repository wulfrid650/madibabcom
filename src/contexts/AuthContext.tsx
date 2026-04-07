'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import auth, { User, AuthResponse, UserRole, RoleSlug, TwoFactorChallengePayload } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, recaptchaToken?: string, rememberMe?: boolean) => Promise<AuthResponse>;
  verifyTwoFactor: (code: string) => Promise<AuthResponse>;
  resendTwoFactorCode: () => Promise<AuthResponse>;
  getPendingTwoFactorChallenge: () => TwoFactorChallengePayload | null;
  clearPendingTwoFactorChallenge: () => void;
  logout: () => Promise<void>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    formation: string;
    roles?: ('apprenant' | 'client')[];
    company_name?: string;
    project_type?: string;
    recaptchaToken?: string;
  }) => Promise<{ success: boolean; message?: string; errors?: Record<string, string[]> }>;
  hasRole: (role: string | string[]) => boolean;
  hasStaffAccess: () => boolean;
  refreshUser: () => Promise<void>;
  // Multi-role features
  switchRole: (role: RoleSlug) => Promise<{ success: boolean; message?: string }>;
  getUserRoles: () => UserRole[];
  hasMultipleRoles: () => boolean;
  activeRole: RoleSlug | null;
  addRole: (role: 'apprenant' | 'client', data?: { formation?: string; company_name?: string; project_type?: string }) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Charger l'utilisateur au démarrage
  useEffect(() => {
    const initAuth = async () => {
      const currentUser = auth.getUser();
      const currentToken = auth.getToken();
      if (currentUser) {
        setUser(currentUser);
        setToken(currentToken);
        // Optionnel : vérifier avec l'API que le token est toujours valide
        // const freshUser = await auth.fetchUser();
        // if (freshUser) setUser(freshUser);
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (
    email: string,
    password: string,
    recaptchaToken?: string,
    rememberMe: boolean = false,
  ) => {
    setIsLoading(true);
    try {
      const result = await auth.login(email, password, recaptchaToken, rememberMe);
      if (result.success && result.user) {
        setUser(result.user);
        setToken(result.token || null);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyTwoFactor = async (code: string) => {
    setIsLoading(true);
    try {
      const result = await auth.verifyTwoFactor(code);
      if (result.success && result.user) {
        setUser(result.user);
        setToken(result.token || null);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const resendTwoFactorCode = async () => {
    setIsLoading(true);
    try {
      return await auth.resendTwoFactorCode();
    } finally {
      setIsLoading(false);
    }
  };

  const getPendingTwoFactorChallenge = useCallback(() => {
    const pending = auth.getPendingTwoFactorChallenge();
    if (!pending) {
      return null;
    }

    return {
      challenge_token: pending.challenge_token,
      expires_at: pending.expires_at ?? null,
      resend_available_at: pending.resend_available_at ?? null,
      retry_after_seconds: pending.retry_after_seconds ?? 0,
      remaining_resends: pending.remaining_resends ?? 0,
      send_count_last_hour: pending.send_count_last_hour ?? 0,
      cooldown_seconds: pending.cooldown_seconds ?? 0,
      email: pending.email,
    };
  }, []);

  const clearPendingTwoFactorChallenge = useCallback(() => {
    auth.clearPendingTwoFactorChallenge();
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      // Force cleanup in case auth.logout didn't finish
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mbc_auth_token');
        localStorage.removeItem('mbc_auth_user');
        // Force hard redirect to clear all states
        window.location.href = '/connexion';
      } else {
        router.push('/connexion');
      }
      setIsLoading(false);
    }
  }, [router]);

  const register = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    formation: string;
    recaptchaToken?: string;
  }) => {
    setIsLoading(true);
    try {
      const result = await auth.register(data);
      if (result.success && result.user) {
        setUser(result.user);
      }
      return { 
        success: result.success, 
        message: result.message,
        errors: result.errors 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const hasRole = useCallback((role: string | string[]): boolean => {
    if (!user) return false;
    
    // Check against active role first
    if (Array.isArray(role)) {
      if (role.includes(user.role)) return true;
      // Also check in all user roles
      return user.roles?.some(r => role.includes(r.slug)) ?? false;
    }
    
    // Single role check
    if (user.role === role) return true;
    return user.roles?.some(r => r.slug === role) ?? false;
  }, [user]);

  const hasStaffAccess = useCallback((): boolean => {
    return hasRole(['admin', 'secretaire', 'chef_chantier']);
  }, [hasRole]);

  // Multi-role: Switch active role
  const switchRole = useCallback(async (roleSlug: RoleSlug) => {
    if (!user) return { success: false, message: 'Non connecté' };
    
    // Check if user has this role
    if (!user.roles?.some(r => r.slug === roleSlug)) {
      return { success: false, message: 'Vous n\'avez pas ce rôle' };
    }

    setIsLoading(true);
    try {
      const result = await auth.switchRole(roleSlug);
      if (result.success && result.user) {
        setUser(result.user);
        // Redirect to appropriate dashboard
        const dashboardRoutes: Record<RoleSlug, string> = {
          admin: '/doublemb/dashboard',
          secretaire: '/secretaire/dashboard',
          formateur: '/formateur/dashboard',
          chef_chantier: '/chef-chantier/dashboard',
          apprenant: '/apprenant/dashboard',
          client: '/client',
        };
        window.location.href = dashboardRoutes[roleSlug] || '/';
      }
      return { success: result.success, message: result.message };
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Get all user roles
  const getUserRoles = useCallback((): UserRole[] => {
    return user?.roles ?? [];
  }, [user]);

  // Check if user has multiple roles
  const hasMultipleRoles = useCallback((): boolean => {
    return (user?.roles?.length ?? 0) > 1;
  }, [user]);

  // Get active role slug
  const activeRole = user?.role ?? null;

  // Add a new role to current user
  const addRole = useCallback(async (
    roleSlug: 'apprenant' | 'client',
    data?: { formation?: string; company_name?: string; project_type?: string }
  ) => {
    setIsLoading(true);
    try {
      const result = await auth.addRoleToSelf(roleSlug, data);
      if (result.success && result.user) {
        setUser(result.user);
      }
      return { success: result.success, message: result.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = async () => {
    const freshUser = await auth.fetchUser();
    if (freshUser) {
      setUser(freshUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        verifyTwoFactor,
        resendTwoFactorCode,
        getPendingTwoFactorChallenge,
        clearPendingTwoFactorChallenge,
        logout,
        register,
        hasRole,
        hasStaffAccess,
        refreshUser,
        // Multi-role
        switchRole,
        getUserRoles,
        hasMultipleRoles,
        activeRole,
        addRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook pour redirection basée sur le rôle
export function useRequireRole(allowedRoles: string | string[]) {
  const { user, isLoading, isAuthenticated, hasRole } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push('/connexion');
      return;
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    // Check if user has any of the allowed roles (including in multi-roles)
    const userHasRole = roles.some(role => hasRole(role));
    
    if (userHasRole) {
      setIsAuthorized(true);
    } else {
      // Rediriger vers la page appropriée selon le rôle actif
      const dashboardRoutes: Record<string, string> = {
        admin: '/doublemb/dashboard',
        secretaire: '/secretaire/dashboard',
        formateur: '/formateur/dashboard',
        chef_chantier: '/chef-chantier/dashboard',
        apprenant: '/apprenant/dashboard',
        client: '/client',
      };
      router.push(dashboardRoutes[user?.role || ''] || '/');
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, router, hasRole]);

  return { isLoading, isAuthorized, user };
}

export function useRedirectIfAuthenticated() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !user) {
      return;
    }

    const dashboardRoutes: Record<string, string> = {
      admin: '/doublemb/dashboard',
      secretaire: '/secretaire/dashboard',
      formateur: '/formateur/dashboard',
      chef_chantier: '/chef-chantier/dashboard',
      apprenant: '/apprenant/dashboard',
      client: '/client',
    };

    router.replace(dashboardRoutes[user.role] || '/');
  }, [isLoading, router, user]);

  return {
    isBlocking: isLoading || !!user,
  };
}
