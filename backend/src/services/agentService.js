import { User } from '../models/User.js';
import { Complaint } from '../models/Complaint.js';

/**
 * Update an agent's availability status
 * @param {string} agentId - The ID of the agent
 * @param {string} status - The new availability status ('available', 'busy', 'offline')
 * @returns {Promise<object>} The updated agent user object
 */
export const updateAgentAvailability = async (agentId, status) => {
  try {
    // Verify that user is an agent
    const agent = await User.findById(agentId);
    
    if (!agent || agent.role !== 'agent') {
      throw new Error('Invalid agent ID or user is not an agent');
    }
    
    // Update the agent's availability
    agent.availability = status;
    await agent.save();
    
    return agent;
  } catch (error) {
    console.error('Error updating agent availability:', error);
    throw error;
  }
};

/**
 * Check if an agent is currently assigned to any active complaints
 * @param {string} agentId - The ID of the agent to check
 * @returns {Promise<boolean>} True if agent has active complaints, false otherwise
 */
export const hasActiveComplaints = async (agentId) => {
  try {
    const activeCount = await Complaint.countDocuments({
      assignedTo: agentId,
      status: { $nin: ['Resolved', 'Closed'] }
    });
    
    return activeCount > 0;
  } catch (error) {
    console.error('Error checking active complaints:', error);
    throw error;
  }
};

/**
 * Update agent availability based on active complaints
 * @param {string} agentId - The ID of the agent
 * @returns {Promise<object>} The updated agent with new availability
 */
export const refreshAgentAvailability = async (agentId) => {
  try {
    const hasActive = await hasActiveComplaints(agentId);
    
    // If no active complaints, mark as available; otherwise busy
    const newStatus = hasActive ? 'busy' : 'available';
    
    return await updateAgentAvailability(agentId, newStatus);
  } catch (error) {
    console.error('Error refreshing agent availability:', error);
    throw error;
  }
};