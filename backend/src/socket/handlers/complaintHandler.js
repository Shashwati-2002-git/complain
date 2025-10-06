/**
 * Complaint Handler - Manages real-time updates for complaints
 */
import { Complaint } from '../../models/Complaint.js';
import { sendNotification } from './notificationHandler.js';
import { getConnectedUsers } from './connectionHandler.js';
import { createNotification } from '../../services/notificationService.js';
import { autoAssignTicket, manualAssignTicket } from '../../services/ticketAssignmentService.js';

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
    
    // Update complaint status
    socket.on('update_complaint_status', async ({ complaintId, status, note }) => {
      try {
        // Security check - only agents and admins can update status
        if (!['agent', 'admin'].includes(socket.user.role)) {
          socket.emit('error', { message: 'Unauthorized to update complaint status' });
          return;
        }
        
        const complaint = await Complaint.findById(complaintId);
        
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