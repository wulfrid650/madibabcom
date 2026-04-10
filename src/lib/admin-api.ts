// Admin API Service
// Connects to Laravel API for admin operations

import { getClientApiBaseUrl } from './api-base-url';
import { tokenStorage } from './api';

const API_URL = getClientApiBaseUrl();

const getAuthHeaders = (options: { json?: boolean } = {}) => {
  const token = tokenStorage.getToken();
  return {
    'Accept': 'application/json',
    ...(options.json ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export async function downloadReport(url: string, filename: string) {
  try {
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error('Download failed');

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  roles: { slug: string; name: string; is_staff: boolean }[];
  active_role: { slug: string; name: string } | null;
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
  company_name?: string;
  company_address?: string;
  project_type?: string;
  formation?: string;
  employee_id?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  speciality?: string;
  bio?: string;
}

export interface Role {
  id: string;
  slug: string;
  name: string;
  description?: string;
  is_staff: boolean;
  can_self_register: boolean;
  users_count?: number;
  created_at: string;
}

export interface Payment {
  id: string;
  reference: string;
  amount: number;
  currency?: string;
  method: string;
  method_label?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  type?: string;
  user: {
    id: string;
    name: string;
    email: string
  };
  description: string;
  payable_type?: string;
  payable?: {
    formation?: { title: string };
    title?: string; // For projects?
  };
  project_title?: string; // Helper for frontend mapping
  formation_title?: string; // Helper for frontend mapping
  created_at: string;
  validated_at?: string;
  validated_by?: string;
  metadata?: any;
}

export interface PaymentFilters {
  status?: string;
  method?: string;
  search?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  per_page?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface DashboardStats {
  users: {
    total: number;
    active: number;
    new_this_month: number;
  };
  roles: {
    admin: number;
    staff: number;
    clients: number;
    apprenants: number;
  };
}

// Dashboard
export async function getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
  try {
    const response = await fetch(`${API_URL}/admin/stats`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return { success: false, message: 'Erreur de connexion au serveur' };
  }
}

// Users
export interface UserFilters {
  role?: string;
  status?: 'active' | 'inactive';
  search?: string;
  page?: number;
  per_page?: number;
}

export async function getUsers(filters: UserFilters = {}): Promise<PaginatedResponse<User>> {
  try {
    const params = new URLSearchParams();
    if (filters.role) params.append('role', filters.role);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.per_page) params.append('per_page', filters.per_page.toString());

    // Route to specific endpoints based on role to avoid 403 on /admin/users
    let endpoint = '/admin/users';
    if (filters.role === 'client') {
      endpoint = '/secretaire/clients';
    } else if (filters.role === 'apprenant') {
      endpoint = '/secretaire/apprenants';
    }

    const response = await fetch(`${API_URL}${endpoint}?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    return {
      success: false,
      data: [],
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 }
    };
  }
}

export async function getUser(userId: string): Promise<ApiResponse<User>> {
  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    return { success: false, message: 'Erreur de connexion au serveur' };
  }
}

export interface CreateUserData {
  name: string;
  email: string;
  phone: string;
  password: string;
  roles: string[];
  is_active?: boolean;
  client_type?: string;
  company_name?: string;
  company_address?: string;
  project_type?: string;
  formation?: string;
  employee_id?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  speciality?: string;
  bio?: string;
}

export async function createUser(data: CreateUserData): Promise<ApiResponse<User> & { errors?: Record<string, string[]> }> {
  try {
    const response = await fetch(`${API_URL}/admin/users`, {
      method: 'POST',
      headers: getAuthHeaders({ json: true }),
      body: JSON.stringify(data),
    });

    const result = await response.json();

    // Handle Laravel validation errors (422 status)
    if (response.status === 422 && result.errors) {
      return {
        success: false,
        message: result.message || 'Erreur de validation',
        errors: result.errors
      };
    }

    // Handle unauthorized (401) or forbidden (403)
    if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        message: result.message || 'Accès non autorisé'
      };
    }

    return result;
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, message: 'Erreur de connexion au serveur' };
  }
}

export async function updateUser(userId: string, data: Partial<CreateUserData>): Promise<ApiResponse<User>> {
  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}`, {
      method: 'PUT',
      headers: getAuthHeaders({ json: true }),
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, message: 'Erreur de connexion au serveur' };
  }
}

export async function deleteUser(userId: string): Promise<ApiResponse<null>> {
  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, message: 'Erreur de connexion au serveur' };
  }
}

export async function toggleUserStatus(userId: string): Promise<ApiResponse<{ is_active: boolean }>> {
  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}/toggle-status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Error toggling user status:', error);
    return { success: false, message: 'Erreur de connexion au serveur' };
  }
}

export async function exportUsers(role?: string): Promise<ApiResponse<User[]>> {
  try {
    const params = role ? `?role=${role}` : '';
    const response = await fetch(`${API_URL}/admin/users/export${params}`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Error exporting users:', error);
    return { success: false, message: 'Erreur de connexion au serveur' };
  }
}

// Login History
export interface UserLoginHistory {
  id: string;
  ip_address: string;
  user_agent: string;
  country: string;
  city: string;
  isp: string;
  created_at: string;
}

export async function getUserLoginHistory(userId: string): Promise<PaginatedResponse<UserLoginHistory>> {
  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}/login-history`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching user login history:', error);
    return {
      success: false,
      data: [],
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 }
    };
  }
}

export async function sendUserPasswordReset(userId: string): Promise<ApiResponse<null>> {
  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}/send-reset-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, message: 'Erreur de connexion au serveur' };
  }
}

// Roles
export async function getRoles(): Promise<ApiResponse<Role[]>> {
  try {
    const response = await fetch(`${API_URL}/admin/roles`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching roles:', error);
    return { success: false, message: 'Erreur de connexion au serveur' };
  }
}

export interface CreateRoleData {
  name: string;
  slug: string;
  description?: string;
  is_staff?: boolean;
  can_self_register?: boolean;
}

export async function createRole(data: CreateRoleData): Promise<ApiResponse<Role>> {
  try {
    const response = await fetch(`${API_URL}/admin/roles`, {
      method: 'POST',
      headers: getAuthHeaders({ json: true }),
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error('Error creating role:', error);
    return { success: false, message: 'Erreur de connexion au serveur' };
  }
}

export async function updateRole(roleId: string, data: Partial<CreateRoleData>): Promise<ApiResponse<Role>> {
  try {
    const response = await fetch(`${API_URL}/admin/roles/${roleId}`, {
      method: 'PUT',
      headers: getAuthHeaders({ json: true }),
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating role:', error);
    return { success: false, message: 'Erreur de connexion au serveur' };
  }
}

export async function deleteRole(roleId: string): Promise<ApiResponse<null>> {
  try {
    const response = await fetch(`${API_URL}/admin/roles/${roleId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Error deleting role:', error);
    return { success: false, message: 'Erreur de connexion au serveur' };
  }
}

// Utility function to download CSV
export function downloadCSV(data: Record<string, any>[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value ?? '');
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ==========================================
// Settings Management
// ==========================================

export interface SiteSetting {
  id: number;
  key: string;
  value: string | boolean | string[] | null;
  type: 'text' | 'textarea' | 'image' | 'boolean' | 'json';
  label: string;
  description?: string;
  is_public: boolean;
}

export interface SettingsGroup {
  [key: string]: SiteSetting[];
}

// Get all settings (grouped)
export async function getSettings(): Promise<ApiResponse<SettingsGroup>> {
  try {
    const response = await fetch(`${API_URL}/settings`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching settings:', error);
    return { success: false, message: 'Erreur de connexion au serveur' };
  }
}

// Get settings by group
export async function getSettingsByGroup(group: string): Promise<ApiResponse<Record<string, SiteSetting>>> {
  try {
    const response = await fetch(`${API_URL}/settings/group/${group}`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching settings group:', error);
    return { success: false, message: 'Erreur de connexion au serveur' };
  }
}

// Update a single setting
export async function updateSetting(key: string, value: string | boolean | string[]): Promise<ApiResponse<SiteSetting>> {
  try {
    const response = await fetch(`${API_URL}/settings/${key}`, {
      method: 'PUT',
      headers: getAuthHeaders({ json: true }),
      body: JSON.stringify({ value }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating setting:', error);
    return { success: false, message: 'Erreur de connexion au serveur' };
  }
}

// Update multiple settings at once
export async function updateSettings(settings: { key: string; value: string | boolean | string[] }[]): Promise<ApiResponse<{ updated_keys: string[] }>> {
  try {
    const response = await fetch(`${API_URL}/settings/batch`, {
      method: 'PUT',
      headers: getAuthHeaders({ json: true }),
      body: JSON.stringify({ settings }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating settings:', error);
    return { success: false, message: 'Erreur de connexion au serveur' };
  }
}

// Create a new setting
export async function createSetting(data: {
  key: string;
  value: string | boolean | string[];
  type: 'text' | 'textarea' | 'image' | 'boolean' | 'json';
  group: string;
  label: string;
  description?: string;
  is_public?: boolean;
}): Promise<ApiResponse<SiteSetting>> {
  try {
    const response = await fetch(`${API_URL}/admin/settings`, {
      method: 'POST',
      headers: getAuthHeaders({ json: true }),
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error('Error creating setting:', error);
    return { success: false, message: 'Erreur de connexion au serveur' };
  }
}

// Delete a setting
export async function deleteSetting(key: string): Promise<ApiResponse<null>> {
  try {
    const response = await fetch(`${API_URL}/admin/settings/${key}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Error deleting setting:', error);
    return { success: false, message: 'Erreur de connexion au serveur' };
  }
}

// Toggle maintenance mode
export async function toggleMaintenanceMode(enabled: boolean, message?: string): Promise<ApiResponse<{ maintenance_mode: boolean }>> {
  try {
    const response = await fetch(`${API_URL}/admin/settings/maintenance`, {
      method: 'POST',
      headers: getAuthHeaders({ json: true }),
      body: JSON.stringify({ enabled, message }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error toggling maintenance mode:', error);
    return { success: false, message: 'Erreur de connexion au serveur' };
  }
}

// Payments
export async function getPayments(filters: PaymentFilters = {}): Promise<PaginatedResponse<Payment>> {
  try {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.method) params.append('method', filters.method);
    if (filters.search) params.append('search', filters.search);
    if (filters.from_date) params.append('from_date', filters.from_date);
    if (filters.to_date) params.append('to_date', filters.to_date);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.per_page) params.append('per_page', filters.per_page.toString());

    const response = await fetch(`${API_URL}/secretaire/paiements?${params.toString()}`, {
      headers: getAuthHeaders(),
    });

    const result = await response.json();

    // Handle Laravel Pagination object nested in 'data'
    if (result.success && result.data && result.data.data && Array.isArray(result.data.data)) {
      return {
        success: true,
        data: result.data.data,
        meta: {
          current_page: result.data.current_page,
          last_page: result.data.last_page,
          per_page: result.data.per_page,
          total: result.data.total
        }
      };
    }

    return result;
  } catch (error) {
    console.error('Error fetching payments:', error);
    return {
      success: false,
      data: [],
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 }
    };
  }
}

// Clients (Entreprises)
export async function getClients(filters: UserFilters = {}): Promise<PaginatedResponse<User>> {
  try {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.per_page) params.append('per_page', filters.per_page.toString());

    const response = await fetch(`${API_URL}/secretaire/clients?${params.toString()}`, {
      headers: getAuthHeaders(),
    });

    if (response.ok) {
      const result = await response.json();

      // Handle Laravel Pagination object nested in 'data'
      if (result.success && result.data && result.data.data && Array.isArray(result.data.data)) {
        return {
          success: true,
          data: result.data.data,
          meta: {
            current_page: result.data.current_page,
            last_page: result.data.last_page,
            per_page: result.data.per_page,
            total: result.data.total
          }
        };
      }
      return result;
    }

    return {
      success: false,
      data: [],
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 }
    };

  } catch (error) {
    console.error('Error fetching clients:', error);
    return {
      success: false,
      data: [],
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 }
    };
  }
}

export async function createClient(data: Partial<CreateUserData>): Promise<ApiResponse<User>> {
  try {
    const payload = {
      ...data,
      roles: ['client'],
      password: data.password || 'Client123!',
    };

    const response = await fetch(`${API_URL}/secretaire/clients`, {
      method: 'POST',
      headers: getAuthHeaders({ json: true }),
      body: JSON.stringify(payload),
    });

    return await response.json();
  } catch (error) {
    console.error('Error creating client:', error);
    return { success: false, message: 'Erreur de connexion au serveur' };
  }
}

// ==========================================
// Portfolio Management (Admin)
// ==========================================

export interface PortfolioProjectAdmin {
  id: number;
  title: string;
  slug: string;
  description?: string;
  category: string;
  client?: string;
  client_id?: number | null;
  client_email?: string | null;
  client_name?: string;
  location?: string;
  year?: number;
  duration?: string;
  budget?: string;
  status?: string;
  progress?: number;
  start_date?: string;
  expected_end_date?: string;
  completion_date?: string;
  chef_chantier_id?: number | null;
  chef_chantier_public_id?: string | null;
  chef_chantier_name?: string | null;
  linked_quote_request_id?: number | null;
  linked_quote_request?: QuoteRequestLinkOption | null;
  team_ids?: number[];
  construction_team_ids?: number[];
  assigned_construction_teams_count?: number;
  assigned_construction_team_members_count?: number;
  assigned_people_count?: number;
  cover_image?: string;
  challenges?: string;
  results?: string;
  is_featured: boolean;
  is_published: boolean;
  services?: string[];
  images?: string[];
  created_at: string;
}

export interface QuoteRequestLinkOption {
  id: number;
  quote_number?: string | null;
  name: string;
  email: string;
  company?: string | null;
  subject: string;
  status: string;
  service_type?: string | null;
  created_at: string;
}

export interface PortfolioProjectPayload {
  title: string;
  category: string;
  description?: string;
  client?: string;
  client_id?: string | number | null;
  linked_quote_request_id?: string | number | null;
  location?: string;
  year?: number;
  duration?: string;
  budget?: string;
  status?: string;
  progress?: number;
  cover_image?: string;
  images?: string[];
  is_featured?: boolean;
  is_published?: boolean;
  start_date?: string;
  expected_end_date?: string;
  chef_chantier_id?: string | number | null;
  team_ids?: Array<string | number>;
}

export async function getPortfolioProjectsAdmin(params: { search?: string; page?: number; per_page?: number } = {}): Promise<PaginatedResponse<PortfolioProjectAdmin>> {
  try {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', String(params.page));
    if (params.per_page) query.append('per_page', String(params.per_page));

    const response = await fetch(`${API_URL}/admin/portfolio-projects?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    const result = await response.json();

    if (result.success && result.data && Array.isArray(result.data.data)) {
      return {
        success: true,
        data: result.data.data,
        meta: {
          current_page: result.data.current_page,
          last_page: result.data.last_page,
          per_page: result.data.per_page,
          total: result.data.total,
        },
      };
    }

    return {
      success: false,
      data: [],
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 },
    };
  } catch (error) {
    console.error('Error fetching portfolio projects:', error);
    return {
      success: false,
      data: [],
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 },
    };
  }
}

export async function getQuoteRequestsForProjectLink(params: { search?: string; per_page?: number } = {}): Promise<ApiResponse<QuoteRequestLinkOption[]>> {
  try {
    const query = new URLSearchParams();
    query.append('quote_only', '1');
    query.append('per_page', String(params.per_page ?? 100));
    if (params.search) query.append('search', params.search);

    const response = await fetch(`${API_URL}/admin/contacts?${query.toString()}`, {
      headers: getAuthHeaders(),
    });

    const result = await response.json();

    if (!result.success || !Array.isArray(result.data)) {
      return {
        success: false,
        message: result.message || 'Impossible de charger les devis.',
      };
    }

    return {
      success: true,
      data: result.data.map((contact: any) => ({
        id: Number(contact.id),
        quote_number: contact.quote_number ?? null,
        name: contact.name,
        email: contact.email,
        company: contact.company ?? null,
        subject: contact.subject,
        status: contact.status,
        service_type: contact.service_type ?? null,
        created_at: contact.created_at,
      })),
    };
  } catch (error) {
    console.error('Error fetching quote requests for project link:', error);
    return { success: false, message: 'Erreur de connexion au serveur' };
  }
}

export async function createPortfolioProject(payload: PortfolioProjectPayload): Promise<ApiResponse<PortfolioProjectAdmin>> {
  try {
    const response = await fetch(`${API_URL}/admin/portfolio-projects`, {
      method: 'POST',
      headers: getAuthHeaders({ json: true }),
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (error) {
    console.error('Error creating portfolio project:', error);
    return { success: false, message: 'Erreur de connexion au serveur' };
  }
}

export async function getPortfolioProjectAdmin(id: number | string): Promise<ApiResponse<PortfolioProjectAdmin>> {
  try {
    const response = await fetch(`${API_URL}/admin/portfolio-projects/${id}`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching portfolio project:', error);
    return { success: false, message: 'Erreur de connexion au serveur' };
  }
}

export async function updatePortfolioProject(id: number, payload: Partial<PortfolioProjectPayload>): Promise<ApiResponse<PortfolioProjectAdmin>> {
  try {
    const response = await fetch(`${API_URL}/admin/portfolio-projects/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ json: true }),
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating portfolio project:', error);
    return { success: false, message: 'Erreur de connexion au serveur' };
  }
}

export async function deletePortfolioProject(id: number): Promise<ApiResponse<null>> {
  try {
    const response = await fetch(`${API_URL}/admin/portfolio-projects/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Error deleting portfolio project:', error);
    return { success: false, message: 'Erreur de connexion au serveur' };
  }
}

export async function uploadPortfolioImage(file: File): Promise<ApiResponse<{ url: string; full_url: string; path: string }>> {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const token = tokenStorage.getToken();
    const response = await fetch(`${API_URL}/admin/portfolio-projects/upload-image`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    return await response.json();
  } catch (error) {
    console.error('Error uploading portfolio image:', error);
    return { success: false, message: 'Erreur de connexion au serveur' };
  }
}

// ==========================================
// Financial Reports
// ==========================================

export interface FinancialReport {
  id: number;
  title: string;
  type: string;
  period_start: string;
  period_end: string;
  file_path: string;
  created_at: string;
  is_auto_generated: boolean;
  status: string;
  creator?: {
    id: number;
    name: string;
  };
  metadata?: any;
}

export type FinancialReportPeriodType = 'monthly' | 'current_year' | 'previous_year';

export interface FinancialReportGenerationPayload {
  period_type?: FinancialReportPeriodType;
  month?: number;
  year?: number;
}

function buildFinancialReportGenerationPayload(
  payloadOrMonth: number | FinancialReportGenerationPayload,
  year?: number,
): FinancialReportGenerationPayload {
  if (typeof payloadOrMonth === 'number') {
    return {
      period_type: 'monthly',
      month: payloadOrMonth,
      year: year ?? new Date().getFullYear(),
    };
  }

  return {
    period_type: payloadOrMonth.period_type ?? 'monthly',
    ...(typeof payloadOrMonth.month === 'number' ? { month: payloadOrMonth.month } : {}),
    ...(typeof payloadOrMonth.year === 'number' ? { year: payloadOrMonth.year } : {}),
  };
}


export async function getFinancialReportsSecretary(type?: string): Promise<PaginatedResponse<FinancialReport>> {
  try {
    const params = new URLSearchParams();
    if (type) params.append('type', type);

    const response = await fetch(`${API_URL}/secretaire/reports/financial?${params.toString()}`, {
      headers: getAuthHeaders(),
    });

    const result = await response.json();

    if (result.success && result.data && result.data.data && Array.isArray(result.data.data)) {
      return {
        success: true,
        data: result.data.data,
        meta: {
          current_page: result.data.current_page,
          last_page: result.data.last_page,
          per_page: result.data.per_page,
          total: result.data.total
        }
      };
    }
    return result;
  } catch (error) {
    console.error('Error fetching secretary financial reports:', error);
    return {
      success: false,
      data: [],
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 }
    };
  }
}

export async function getFinancialReports(type?: string): Promise<PaginatedResponse<FinancialReport>> {
  try {
    const params = new URLSearchParams();
    if (type) params.append('type', type);

    const response = await fetch(`${API_URL}/admin/reports/financial?${params.toString()}`, {
      headers: getAuthHeaders(),
    });

    const result = await response.json();

    if (result.success && result.data && result.data.data && Array.isArray(result.data.data)) {
      return {
        success: true,
        data: result.data.data,
        meta: {
          current_page: result.data.current_page,
          last_page: result.data.last_page,
          per_page: result.data.per_page,
          total: result.data.total
        }
      };
    }

    return result;
  } catch (error) {
    console.error('Error fetching financial reports:', error);
    return {
      success: false,
      data: [],
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 }
    };
  }
}

export async function generateFinancialReport(
  payloadOrMonth: number | FinancialReportGenerationPayload,
  year?: number,
): Promise<ApiResponse<FinancialReport>> {
  try {
    const response = await fetch(`${API_URL}/admin/reports/financial/generate`, {
      method: 'POST',
      headers: getAuthHeaders({ json: true }),
      body: JSON.stringify(buildFinancialReportGenerationPayload(payloadOrMonth, year)),
    });
    return await response.json();
  } catch (error) {
    console.error('Error generating financial report:', error);
    return { success: false, message: 'Erreur de connexion au serveur' };
  }
}

export async function uploadFinancialReport(data: FormData): Promise<ApiResponse<FinancialReport>> {
  try {
    const response = await fetch(`${API_URL}/secretaire/reports/financial`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${tokenStorage.getToken()}`,
      },
      body: data,
    });
    return await response.json();
  } catch (error) {
    console.error('Error uploading financial report:', error);
    return { success: false, message: 'Erreur de connexion au serveur' };
  }
}

export async function generateFinancialReportSecretary(
  payloadOrMonth: number | FinancialReportGenerationPayload,
  year?: number,
): Promise<ApiResponse<FinancialReport>> {
  try {
    const response = await fetch(`${API_URL}/secretaire/reports/financial/generate`, {
      method: 'POST',
      headers: getAuthHeaders({ json: true }),
      body: JSON.stringify(buildFinancialReportGenerationPayload(payloadOrMonth, year)),
    });
    return await response.json();
  } catch (error) {
    console.error('Error generating financial report:', error);
    return { success: false, message: 'Erreur de connexion au serveur' };
  }
}

// Project Reports (Rapports Chantiers)
export interface ProjectReport {
  id: number;
  title: string;
  type: string;
  file_path: string;
  created_at: string;
  chantier_id: number;
  chantier?: {
    id: number;
    title: string;
  };
  creator: {
    id: number;
    name: string;
  };
}

export async function getProjectReports(): Promise<PaginatedResponse<ProjectReport>> {
  try {
    const response = await fetch(`${API_URL}/chef-chantier/rapports`, {
      headers: getAuthHeaders(),
    });

    const result = await response.json();

    if (result.success && result.data && result.data.data && Array.isArray(result.data.data)) {
      return {
        success: true,
        data: result.data.data,
        meta: {
          current_page: result.data.current_page,
          last_page: result.data.last_page,
          per_page: result.data.per_page,
          total: result.data.total
        }
      };
    }

    return result;
  } catch (error) {
    console.error('Error fetching project reports:', error);
    return {
      success: false,
      data: [],
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 }
    };
  }
}
