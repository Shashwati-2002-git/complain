// ApiService.ts - API Service for frontend-backend communication
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Log API URL during initialization to detect environment issues
console.log(`API Service initialized with base URL: ${API_BASE_URL}`);

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  networkError?: boolean; // Flag to identify network-related errors
}

class ApiService {
  private timeout = 20000; // 20 second timeout for requests
  
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      // Add token expiry check based on JWT structure (optional)
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        const expiryTime = tokenData.exp * 1000; // Convert to milliseconds
        
        // Only add token if not expired (with 10s buffer)
        if (Date.now() < expiryTime - 10000) {
          headers['Authorization'] = `Bearer ${token}`;
        } else {
          console.warn('Token appears to be expired, not adding to request');
          // Trigger token refresh
          window.dispatchEvent(new Event('tokenExpired'));
        }
      } catch (e) {
        // If we can't parse the token, just use it anyway
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = 2 // Default to 2 retries
  ): Promise<ApiResponse<T>> {
    try {
      // Add timestamp to prevent caching issues
      const url = new URL(`${API_BASE_URL}${endpoint}`); 
      if (!endpoint.includes('?')) {
        url.searchParams.append('_t', Date.now().toString());
      }

      const response = await fetch(url.toString(), {
        headers: this.getAuthHeaders(),
        ...options,
      });

      // Safely parse JSON
      let data: any = undefined;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          // Handle non-JSON responses
          const text = await response.text();
          data = text ? { message: text } : {};
        }
      } catch (parseError) {
        // Empty response or invalid JSON
        console.warn('Failed to parse response:', parseError);
        data = {};
      }

      // Handle token expiration
      if (response.status === 401 && data?.message?.includes('expired')) {
        console.log('Token expired, attempting refresh...');
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            const refreshResult = await this.refreshToken(refreshToken);
            if (refreshResult.data?.token) {
              // Save new token
              localStorage.setItem('token', refreshResult.data.token);
              if (refreshResult.data.refreshToken) {
                localStorage.setItem('refreshToken', refreshResult.data.refreshToken);
              }
              
              // Retry the original request
              return this.request(endpoint, options, 0); // No more retries
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            // Clear tokens on refresh failure
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            window.dispatchEvent(new Event('tokenExpired'));
          }
        }
      }

      if (!response.ok) {
        const error = data?.error || data?.message || `API Error: ${response.status} ${response.statusText}`;
        console.error(`API Error (${response.status}):`, error);
        return { error };
      }

      return { data };
    } catch (error: any) {
      console.error('API request failed:', error);
      
      // Retry logic for network errors
      if (retries > 0 && (error instanceof TypeError || error.message?.includes('network'))) {
        console.log(`Retrying request to ${endpoint} (${retries} attempts left)...`);
        // Exponential backoff with jitter
        const delay = Math.min(1000 * (3 - retries) + Math.random() * 1000, 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.request(endpoint, options, retries - 1);
      }
      
      return { 
        error: error?.message || 'Network error occurred', 
        networkError: true 
      };
    }
  }

  // --------------------- Auth Endpoints ---------------------
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: string;
    department?: string;
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async refreshToken(token: string) {
    try {
      // Use a direct fetch call here to avoid circular dependencies
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { error: errorData?.error || errorData?.message || 'Failed to refresh token' };
      }
      
      const data = await response.json();
      return { data };
    } catch (error: any) {
      console.error('Token refresh network error:', error);
      return { error: 'Network error during token refresh', networkError: true };
    }
  }

  // --------------------- Complaint Endpoints ---------------------
  async getComplaints(filters?: Record<string, any>) {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return this.request(`/complaints${query ? `?${query}` : ''}`);
  }

  async getComplaint(id: string) {
    return this.request(`/complaints/${id}`);
  }

  async createComplaint(complaintData: {
    title: string;
    description: string;
    category?: string;
    attachments?: string[];
  }) {
    return this.request('/complaints', {
      method: 'POST',
      body: JSON.stringify(complaintData),
    });
  }

  async updateComplaintStatus(id: string, status: string, message?: string) {
    return this.request(`/complaints/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, message }),
    });
  }

  async assignComplaint(id: string, agentId: string) {
    return this.request(`/complaints/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ agentId }),
    });
  }

  async addComplaintUpdate(id: string, updateData: {
    message: string;
    type?: string;
    isInternal?: boolean;
    attachments?: string[];
  }) {
    return this.request(`/complaints/${id}/updates`, {
      method: 'POST',
      body: JSON.stringify(updateData),
    });
  }

  async escalateComplaint(id: string, reason: string) {
    return this.request(`/complaints/${id}/escalate`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  async submitFeedback(id: string, rating: number, comment: string) {
    return this.request(`/complaints/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    });
  }

  // --------------------- User Endpoints ---------------------
  async getUserProfile() {
    return this.request('/users/profile');
  }

  async updateUserProfile(profileData: any) {
    return this.request('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/users/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // --------------------- Analytics ---------------------
  async getDashboardAnalytics(timeRange: string = '30') {
    return this.request(`/analytics/dashboard?timeRange=${timeRange}`);
  }

  async getTeamPerformance(timeRange: string = '30') {
    return this.request(`/analytics/team-performance?timeRange=${timeRange}`);
  }

  async getCategoryTrends(timeRange: string = '90') {
    return this.request(`/analytics/trends/category?timeRange=${timeRange}`);
  }

  async getSLACompliance(timeRange: string = '30') {
    return this.request(`/analytics/sla-compliance?timeRange=${timeRange}`);
  }

  // --------------------- Admin ---------------------
  async getSystemStats() {
    return this.request('/admin/stats');
  }

  async getAllUsers(filters?: Record<string, any>) {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return this.request(`/admin/users${query ? `?${query}` : ''}`);
  }

  async updateUser(id: string, userData: any) {
    return this.request(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  }

  async bulkAssignComplaints(complaintIds: string[], agentId: string) {
    return this.request('/admin/complaints/bulk-assign', {
      method: 'PATCH',
      body: JSON.stringify({ complaintIds, agentId }),
    });
  }

  // --------------------- Notifications ---------------------
  async getNotifications() {
    return this.request('/notifications');
  }

  async markNotificationAsRead(id: string) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/read-all', {
      method: 'PATCH',
    });
  }

  async getNotificationPreferences() {
    return this.request('/notifications/preferences');
  }

  async updateNotificationPreferences(preferences: any) {
    return this.request('/notifications/preferences', {
      method: 'PATCH',
      body: JSON.stringify(preferences),
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
