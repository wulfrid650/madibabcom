// Configuration de l'authentification côté client
// Se connecte à l'API Laravel

import { getClientApiBaseUrl } from './api-base-url';

const API_URL = getClientApiBaseUrl();
const AUTH_REQUEST_TIMEOUT_MS = 10000;

export type RoleSlug = 'admin' | 'secretaire' | 'apprenant' | 'client' | 'chef_chantier' | 'formateur';

export interface UserRole {
  slug: RoleSlug;
  name: string;
  is_primary: boolean;
  is_staff: boolean;
}

export interface ActiveRole {
  slug: RoleSlug;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: RoleSlug; // Active role slug
  roles: UserRole[]; // All user roles
  phone?: string;
  formation?: string;
  project_id?: string;
  speciality?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  errors?: Record<string, string[]>;
  requires_two_factor?: boolean;
  retry_after_seconds?: number;
  two_factor?: TwoFactorChallengePayload;
}

export interface TwoFactorChallengePayload {
  challenge_token: string;
  expires_at?: string | null;
  resend_available_at?: string | null;
  retry_after_seconds?: number;
  remaining_resends?: number;
  send_count_last_hour?: number;
  cooldown_seconds?: number;
  email?: string;
}

interface PendingTwoFactorChallenge {
  email: string;
  challenge_token: string;
  remember_me: boolean;
  expires_at?: string | null;
  resend_available_at?: string | null;
  retry_after_seconds?: number;
  remaining_resends?: number;
  send_count_last_hour?: number;
  cooldown_seconds?: number;
}

// Stockage du token
const TOKEN_KEY = 'mbc_auth_token';
const USER_KEY = 'mbc_auth_user';
const LEGACY_TOKEN_KEYS = ['auth_token', 'token'];
const LEGACY_USER_KEYS = ['user', 'mbc_user_data'];
const TWO_FACTOR_KEY = 'mbc_pending_two_factor';

function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;

  [TOKEN_KEY, ...LEGACY_TOKEN_KEYS].forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });

  [USER_KEY, ...LEGACY_USER_KEYS].forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });

  localStorage.removeItem(TWO_FACTOR_KEY);
  sessionStorage.removeItem(TWO_FACTOR_KEY);
}

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AUTH_REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function normalizeBackendUser(user: unknown): User {
  const normalized = { ...(user as Record<string, unknown>) } as any;

  if (normalized.active_role && typeof normalized.active_role === 'object') {
    normalized.role = normalized.active_role.slug;
  } else if (!normalized.role && Array.isArray(normalized.roles) && normalized.roles.length > 0) {
    normalized.role = normalized.roles[0].slug;
  }

  return normalized as User;
}

function persistAuthenticatedSession(user: User, token: string): void {
  clearAuthStorage();

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));

  LEGACY_TOKEN_KEYS.forEach((key) => {
    localStorage.setItem(key, token);
    sessionStorage.setItem(key, token);
  });

  LEGACY_USER_KEYS.forEach((key) => {
    localStorage.setItem(key, JSON.stringify(user));
    sessionStorage.setItem(key, JSON.stringify(user));
  });
}

function savePendingTwoFactorChallenge(payload: PendingTwoFactorChallenge): void {
  if (typeof window === 'undefined') return;
  const serialized = JSON.stringify(payload);
  sessionStorage.setItem(TWO_FACTOR_KEY, serialized);
  localStorage.setItem(TWO_FACTOR_KEY, serialized);
}

function getPendingTwoFactorChallenge(): PendingTwoFactorChallenge | null {
  if (typeof window === 'undefined') return null;

  const stored = sessionStorage.getItem(TWO_FACTOR_KEY) || localStorage.getItem(TWO_FACTOR_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as PendingTwoFactorChallenge;
  } catch {
    sessionStorage.removeItem(TWO_FACTOR_KEY);
    localStorage.removeItem(TWO_FACTOR_KEY);
    return null;
  }
}

function clearPendingTwoFactorChallenge(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(TWO_FACTOR_KEY);
  localStorage.removeItem(TWO_FACTOR_KEY);
}

