// Configuration de l'authentification côté client
// Se connecte à l'API Laravel

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
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
}

// Stockage du token
const TOKEN_KEY = 'mbc_auth_token';
const USER_KEY = 'mbc_auth_user';
const LEGACY_TOKEN_KEYS = ['auth_token', 'token'];
const LEGACY_USER_KEYS = ['user', 'mbc_user_data'];

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

export const auth = {
  // Connexion
  async login(email: string, password: string, recaptchaToken?: string): Promise<AuthResponse> {
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
          ...(recaptchaToken ? { recaptcha_token: recaptchaToken, recaptcha_action: 'login' } : {}),
        }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        // Clear any existing auth data first to prevent conflicts
        clearAuthStorage();
        
        // Normalize user data from backend
        const user = data.user as any;
        // Backend returns active_role as object, frontend expects role as string
        if (user.active_role && typeof user.active_role === 'object') {
          user.role = user.active_role.slug;
        } else if (!user.role && user.roles && user.roles.length > 0) {
          // Fallback to first role if active_role missing
          user.role = user.roles[0].slug;
        }

        // Stocker le token et l'utilisateur
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        sessionStorage.setItem(TOKEN_KEY, data.token);
        sessionStorage.setItem(USER_KEY, JSON.stringify(user));
        LEGACY_TOKEN_KEYS.forEach((key) => {
          localStorage.setItem(key, data.token);
          sessionStorage.setItem(key, data.token);
        });
        LEGACY_USER_KEYS.forEach((key) => {
          localStorage.setItem(key, JSON.stringify(user));
          sessionStorage.setItem(key, JSON.stringify(user));
        });
        
        console.log('✅ Login successful:', { email: user.email, name: user.name, role: user.role });
        
        return { success: true, user: user, token: data.token };
      }

      return { success: false, message: data.message || 'Identifiants incorrects' };
    } catch (error) {
      console.error('Erreur de connexion:', error);
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
          ...(data.recaptchaToken ? { recaptcha_token: data.recaptchaToken, recaptcha_action: 'register' } : {}),
        }),
      });

      const result = await response.json();

      if (result.success && result.token) {
        // Clear any existing auth data first
        clearAuthStorage();
        
        // Normalize user data from backend
        const user = result.user as any;
        if (user.active_role && typeof user.active_role === 'object') {
          user.role = user.active_role.slug;
        } else if (!user.role && user.roles && user.roles.length > 0) {
          user.role = user.roles[0].slug;
        }
        
        // Set new auth data
        localStorage.setItem(TOKEN_KEY, result.token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        sessionStorage.setItem(TOKEN_KEY, result.token);
        sessionStorage.setItem(USER_KEY, JSON.stringify(user));
        LEGACY_TOKEN_KEYS.forEach((key) => {
          localStorage.setItem(key, result.token);
          sessionStorage.setItem(key, result.token);
        });
        LEGACY_USER_KEYS.forEach((key) => {
          localStorage.setItem(key, JSON.stringify(user));
          sessionStorage.setItem(key, JSON.stringify(user));
        });
        
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

  // Déconnexion
  async logout(): Promise<void> {
    const token = this.getToken();

    if (token) {
      try {
        await fetchWithTimeout(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
        });
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
      }
    }

    // Clear all auth-related data from localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Clear legacy keys too
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('mbc_user_data');
    
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
};

export default auth;
