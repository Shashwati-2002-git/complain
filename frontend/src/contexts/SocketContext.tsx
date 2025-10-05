import React, {
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useTokenValidation } from '../hooks/useTokenValidation';
import { 
  SocketContext, 
  NotificationType, 
  OnlineUser,
  ComplaintUpdate,
  SocketContextType 
} from './SocketContextStore';

// -------------------- Provider Component --------------------

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { checkTokenExpiration } = useTokenValidation();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  // Request browser notification permission once
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  // -------------------- Setup Socket Event Listeners --------------------
  const setupSocketListeners = useCallback(
    (newSocket: Socket) => {
      newSocket.on('connect', () => {
        console.log('✅ Socket connected:', newSocket.id);
        setIsConnected(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('⚠️ Socket disconnected:', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.warn('Socket connection error:', error.message);
        setIsConnected(false);

        if (
          error.message.includes('auth') ||
          error.message.includes('token') ||
          error.message.includes('Invalid user')
        ) {
          console.warn('Authentication error. Refreshing token...');
          checkTokenExpiration().catch((err) => {
            console.error('Failed to refresh token:', err);
            localStorage.removeItem('token');
          });
        }
      });

      // Authenticated event
      newSocket.on(
        'connected',
        (data: { user: Record<string, unknown>; unreadNotifications: NotificationType[] }) => {
          console.log('User authenticated via socket:', data.user);
          setNotifications(data.unreadNotifications || []);
        }
      );

      // -------------------- Notifications --------------------
      newSocket.on('notification', (data: { notification: NotificationType }) => {
        setNotifications((prev) => [data.notification, ...prev]);

        if (Notification.permission === 'granted') {
          new Notification(data.notification.title, {
            body: data.notification.message,
            icon: '/favicon.ico',
          });
        }
      });

      // -------------------- Real-Time Events --------------------
      newSocket.on('online_users', (users: OnlineUser[]) => {
        setOnlineUsers(users);
      });

      newSocket.on('complaint_updated', (data) => {
        window.dispatchEvent(new CustomEvent('complaintUpdated', { detail: data.complaint }));
      });

      newSocket.on('dashboard_update', (data) => {
        window.dispatchEvent(new CustomEvent('dashboardUpdate', { detail: data }));
      });

      newSocket.on('new_message', (data) => {
        window.dispatchEvent(new CustomEvent('newMessage', { detail: data }));
      });

      newSocket.on('internal_message', (data) => {
        window.dispatchEvent(new CustomEvent('internalMessage', { detail: data }));
      });

      newSocket.on('user_typing', (data) => {
        window.dispatchEvent(new CustomEvent('userTyping', { detail: data }));
      });

      newSocket.on('user_stopped_typing', (data) => {
        window.dispatchEvent(new CustomEvent('userStoppedTyping', { detail: data }));
      });

      // -------------------- Error Handling --------------------
      newSocket.on('error', (error: Error) => {
        console.error('Socket error:', error);
        if (error.message === 'Invalid user') {
          checkTokenExpiration().catch((err) => {
            console.error('Failed to refresh token after invalid user:', err);
          });
        }
      });

      // -------------------- Reconnection Handling --------------------
      newSocket.io.on('reconnect_attempt', () => {
        console.log('🔄 Socket reconnection attempt...');
        const freshToken = localStorage.getItem('token');
        if (freshToken) newSocket.auth = { token: freshToken };
      });
    },
    [checkTokenExpiration]
  );

  // -------------------- Socket Connection --------------------
  const connectSocket = useCallback(
    (token: string) => {
      const newSocket = io(
        import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001',
        {
          auth: {
            token,
            userId: user?.id,
          },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          timeout: 10000,
        }
      );

      setupSocketListeners(newSocket);
      setSocket(newSocket);
      return newSocket;
    },
    [user, setupSocketListeners]
  );

  // -------------------- Manage Lifecycle --------------------
  useEffect(() => {
    if (!user) {
      socket?.disconnect();
      setSocket(null);
      setIsConnected(false);
      return;
    }

    let socketInstance: Socket | null = null;

    const initializeSocket = async () => {
      const isValid = await checkTokenExpiration();
      if (!isValid) return;

      const token = localStorage.getItem('token');
      if (!token) return;

      socketInstance = connectSocket(token);
    };

    initializeSocket();

    return () => {
      if (socketInstance) {
        console.log('🛑 Disconnecting socket on cleanup');
        socketInstance.disconnect();
      }
    };
  }, [user, connectSocket, checkTokenExpiration, socket]);

  // -------------------- Helper Functions --------------------
  const sendMessage = useCallback(
    (complaintId: string, message: string, isInternal = false) => {
      if (socket && isConnected) {
        socket.emit(isInternal ? 'internal_message' : 'send_message', {
          complaintId,
          message,
        });
      } else {
        console.warn('Cannot send message: socket not connected');
      }
    },
    [socket, isConnected]
  );

  const updateComplaint = useCallback(
    (complaintId: string, updates: ComplaintUpdate, note?: string) => {
      if (socket && isConnected) {
        socket.emit('update_complaint', { complaintId, updates, note });
      } else {
        console.warn('Cannot update complaint: socket not connected');
      }
    },
    [socket, isConnected]
  );

  const markNotificationsRead = useCallback(
    (notificationIds: string[]) => {
      if (socket && isConnected && notificationIds.length > 0) {
        socket.emit('mark_notifications_read', { notificationIds });
        setNotifications((prev) =>
          prev.map((n) =>
            notificationIds.includes(n._id) ? { ...n, isRead: true } : n
          )
        );
      }
    },
    [socket, isConnected]
  );

  const joinComplaintRoom = useCallback(
    (complaintId: string) => {
      socket?.emit('join_complaint', { complaintId });
    },
    [socket]
  );

  const leaveComplaintRoom = useCallback(
    (complaintId: string) => {
      socket?.emit('leave_complaint', { complaintId });
    },
    [socket]
  );

  // -------------------- Context Value --------------------
  const contextValue: SocketContextType = {
    socket,
    isConnected,
    notifications,
    onlineUsers,
    sendMessage,
    updateComplaint,
    markNotificationsRead,
    joinComplaintRoom,
    leaveComplaintRoom,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