function toPendingTwoFactorChallenge(
  email: string,
  rememberMe: boolean,
  payload?: TwoFactorChallengePayload | null,
): PendingTwoFactorChallenge | null {
  if (!payload?.challenge_token) {
    return null;
  }

  return {
    email,
    remember_me: rememberMe,
    challenge_token: payload.challenge_token,
    expires_at: payload.expires_at ?? null,
    resend_available_at: payload.resend_available_at ?? null,
    retry_after_seconds: payload.retry_after_seconds ?? 0,
    remaining_resends: payload.remaining_resends ?? 0,
    send_count_last_hour: payload.send_count_last_hour ?? 0,
    cooldown_seconds: payload.cooldown_seconds ?? 0,
  };
}

export const auth = {
  // Connexion
  async login(
    email: string,
    password: string,
    recaptchaToken?: string,
    rememberMe: boolean = false,
  ): Promise<AuthResponse> {
    try {
      const response = await fetchWithTimeout(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          ...(recaptchaToken ? { recaptcha_token: recaptchaToken } : {}),
        }),
      });

      const data = await response.json();

      if (data.success && data.requires_two_factor && data.two_factor) {
        clearAuthStorage();
        const pendingChallenge = toPendingTwoFactorChallenge(email, rememberMe, data.two_factor);

        if (!pendingChallenge) {
          return { success: false, message: 'Le challenge de vérification est invalide.' };
        }

        savePendingTwoFactorChallenge(pendingChallenge);

        return {
          success: true,
          requires_two_factor: true,
          message: data.message || 'Un code de vérification a été envoyé par email.',
          retry_after_seconds: data.retry_after_seconds ?? data.two_factor.retry_after_seconds,
          two_factor: {
            ...data.two_factor,
            email: pendingChallenge.email,
          },
        };
      }

      if (data.success && data.token) {
        const user = normalizeBackendUser(data.user);
        persistAuthenticatedSession(user, data.token);
        
        console.log('✅ Login successful:', { email: user.email, name: user.name, role: user.role });
        
        return { success: true, user: user, token: data.token };
      }

      return { success: false, message: data.message || 'Identifiants incorrects' };
    } catch (error) {
      if ((error as Error).name !== 'AbortError') console.error('Erreur de connexion:', error);
      return { success: false, message: 'Erreur de connexion au serveur. Vérifiez que le serveur API est démarré.' };
    }
  },

  // Inscription
  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    formation: string;
    recaptchaToken?: string;
  }): Promise<AuthResponse> {
    try {
      const response = await fetchWithTimeout(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          phone: data.phone,
          password: data.password,
          password_confirmation: data.password,
          role: 'apprenant',
          formation: data.formation,
          ...(data.recaptchaToken ? { recaptcha_token: data.recaptchaToken } : {}),
        }),
      });

      const result = await response.json();

      if (result.success && result.token) {
        const user = normalizeBackendUser(result.user);
        persistAuthenticatedSession(user, result.token);
        
        console.log('✅ Registration successful:', { email: user.email, name: user.name, role: user.role });
        
        return { success: true, user: user, token: result.token };
      }

      return {
        success: false,
        message: result.message || 'Erreur lors de l\'inscription',
        errors: result.errors
      };
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      return { success: false, message: 'Erreur de connexion au serveur' };
    }
  },

  async verifyTwoFactor(code: string): Promise<AuthResponse> {
    const pendingChallenge = getPendingTwoFactorChallenge();

    if (!pendingChallenge) {
      return {
        success: false,
        message: 'La vérification a expiré. Veuillez relancer la connexion.',
      };
    }

    try {
      const response = await fetchWithTimeout(`${API_URL}/auth/two-factor/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          challenge_token: pendingChallenge.challenge_token,
          code,
          remember_me: pendingChallenge.remember_me,
        }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        const user = normalizeBackendUser(data.user);
        persistAuthenticatedSession(user, data.token);
        clearPendingTwoFactorChallenge();

        return {
          success: true,
          user,
          token: data.token,
          message: data.message,
        };
      }

      if (response.status === 422 && typeof data.message === 'string' && data.message.includes('relancer la connexion')) {
        clearPendingTwoFactorChallenge();
      }

      return {
        success: false,
        message: data.message || 'Code de vérification invalide.',
        errors: data.errors,
      };
    } catch (error: any) {
      if (error.name !== 'AbortError') console.error('Erreur de vérification 2FA:', error);
      return { success: false, message: 'Erreur de connexion au serveur. Vérifiez que le serveur API est démarré.' };
    }
  },

  async resendTwoFactorCode(): Promise<AuthResponse> {
    const pendingChallenge = getPendingTwoFactorChallenge();

    if (!pendingChallenge) {
      return {
        success: false,
        message: 'Aucun challenge 2FA en attente.',
      };
    }

    try {
      const response = await fetchWithTimeout(`${API_URL}/auth/two-factor/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          challenge_token: pendingChallenge.challenge_token,
        }),
      });

      const data = await response.json();

      if (data.success && data.two_factor) {
        const nextPendingChallenge = toPendingTwoFactorChallenge(
          pendingChallenge.email,
          pendingChallenge.remember_me,
          data.two_factor,
        );

        if (nextPendingChallenge) {
          savePendingTwoFactorChallenge(nextPendingChallenge);
        }

        return {
          success: true,
          requires_two_factor: true,
          message: data.message || 'Un nouveau code a été envoyé.',
          retry_after_seconds: data.retry_after_seconds ?? data.two_factor.retry_after_seconds,
          two_factor: {
            ...data.two_factor,
            email: pendingChallenge.email,
          },
        };
      }

      return {
        success: false,
        message: data.message || 'Impossible de renvoyer le code.',
        errors: data.errors,
        retry_after_seconds: data.retry_after_seconds,
      };
    } catch (error: any) {
      if (error.name !== 'AbortError') console.error('Erreur de renvoi 2FA:', error);
      return { success: false, message: 'Erreur de connexion au serveur. Vérifiez que le serveur API est démarré.' };
    }
  },

  // Déconnexion
  async logout(): Promise<void> {
    const token = this.getToken();

    if (token) {
      try {
        await fetchWithTimeout(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
        });
      } catch (error: any) {
        if (error.name !== 'AbortError') console.error('Erreur lors de la déconnexion:', error);
      }
    }

    clearAuthStorage();
    
    console.log('✅ Logout successful - all data cleared');
  },

  // Récupérer l'utilisateur connecté
  getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  // Récupérer le token
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getUser();
  },

  // Headers d'authentification pour les requêtes API
  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  },

  // Vérifier le rôle de l'utilisateur
  hasRole(role: string | string[]): boolean {
    const user = this.getUser();
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
  },

  // Get all user roles
  getUserRoles(): UserRole[] {
    const user = this.getUser();
    return user?.roles ?? [];
  },

  // Check if user has multiple roles
  hasMultipleRoles(): boolean {
    const user = this.getUser();
    return (user?.roles?.length ?? 0) > 1;
  },

  // Switch active role
  async switchRole(roleSlug: RoleSlug): Promise<AuthResponse> {
    try {
      const response = await fetchWithTimeout(`${API_URL}/auth/switch-role`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ role: roleSlug }),
      });

      const data = await response.json();

      if (data.success && data.user) {
        // Update stored user
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return { success: true, user: data.user };
      }

      return { success: false, message: data.message || 'Impossible de changer de rôle' };
    } catch (error) {
      console.error('Erreur lors du changement de rôle:', error);
      return { success: false, message: 'Erreur de connexion au serveur' };
    }
  },

  // Vérifier si l'utilisateur a accès au staff (admin ou secrétaire)
  hasStaffAccess(): boolean {
    return this.hasRole(['admin', 'secretaire']);
  },

  // Récupérer les infos utilisateur depuis l'API
  async fetchUser(): Promise<User | null> {
    try {
      const response = await fetchWithTimeout(`${API_URL}/auth/me`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        this.logout();
        return null;
      }

      const data = await response.json();
      if (data.success && data.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return data.user;
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      return null;
    }
  },

  // Add a new role to current user (self-service: apprenant or client only)
  async addRoleToSelf(roleSlug: 'apprenant' | 'client', data?: {
    formation?: string;
    company_name?: string;
    company_address?: string;
    project_type?: string;
    project_description?: string;
  }): Promise<AuthResponse> {
    try {
      const response = await fetchWithTimeout(`${API_URL}/auth/add-role`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ role: roleSlug, ...data }),
      });

      const result = await response.json();

      if (result.success && result.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(result.user));
        return { success: true, user: result.user, message: result.message };
      }

      return { success: false, message: result.message || 'Impossible d\'ajouter ce rôle' };
    } catch (error) {
      console.error('Erreur lors de l\'ajout du rôle:', error);
      return { success: false, message: 'Erreur de connexion au serveur' };
    }
  },

  getPendingTwoFactorChallenge(): PendingTwoFactorChallenge | null {
    return getPendingTwoFactorChallenge();
  },

  clearPendingTwoFactorChallenge(): void {
    clearPendingTwoFactorChallenge();
  },
};

export default auth;
