// ApiService.ts - API Service for frontend-backend communication
import type { Agent } from './agentService';  // Import the Agent interface

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

console.log(`API Service initialized with base URL: ${API_BASE_URL}`);

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  networkError?: boolean; // Flag to identify network-related errors
}

class ApiService {
  private readonly timeout = 20000; // 20 second timeout for requests

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };

    if (token) {
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const expiryTime = payload.exp * 1000; // convert to milliseconds
          if (Date.now() < expiryTime - 10000) {
            headers['Authorization'] = `Bearer ${token}`;
          } else {
            console.warn('Token expired, not adding to request');
            window.dispatchEvent(new Event('tokenExpired'));
          }
        } else {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (err) {
        console.debug('Failed to parse token, using it anyway', err);
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = 2
  ): Promise<ApiResponse<T>> {
    try {
      const url = new URL(`${API_BASE_URL}${endpoint}`);
      if (!endpoint.includes('?')) url.searchParams.append('_t', Date.now().toString());

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      let response: Response;
      try {
        response = await fetch(url.toString(), {
          headers: this.getAuthHeaders(),
          signal: controller.signal,
          ...options,
        });
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }

      let data = {} as Record<string, unknown>;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          data = text ? { message: text } : {};
        }
      } catch {
        // Ignore parse errors
        data = {};
      }

      // Handle token expiry
      if (response.status === 401 && typeof data.message === 'string' && data.message.includes('expired')) {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const refreshResult = await this.refreshToken(refreshToken);
          if (refreshResult.data?.token) {
            localStorage.setItem('token', refreshResult.data.token);
            if (refreshResult.data.refreshToken) localStorage.setItem('refreshToken', refreshResult.data.refreshToken);
            return this.request(endpoint, options, 0);
          }
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.dispatchEvent(new Event('tokenExpired'));
        }
      }

      if (!response.ok) {
        let errorMsg: string;
        if (typeof data.error === 'string') {
          errorMsg = data.error;
        } else if (typeof data.message === 'string') {
          errorMsg = data.message;
        } else {
          errorMsg = `API Error: ${response.status}`;
        }
        return { error: errorMsg };
      }

      return { data: data as T };
    } catch (err) {
      // Retry logic for network errors
      if (retries > 0 && (err instanceof TypeError || (err instanceof Error && err.message.includes('network')))) {
        const delay = Math.min(1000 * (3 - retries) + Math.random() * 1000, 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.request(endpoint, options, retries - 1);
      }

      const errorMessage = err instanceof Error ? err.message : 'Network error occurred';
      return { error: errorMessage, networkError: true };
    }
  }

  // --------------------- Auth ---------------------
  async login(email: string, password: string) {
    return this.request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  }

  async register(userData: { firstName: string; lastName: string; email: string; password: string; role?: string; department?: string }) {
    return this.request('/auth/register', { method: 'POST', body: JSON.stringify(userData) });
  }

  async refreshToken(token: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { error: errorData?.error || errorData?.message || 'Failed to refresh token' };
      }
      const data = await response.json();
      return { data };
    } catch {
      return { error: 'Network error during token refresh', networkError: true };
    }
  }

  // --------------------- Complaints ---------------------
  async getComplaints(filters?: Record<string, string | number | boolean>) {
    const queryParams = new URLSearchParams();
    if (filters) Object.entries(filters).forEach(([k, v]) => v !== undefined && v !== null && queryParams.append(k, String(v)));
    return this.request(`/complaints${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
  }

  async getComplaint(id: string) { return this.request(`/complaints/${id}`); }
  async createComplaint(data: { title: string; description: string; category?: string; attachments?: string[] }) {
    return this.request('/complaints', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateComplaintStatus(id: string, status: string, message?: string) {
    return this.request(`/complaints/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, message }) });
  }
  async assignComplaint(id: string, agentId: string) {
    return this.request(`/complaints/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ agentId }) });
  }
  async addComplaintUpdate(id: string, data: { message: string; type?: string; isInternal?: boolean; attachments?: string[] }) {
    return this.request(`/complaints/${id}/updates`, { method: 'POST', body: JSON.stringify(data) });
  }
  async escalateComplaint(id: string, reason: string) { return this.request(`/complaints/${id}/escalate`, { method: 'PATCH', body: JSON.stringify({ reason }) }); }
  async submitFeedback(id: string, rating: number, comment: string) { return this.request(`/complaints/${id}/feedback`, { method: 'POST', body: JSON.stringify({ rating, comment }) }); }

  // --------------------- Users ---------------------
  async getUserProfile() { return this.request('/users/profile'); }
  async updateUserProfile(profileData: Record<string, unknown>) {
    return this.request('/users/profile', { method: 'PATCH', body: JSON.stringify(profileData) });
  }
  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/users/password', { method: 'PATCH', body: JSON.stringify({ currentPassword, newPassword }) });
  }

  // --------------------- Analytics ---------------------
  async getDashboardAnalytics(timeRange: string = '30') { return this.request(`/analytics/dashboard?timeRange=${timeRange}`); }
  async getTeamPerformance(timeRange: string = '30') { return this.request(`/analytics/team-performance?timeRange=${timeRange}`); }
  async getCategoryTrends(timeRange: string = '90') { return this.request(`/analytics/trends/category?timeRange=${timeRange}`); }
  async getSLACompliance(timeRange: string = '30') { return this.request(`/analytics/sla-compliance?timeRange=${timeRange}`); }

  // --------------------- Admin ---------------------
  async getSystemStats() { return this.request('/admin/stats'); }
  async getAllUsers(filters?: Record<string, string | number | boolean>) {
    const queryParams = new URLSearchParams();
    if (filters) Object.entries(filters).forEach(([k, v]) => v !== undefined && v !== null && queryParams.append(k, String(v)));
    return this.request(`/admin/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
  }
  async updateUser(id: string, userData: Record<string, unknown>) { return this.request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(userData) }); }
  async bulkAssignComplaints(ids: string[], agentId: string) { return this.request('/admin/complaints/bulk-assign', { method: 'PATCH', body: JSON.stringify({ complaintIds: ids, agentId }) }); }

  // --------------------- Notifications ---------------------
  async getNotifications() { return this.request('/notifications'); }
  async markNotificationAsRead(id: string) { return this.request(`/notifications/${id}/read`, { method: 'PATCH' }); }
  async markAllNotificationsAsRead() { return this.request('/notifications/read-all', { method: 'PATCH' }); }
  async getNotificationPreferences() { return this.request('/notifications/preferences'); }
  async updateNotificationPreferences(preferences: Record<string, unknown>) { return this.request('/notifications/preferences', { method: 'PATCH', body: JSON.stringify(preferences) }); }

  // --------------------- Agents ---------------------
  async getAllAgents() { return this.request<Agent[]>('/agents'); }
  async getAvailableAgents() { return this.request<Agent[]>('/agents/available'); }
  async updateAgentAvailability(agentId: string, status: 'available' | 'busy' | 'offline') { 
    return this.request<Agent>(`/agents/${agentId}/availability`, { method: 'PATCH', body: JSON.stringify({ status }) });
  }
  async refreshAgentAvailability(agentId: string) { 
    return this.request<Agent>(`/agents/${agentId}/refresh-availability`, { method: 'POST' });
  }
}

export const apiService = new ApiService();
export default apiService;
