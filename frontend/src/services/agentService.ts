import { apiService } from './apiService';

// Define and export the Agent interface for use in other files
export interface Agent {
  _id: string;
  name: string;
  email: string;
  role: string;
  availability: string;
}

export const agentService = {
  /**
   * Get a list of all agents
   */
  async getAllAgents() {
    return apiService.getAllAgents();
  },
  
  /**
   * Get a list of available agents
   */
  async getAvailableAgents() {
    return apiService.getAvailableAgents();
  },
  
  /**
   * Update agent availability status
   * @param agentId The ID of the agent
   * @param status The new availability status ('available', 'busy', 'offline')
   */
  async updateAvailability(agentId: string, status: 'available' | 'busy' | 'offline') {
    return apiService.updateAgentAvailability(agentId, status);
  },
  
  /**
   * Refresh agent availability based on active tickets
   * @param agentId The ID of the agent
   */
  async refreshAvailability(agentId: string) {
    return apiService.refreshAgentAvailability(agentId);
  }
};