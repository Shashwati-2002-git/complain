// API Service for frontend-backend communication

const API_BASE_URL = 'http://localhost:5000/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: this.getAuthHeaders(),
        ...options
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'An error occurred' };
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return { error: 'Network error occurred' };
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
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
      body: JSON.stringify(userData)
    });
  }

  async refreshToken(token: string) {
    return this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
  }

  // Complaint endpoints
  async getComplaints(filters?: {
    status?: string;
    category?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
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
      body: JSON.stringify(complaintData)
    });
  }

  async updateComplaintStatus(id: string, status: string, message?: string) {
    return this.request(`/complaints/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, message })
    });
  }

  async assignComplaint(id: string, agentId: string) {
    return this.request(`/complaints/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ agentId })
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
      body: JSON.stringify(updateData)
    });
  }

  async escalateComplaint(id: string, reason: string) {
    return this.request(`/complaints/${id}/escalate`, {
      method: 'PATCH',
      body: JSON.stringify({ reason })
    });
  }

  async submitFeedback(id: string, rating: number, comment: string) {
    return this.request(`/complaints/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment })
    });
  }

  // User endpoints
  async getUserProfile() {
    return this.request('/users/profile');
  }

  async updateUserProfile(profileData: any) {
    return this.request('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData)
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/users/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }

  // Analytics endpoints
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

  // Admin endpoints
  async getSystemStats() {
    return this.request('/admin/stats');
  }

  async getAllUsers(filters?: {
    role?: string;
    department?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
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
      body: JSON.stringify(userData)
    });
  }

  async bulkAssignComplaints(complaintIds: string[], agentId: string) {
    return this.request('/admin/complaints/bulk-assign', {
      method: 'PATCH',
      body: JSON.stringify({ complaintIds, agentId })
    });
  }

  // Notification endpoints
  async getNotifications() {
    return this.request('/notifications');
  }

  async markNotificationAsRead(id: string) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PATCH'
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/read-all', {
      method: 'PATCH'
    });
  }

  async getNotificationPreferences() {
    return this.request('/notifications/preferences');
  }

  async updateNotificationPreferences(preferences: any) {
    return this.request('/notifications/preferences', {
      method: 'PATCH',
      body: JSON.stringify(preferences)
    });
  }
}

export const apiService = new ApiService();
export default apiService;
