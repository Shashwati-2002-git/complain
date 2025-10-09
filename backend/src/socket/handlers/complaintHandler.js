/**
 * Complaint Handler - Manages real-time updates for complaints
 */
import { Complaint } from '../../models/Complaint.js';
import { sendNotification } from './notificationHandler.js';
import { getConnectedUsers } from './connectionHandler.js';
import { createNotification } from '../../services/notificationService.js';
import { autoAssignTicket, manualAssignTicket } from '../../services/ticketAssignmentService.js';
import { User } from '../../models/User.js';

/**
 * Initialize the complaint handler
 * @param {object} io - Socket.io instance
 */
export const initComplaintHandler = (io) => {
  io.on('connection', (socket) => {
    // Join room for specific complaint to get real-time updates
    socket.on('join_complaint', async ({ complaintId }) => {
      try {
        // Security check - ensure user can access this complaint
        const complaint = await Complaint.findById(complaintId);
        
        if (!complaint) {
          socket.emit('error', { message: 'Complaint not found' });
          return;
        }
        
        // Users can only view their own complaints unless they're agents or admins
        const isOwner = complaint.userId?.toString() === socket.user._id.toString();
        const isAgentOrAdmin = ['agent', 'admin'].includes(socket.user.role);
        const isAssignedAgent = socket.user.role === 'agent' && 
                               complaint.agentId?.toString() === socket.user._id.toString();
        if (!isOwner && !isAgentOrAdmin) {
          socket.emit('error', { message: 'Unauthorized to access this complaint' });
          return;
        }
        
        // Join the complaint room to receive real-time updates
        const roomName = `complaint:${complaintId}`;
        socket.join(roomName);
        console.log(`User ${socket.user._id} joined room ${roomName}`);
        
        socket.emit('joined_complaint', { complaintId, roomName });
      } catch (error) {
        console.error('Error joining complaint room:', error);
        socket.emit('error', { message: 'Failed to join complaint room' });
      }
    });
    
    // Leave complaint room
    socket.on('leave_complaint', ({ complaintId }) => {
      const roomName = `complaint:${complaintId}`;
      socket.leave(roomName);
      console.log(`User ${socket.user._id} left room ${roomName}`);
      socket.emit('left_complaint', { complaintId });
    });
    
    // Handle new complaint created
    socket.on('new_complaint_created', async ({ complaintId }) => {
      try {
        // Fetch the newly created complaint with populated fields
        const complaint = await Complaint.findById(complaintId)
          .populate('userId', 'name email')
          .populate('agentId', 'name email role')
          .lean();
          
        if (!complaint) {
          console.error(`New complaint ${complaintId} not found in database`);
          return;
        }
        
        // Emit to all admins
        socket.broadcast.to('admin').emit('new_complaint', complaint);
        
        // If assigned to an agent, emit to that specific agent
        if (complaint.agentId) {
          socket.broadcast.to(`agent:${complaint.agentId._id}`).emit('new_complaint', complaint);
        } else {
          // If not assigned, broadcast to all agents
          socket.broadcast.to('agent').emit('new_complaint', complaint);
        }
        
        // Create notification for admins and agents
        await createNotification({
          title: 'New Complaint Filed',
          message: `A new complaint "${complaint.title}" has been filed`,
          type: 'complaint',
          targetUsers: ['admin', 'agent'],
          referenceId: complaint._id,
          data: { complaintId: complaint._id }
        });
        
        // Broadcast to dashboards to update stats
        socket.broadcast.to('admin').emit('dashboard_stats_update', { type: 'new_complaint' });
      } catch (error) {
        console.error('Socket error handling new complaint:', error);
      }
    });

    // Update complaint status
    socket.on('update_complaint_status', async ({ complaintId, status, note }) => {
      try {
        // Security check - only agents and admins can update status
        if (!['agent', 'admin'].includes(socket.user.role)) {
          socket.emit('error', { message: 'Unauthorized to update complaint status' });
          return;
        }
        
        const complaint = await Complaint.findById(complaintId)
          .populate('userId', 'name email')
          .populate('agentId', 'name email role');
        
        if (!complaint) {
          socket.emit('error', { message: 'Complaint not found' });
          return;
        }
        
        // Update complaint status
        const previousStatus = complaint.status;
        complaint.status = status;
        
        // Add status update to history
        complaint.statusHistory.push({
          status,
          updatedBy: socket.user._id,
          updatedAt: new Date(),
          note: note || ''
        });
        
        await complaint.save();
        
        // Broadcast to all users in the complaint room
        const roomName = `complaint:${complaintId}`;
        io.to(roomName).emit('complaint_status_updated', {
          complaintId,
          status,
          previousStatus,
          updatedBy: {
            id: socket.user._id,
            name: socket.user.name
          },
          updatedAt: new Date(),
          note
        });
        
        // Notify the user who owns the complaint
        if (complaint.userId) {
          socket.broadcast.to(`user:${complaint.userId._id}`).emit('complaint_status_update', {
            complaintId,
            status,
            updatedAt: new Date(),
            updatedBy: socket.user._id
          });
          
          // Create notification for the user
          await createNotification({
            title: 'Complaint Status Updated',
            message: `Your complaint "${complaint.title}" is now ${status}`,
            type: 'status_update',
            targetUsers: [complaint.userId._id],
            referenceId: complaint._id,
            data: { complaintId, status }
          });
        }
        
        // Emit to admins for dashboard updates
        socket.broadcast.to('admin').emit('complaint_status_update', {
          complaintId,
          status,
          updatedAt: new Date(),
          updatedBy: socket.user._id
        });
        
        // If assigned to an agent, emit to that agent (unless they made the update)
        if (complaint.agentId && complaint.agentId._id.toString() !== socket.user._id.toString()) {
          socket.broadcast.to(`agent:${complaint.agentId._id}`).emit('complaint_status_update', {
            complaintId,
            status,
            updatedAt: new Date(),
            updatedBy: socket.user._id
          });
        }
        
        // Broadcast to dashboards to update stats
        io.to('admin').emit('dashboard_stats_update', { type: 'status_update' });
        
        // Update agent workload data for admin dashboard
        const agents = await User.find({ role: 'agent' })
          .select('name email activeComplaints')
          .lean();
          
        io.to('admin').emit('agent_status_update', agents);
      } catch (error) {
        console.error('Error updating complaint status:', error);
        socket.emit('error', { message: 'Error updating complaint status' });
      }
    });
    
    // Handle complaint assignment
    socket.on('assign_complaint', async ({ complaintId, agentId }) => {
      try {
        // Security check - only admins can assign complaints
        if (socket.user.role !== 'admin') {
          socket.emit('error', { message: 'Unauthorized to assign complaints' });
          return;
        }
        
        const complaint = await Complaint.findById(complaintId)
          .populate('userId', 'name email')
          .populate('agentId', 'name email role');
        
        if (!complaint) {
          socket.emit('error', { message: 'Complaint not found' });
          return;
        }
        
        // Get agent info
        const agent = await User.findById(agentId).select('name email').lean();
        if (!agent) {
          socket.emit('error', { message: 'Agent not found' });
          return;
        }
        
        // Update the complaint with the new agent
        const previousAgentId = complaint.agentId?._id;
        complaint.agentId = agentId;
        complaint.assignmentHistory.push({
          agentId,
          assignedBy: socket.user._id,
          assignedAt: new Date()
        });
        
        await complaint.save();
        
        // Emit to the assigned agent
        socket.broadcast.to(`agent:${agentId}`).emit('complaint_assigned', {
          complaint,
          assignedBy: socket.user._id
        });
        
        // Emit to the user who owns the complaint
        if (complaint.userId) {
          socket.broadcast.to(`user:${complaint.userId._id}`).emit('complaint_assigned', {
            complaintId,
            agentName: agent.name,
            assignedAt: new Date()
          });
          
          // Create notification for the user
          await createNotification({
            title: 'Agent Assigned',
            message: `Agent ${agent.name} has been assigned to your complaint`,
            type: 'assignment',
            targetUsers: [complaint.userId._id],
            referenceId: complaint._id,
            data: { complaintId, agentId }
          });
        }
        
        // Create notification for the agent
        await createNotification({
          title: 'New Complaint Assigned',
          message: `Complaint "${complaint.title}" has been assigned to you`,
          type: 'assignment',
          targetUsers: [agentId],
          referenceId: complaint._id,
          data: { complaintId }
        });
        
        // If there was a previous agent, notify them they're no longer assigned
        if (previousAgentId && previousAgentId.toString() !== agentId) {
          socket.broadcast.to(`agent:${previousAgentId}`).emit('complaint_unassigned', {
            complaintId,
            unassignedAt: new Date()
          });
          
          await createNotification({
            title: 'Complaint Reassigned',
            message: `Complaint "${complaint.title}" has been reassigned to another agent`,
            type: 'assignment',
            targetUsers: [previousAgentId],
            referenceId: complaint._id,
            data: { complaintId }
          });
        }
        
        // Update agent workload data for admin dashboard
        const agents = await User.find({ role: 'agent' })
          .select('name email activeComplaints')
          .lean();
          
        io.to('admin').emit('agent_status_update', agents);
        
        // Create and send notification to complaint owner
        const notification = await createNotification({
          type: 'status_update',
          recipient: complaint.userId,
          content: `Your complaint #${complaint.ticketNumber} status has been updated to ${status}`,
          reference: {
            type: 'complaint',
            id: complaintId
          }
        });
        
        sendNotification(io, notification, [complaint.userId]);
      } catch (error) {
        console.error('Error updating complaint status:', error);
        socket.emit('error', { message: 'Failed to update complaint status' });
      }
    });
    
    // Assign complaint to agent
    socket.on('assign_complaint', async ({ complaintId, agentId }) => {
      try {
        // Security check - only agents and admins can assign complaints
        if (!['agent', 'admin'].includes(socket.user.role)) {
          socket.emit('error', { message: 'Unauthorized to assign complaints' });
          return;
        }
        
        // If agentId is not provided, use auto-assignment
        if (!agentId) {
          const result = await autoAssignTicket(complaintId);
          if (!result.success) {
            socket.emit('error', { message: result.message });
            return;
          }
          agentId = result.agentId;
        } else {
          // Manual assignment
          const result = await manualAssignTicket(complaintId, agentId, socket.user._id);
          if (!result.success) {
            socket.emit('error', { message: result.message });
            return;
          }
        }
        
        const complaint = await Complaint.findById(complaintId)
          .populate('assignedTo', 'name email')
          .populate('userId', 'name email');
        
        // Broadcast to all users in the complaint room
        const roomName = `complaint:${complaintId}`;
        io.to(roomName).emit('complaint_assigned', {
          complaintId,
          agent: complaint.assignedTo,
          assignedBy: {
            id: socket.user._id,
            name: socket.user.name
          },
          assignedAt: new Date()
        });
        
        // Create and send notification to complaint owner
        const ownerNotification = await createNotification({
          type: 'agent_assigned',
          recipient: complaint.userId,
          content: `An agent has been assigned to your complaint #${complaint.ticketNumber}`,
          reference: {
            type: 'complaint',
            id: complaintId
          }
        });
        
        sendNotification(io, ownerNotification, [complaint.userId._id]);
        
        // Create and send notification to assigned agent
        const agentNotification = await createNotification({
          type: 'complaint_assigned',
          recipient: agentId,
          content: `You have been assigned to complaint #${complaint.ticketNumber}`,
          reference: {
            type: 'complaint',
            id: complaintId
          }
        });
        
        sendNotification(io, agentNotification, [agentId]);
      } catch (error) {
        console.error('Error assigning complaint:', error);
        socket.emit('error', { message: 'Failed to assign complaint' });
      }
    });

    // Listen for new complaint events
    socket.on('new_complaint', async ({ complaintData }) => {
      try {
        // Security check - ensure user is creating their own complaint
        complaintData.userId = socket.user._id;
        
        const complaint = new Complaint(complaintData);
        await complaint.save();
        
        socket.emit('complaint_created', { complaint });
        
        // Notify admins and agents of new complaint
        const connectedUsers = getConnectedUsers();
        const agentAdminTargets = [];
        
        // Collect agent and admin user IDs
        for (const [userId, conn] of connectedUsers.entries()) {
          if (['agent', 'admin'].includes(conn.role)) {
            agentAdminTargets.push(userId);
          }
        }
        
        // Create and send notification
        if (agentAdminTargets.length > 0) {
          const notification = await createNotification({
            type: 'new_complaint',
            recipient: agentAdminTargets,
            content: `New complaint #${complaint.ticketNumber} submitted: ${complaint.subject}`,
            reference: {
              type: 'complaint',
              id: complaint._id
            }
          });
          
          sendNotification(io, notification, agentAdminTargets);
        }
      } catch (error) {
        console.error('Error creating new complaint:', error);
        socket.emit('error', { message: 'Failed to create complaint' });
      }
    });
  });
};