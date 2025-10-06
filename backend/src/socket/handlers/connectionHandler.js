/**
 * Connection Handler - Manages socket connections, authentication, and disconnect events
 */
import { User } from '../../models/User.js';
import { Notification } from '../../models/Notification.js';

// Store connected users by userId for targeted messaging
const connectedUsers = new Map();

// Track connection attempts to prevent connection floods
const connectionAttempts = new Map();

// Tracks all online users with role information
let onlineUsersList = [];

/**
 * Update and broadcast online users list
 */
const updateOnlineUsers = async () => {
  try {
    // Get user details for all connected users
    const userIds = [...connectedUsers.keys()];
    
    if (userIds.length === 0) {
      onlineUsersList = [];
      return;
    }
    
    const users = await User.find({
      _id: { $in: userIds }
    }).select('name email role').lean();
    
    onlineUsersList = users.map(user => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      socketId: connectedUsers.get(user._id.toString())?.socketId
    }));
  } catch (error) {
    console.error('Error updating online users:', error);
  }
};

/**
 * Broadcast online users to all connected clients
 * @param {object} io - Socket.io instance
 */
export const broadcastOnlineUsers = (io) => {
  io.emit('online_users', onlineUsersList);
};

/**
 * Get list of all currently connected users
 * @returns {Map} Map of connected users
 */
export const getConnectedUsers = () => {
  return connectedUsers;
};

/**
 * Get list of online users with details
 * @returns {Array} Array of online user objects
 */
export const getOnlineUsersList = () => {
  return onlineUsersList;
};

/**
 * Initialize the connection handler
 * @param {object} io - Socket.io instance
 */
export const initConnectionHandler = (io) => {
  io.on('connection', async (socket) => {
    const clientIp = socket.handshake.address || 'unknown';
    const timestamp = Date.now();
    
    // Rate limit connection attempts
    if (connectionAttempts.has(clientIp)) {
      const attempts = connectionAttempts.get(clientIp);
      const recentAttempts = attempts.filter(time => timestamp - time < 10000); // Within 10 seconds
      
      if (recentAttempts.length >= 5) {
        console.log(`Too many connection attempts from ${clientIp}. Blocking connection.`);
        socket.disconnect();
        return;
      }
      
      connectionAttempts.set(clientIp, [...recentAttempts, timestamp]);
    } else {
      connectionAttempts.set(clientIp, [timestamp]);
    }
    
    console.log(`Client connected: ${socket.id} from ${clientIp}`);

    // User should be available from authentication middleware
    if (!socket.user) {
      console.error('Socket missing user data after middleware - this should never happen');
      socket.disconnect();
      return;
    }
    
    const user = socket.user;
    console.log(`User authenticated: ${user.name || `${user.firstName} ${user.lastName}`} (${user.role})`);
    
    // Store user connection for targeted messaging
    const userId = user._id.toString();
    
    // Check if this user already has an active connection
    const existingConnection = connectedUsers.get(userId);
    if (existingConnection) {
      console.log(`User ${userId} already has active connection ${existingConnection.socketId}, handling duplicate...`);
      
      // Force disconnect the old connection
      const oldSocket = io.sockets.sockets.get(existingConnection.socketId);
      if (oldSocket) {
        console.log(`Disconnecting previous socket ${existingConnection.socketId} for user ${userId}`);
        oldSocket.emit('error', { message: 'New login detected from another device' });
        oldSocket.disconnect();
      }
    }
    
    // Store the new connection
    connectedUsers.set(userId, {
      socketId: socket.id,
      userId,
      userName: user.name || `${user.firstName} ${user.lastName}`,
      role: user.role
    });
    
    console.log(`Total connected users: ${connectedUsers.size}`);
    
    // Send user their unread notifications
    try {
      const unreadNotifications = await Notification.find({
        recipient: userId,
        isRead: false
      }).sort({ createdAt: -1 });
      
      socket.emit('connected', { 
        user: { 
          id: userId, 
          name: user.name || `${user.firstName} ${user.lastName}`,
          role: user.role 
        },
        unreadNotifications
      });
    } catch (error) {
      console.error('Error retrieving notifications:', error);
    }
    
    // Broadcast online users to all clients
    await updateOnlineUsers();
    broadcastOnlineUsers(io);
    
    // Handle user disconnect
    socket.on('disconnect', async () => {
      console.log(`Client disconnected: ${socket.id}`);
      
      // Remove from connected users map
      for (const [id, conn] of connectedUsers.entries()) {
        if (conn.socketId === socket.id) {
          connectedUsers.delete(id);
          break;
        }
      }
      
      // Update and broadcast online users
      await updateOnlineUsers();
      broadcastOnlineUsers(io);
      
      console.log(`User disconnected. Remaining connected users: ${connectedUsers.size}`);
    });

    // Handle client errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });
};