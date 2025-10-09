import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { User } from '../models/User.js';
import { updateAgentAvailability, refreshAgentAvailability } from '../services/agentService.js';

const router = express.Router();

// Get all agents
router.get('/', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const agents = await User.find({ role: 'agent' }).select('-password');
  res.json(agents);
}));

// Get available agents
router.get('/available', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const availableAgents = await User.find({
    role: 'agent',
    availability: 'available'
  }).select('-password');
  
  res.json(availableAgents);
}));

// Update agent availability
router.patch('/:agentId/availability', authenticate, asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  const { status } = req.body;
  
  // Only the agent themselves or an admin can update availability
  if (
    req.user.role !== 'admin' && 
    req.user._id.toString() !== agentId
  ) {
    return res.status(403).json({
      error: 'Not authorized to update this agent\'s availability'
    });
  }
  
  // Validate status
  if (!['available', 'busy', 'offline'].includes(status)) {
    return res.status(400).json({
      error: 'Invalid availability status. Must be "available", "busy", or "offline"'
    });
  }
  
  try {
    const updatedAgent = await updateAgentAvailability(agentId, status);
    res.json(updatedAgent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// Refresh agent availability based on active tickets
router.post('/:agentId/refresh-availability', authenticate, asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  
  // Only the agent themselves or an admin can refresh availability
  if (
    req.user.role !== 'admin' && 
    req.user._id.toString() !== agentId
  ) {
    return res.status(403).json({
      error: 'Not authorized to refresh this agent\'s availability'
    });
  }
  
  try {
    const updatedAgent = await refreshAgentAvailability(agentId);
    res.json(updatedAgent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

export default router;