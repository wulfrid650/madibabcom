/**
 * Client API MBC - Connexion sécurisée au backend Laravel
 * 
 * Ce module gère toutes les communications avec l'API backend.
 * Les tokens d'authentification sont stockés de manière sécurisée.
 * 
 * @author MBC SARL
 * @version 2.0.0
 */

// ===========================================
// Configuration de base
// ===========================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const API_REQUEST_TIMEOUT_MS = 10000;
const SERVICE_UNAVAILABLE_MESSAGE = 'Service temporairement indisponible';

function generateIdempotencyKey(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID().replace(/-/g, '').slice(0, 48);
    }
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 22)}`.slice(0, 48);
}

// Admin Dashboard Types
export interface AdminDashboardStats {
    users: { total: number; active: number; new_this_month: number };
    financials: { total_revenue: number; monthly_revenue: number };
    projects: { active: number };
    apprenants: { total: number };
    roles: { admin: number; staff: number; clients: number; apprenants: number };
    activities: any[];
}

// Types pour les réponses API
interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    errors?: Record<string, string[]>;
    meta?: PaginationMeta;
}

interface ApiRequestOptions extends RequestInit {
    timeoutMs?: number;
}

// ===========================================
// Gestion sécurisée des tokens
// ===========================================

const TOKEN_KEY = 'mbc_auth_token';
const USER_KEY = 'mbc_auth_user';

// Compat keys used across the codebase (legacy)
const ALT_TOKEN_KEYS = ['auth_token', 'token'];
const ALT_USER_KEYS = ['user', 'mbc_user_data'];

/**
 * Stockage sécurisé du token (côté client uniquement)
 * - sessionStorage par défaut (plus sécurisé, session unique)
 * - localStorage si "Se souvenir de moi" est coché
 */
export const tokenStorage = {
    getToken: (): string | null => {
        if (typeof window === 'undefined') return null;
        const fromSession = sessionStorage.getItem(TOKEN_KEY) || ALT_TOKEN_KEYS.map(k => sessionStorage.getItem(k)).find(Boolean);
        if (fromSession) return fromSession;
        const fromLocal = localStorage.getItem(TOKEN_KEY) || ALT_TOKEN_KEYS.map(k => localStorage.getItem(k)).find(Boolean);
        return fromLocal || null;
    },

    setToken: (token: string, rememberMe: boolean = false): void => {
        if (typeof window === 'undefined') return;
        if (rememberMe) {
            localStorage.setItem(TOKEN_KEY, token);
            // keep legacy key for compatibility
            localStorage.setItem('auth_token', token);
            localStorage.setItem('token', token);
        } else {
            sessionStorage.setItem(TOKEN_KEY, token);
            sessionStorage.setItem('auth_token', token);
            sessionStorage.setItem('token', token);
        }
    },

    removeToken: (): void => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
    },

    getUser: (): User | null => {
        if (typeof window === 'undefined') return null;
        const fromSession = sessionStorage.getItem(USER_KEY) || ALT_USER_KEYS.map(k => sessionStorage.getItem(k)).find(Boolean);
        if (fromSession) {
            try {
                return JSON.parse(fromSession);
            } catch {
                sessionStorage.removeItem(USER_KEY);
                ALT_USER_KEYS.forEach((key) => sessionStorage.removeItem(key));
            }
        }
        const fromLocal = localStorage.getItem(USER_KEY) || ALT_USER_KEYS.map(k => localStorage.getItem(k)).find(Boolean);
        if (!fromLocal) return null;
        try {
            return JSON.parse(fromLocal);
        } catch {
            localStorage.removeItem(USER_KEY);
            ALT_USER_KEYS.forEach((key) => localStorage.removeItem(key));
            return null;
        }
    },

    setUser: (user: User, rememberMe: boolean = false): void => {
        if (typeof window === 'undefined') return;
        const userData = JSON.stringify(user);
        if (rememberMe) {
            localStorage.setItem(USER_KEY, userData);
            localStorage.setItem('user', userData);
            localStorage.setItem('mbc_user_data', userData);
        } else {
            sessionStorage.setItem(USER_KEY, userData);
            sessionStorage.setItem('user', userData);
            sessionStorage.setItem('mbc_user_data', userData);
        }
    },

    removeUser: (): void => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(USER_KEY);
        sessionStorage.removeItem(USER_KEY);
    },

    clear: (): void => {
        tokenStorage.removeToken();
        tokenStorage.removeUser();
    }
};

// ===========================================
// Types de données
// ===========================================

export interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    role: string;
    roles: Role[];
    email_verified_at?: string;
    is_active: boolean;
    created_at: string;
}

export interface Role {
    slug: string;
    name: string;
    is_primary: boolean;
    is_staff: boolean;
}

export interface SiteSettings {
    company_name: string;
    company_short_name: string;
    company_slogan: string;
    company_description: string;
    company_year_founded: string;
    company_legal_form: string;
    company_rccm: string;
    company_niu: string;
    company_tax_regime: string;
    company_activity: string;
    company_headquarters: string;
    phone: string;
    phone_secondary: string;
    email: string;
    address: string;
    address_full: string;
    working_hours: string;
    facebook_url?: string;
    instagram_url?: string;
    linkedin_url?: string;
    whatsapp_number?: string;
    hero_title?: string;
    hero_subtitle?: string;
    hero_image?: string;
    hero_cta_text?: string;
    stats_projects: string;
    stats_years: string;
    stats_employees: string;
    stats_regions: string;
}

export interface Service {
    id: number;
    title: string;
    slug: string;
    short_description: string;
    description: string;
    features: string[];
    icon: string;
    cover_image: string;
    starting_price?: number;
    is_featured: boolean;
}

export interface Formation {
    id: number;
    title: string;
    slug: string;
    description: string;
    objectives: string[];
    prerequisites: string[];
    program: string[];
    duration_hours: number;
    duration_days?: number;
    price: number;
    registration_fees?: number;
    level: string;
    category: string;
    cover_image: string;
    max_participants?: number;
    certification?: string;
    is_featured: boolean;
    sessions?: FormationSession[];
    formateur?: { id: number; name: string; email: string; };
    formateur_id?: number | string;
    max_students?: number;
    active_sessions_count?: number;
    created_at?: string;
    is_active?: boolean;
}

export interface FormationSession {
    id: number;
    formation_id: number;
    start_date: string;
    end_date: string;
    location: string;
    available_spots: number;
    status: string;
}

export interface Testimonial {
    id: number;
    author_name: string;
    author_role: string;
    author_company?: string;
    author_image?: string;
    content: string;
    rating: number;
    project_type?: string;
}

export interface PortfolioProject {
    id: number | string;
    title: string;
    slug: string;
    short_description?: string;
    description: string;
    category: string;
    cover_image: string;
    gallery?: string[];
    images?: string[];
    location: string;
    client?: string;
    budget_range?: string;
    surface_area?: string;
    start_date?: string;
    expected_end_date?: string;
    completion_date?: string;
    duration?: string;
    status?: string;
    services_used?: string[];
    challenges?: string;
    solutions?: string;
    results?: string;
    is_featured?: boolean;
    featured?: boolean;
    progress?: number;
    client_name?: string;
    client_id?: number | null;
    client_email?: string | null;
    budget?: number | string;
    chef_chantier_id?: number;
    created_by?: number;
    team_ids?: number[];
    metadata?: Record<string, unknown> | null;
}

export interface ChefChantierChantierPayload {
    title: string;
    description?: string;
    location?: string;
    category?: string;
    status?: 'pending' | 'in_progress' | 'completed' | 'on_hold';
    progress?: number;
    start_date?: string;
    expected_end_date?: string;
    budget?: string;
}

export interface ProjectPhaseOption {
    key: string;
    label: string;
    progress_floor: number;
}

export interface ProjectPhasePendingRequest {
    from_phase: string;
    from_phase_label?: string;
    to_phase: string;
    to_phase_label?: string;
    note?: string;
    requested_by: number;
    requested_by_role?: string;
    requested_at: string;
}

export interface ProjectPhaseState {
    current_phase: string;
    current_phase_label: string;
    available_phases: ProjectPhaseOption[];
    pending_request?: ProjectPhasePendingRequest | null;
    history: Array<Record<string, unknown>>;
}

export interface ContactRequest {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    service_type?: string;
    company?: string;
    recaptcha_token?: string;
    recaptcha_action?: string;
}

export interface LegalPage {
    id: number;
    slug: string;
    title: string;
    subtitle?: string;
    content: string;
    meta_title?: string;
    meta_description?: string;
    last_updated: string;
}

// ===========================================
// Types de paiement
// ===========================================

export interface PaymentMethod {
    id: string;
    name: string;
    icon: string;
    description: string;
    available: boolean;
}

export interface PaymentInitiateRequest {
    amount: number;
    currency?: string;
    description?: string;
    payable_type?: string;
    payable_id?: number;
    return_url?: string;
    customer_email?: string;
    customer_phone?: string;
    customer_first_name?: string;
    customer_last_name?: string;
}

export interface PaymentInitiateResponse {
    payment_id: number;
    reference: string;
    checkout_url: string | null;
    link?: string;
    payment_url?: string | null;
    enrollment_id?: number;
    formation?: string;
    amount?: number;
    expires_at?: string | null;
    payment_retry_required?: boolean;
    status?: string;
}

export interface PaymentStatus {
    reference: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    status_label: string;
    amount: number;
    currency: string;
    method: string;
    method_label: string;
    created_at: string;
    validated_at?: string;
}

export interface Payment {
    id?: number;
    reference: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    status_label: string;
    amount: number;
    currency: string;
    method: string;
    method_label: string;
    description?: string;
    created_at: string;
    validated_at?: string;
    payment_url?: string;
    metadata?: Record<string, any>;
    link_audit_summary?: {
        payment_url?: string;
        generated_by?: string;
        generated_at?: string;
        access_count?: number;
        retry_count?: number;
        last_accessed_at?: string;
        last_access_ip?: string;
        last_retry_at?: string;
        last_retry_by?: string;
        last_event?: {
            action: string;
            description: string;
            created_at: string;
        } | null;
    };
    link_audit?: Array<{
        id: number;
        action: string;
        description: string;
        actor_name: string;
        created_at: string;
        time: string;
        ip_address?: string | null;
        user_agent?: string | null;
    }>;
}

export interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

// ===========================================
// Classe d'erreur de validation
// ===========================================

export class ValidationError extends Error {
    errors: Record<string, string[]>;

    constructor(message: string, errors: Record<string, string[]> = {}) {
        super(message);
        this.name = 'ValidationError';
        this.errors = errors;
    }

    getFirstError(field: string): string | undefined {
        return this.errors[field]?.[0];
    }

    getAllErrors(): string[] {
        return Object.values(this.errors).flat();
    }
}

// ===========================================
// Client API principal
// ===========================================

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    /**
     * Effectue une requête HTTP avec gestion automatique des tokens et erreurs
     */
    public async request<T>(
        endpoint: string,
        options: ApiRequestOptions = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const token = tokenStorage.getToken();
        const { timeoutMs = API_REQUEST_TIMEOUT_MS, ...fetchOptions } = options;
        const isFormData =
            typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData;
        const headers = new Headers(fetchOptions.headers || {});

        if (!headers.has('Accept')) {
            headers.set('Accept', 'application/json');
        }

        if (isFormData) {
            headers.delete('Content-Type');
        } else if (!headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
        }

        // Ajouter le token d'authentification si disponible
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                ...fetchOptions,
                headers,
                signal: controller.signal,
                cache: 'no-store', // Prevent caching of API responses
            });

            // Gérer les erreurs HTTP
            if (!response.ok) {
                if (response.status === 401) {
                    tokenStorage.clear();
                    if (typeof window !== 'undefined') {
                        window.location.href = '/connexion?expired=true';
                    }
                    throw new Error('Session expirée. Veuillez vous reconnecter.');
                }

                if (response.status === 403) {
                    throw new Error('Vous n\'avez pas les permissions pour cette action.');
                }

                if (response.status === 422) {
                    const errorData = await response.json();
                    throw new ValidationError(errorData.message || 'Données invalides', errorData.errors);
                }

                if (response.status === 429) {
                    throw new Error('Trop de requêtes. Veuillez patienter quelques instants.');
                }

                if (response.status >= 500) {
                    throw new Error('Erreur serveur. Veuillez réessayer plus tard.');
                }

                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Erreur ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }

            if (error instanceof DOMException && error.name === 'AbortError') {
                throw new Error(SERVICE_UNAVAILABLE_MESSAGE);
            }

            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                throw new Error(SERVICE_UNAVAILABLE_MESSAGE);
            }

            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    // ===========================================
    // Authentification
    // ===========================================

    async login(email: string, password: string, rememberMe: boolean = false): Promise<{ user: User; token: string }> {
        const response = await this.request<ApiResponse<{ user: User; token: string }>>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        if (response.success && response.data.token) {
            tokenStorage.setToken(response.data.token, rememberMe);
            tokenStorage.setUser(response.data.user, rememberMe);
        }

        return response.data;
    }

    async register(data: {
        name: string;
        email: string;
        password: string;
        password_confirmation: string;
        phone?: string;
    }): Promise<{ user: User; token: string }> {
        const response = await this.request<ApiResponse<{ user: User; token: string }>>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        if (response.success && response.data.token) {
            tokenStorage.setToken(response.data.token);
            tokenStorage.setUser(response.data.user);
        }

        return response.data;
    }

    async logout(): Promise<void> {
        try {
            await this.request('/auth/logout', { method: 'POST' });
        } finally {
            tokenStorage.clear();
        }
    }

    async getCurrentUser(): Promise<User> {
        const response = await this.request<ApiResponse<User>>('/auth/me');
        return response.data;
    }

    // Alias pour getCurrentUser (compatibilité)
    async getMe(): Promise<User> {
        return this.getCurrentUser();
    }

    async updateProfile(data: Partial<User>): Promise<User> {
        const response = await this.request<ApiResponse<User>>('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        });

        if (response.success) {
            const currentUser = tokenStorage.getUser();
            if (currentUser) {
                tokenStorage.setUser({ ...currentUser, ...response.data });
            }
        }

        return response.data;
    }

    async changePassword(data: {
        current_password: string;
        password: string;
        password_confirmation: string;
    }): Promise<{ message: string }> {
        const response = await this.request<ApiResponse<{ message: string }>>('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        return response.data;
    }

    async switchRole(role: string): Promise<User> {
        const response = await this.request<ApiResponse<User>>('/auth/switch-role', {
            method: 'POST',
            body: JSON.stringify({ role }),
        });

        if (response.success) {
            tokenStorage.setUser(response.data);
        }

        return response.data;
    }

    // ===========================================
    // Réinitialisation mot de passe
    // ===========================================

    async forgotPassword(email: string): Promise<{ status: string }> {
        const response = await this.request<ApiResponse<{ status: string }>>('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
        return response.data;
    }

    async resetPassword(data: {
        email: string;
        token: string;
        password: string;
        password_confirmation: string;
    }): Promise<{ status: string }> {
        const response = await this.request<ApiResponse<{ status: string }>>('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return response.data;
    }

    // ===========================================
    // Données publiques
    // ===========================================

    async getSettings(): Promise<SiteSettings> {
        const response = await this.request<ApiResponse<SiteSettings>>('/public/settings');
        return response.data;
    }

    async getContactInfo(): Promise<Partial<SiteSettings>> {
        const response = await this.request<ApiResponse<Partial<SiteSettings>>>('/public/contact-info');
        return response.data;
    }

    async getSocialLinks(): Promise<Record<string, string>> {
        const response = await this.request<ApiResponse<Record<string, string>>>('/public/social-links');
        return response.data;
    }

    async getHomepageData(): Promise<{
        company: { name: string; slogan: string; description?: string };
        hero: { title: string; subtitle: string; image?: string; cta_text: string };
        stats: { projects_completed: number; years_experience: number; happy_clients: number; trained_students: number };
        services: Service[];
        formations: Formation[];
        portfolio: PortfolioProject[];
        testimonials: Testimonial[];
        contact: { phone?: string; email?: string; address?: string };
        social: Record<string, string>;
    }> {
        const response = await this.request<ApiResponse<{
            company: { name: string; slogan: string; description?: string };
            hero: { title: string; subtitle: string; image?: string; cta_text: string };
            stats: { projects_completed: number; years_experience: number; happy_clients: number; trained_students: number };
            services: Service[];
            formations: Formation[];
            portfolio: PortfolioProject[];
            testimonials: Testimonial[];
            contact: { phone?: string; email?: string; address?: string };
            social: Record<string, string>;
        }>>('/public/homepage');
        return response.data;
    }

    // ===========================================
    // Services
    // ===========================================

    async getServices(): Promise<Service[]> {
        const response = await this.request<ApiResponse<Service[]>>('/public/services');
        return response.data;
    }

    async getService(slug: string): Promise<Service | null> {
        try {
            const response = await this.request<ApiResponse<Service>>(`/public/services/${slug}`);
            return response.data;
        } catch {
            return null;
        }
    }

    // ===========================================
    // Admin (DoubleMB) - Formations
    // ===========================================

    // Users Management
    async getUsers(page: number = 1, search: string = '', role: string = '', status: string = ''): Promise<{ data: User[]; meta: PaginationMeta }> {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        if (search) params.append('search', search);
        if (role) params.append('role', role);
        if (status) params.append('status', status);

        const response = await this.request<ApiResponse<any>>(`/admin/users?${params}`);
        // AdminController returns { data: User[], meta: PaginationMeta }
        // unlike FormationController which returns { data: { data: Formation[], ... } }
        return {
            data: response.data,
            meta: response.meta || {
                current_page: 1,
                last_page: 1,
                per_page: 15,
                total: response.data.length || 0
            }
        };
    }

    async createUser(data: any): Promise<User> {
        const response = await this.request<ApiResponse<User>>('/admin/users', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return response.data;
    }

    async getUser(id: number): Promise<User> {
        const response = await this.request<ApiResponse<User>>(`/admin/users/${id}`);
        return response.data;
    }

    async updateUser(id: number, data: any): Promise<User> {
        const response = await this.request<ApiResponse<User>>(`/admin/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        return response.data;
    }

    async deleteUser(id: number): Promise<void> {
        await this.request(`/admin/users/${id}`, {
            method: 'DELETE',
        });
    }

    async toggleUserStatus(id: number): Promise<User> {
        const response = await this.request<ApiResponse<User>>(`/admin/users/${id}/toggle-status`, {
            method: 'PATCH',
        });
        return response.data;
    }

    async exportUsers(role: string = ''): Promise<Blob> {
        const params = new URLSearchParams();
        if (role) params.append('role', role);

        const response = await fetch(`${this.baseUrl}/admin/users/export?${params}`, {
            headers: {
                'Authorization': `Bearer ${tokenStorage.getToken()}`,
            },
        });

        if (!response.ok) throw new Error('Erreur lors de l\'export');
        return await response.blob();
    }

    async getAdminFormations(page: number = 1, search: string = '', level: string = '', isActive: string = ''): Promise<{ data: Formation[]; meta: PaginationMeta }> {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        if (search) params.append('search', search);
        if (level) params.append('level', level);
        if (isActive !== '') params.append('is_active', isActive);

        const response = await this.request<ApiResponse<any>>(`/admin/formations-admin?${params}`);
        return {
            data: response.data.data,
            meta: {
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                per_page: response.data.per_page,
                total: response.data.total
            }
        };
    }

    async getAdminFormation(id: string | number): Promise<Formation> {
        const response = await this.request<ApiResponse<Formation>>(`/admin/formations-admin/${id}`);
        return response.data;
    }

    async createFormation(data: any): Promise<Formation> {
        const response = await this.request<ApiResponse<Formation>>('/admin/formations-admin', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return response.data;
    }

    async updateFormation(slug: string, data: any): Promise<Formation> {
        const response = await this.request<ApiResponse<Formation>>(`/admin/formations-admin/${slug}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        return response.data;
    }

    async deleteFormation(slug: string): Promise<void> {
        await this.request(`/admin/formations-admin/${slug}`, {
            method: 'DELETE',
        });
    }

    async toggleFormationStatus(slug: string): Promise<Formation> {
        const response = await this.request<ApiResponse<Formation>>(`/admin/formations-admin/${slug}/toggle-status`, {
            method: 'PATCH',
        });
        return response.data;
    }

    // ===========================================
    // Formations (Public)
    // ===========================================

    async getFormations(): Promise<Formation[]> {
        const response = await this.request<ApiResponse<Formation[]>>('/public/formations');
        return response.data;
    }

    async getFormation(slug: string): Promise<Formation | null> {
        try {
            const response = await this.request<ApiResponse<Formation>>(`/public/formations/${slug}`);
            return response.data;
        } catch {
            return null;
        }
    }

    async getPublicSettings(): Promise<SiteSettings> {
        return this.getSettings();
    }

    async payPending(reference: string, promoCode?: string): Promise<PaymentInitiateResponse> {
        const response = await this.request<ApiResponse<PaymentInitiateResponse>>(`/payments/pay-pending/${reference}`, {
            method: 'POST',
            headers: { 'Idempotency-Key': generateIdempotencyKey() },
            body: JSON.stringify({ promo_code: promoCode })
        });
        return response.data;
    }

    async checkPromo(code: string, amount: number, formationId?: number): Promise<ApiResponse<{ code: string; discount: number; new_amount: number; type: string; value: number; }>> {
        const response = await this.request<ApiResponse<any>>('/payments/check-promo', {
            method: 'POST',
            body: JSON.stringify({ code, amount, formation_id: formationId }),
        });
        return response; // Returning full response as the component checks res.success
    }

    // ===========================================
    // Secrétaire - Création Utilisateurs
    // ===========================================

    async createClient(data: any): Promise<any> {
        const response = await this.request<ApiResponse<any>>('/secretaire/clients', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return response;
    }

    async createApprenant(data: any): Promise<any> {
        const response = await this.request<ApiResponse<any>>('/secretaire/apprenants', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return response;
    }

    // ===========================================
    // Portfolio
    // ===========================================

    async getPortfolio(): Promise<PortfolioProject[]> {
        const response = await this.request<ApiResponse<PortfolioProject[]>>('/public/portfolio');
        return response.data;
    }

    async getPortfolioProject(slug: string): Promise<PortfolioProject | null> {
        try {
            const response = await this.request<ApiResponse<PortfolioProject>>(`/public/portfolio/${slug}`);
            return response.data;
        } catch {
            return null;
        }
    }

    // ===========================================
    // Témoignages
    // ===========================================

    async getTestimonials(): Promise<Testimonial[]> {
        const response = await this.request<ApiResponse<Testimonial[]>>('/public/testimonials');
        return response.data;
    }

    // ===========================================
    // Pages légales
    // ===========================================

    async getLegalPages(): Promise<LegalPage[]> {
        const response = await this.request<ApiResponse<LegalPage[]>>('/public/legal');
        return response.data;
    }

    async getLegalPage(slug: string): Promise<LegalPage | null> {
        try {
            const response = await this.request<ApiResponse<LegalPage>>(`/public/legal/${slug}`);
            return response.data;
        } catch {
            return null;
        }
    }

    // ===========================================
    // Contact
    // ===========================================

    async submitContact(data: ContactRequest): Promise<{ message: string }> {
        const response = await this.request<ApiResponse<{ message: string }>>('/contact', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return response.data;
    }

    // ===========================================
    // Paiements
    // ===========================================

    async getPaymentMethods(): Promise<PaymentMethod[]> {
        const response = await this.request<ApiResponse<PaymentMethod[]>>('/payments/methods');
        return response.data;
    }

    async initiatePayment(data: PaymentInitiateRequest): Promise<PaymentInitiateResponse> {
        const response = await this.request<ApiResponse<PaymentInitiateResponse>>('/payments/initiate', {
            method: 'POST',
            headers: { 'Idempotency-Key': generateIdempotencyKey() },
            body: JSON.stringify(data),
        });
        return response.data;
    }

    async initiateEnrollmentPayment(enrollmentId: number, returnUrl?: string): Promise<PaymentInitiateResponse> {
        const response = await this.request<ApiResponse<PaymentInitiateResponse>>('/payments/enrollment', {
            method: 'POST',
            headers: { 'Idempotency-Key': generateIdempotencyKey() },
            body: JSON.stringify({ enrollment_id: enrollmentId, return_url: returnUrl }),
        });
        return response.data;
    }

    async verifyPayment(reference: string): Promise<PaymentStatus> {
        const response = await this.request<ApiResponse<PaymentStatus>>('/payments/verify', {
            method: 'POST',
            body: JSON.stringify({ reference }),
        });
        return response.data;
    }

    async getPaymentHistory(page: number = 1): Promise<{ data: Payment[]; meta: PaginationMeta }> {
        const response = await this.request<ApiResponse<Payment[]> & { meta: PaginationMeta }>(`/payments/history?page=${page}`);
        return { data: response.data, meta: (response as any).meta };
    }

    async getPayment(reference: string): Promise<Payment> {
        const response = await this.request<ApiResponse<Payment>>(`/payments/${reference}`);
        return response.data;
    }

    // ===========================================
    // Admin Methods
    // ===========================================

    async getAdminDashboardStats(): Promise<AdminDashboardStats> {
        const response = await this.request<ApiResponse<AdminDashboardStats>>('/admin/stats');
        return response.data;
    }

    async getRecentActivities(dateRange: string = '7days'): Promise<any[]> {
        const response = await this.request<ApiResponse<any[]>>(`/admin/activities?range=${dateRange}`);
        return response.data;
    }

    async getAdminContacts(params?: any): Promise<any> {
        const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
        const response = await this.request<ApiResponse<any>>(`/admin/contacts${queryString}`);
        return response;
    }

    async getAdminContact(id: number): Promise<any> {
        const response = await this.request<ApiResponse<any>>(`/admin/contacts/${id}`);
        return response.data;
    }

    async updateAdminContact(id: number, data: any): Promise<any> {
        const response = await this.request<ApiResponse<any>>(`/admin/contacts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        return response.data;
    }

    async deleteAdminContact(id: number): Promise<any> {
        const response = await this.request<ApiResponse<any>>(`/admin/contacts/${id}`, {
            method: 'DELETE',
        });
        return response.data;
    }

    async respondToQuote(id: number, formData: FormData): Promise<any> {
        const token = tokenStorage.getToken();
        const response = await fetch(`${API_BASE_URL}/admin/contacts/${id}/respond`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
            body: formData,
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de l\'envoi de la réponse');
        }
        
        const data = await response.json();
        return data.data;
    }

    // ===========================================
    // Paramètres système
    // ===========================================

    async getAllAdminSettings(): Promise<Record<string, any[]>> {
        const response = await this.request<ApiResponse<Record<string, any[]>>>('/admin/settings');
        return response.data;
    }

    async getSettingsGroup(group: string): Promise<Record<string, any>> {
        const response = await this.request<ApiResponse<Record<string, any>>>(`/admin/settings/group/${group}`);
        return response.data;
    }

    async updateSettingsBatch(settings: { key: string; value: any }[]): Promise<boolean> {
        const response = await this.request<ApiResponse<any>>('/admin/settings/batch', {
            method: 'PUT',
            body: JSON.stringify({ settings }),
        });
        return response.success;
    }

    async sendTestEmail(payload: {
        recipient?: string;
        mail_mailer?: string;
        mail_host?: string;
        mail_port?: number;
        mail_username?: string;
        mail_password?: string;
        mail_encryption?: string;
        mail_from_address?: string;
        mail_from_name?: string;
    }): Promise<ApiResponse<{ recipient: string; sent_at: string }>> {
        return this.request<ApiResponse<{ recipient: string; sent_at: string }>>('/admin/settings/email/test', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    // ===========================================
    // Formateur Dashboard
    // ===========================================

    async getFormateurStats(): Promise<FormateurDashboardStats> {
        try {
            // L'endpoint exact est /formateur/dashboard qui retourne tout
            const response = await this.request<ApiResponse<{
                stats: any,
                active_sessions: any[],
                formations_assignees: any[]
            }>>('/formateur/dashboard');

            const stats = response.data.stats;
            const formations = response.data.formations_assignees || [];

            return {
                total_apprenants: stats.total_apprenants,
                apprenants_actifs: stats.apprenants_actifs,
                cours_cette_semaine: stats.sessions_en_cours, // Mapping sessions_en_cours -> cours_cette_semaine
                evaluations_a_venir: stats.evaluations_a_venir,
                taux_presence_moyen: stats.taux_presence_moyen,
                formations_assignees: ['BIM', 'Métrage', 'Enscape'],
            };
        } catch (error) {
            console.warn('API Formateur Dashboard non disponible, utilisation données mock temporaires');
            // Mock temporaire pour ne pas briser l'UI si le backend n'est pas prêt
            return {
                total_apprenants: 24,
                apprenants_actifs: 18,
                cours_cette_semaine: 8,
                evaluations_a_venir: 3,
                taux_presence_moyen: 87,
                formations_assignees: ['BIM', 'Métrage', 'Enscape'],
            };
        }
    }

    async getFormateurApprenants(limit: number = 5): Promise<TeacherApprenant[]> {
        try {
            const response = await this.request<ApiResponse<TeacherApprenant[]>>(`/formateur/apprenants?limit=${limit}`);
            return response.data;
        } catch (error) {
            console.warn('API Formateur Apprenants non disponible, utilisation données mock temporaires');
            return [
                { id: 1, name: 'Jean Kouame', email: 'jean@email.com', formation: 'BIM', progression: 75, derniere_presence: '2026-01-10' },
                { id: 2, name: 'Marie Diallo', email: 'marie@email.com', formation: 'Métrage', progression: 60, derniere_presence: '2026-01-10' },
                { id: 3, name: 'Paul Mensah', email: 'paul@email.com', formation: 'BIM', progression: 90, derniere_presence: '2026-01-09' },
                { id: 4, name: 'Aminata Bah', email: 'aminata@email.com', formation: 'Enscape', progression: 45, derniere_presence: '2026-01-08' },
            ];
        }
    }

    async getChefChantierChantiers(status?: string): Promise<PortfolioProject[]> {
        const query = status && status !== 'all' ? `?status=${status}` : '';
        try {
            const response = await this.request<ApiResponse<{ data: PortfolioProject[] }>>(`/chef-chantier/chantiers${query}`);
            const paginated = response.data as any;
            return paginated.data || [];
        } catch (error) {
            console.warn('API Chef Chantier Chantiers non disponible');
            return [];
        }
    }

    async getChefChantierChantier(chantierId: number): Promise<PortfolioProject> {
        const response = await this.request<ApiResponse<{ project: PortfolioProject }>>(`/chef-chantier/chantiers/${chantierId}`);
        const payload = response.data as any;
        return payload.project || payload;
    }

    async createChefChantierChantier(payload: ChefChantierChantierPayload): Promise<ApiResponse<PortfolioProject>> {
        return this.request<ApiResponse<PortfolioProject>>('/chef-chantier/chantiers', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async updateChefChantierChantier(
        chantierId: number,
        payload: Partial<ChefChantierChantierPayload> & { notes?: string }
    ): Promise<ApiResponse<PortfolioProject>> {
        return this.request<ApiResponse<PortfolioProject>>(`/chef-chantier/chantiers/${chantierId}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }

    async getChefChantierPhaseState(chantierId: number): Promise<ProjectPhaseState> {
        const response = await this.request<ApiResponse<ProjectPhaseState>>(`/chef-chantier/chantiers/${chantierId}/phase-transition`);
        return response.data;
    }

    async requestChefChantierPhaseTransition(
        chantierId: number,
        payload: { to_phase: string; note?: string }
    ): Promise<ApiResponse<{ mode: string; phase_state: ProjectPhaseState }>> {
        return this.request<ApiResponse<{ mode: string; phase_state: ProjectPhaseState }>>(
            `/chef-chantier/chantiers/${chantierId}/phase-transition`,
            {
                method: 'POST',
                body: JSON.stringify(payload),
            }
        );
    }

    async getChefChantierAvancements(search?: string): Promise<ChefChantierUpdate[]> {
        const query = search ? `?search=${search}` : '';
        try {
            const response = await this.request<ApiResponse<{ data: ChefChantierUpdate[] }>>(`/chef-chantier/avancements${query}`);
            const paginated = response.data as any;
            return paginated.data || [];
        } catch (error) {
            return [];
        }
    }

    async createChefChantierAvancement(payload: ChefChantierAvancementPayload): Promise<ApiResponse<any>> {
        return this.request<ApiResponse<any>>('/chef-chantier/avancements', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async updateChefChantierAvancement(
        avancementId: number,
        payload: Partial<ChefChantierAvancementPayload>
    ): Promise<ApiResponse<any>> {
        return this.request<ApiResponse<any>>(`/chef-chantier/avancements/${avancementId}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }

    async getChefChantierEquipes(search?: string): Promise<ChefChantierTeam[]> {
        const query = search ? `?search=${search}` : '';
        try {
            const response = await this.request<ApiResponse<{ data: ChefChantierTeam[] }>>(`/chef-chantier/equipes${query}`);
            const paginated = response.data as any;
            return paginated.data || [];
        } catch (error) {
            return [];
        }
    }

    async getChefChantierRapports(search?: string, type?: string): Promise<ChefChantierReport[]> {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (type && type !== 'all') params.append('type', type);

        try {
            const response = await this.request<ApiResponse<{ data: ChefChantierReport[] }>>(`/chef-chantier/rapports?${params.toString()}`);
            const paginated = response.data as any;
            return paginated.data || [];
        } catch (error) {
            return [];
        }
    }

    async getChefChantierMessages(type?: string): Promise<ChefChantierMessage[]> {
        const query = type && type !== 'all' ? `?type=${type}` : '';
        try {
            const response = await this.request<ApiResponse<{ data: ChefChantierMessage[] }>>(`/chef-chantier/messages${query}`);
            const paginated = response.data as any;
            return paginated.data || [];
        } catch (error) {
            return [];
        }
    }

    async sendChefChantierMessage(data: { recipient_id?: number, chantier_id?: number, subject: string, message: string }): Promise<any> {
        return await this.request('/chef-chantier/messages', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async uploadChantierPhotos(chantierId: number, photos: File[], description?: string): Promise<ApiResponse<any>> {
        const formData = new FormData();
        photos.forEach(photo => {
            formData.append('photos[]', photo);
        });
        if (description) {
            formData.append('description', description);
        }

        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${this.baseUrl}/chef-chantier/chantiers/${chantierId}/photos`, {
            method: 'POST',
            headers,
            body: formData,
        });

        return await response.json();
    }

    async createChefChantierRapport(data: {
        chantier_id: number;
        title: string;
        type: string;
        content: string;
        attachments?: File[];
    }): Promise<ApiResponse<any>> {
        const formData = new FormData();
        formData.append('project_id', data.chantier_id.toString());
        formData.append('title', data.title);
        formData.append('type', data.type === 'Avancement' ? 'daily' : 'incident');
        formData.append('period', new Date().toISOString().split('T')[0]);
        formData.append('date', new Date().toISOString().split('T')[0]);

        // If attachments exist, use the first one as the main file
        if (data.attachments && data.attachments.length > 0) {
            formData.append('file', data.attachments[0]);
        } else {
            // Create a text file with the content if no attachments
            const blob = new Blob([data.content], { type: 'text/plain' });
            const file = new File([blob], 'rapport.txt', { type: 'text/plain' });
            formData.append('file', file);
        }

        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${this.baseUrl}/chef-chantier/rapports`, {
            method: 'POST',
            headers,
            body: formData,
        });

        return await response.json();
    }

    // ===========================================
    // Secretaire Methods
    // ===========================================

    async getSecretaireRegistre(params: { formation_id?: number, from_date?: string, to_date?: string, page?: number } = {}): Promise<{ data: any[], meta: PaginationMeta }> {
        const query = new URLSearchParams(params as any).toString();
        const response = await this.request<ApiResponse<any> & { meta: PaginationMeta }>(`/secretaire/registre?${query}`);
        return { data: response.data.data, meta: (response as any).data || (response as any).meta }; // Handle pagination structure
    }

    async getSecretaireClients(params: { search?: string, status?: string, page?: number, per_page?: number } = {}): Promise<{ data: any[], meta: PaginationMeta }> {
        const query = new URLSearchParams(params as any).toString();
        const response = await this.request<ApiResponse<any> & { meta: PaginationMeta }>(`/secretaire/clients?${query}`);
        const result = response.data as any;
        return {
            data: result.data,
            meta: {
                current_page: result.current_page,
                last_page: result.last_page,
                per_page: result.per_page,
                total: result.total
            }
        };
    }

    async getSecretaireProjets(status?: string): Promise<any[]> {
        const query = status ? `?status=${status}` : '';
        const response = await this.request<ApiResponse<{ data: any[] }>>(`/secretaire/projets${query}`);
        const paginated = response.data as any;
        return paginated.data || [];
    }

    async getSecretaireProjet(projetId: number): Promise<any> {
        const response = await this.request<ApiResponse<any>>(`/secretaire/projets/${projetId}`);
        return response.data;
    }

    async assignSecretaireProjetClient(projetId: number, clientId: number): Promise<ApiResponse<any>> {
        return this.request<ApiResponse<any>>(`/secretaire/projets/${projetId}/assign-client`, {
            method: 'POST',
            body: JSON.stringify({ client_id: clientId }),
        });
    }

    async validateSecretaireProjetCreation(
        projetId: number,
        decision: 'approved' | 'rejected',
        note?: string
    ): Promise<ApiResponse<any>> {
        return this.request<ApiResponse<any>>(`/secretaire/projets/${projetId}/validate-creation`, {
            method: 'POST',
            body: JSON.stringify({
                decision,
                note: note || undefined,
            }),
        });
    }

    async getSecretaireProjetPhaseState(projetId: number): Promise<ProjectPhaseState> {
        const response = await this.request<ApiResponse<ProjectPhaseState>>(`/secretaire/projets/${projetId}/phase-transition`);
        return response.data;
    }

    async updateSecretaireProjetPhase(
        projetId: number,
        payload: { action: 'apply' | 'approve' | 'reject'; to_phase?: string; note?: string }
    ): Promise<ApiResponse<{ mode: string; phase_state: ProjectPhaseState }>> {
        return this.request<ApiResponse<{ mode: string; phase_state: ProjectPhaseState }>>(
            `/secretaire/projets/${projetId}/phase-transition`,
            {
                method: 'POST',
                body: JSON.stringify(payload),
            }
        );
    }

    async getSecretaireApprenants(params: { search?: string, status?: string, page?: number } = {}): Promise<{ data: any[], meta: PaginationMeta }> {
        const query = new URLSearchParams(params as any).toString();
        const response = await this.request<ApiResponse<any> & { meta: PaginationMeta }>(`/secretaire/apprenants?${query}`);
        const result = response.data as any;
        return {
            data: result.data,
            meta: {
                current_page: result.current_page,
                last_page: result.last_page,
                per_page: result.per_page,
                total: result.total
            }
        };
    }

    async getSecretaireEnrollments(params: { search?: string, status?: string, formation_id?: number, page?: number } = {}): Promise<{ data: any[], meta: PaginationMeta }> {
        const query = new URLSearchParams(params as any).toString();
        const response = await this.request<ApiResponse<any> & { meta: PaginationMeta }>(`/secretaire/enrollments?${query}`);
        const result = response.data as any;
        return {
            data: result.data,
            meta: {
                current_page: result.current_page,
                last_page: result.last_page,
                per_page: result.per_page,
                total: result.total
            }
        };
    }

    async getSecretaireApprenant(id: number): Promise<{ apprenant: User, payments: Payment[] }> {
        const response = await this.request<ApiResponse<{ apprenant: User, payments: Payment[] }>>(`/secretaire/apprenants/${id}`);
        return response.data;
    }

    // Enrollments (Admin)
    async getEnrollments(page: number = 1): Promise<any> {
        const response = await this.request<ApiResponse<any>>(`/admin/enrollments?page=${page}`);
        return response.data;
    }

    async updateEnrollment(id: number, data: any): Promise<any> {
        const response = await this.request<ApiResponse<any>>(`/admin/enrollments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        return response.data;
    }

    async updateSecretaireApprenant(id: number, data: Partial<User>): Promise<User> {
        const response = await this.request<ApiResponse<User>>(`/secretaire/apprenants/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        return response.data;
    }

    async getSecretairePaiements(params: { status?: string, category?: string, method?: string, from_date?: string, to_date?: string, page?: number, per_page?: number } = {}): Promise<{ data: Payment[], meta: PaginationMeta }> {
        const query = new URLSearchParams(params as any).toString();
        const response = await this.request<ApiResponse<any>>(`/secretaire/paiements?${query}`);
        const result = response.data as any;
        return {
            data: result.data,
            meta: {
                current_page: result.current_page,
                last_page: result.last_page,
                per_page: result.per_page,
                total: result.total
            }
        };
    }

    async getSecretairePaiement(id: number): Promise<Payment> {
        const response = await this.request<ApiResponse<Payment>>(`/secretaire/paiements/${id}`);
        return response.data;
    }

    async validateSecretairePaiement(
        id: number,
        data?: FormData | { notes?: string; amount?: number; method?: string; reference?: string; proof?: File | null }
    ): Promise<Payment> {
        const body = data instanceof FormData ? data : new FormData();

        if (!(data instanceof FormData)) {
            if (data?.notes) body.append('notes', data.notes);
            if (typeof data?.amount === 'number') body.append('amount', data.amount.toString());
            if (data?.method) body.append('method', data.method);
            if (data?.reference) body.append('reference', data.reference);
            if (data?.proof) body.append('proof', data.proof);
        }

        const response = await this.request<ApiResponse<Payment>>(`/secretaire/paiements/${id}/validate`, {
            method: 'POST',
            body,
            timeoutMs: 60000,
        });
        return response.data;
    }

    async rejectSecretairePaiement(id: number, reason: string): Promise<Payment> {
        const response = await this.request<ApiResponse<Payment>>(`/secretaire/paiements/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
        return response.data;
    }

    async generatePaymentLink(data: {
        client_id: number;
        amount: number;
        motif: string;
        payable_type?: string;
        payable_id?: number;
    }): Promise<PaymentInitiateResponse> {
        const response = await this.request<ApiResponse<PaymentInitiateResponse>>('/secretaire/paiements/generate-link', {
            method: 'POST',
            headers: { 'Idempotency-Key': generateIdempotencyKey() },
            body: JSON.stringify(data)
        });
        return response.data;
    }

    async getSecretaireRecus(params: { from_date?: string, to_date?: string, page?: number, per_page?: number } = {}): Promise<{ data: any[], invalid_receipts: any[], invalid_receipts_count: number, meta: PaginationMeta }> {
        const query = new URLSearchParams(params as any).toString();
        const response = await this.request<ApiResponse<any>>(`/secretaire/recus?${query}`);
        const result = response.data as any;
        return {
            data: result.data,
            invalid_receipts: result.invalid_receipts || [],
            invalid_receipts_count: result.invalid_receipts_count || 0,
            meta: {
                current_page: result.current_page,
                last_page: result.last_page,
                per_page: result.per_page,
                total: result.total
            }
        };
    }

    async downloadSecretaireRecu(id: number): Promise<any> {
        const response = await this.request<ApiResponse<any>>(`/secretaire/recus/${id}/download`);
        return response.data;
    }
}

// ===========================================
// Export de l'instance unique
// ===========================================

export const api = new ApiClient(API_BASE_URL);

// ===========================================
// Fonctions legacy pour compatibilité
// ===========================================

export async function getPortfolioProjects(): Promise<PortfolioProject[]> {
    // Server-side fetch with ISR to avoid dynamic render errors during build
    if (typeof window === 'undefined') {
        try {
            const response = await fetch(`${API_BASE_URL}/public/portfolio`, {
                next: { revalidate: 60 },
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            return data?.data || [];
        } catch (error) {
            console.error('Error fetching portfolio (server):', error);
            return [];
        }
    }

    try {
        return await api.getPortfolio();
    } catch (error) {
        console.error('Error fetching portfolio:', error);
        return [];
    }
}

export async function getPortfolioProject(slug: string): Promise<PortfolioProject | null> {
    return api.getPortfolioProject(slug);
}

// ===========================================
// Helpers pour la redirection selon le rôle
// ===========================================

/**
 * Retourne le chemin de redirection approprié selon le rôle de l'utilisateur
 * C'est cette fonction qui corrige le bug de redirection toujours vers apprenant
 */
export function getRedirectPathForRole(role: string): string {
    const redirectPaths: Record<string, string> = {
        admin: '/dashboard',
        formateur: '/formateur/dashboard',
        chef_chantier: '/chantier/dashboard',
        apprenant: '/apprenant/dashboard',
        client: '/client',
    };

    return redirectPaths[role] || '/';
}

// ===========================================
// Formateur Dashboard Types & Methods
// ===========================================

export interface FormateurDashboardStats {
    total_apprenants: number;
    apprenants_actifs: number;
    cours_cette_semaine: number;
    evaluations_a_venir: number;
    taux_presence_moyen: number;
    formations_assignees: string[];
}

export interface TeacherApprenant {
    id: number;
    name: string;
    email: string;
    formation: string;
    progression: number;
    derniere_presence: string;
    avatar?: string;
}

/**
 * Retourne le nom lisible d'un rôle
 */
export function getRoleName(role: string): string {
    const roleNames: Record<string, string> = {
        admin: 'Administrateur',
        formateur: 'Formateur',
        chef_chantier: 'Chef de chantier',
        apprenant: 'Apprenant',
        client: 'Client',
    };
    return roleNames[role] || role;
}

/**
 * Vérifie si l'utilisateur a un rôle spécifique
 */
export function hasRole(user: User | null, role: string): boolean {
    if (!user) return false;
    // Check main role or roles array
    if (user.role === role) return true;
    return user.roles.some(r => r.slug === role);
}

/**
 * Vérifie si l'utilisateur a l'un des rôles spécifiés
 */
export function hasAnyRole(user: User | null, roles: string[]): boolean {
    if (!user) return false;
    if (roles.includes(user.role)) return true;
    return roles.some(role => user.roles.some(r => r.slug === role));
}

// ===========================================
// Chef Chantier Types
// ===========================================

export interface ChefChantierUpdate {
    id: number;
    project_id?: number;
    project: string;
    title: string;
    description: string;
    date: string;
    author: string;
    images: number;
    status: string;
}

export interface ChefChantierAvancementPayload {
    project_id: number;
    title: string;
    description: string;
    date: string;
    status: 'Publié' | 'Brouillon' | 'Archivé';
    progress?: number;
}

export interface ChefChantierTeam {
    id: number;
    name: string;
    leader: string;
    members: number;
    phone: string;
    email: string;
    specialization: string;
    projects: number;
    status: string;
}

export interface ChefChantierReport {
    id: number;
    title: string;
    project: string;
    period: string;
    author: string;
    date: string;
    type: string;
    status: string;
    pages: number;
    file_url?: string;
}

export interface ChefChantierMessage {
    id: number;
    sender: string;
    project: string;
    subject: string;
    message: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    read: boolean;
    type: 'received' | 'sent';
}

// ===========================================
// Client-specific API methods
// ===========================================

/**
 * Get projects for construction site tracking
 */
export async function getClientProjects() {
    return api.request<ApiResponse<any>>('/client/suivi-chantier');
}

/**
 * Get detailed project info for tracking
 */
export async function getClientProjectDetail(projectId: number) {
    return api.request<ApiResponse<any>>(`/client/suivi-chantier/${projectId}`);
}

/**
 * Get project photos
 */
export async function getClientProjectPhotos(projectId: number) {
    return api.request<ApiResponse<any>>(`/client/suivi-chantier/${projectId}/photos`);
}

/**
 * Get client messages
 */
export async function getClientMessages(page = 1) {
    return api.request<ApiResponse<any>>(`/client/messages?page=${page}`);
}

/**
 * Send a new message
 */
export async function sendClientMessage(data: { subject: string; message: string; project_id?: number }) {
    return api.request<ApiResponse<any>>('/client/messages', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

/**
 * Get client invoices/factures
 */
export async function getClientInvoices() {
    return api.request<ApiResponse<any>>('/client/factures');
}

/**
 * Initiate online payment for an invoice
 */
export async function payInvoice(invoiceId: number) {
    return api.request<ApiResponse<{ payment_url: string }>>(`/client/factures/${invoiceId}/pay`, {
        method: 'POST'
    });
}

// ===========================================
// Apprenant-specific API methods
// ===========================================

/**
 * Get apprenant formations
 */
export async function getApprenantFormations() {
    return api.request<ApiResponse<any>>('/apprenant/formations');
}

/**
 * Get apprenant certificats
 */
export async function getApprenantCertificats() {
    return api.request<ApiResponse<any>>('/apprenant/certificats');
}

/**
 * Download certificat
 */
export async function downloadCertificat(certificatId: number) {
    const response = await fetch(`${API_BASE_URL}/apprenant/certificats/${certificatId}/download`, {
        headers: {
            'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
        },
    });
    return response.blob();
}

/**
 * Get apprenant paiements
 */
export async function getApprenantPaiements() {
    return api.request<ApiResponse<any>>('/apprenant/paiements');
}

/**
 * Initier un paiement de formation pour l'apprenant
 */
export async function initiateApprenantFormationPayment(mode: 'installment' | 'full', returnUrl?: string) {
    return api.request<ApiResponse<PaymentInitiateResponse>>('/apprenant/paiements/formation/initiate', {
        method: 'POST',
        headers: { 'Idempotency-Key': generateIdempotencyKey() },
        body: JSON.stringify({ mode, return_url: returnUrl }),
    });
}

/**
 * Get apprenant recus
 */
export async function getApprenantRecus() {
    return api.request<ApiResponse<any>>('/apprenant/recus');
}

async function fetchAuthenticatedFile(endpoint: string): Promise<Blob> {
    const token = tokenStorage.getToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: token ? {
            'Authorization': `Bearer ${token}`,
        } : undefined,
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error('File download error:', response.status, errorText);
        throw new Error(SERVICE_UNAVAILABLE_MESSAGE);
    }

    return response.blob();
}

function openBlobInNewTab(blob: Blob) {
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
}

function triggerBlobDownload(blob: Blob, fileName: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
}

/**
 * Download recu
 */
export async function downloadRecu(paymentId: string | number) {
    return fetchAuthenticatedFile(`/apprenant/recus/${paymentId}/download`);
}

export async function previewApprenantRecu(paymentId: string | number) {
    const blob = await fetchAuthenticatedFile(`/apprenant/recus/${paymentId}/pdf`);
    openBlobInNewTab(blob);
}

/**
 * Get apprenant profil
 */
export async function getApprenantProfil() {
    return api.request<ApiResponse<any>>('/apprenant/profil');
}

/**
 * Update apprenant profil
 */
export async function updateApprenantProfil(data: any) {
    return api.request<ApiResponse<any>>('/apprenant/profil', {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}
/**
 * Formateur - Get apprenants
 */
export async function getFormateurApprenants(params?: { search?: string; formation?: string }) {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return api.request<ApiResponse<any[]>>(`/formateur/apprenants${query}`);
}

/**
 * Formateur - Get evaluations
 */
export async function getFormateurEvaluations(params?: { status?: string }) {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return api.request<ApiResponse<any[]>>(`/formateur/evaluations${query}`);
}

/**
 * Formateur - Create evaluation
 */
export async function createEvaluation(data: {
    titre: string;
    formation_session_id: number;
    type: string;
    date: string;
    duree?: number;
    description?: string;
}) {
    return api.request<ApiResponse<any>>('/formateur/evaluations', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * Formateur - Get evaluation notes
 */
export async function getEvaluationNotes(evaluationId: number) {
    return api.request<ApiResponse<any[]>>(`/formateur/evaluations/${evaluationId}/notes`);
}

/**
 * Formateur - Save evaluation notes
 */
export async function saveEvaluationNotes(evaluationId: number, notes: any[]) {
    return api.request<ApiResponse<any>>(`/formateur/evaluations/${evaluationId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
    });
}

/**
 * Formateur - Get presences
 */
export async function getPresences(params: { date: string; formation_session_id: number }) {
    const query = '?' + new URLSearchParams(params as any).toString();
    return api.request<ApiResponse<any>>(`/formateur/presences${query}`);
}

/**
 * Formateur - Save presences
 */
export async function savePresences(data: {
    date: string;
    formation_session_id: number;
    presences: Array<{
        user_id: number;
        status: string;
        heure_arrivee?: string;
        commentaire?: string;
    }>;
}) {
    return api.request<ApiResponse<any>>('/formateur/presences', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}
/**
 * Secrétaire - Get promo codes
 */
export async function getSecretairePromoCodes(params?: { is_active?: string }) {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return api.request<ApiResponse<any>>(`/secretaire/promo-codes${query}`);
}

/**
 * Secrétaire - Create promo code
 */
export async function createPromoCode(data: {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    max_uses?: number | null;
    valid_from?: string;
    valid_until?: string;
    formations?: number[] | null;
    description?: string;
}) {
    return api.request<ApiResponse<any>>('/secretaire/promo-codes', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * Secrétaire - Update promo code
 */
export async function updatePromoCode(id: number, data: {
    code?: string;
    type?: 'percentage' | 'fixed';
    value?: number;
    max_uses?: number | null;
    valid_from?: string;
    valid_until?: string;
    is_active?: boolean;
    formations?: number[] | null;
    description?: string;
}) {
    return api.request<ApiResponse<any>>(`/secretaire/promo-codes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

/**
 * Secrétaire - Delete promo code
 */
export async function deletePromoCode(id: number) {
    return api.request<ApiResponse<any>>(`/secretaire/promo-codes/${id}`, {
        method: 'DELETE',
    });
}
/**
 * Secrétaire - Create manual receipt
 */
export async function createManualReceipt(data: {
    user_id: number;
    amount: number;
    description: string;
    payment_method: 'cash' | 'bank_transfer' | 'check';
    payment_date: string;
    reference?: string;
}) {
    return api.request<ApiResponse<any>>('/secretaire/recus/manual', {
        method: 'POST',
        headers: { 'Idempotency-Key': generateIdempotencyKey() },
        body: JSON.stringify(data),
    });
}

/**
 * Secrétaire - Preview receipt PDF
 */
export async function previewReceiptPDF(paymentId: number) {
    const blob = await fetchAuthenticatedFile(`/secretaire/recus/${paymentId}/pdf`);
    openBlobInNewTab(blob);
}

/**
 * Secrétaire - Download receipt PDF
 */
export async function downloadReceiptPDF(paymentId: number) {
    const blob = await fetchAuthenticatedFile(`/secretaire/recus/${paymentId}/pdf?download=1`);
    triggerBlobDownload(blob, `recu-${paymentId}.pdf`);
}

/**
 * Client - Get my quotes
 */
export async function getClientQuotes() {
    return api.request<ApiResponse<any>>('/client/devis').then(res => res.data);
}
