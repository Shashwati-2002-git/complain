import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Complaint } from '../models/Complaint.js';
import { Notification } from '../models/Notification.js';

// Store connected users by userId for targeted messaging
const connectedUsers = new Map();

export const handleConnection = (io) => {
  io.on('connection', async (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Authenticate user on connection
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        socket.emit('error', { message: 'Authentication required' });
        socket.disconnect();
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        socket.emit('error', { message: 'Invalid user' });
        socket.disconnect();
        return;
      }

      // Store user connection
      socket.userId = user._id.toString();
      socket.userRole = user.role;
      connectedUsers.set(socket.userId, {
        socketId: socket.id,
        user: user,
        connectedAt: new Date()
      });

      // Join user to their role-based room
      socket.join(`role_${user.role}`);
      socket.join(`user_${socket.userId}`);

      // Send welcome message with unread notifications
      const unreadNotifications = await Notification.find({
        userId: user._id,
        isRead: false
      }).sort({ createdAt: -1 }).limit(10);

      socket.emit('connected', {
        message: 'Connected successfully',
        user: {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role
        },
        unreadNotifications
      });

      console.log(`User ${user.firstName} ${user.lastName} (${user.role}) connected`);

    } catch (error) {
      console.error('Socket authentication error:', error);
      socket.emit('error', { message: 'Authentication failed' });
      socket.disconnect();
      return;
    }

    // Handle complaint updates
    socket.on('complaint_update', async (data) => {
      try {
        const { complaintId, updates, note } = data;
        
        // Verify user has permission to update this complaint
        const complaint = await Complaint.findById(complaintId).populate('userId assignedTo');
        
        if (!complaint) {
          socket.emit('error', { message: 'Complaint not found' });
          return;
        }

        // Permission check
        const canUpdate = 
          socket.userRole === 'admin' ||
          (socket.userRole === 'agent' && complaint.assignedTo?._id.toString() === socket.userId) ||
          (socket.userRole === 'user' && complaint.userId._id.toString() === socket.userId);

        if (!canUpdate) {
          socket.emit('error', { message: 'Permission denied' });
          return;
        }

        // Update complaint
        const updatedComplaint = await Complaint.findByIdAndUpdate(
          complaintId,
          {
            ...updates,
            ...(note && {
              $push: {
                internalNotes: {
                  note,
                  addedBy: socket.userId,
                  addedAt: new Date()
                }
              }
            }),
            updatedAt: new Date()
          },
          { new: true }
        ).populate('userId assignedTo');

        // Notify relevant users
        const notifyUsers = [
          complaint.userId._id.toString(), // Original complainant
          complaint.assignedTo?._id.toString(), // Assigned agent
        ].filter(Boolean);

        // Create notifications
        for (const userId of notifyUsers) {
          if (userId !== socket.userId) { // Don't notify the user who made the update
            const notification = new Notification({
              userId,
              title: 'Complaint Updated',
              message: `Complaint #${complaint.ticketNumber} has been updated`,
              type: 'complaint_update',
              relatedId: complaintId,
              metadata: {
                status: updatedComplaint.status,
                updatedBy: socket.userId
              }
            });
            await notification.save();

            // Send real-time notification
            io.to(`user_${userId}`).emit('notification', {
              type: 'complaint_update',
              complaint: updatedComplaint,
              notification: notification,
              timestamp: new Date()
            });
          }
        }

        // Broadcast to admins for dashboard updates
        io.to('role_admin').emit('dashboard_update', {
          type: 'complaint_updated',
          complaint: updatedComplaint,
          timestamp: new Date()
        });

        socket.emit('complaint_updated', { success: true, complaint: updatedComplaint });

      } catch (error) {
        console.error('Error updating complaint:', error);
        socket.emit('error', { message: 'Failed to update complaint' });
      }
    });

    // Handle new complaint submissions
    socket.on('new_complaint', async (complaintData) => {
      try {
        // Create new complaint
        const complaint = new Complaint({
          ...complaintData,
          userId: socket.userId,
          status: 'Registered',
          createdAt: new Date()
        });

        await complaint.save();
        await complaint.populate('userId');

        // Auto-assign logic (simplified)
        if (complaintData.autoAssign !== false) {
          const availableAgents = await User.find({
            role: 'agent',
            isActive: true,
            department: complaintData.category || 'General'
          });

          if (availableAgents.length > 0) {
            // Simple round-robin assignment
            const agentIndex = Math.floor(Math.random() * availableAgents.length);
            const assignedAgent = availableAgents[agentIndex];

            complaint.assignedTo = assignedAgent._id;
            complaint.status = 'In Progress';
            await complaint.save();
            await complaint.populate('assignedTo');

            // Notify assigned agent
            const agentNotification = new Notification({
              userId: assignedAgent._id,
              title: 'New Complaint Assigned',
              message: `You have been assigned complaint #${complaint.ticketNumber}`,
              type: 'assignment',
              relatedId: complaint._id
            });
            await agentNotification.save();

            io.to(`user_${assignedAgent._id}`).emit('notification', {
              type: 'new_assignment',
              complaint: complaint,
              notification: agentNotification,
              timestamp: new Date()
            });
          }
        }

        // Notify user of successful submission
        socket.emit('complaint_submitted', {
          success: true,
          complaint: complaint,
          message: 'Your complaint has been submitted successfully'
        });

        // Update admin dashboards
        io.to('role_admin').emit('dashboard_update', {
          type: 'new_complaint',
          complaint: complaint,
          timestamp: new Date()
        });

      } catch (error) {
        console.error('Error creating complaint:', error);
        socket.emit('error', { message: 'Failed to submit complaint' });
      }
    });

    // Handle chat messages (for real-time support)
    socket.on('send_message', async (data) => {
      try {
        const { complaintId, message, isInternal = false } = data;
        
        const complaint = await Complaint.findById(complaintId).populate('userId assignedTo');
        
        if (!complaint) {
          socket.emit('error', { message: 'Complaint not found' });
          return;
        }

        // Add message to complaint
        const messageData = {
          message,
          sentBy: socket.userId,
          sentAt: new Date(),
          isInternal
        };

        complaint.messages = complaint.messages || [];
        complaint.messages.push(messageData);
        await complaint.save();

        // Determine who should receive the message
        let recipients = [];
        
        if (isInternal) {
          // Internal messages only go to agents and admins
          recipients = [complaint.assignedTo?._id.toString()].filter(Boolean);
          io.to('role_admin').emit('internal_message', {
            complaintId,
            message: messageData,
            complaint
          });
        } else {
          // External messages go to user and assigned agent
          recipients = [
            complaint.userId._id.toString(),
            complaint.assignedTo?._id.toString()
          ].filter(Boolean);
        }

        // Send to specific recipients
        recipients.forEach(userId => {
          if (userId !== socket.userId) {
            io.to(`user_${userId}`).emit('new_message', {
              complaintId,
              message: messageData,
              complaint
            });
          }
        });

        socket.emit('message_sent', { success: true, message: messageData });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { complaintId } = data;
      socket.to(`complaint_${complaintId}`).emit('user_typing', {
        userId: socket.userId,
        complaintId
      });
    });

    socket.on('typing_stop', (data) => {
      const { complaintId } = data;
      socket.to(`complaint_${complaintId}`).emit('user_stopped_typing', {
        userId: socket.userId,
        complaintId
      });
    });

    // Handle notification read status
    socket.on('mark_notifications_read', async (notificationIds) => {
      try {
        await Notification.updateMany(
          { 
            _id: { $in: notificationIds },
            userId: socket.userId
          },
          { isRead: true, readAt: new Date() }
        );

        socket.emit('notifications_marked_read', { success: true });
      } catch (error) {
        console.error('Error marking notifications as read:', error);
        socket.emit('error', { message: 'Failed to mark notifications as read' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        console.log(`User ${socket.userId} disconnected`);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });
};

// Utility function to broadcast to specific users
export const broadcastToUser = (io, userId, event, data) => {
  io.to(`user_${userId}`).emit(event, data);
};

// Utility function to broadcast to all users of a specific role
export const broadcastToRole = (io, role, event, data) => {
  io.to(`role_${role}`).emit(event, data);
};

// Get connected users (for admin monitoring)
export const getConnectedUsers = () => {
  return Array.from(connectedUsers.values()).map(conn => ({
    userId: conn.user._id,
    name: `${conn.user.firstName} ${conn.user.lastName}`,
    role: conn.user.role,
    connectedAt: conn.connectedAt
  }));
};