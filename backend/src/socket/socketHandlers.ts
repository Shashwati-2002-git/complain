import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export const setupSocketHandlers = (io: Server) => {
  // Middleware for socket authentication
  io.use(async (socket: any, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key') as { userId: string };
      const user = await User.findById(decoded.userId);

      if (!user || !user.isActive) {
        return next(new Error('Authentication error'));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.userId} connected`);

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Join role-based rooms
    if (socket.userRole === 'admin') {
      socket.join('admins');
    } else if (socket.userRole === 'agent') {
      socket.join('agents');
    }

    // Handle joining complaint-specific rooms
    socket.on('join_complaint', (complaintId: string) => {
      socket.join(`complaint_${complaintId}`);
      console.log(`User ${socket.userId} joined complaint room: ${complaintId}`);
    });

    // Handle leaving complaint-specific rooms
    socket.on('leave_complaint', (complaintId: string) => {
      socket.leave(`complaint_${complaintId}`);
      console.log(`User ${socket.userId} left complaint room: ${complaintId}`);
    });

    // Handle typing indicators for complaint updates
    socket.on('typing_start', (data: { complaintId: string }) => {
      socket.to(`complaint_${data.complaintId}`).emit('user_typing', {
        userId: socket.userId,
        complaintId: data.complaintId
      });
    });

    socket.on('typing_stop', (data: { complaintId: string }) => {
      socket.to(`complaint_${data.complaintId}`).emit('user_stopped_typing', {
        userId: socket.userId,
        complaintId: data.complaintId
      });
    });

    // Handle real-time complaint updates
    socket.on('complaint_update', (data: any) => {
      // Broadcast to all users in the complaint room
      io.to(`complaint_${data.complaintId}`).emit('complaint_updated', data);
      
      // Notify admins and agents
      io.to('admins').emit('complaint_activity', data);
      io.to('agents').emit('complaint_activity', data);
    });

    // Handle new message in complaint
    socket.on('new_message', (data: any) => {
      // Broadcast to complaint room
      io.to(`complaint_${data.complaintId}`).emit('message_received', data);
      
      // Notify assigned agent if they're not in the room
      if (data.assignedTo) {
        io.to(`user_${data.assignedTo}`).emit('new_complaint_message', data);
      }
    });

    // Handle escalation notifications
    socket.on('complaint_escalated', (data: any) => {
      // Notify all admins
      io.to('admins').emit('complaint_escalated', data);
      
      // Notify the user who created the complaint
      io.to(`user_${data.userId}`).emit('your_complaint_escalated', data);
    });

    // Handle SLA breach warnings
    socket.on('sla_breach_warning', (data: any) => {
      // Notify admins and the assigned agent
      io.to('admins').emit('sla_breach_warning', data);
      
      if (data.assignedTo) {
        io.to(`user_${data.assignedTo}`).emit('sla_breach_warning', data);
      }
    });

    // Handle assignment notifications
    socket.on('complaint_assigned', (data: any) => {
      // Notify the assigned agent
      io.to(`user_${data.assignedTo}`).emit('complaint_assigned_to_you', data);
      
      // Notify the complaint owner
      io.to(`user_${data.userId}`).emit('your_complaint_assigned', data);
    });

    // Handle status change notifications
    socket.on('status_changed', (data: any) => {
      // Notify complaint room
      io.to(`complaint_${data.complaintId}`).emit('status_updated', data);
      
      // Notify complaint owner
      io.to(`user_${data.userId}`).emit('your_complaint_status_changed', data);
      
      // Notify admins
      io.to('admins').emit('complaint_status_changed', data);
    });

    // Handle feedback notifications
    socket.on('feedback_submitted', (data: any) => {
      // Notify admins
      io.to('admins').emit('feedback_received', data);
      
      // Notify the assigned agent
      if (data.assignedTo) {
        io.to(`user_${data.assignedTo}`).emit('feedback_for_your_complaint', data);
      }
    });

    // Handle general notifications
    socket.on('send_notification', (data: any) => {
      if (data.targetUser) {
        // Send to specific user
        io.to(`user_${data.targetUser}`).emit('notification', data);
      } else if (data.targetRole) {
        // Send to all users of a specific role
        io.to(data.targetRole + 's').emit('notification', data);
      } else {
        // Broadcast to all connected users
        io.emit('notification', data);
      }
    });

    // Handle agent availability status
    socket.on('agent_status_change', (data: { status: 'available' | 'busy' | 'away' }) => {
      if (socket.userRole === 'agent') {
        // Broadcast agent status to admins
        io.to('admins').emit('agent_status_updated', {
          agentId: socket.userId,
          status: data.status,
          timestamp: new Date()
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
      
      // Notify other users if this was an agent
      if (socket.userRole === 'agent') {
        io.to('admins').emit('agent_disconnected', {
          agentId: socket.userId,
          timestamp: new Date()
        });
      }
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Utility functions for emitting events from API routes
  return {
    notifyComplaintUpdate: (complaintId: string, data: any) => {
      io.to(`complaint_${complaintId}`).emit('complaint_updated', data);
    },
    
    notifyNewComplaint: (data: any) => {
      io.to('admins').emit('new_complaint', data);
      io.to('agents').emit('new_complaint', data);
    },
    
    notifyAssignment: (agentId: string, data: any) => {
      io.to(`user_${agentId}`).emit('complaint_assigned_to_you', data);
    },
    
    notifyEscalation: (data: any) => {
      io.to('admins').emit('complaint_escalated', data);
    },
    
    notifySLABreach: (data: any) => {
      io.to('admins').emit('sla_breach', data);
      if (data.assignedTo) {
        io.to(`user_${data.assignedTo}`).emit('sla_breach_warning', data);
      }
    },
    
    broadcastSystemMessage: (message: string, type: 'info' | 'warning' | 'error' = 'info') => {
      io.emit('system_message', { message, type, timestamp: new Date() });
    }
  };
};
