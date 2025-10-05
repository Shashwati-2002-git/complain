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
  const { user, logout } = useAuth();
  const { checkTokenExpiration, refreshToken } = useTokenValidation();

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
      newSocket.on('error', (error: { message: string }) => {
        console.error('Socket error:', error);
        
        // Maintain a counter of errors in localStorage to prevent infinite loops
        const errorCount = parseInt(localStorage.getItem('socketErrorCount') || '0', 10);
        const errorTime = parseInt(localStorage.getItem('socketErrorTime') || '0', 10);
        const now = Date.now();
        
        // Reset error count if last error was more than 1 minute ago
        if (now - errorTime > 60000) {
          localStorage.setItem('socketErrorCount', '1');
          localStorage.setItem('socketErrorTime', now.toString());
        } else {
          // Increment error count
          localStorage.setItem('socketErrorCount', (errorCount + 1).toString());
          localStorage.setItem('socketErrorTime', now.toString());
          
          // If too many errors in a short time, back off reconnection attempts
          if (errorCount > 5) {
            console.warn(`Too many socket errors (${errorCount}). Backing off for 30 seconds...`);
            return; // Don't attempt to reconnect immediately
          }
        }
        
        // Handle "New login" message specifically to prevent reconnection loops
        if (error.message === 'New login detected from another device') {
          console.log('New login detected - this is normal if you have multiple tabs open');
          // Mark this as a duplicate connection in localStorage to prevent immediate reconnect
          localStorage.setItem('socketDuplicateDetected', Date.now().toString());
          // Don't take any action, the server is handling the duplicate login
          return;
        }
        
        // Handle connection failures
        if (error.message?.includes('failed') || error.message?.includes('refused')) {
          console.error('Socket connection failure. Will attempt again later.');
          // Track the failure time to avoid rapid reconnection attempts
          localStorage.setItem('socketConnectionFailure', Date.now().toString());
        }
        
        // Handle all authentication-related errors
        if (error.message === 'Invalid user' || 
            error.message === 'Authentication failed' || 
            error.message === 'Token expired' || 
            error.message === 'Invalid token payload') {
              
          // Force disconnect the socket immediately
          console.log('Authentication error detected. Disconnecting socket...');
          newSocket.disconnect();
          
          // Wait a bit before trying to refresh token to prevent rapid attempts
          setTimeout(() => {
            console.log('Attempting token refresh...');
            
            // Try direct token refresh instead of checkTokenExpiration
            refreshToken()
              .then((isValid: boolean) => {
                console.log('Token refresh attempt result:', isValid ? 'success' : 'failed');
                
                if (isValid) {
                  console.log('Token refreshed successfully, will reconnect on next lifecycle');
                  // Reset error count since we successfully refreshed
                  localStorage.setItem('socketErrorCount', '0');
                  // Let the useEffect handle reconnection rather than doing it here
                  // This avoids having multiple socket connections
                } else {
                  console.warn('Token refresh failed. User needs to log in again.');
                  localStorage.removeItem('token');
                  localStorage.removeItem('refreshToken');
                  logout();
                }
              })
              .catch((err: Error) => {
                console.error('Failed to refresh token:', err);
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                logout();
              });
          }, 2000);
        }
      });

      // -------------------- Reconnection Handling --------------------
      newSocket.io.on('reconnect_attempt', () => {
        console.log('🔄 Socket reconnection attempt...');
        const freshToken = localStorage.getItem('token');
        if (freshToken) newSocket.auth = { token: freshToken };
      });
    },
    [checkTokenExpiration, logout, refreshToken]
  );

  // -------------------- Socket Connection --------------------
  const connectSocket = useCallback(
    (token: string) => {
      console.log('Initializing socket connection with token');
      
      // Decode token to verify its structure and extract userId
      let userId = null;
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('Token payload:', JSON.stringify(payload));
          
          // Extract user ID from token - backend expects 'id' as the key
          userId = payload.id || payload.userId || payload.sub;
          
          // Check for critical fields
          if (!userId) {
            console.warn('Warning: Token payload missing user ID field');
            
            // Last resort: look for any field that looks like a MongoDB ObjectId
            for (const key in payload) {
              if (typeof payload[key] === 'string' && /^[0-9a-fA-F]{24}$/.test(payload[key])) {
                console.log(`Found potential MongoDB ObjectId in field "${key}": ${payload[key]}`);
                userId = payload[key];
                break;
              }
            }
          } else {
            console.log(`Found user ID in token: ${userId}`);
          }
          
          // Check token expiration
          if (payload.exp) {
            const expiresIn = payload.exp * 1000 - Date.now();
            console.log(`Token expires in: ${Math.round(expiresIn / 1000)} seconds`);
            
            if (expiresIn < 0) {
              console.error('Token is already expired!');
              return null; // Don't even try to connect with expired token
            }
          }
        }
      } catch (e) {
        console.error('Failed to decode token:', e);
      }
      
      // Get user from local storage as fallback for userId
      const userStr = localStorage.getItem('user');
      let userObj = null;
      if (userStr && !userId) {
        try {
          userObj = JSON.parse(userStr);
          userId = userObj?.id;
          console.log('Using user ID from localStorage:', userId);
        } catch (e) {
          console.error('Failed to parse user from localStorage:', e);
        }
      }
      
      // Use dedicated socket URL from environment variables, or fallback to API URL
      // CRITICAL: Socket.IO client requires http:// protocol (NOT ws://)
      try {
        const socketServerUrl = import.meta.env.VITE_SOCKET_SERVER_URL;
        const socketPort = import.meta.env.VITE_SOCKET_PORT || '5001';
        
        console.log('Initializing socket with config:', {
          VITE_SOCKET_SERVER_URL: socketServerUrl,
          VITE_SOCKET_PORT: socketPort,
          VITE_API_URL: import.meta.env.VITE_API_URL
        });
        
        // Build a stable base URL to avoid undefined segments
        let baseURL = '';
        
        if (socketServerUrl && typeof socketServerUrl === 'string' && socketServerUrl !== 'undefined') {
          baseURL = socketServerUrl;
        } else if (import.meta.env.VITE_API_URL && typeof import.meta.env.VITE_API_URL === 'string') {
          baseURL = import.meta.env.VITE_API_URL.replace('/api', '');
        } else {
          baseURL = `http://localhost:${socketPort}`;
        }
        
        // Ensure URL has proper http:// or https:// protocol (required for Socket.IO)
        if (!baseURL.startsWith('http://') && !baseURL.startsWith('https://')) {
          baseURL = `http://${baseURL}`;
        }
        
        // Final safety check to avoid 'undefined' in URLs
        if (baseURL.includes('undefined')) {
          console.error('⚠️ Invalid socket URL contains undefined:', baseURL);
          baseURL = `http://localhost:${socketPort}`;
        }
        
        console.log('🔌 Socket connecting to:', baseURL);
      
      // Verify token one more time before connecting
      if (!token) {
        console.error('Cannot connect socket: No authentication token available');
        return null;
      }
        
      const socketOptions = {
        auth: {
          token,
          userId // Include userId extracted from token or localStorage
        },
        transports: ['websocket', 'polling'], // Try WebSocket first, then fall back to polling
        reconnection: true, // Enable built-in reconnection
        reconnectionAttempts: 5, // Increased from 3
        reconnectionDelay: 1000, // Start with a shorter delay
        reconnectionDelayMax: 10000,
        timeout: 20000, // Increased from 10000 to allow more time for connection
        forceNew: true, // Force a new connection each time
        autoConnect: true, // Connect immediately
      };
      
      console.log('Initializing socket with options:', socketOptions);
      const socket = io(baseURL, socketOptions);
      
      setupSocketListeners(socket);
      setSocket(socket);
      return socket;
      
      } catch (err) {
        console.error('Fatal error initializing socket:', err);
        return null;
      }
    },
    [setupSocketListeners] // Dependencies are now properly included in setupSocketListeners
  );

  // -------------------- Manage Lifecycle --------------------
  useEffect(() => {
    // Track if component is still mounted for async operations
    let isMounted = true;
    
    if (!user) {
      if (socket) {
        console.log('🛑 User not available, disconnecting socket');
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return () => { isMounted = false; };
    }

    // Prevent multiple socket connections
    if (socket && socket.connected) {
      console.log('Socket already connected, not creating a new one');
      return () => { isMounted = false; };
    }
    
    // Close any existing connections before creating new ones
    if (socket && !socket.connected) {
      console.log('Cleaning up existing disconnected socket');
      socket.disconnect();
      setSocket(null);
    }
    
    let socketInstance: Socket | null = null;
    let connectionAttempts = 0;
    const MAX_ATTEMPTS = 3;
    
    // Use localStorage to track connection attempts between renders
    const lastAttemptTime = parseInt(localStorage.getItem('socketLastAttemptTime') || '0');
    const currentTime = Date.now();
    
    // Check if we've recently detected a duplicate connection
    const duplicateDetectedTime = parseInt(localStorage.getItem('socketDuplicateDetected') || '0');
    const isDuplicateRecent = (currentTime - duplicateDetectedTime) < 10000; // 10 seconds
    
    if (isDuplicateRecent) {
      console.log('Recently detected as duplicate connection. Waiting before reconnecting.');
      return () => { isMounted = false; };
    }
    
    // If we've tried recently (within 5 seconds), don't try again immediately
    if (currentTime - lastAttemptTime < 5000) {
      console.log('Throttling connection attempt - tried too recently');
      return () => { isMounted = false; };
    }

    const initializeSocket = async () => {
      // Update last attempt time
      localStorage.setItem('socketLastAttemptTime', currentTime.toString());
      
      // Prevent excessive connection attempts
      if (connectionAttempts >= MAX_ATTEMPTS) {
        console.error('Max connection attempts reached, giving up');
        return;
      }
      
      connectionAttempts++;
      console.log(`Socket connection attempt ${connectionAttempts}/${MAX_ATTEMPTS}`);
      
      const isValid = await checkTokenExpiration();
      if (!isValid) {
        console.error('Token validation failed, not connecting socket');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token available, not connecting socket');
        return;
      }

      // Wait a moment before connecting to avoid rapid reconnection issues
      setTimeout(() => {
        if (isMounted) {
          socketInstance = connectSocket(token);
        }
      }, 1000);
    };

    initializeSocket();

    return () => {
      isMounted = false;
      if (socketInstance) {
        console.log('🛑 Disconnecting socket on cleanup');
        socketInstance.removeAllListeners();
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
