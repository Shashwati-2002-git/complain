import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface NotificationType {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
}

interface OnlineUser {
  userId: string;
  name: string;
  role: string;
  connectedAt: string;
}

interface ComplaintUpdate {
  status?: string;
  priority?: string;
  assignedTo?: string;
  category?: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: NotificationType[];
  onlineUsers: OnlineUser[];
  sendMessage: (complaintId: string, message: string, isInternal?: boolean) => void;
  updateComplaint: (complaintId: string, updates: ComplaintUpdate, note?: string) => void;
  markNotificationsRead: (notificationIds: string[]) => void;
  joinComplaintRoom: (complaintId: string) => void;
  leaveComplaintRoom: (complaintId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [onlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (!token) return;

    // Initialize socket connection
    const newSocket = io('http://localhost:5000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connected', (data) => {
      console.log('User authenticated:', data.user);
      setNotifications(data.unreadNotifications || []);
    });

    // Notification handlers
    newSocket.on('notification', (data) => {
      setNotifications(prev => [data.notification, ...prev]);
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(data.notification.title, {
          body: data.notification.message,
          icon: '/favicon.ico'
        });
      }
    });

    // Real-time updates
    newSocket.on('complaint_updated', (data) => {
      // Trigger refetch in relevant contexts
      window.dispatchEvent(new CustomEvent('complaintUpdated', { 
        detail: data.complaint 
      }));
    });

    newSocket.on('dashboard_update', (data) => {
      // Trigger dashboard refresh
      window.dispatchEvent(new CustomEvent('dashboardUpdate', { 
        detail: data 
      }));
    });

    // Chat/messaging handlers
    newSocket.on('new_message', (data) => {
      window.dispatchEvent(new CustomEvent('newMessage', { 
        detail: data 
      }));
    });

    newSocket.on('internal_message', (data) => {
      window.dispatchEvent(new CustomEvent('internalMessage', { 
        detail: data 
      }));
    });

    // Typing indicators
    newSocket.on('user_typing', (data) => {
      window.dispatchEvent(new CustomEvent('userTyping', { 
        detail: data 
      }));
    });

    newSocket.on('user_stopped_typing', (data) => {
      window.dispatchEvent(new CustomEvent('userStoppedTyping', { 
        detail: data 
      }));
    });

    // Error handling
    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      // You could show a toast notification here
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [user, socket]); // Added socket to dependencies

  // Helper functions
  const sendMessage = (complaintId: string, message: string, isInternal = false) => {
    if (socket && isConnected) {
      socket.emit('send_message', {
        complaintId,
        message,
        isInternal
      });
    }
  };

  const updateComplaint = (complaintId: string, updates: ComplaintUpdate, note?: string) => {
    if (socket && isConnected) {
      socket.emit('complaint_update', {
        complaintId,
        updates,
        note
      });
    }
  };

  const markNotificationsRead = (notificationIds: string[]) => {
    if (socket && isConnected) {
      socket.emit('mark_notifications_read', notificationIds);
      setNotifications(prev => 
        prev.map(notif => 
          notificationIds.includes(notif._id) 
            ? { ...notif, isRead: true } 
            : notif
        )
      );
    }
  };

  const joinComplaintRoom = (complaintId: string) => {
    if (socket && isConnected) {
      socket.emit('join_complaint', complaintId);
    }
  };

  const leaveComplaintRoom = (complaintId: string) => {
    if (socket && isConnected) {
      socket.emit('leave_complaint', complaintId);
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    notifications,
    onlineUsers,
    sendMessage,
    updateComplaint,
    markNotificationsRead,
    joinComplaintRoom,
    leaveComplaintRoom
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};