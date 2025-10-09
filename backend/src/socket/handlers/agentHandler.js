/**
 * Agent Handler - Manages agent status and workload
 */
import { User } from '../../models/User.js';
import { Complaint } from '../../models/Complaint.js';
import { getAgentsWithWorkload } from '../../services/ticketAssignmentService.js';

/**
 * Broadcast agent status to all connected clients
 * @param {object} io - Socket.io instance
 */
export const broadcastAgentStatus = async (io) => {
  try {
    const agents = await getAgentsWithWorkload();
    io.emit('agent_status_update', agents);
  } catch (error) {
    console.error('Error broadcasting agent status:', error);
  }
};

/**
 * Initialize the agent handler
 * @param {object} io - Socket.io instance
 */
export const initAgentHandler = (io) => {
  io.on('connection', (socket) => {
    // Only proceed if user is an agent or admin
    if (!['agent', 'admin'].includes(socket.user.role)) {
      return;
    }
    
    // Update agent status (available, busy, offline)
    socket.on('update_agent_status', async ({ status }) => {
      try {
        if (!['available', 'busy', 'offline'].includes(status)) {
          socket.emit('error', { message: 'Invalid status' });
          return;
        }
        
        await User.findByIdAndUpdate(socket.user._id, {
          agentStatus: status,
          lastStatusChange: new Date()
        });
        
        // Emit updated status to the agent
        socket.emit('agent_status_changed', {
          status,
          timestamp: new Date()
        });
        
        // Broadcast updated agent workload to all clients
        await broadcastAgentStatus(io);
      } catch (error) {
        console.error('Error updating agent status:', error);
        socket.emit('error', { message: 'Failed to update agent status' });
      }
    });
    
    // Get list of complaints assigned to current agent
    socket.on('get_my_tickets', async ({ status, page = 1, limit = 10 }) => {
      try {
        const query = { assignedTo: socket.user._id };
        
        // Add status filter if provided
        if (status && status !== 'all') {
          query.status = status;
        }
        
        const tickets = await Complaint.find(query)
          .sort({ updatedAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate('userId', 'name email')
          .lean();
        
        const totalCount = await Complaint.countDocuments(query);
        
        socket.emit('my_tickets', {
          tickets,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
        });
      } catch (error) {
        console.error('Error fetching agent tickets:', error);
        socket.emit('error', { message: 'Failed to fetch tickets' });
      }
    });

    // Request update of all agent statuses
    socket.on('request_agent_status', async () => {
      try {
        if (socket.user.role !== 'admin') {
          socket.emit('error', { message: 'Unauthorized to access agent statuses' });
          return;
        }
        
        await broadcastAgentStatus(io);
      } catch (error) {
        console.error('Error requesting agent status:', error);
        socket.emit('error', { message: 'Failed to get agent statuses' });
      }
    });
  });
};