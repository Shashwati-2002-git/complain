import React, {
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
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
        // Don't set isConnected=true yet - wait for connection_success from server
      });

      newSocket.on('disconnect', (reason) => {
        console.log('⚠️ Socket disconnected:', reason);
        setIsConnected(false);
      });
      
      newSocket.on('connection_success', (data) => {
        console.log('🔐 Socket authenticated successfully:', data);
        setIsConnected(true);
      });
      
      newSocket.on('connection_error', (error) => {
        console.error('⛔ Socket authentication failed:', error);
        setIsConnected(false);
        // Disconnect and try again with fresh token
        newSocket.disconnect();
        
        // Try to refresh token and reconnect
        setTimeout(() => {
          refreshToken(); // Use refreshToken directly instead
        }, 1000);
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

      // Listen for new complaints (admin and agent dashboards)
      newSocket.on('new_complaint', (complaint) => {
        console.log('New complaint received via socket:', complaint);
        window.dispatchEvent(new CustomEvent('newComplaint', { detail: complaint }));
        
        // Show browser notification
        if (Notification.permission === 'granted') {
          new Notification('New Complaint Filed', {
            body: `${complaint.title} - ${complaint.description?.substring(0, 50)}...`,
            icon: '/favicon.ico',
          });
        }
      });
      
      // Listen for complaint status updates
      newSocket.on('complaint_status_update', (data) => {
        console.log('Complaint status updated via socket:', data);
        window.dispatchEvent(new CustomEvent('complaintStatusUpdate', { detail: data }));
        
        // Show browser notification
        if (Notification.permission === 'granted') {
          new Notification('Complaint Status Updated', {
            body: `Complaint #${data.complaintId} status is now ${data.status}`,
            icon: '/favicon.ico',
          });
        }
      });
      
      // Listen for complaint assignments
      newSocket.on('complaint_assigned', (data) => {
        console.log('Complaint assigned via socket:', data);
        window.dispatchEvent(new CustomEvent('complaintAssigned', { detail: data }));
        
        // Show browser notification
        if (Notification.permission === 'granted') {
          const title = user?.role === 'agent' ? 
            'New Complaint Assigned' : 
            'Agent Assigned to Your Complaint';
            
          const body = user?.role === 'agent' ?
            `Complaint "${data.complaint?.title || 'New complaint'}" has been assigned to you` :
            `Agent ${data.agentName} has been assigned to your complaint`;
            
          new Notification(title, {
            body,
            icon: '/favicon.ico',
          });
        }
      });
      
      newSocket.on('complaint_status_updated', (data) => {
        window.dispatchEvent(new CustomEvent('complaintUpdated', { detail: data }));
      });

      newSocket.on('dashboard_stats_update', (data) => {
        window.dispatchEvent(new CustomEvent('dashboardStatsUpdate', { detail: data }));
      });
      
      newSocket.on('agent_status_update', (agents) => {
        window.dispatchEvent(new CustomEvent('agentStatusUpdate', { detail: { agents } }));
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
    // Remove dependencies that cause circular updates and only depend on role changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.role]
  );

  // -------------------- Socket Actions --------------------
  
  // Join a complaint room to receive real-time updates about a specific complaint
  const joinComplaintRoom = useCallback((complaintId: string) => {
    if (!socket || !isConnected) return;
    console.log(`Joining complaint room: ${complaintId}`);
    socket.emit('join_complaint', { complaintId });
  }, [socket, isConnected]);
  
  // Leave a complaint room
  const leaveComplaintRoom = useCallback((complaintId: string) => {
    if (!socket || !isConnected) return;
    console.log(`Leaving complaint room: ${complaintId}`);
    socket.emit('leave_complaint', { complaintId });
  }, [socket, isConnected]);
  
  // Send a message in a complaint thread
  const sendMessage = useCallback((complaintId: string, message: string, isInternal: boolean = false) => {
    if (!socket || !isConnected) return;
    console.log(`Sending message to complaint ${complaintId}:`, message);
    socket.emit('send_message', { 
      complaintId, 
      message,
      isInternal
    });
  }, [socket, isConnected]);
  
  // Update a complaint (status, priority, etc.)
  const updateComplaint = useCallback((complaintId: string, updates: ComplaintUpdate, note?: string) => {
    if (!socket || !isConnected) return;
    
    console.log(`Updating complaint ${complaintId}:`, updates);
    
    // Handle status updates specially for tracking history
    if (updates.status) {
      socket.emit('update_complaint_status', {
        complaintId,
        status: updates.status,
        note
      });
    }
    
    // Handle other updates
    if (updates.priority || updates.category) {
      socket.emit('update_complaint_details', {
        complaintId,
        updates
      });
    }
    
    // Handle assignment
    if (updates.assignedTo) {
      socket.emit('assign_complaint', {
        complaintId,
        agentId: updates.assignedTo
      });
    }
  }, [socket, isConnected]);
  
  // Mark notifications as read
  const markNotificationsRead = useCallback((notificationIds: string[]) => {
    if (!socket || !isConnected || !notificationIds.length) return;
    
    socket.emit('mark_notifications_read', { notificationIds });
    
    // Update local state optimistically
    setNotifications(prev => 
      prev.map(notification => 
        notificationIds.includes(notification._id) 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  }, [socket, isConnected]);
  
  // Notify about a new complaint being created (after API call)
  const notifyNewComplaint = useCallback((complaintId: string) => {
    if (!socket || !isConnected) return;
    socket.emit('new_complaint_created', { complaintId });
  }, [socket, isConnected]);

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
      
      // Verify token one more time before connecting
      if (!token) {
        console.error('Cannot connect socket: No authentication token available');
        return null;
      }
      
      // First validate token to avoid connection attempts with invalid tokens
    try {
      // Simple client-side check for token validity
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.error('Token validation failed, not connecting socket');
        return null;
      }
      
      // Check if token is expired
      const payload = JSON.parse(atob(tokenParts[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        console.error('Token validation failed (expired), not connecting socket');
        return null;
      }
    } catch (error) {
      console.error('Token validation failed, not connecting socket:', error);
      return null;
    }
    
    // Use dedicated socket URL from environment variables, or fallback to API URL
    const baseURL = import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:5001';
    
    console.log('🔌 Socket connecting to:', baseURL);
      
    const socketOptions = {
      auth: {
        token // Simplified to just include the token
      },
      transports: ['websocket', 'polling'], 
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout: 10000,
      forceNew: true
    };
      
      console.log('Initializing socket with options:', socketOptions);
      
      try {
        const socket = io(baseURL, socketOptions);
        setupSocketListeners(socket);
        setSocket(socket);
        return socket;
      } catch (error) {
        console.error('Failed to initialize socket:', error);
        return null;
      }
    },
    // setupSocketListeners is stable since we fixed its dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Track socket connection attempts to prevent loops
  const [connectionAttemptCount, setConnectionAttemptCount] = useState<number>(0);
  const [lastConnectionAttempt, setLastConnectionAttempt] = useState<number>(0);

  // -------------------- Manage Lifecycle --------------------
  useEffect(() => {
    // Track if component is still mounted for async operations
    let isMounted = true;
    
    // If no user, disconnect and clean up
    if (!user) {
      if (socket) {
        console.log('🛑 User not available, disconnecting socket');
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return () => { isMounted = false; };
    }

    // If socket already connected, don't reconnect
    if (socket && socket.connected) {
      console.log('Socket already connected, not creating a new one');
      return () => { isMounted = false; };
    }
    
    // Enforce a minimum time between connection attempts to prevent rapid reconnections
    const now = Date.now();
    const MIN_RECONNECT_INTERVAL = 10000; // 10 seconds between attempts
    
    if (now - lastConnectionAttempt < MIN_RECONNECT_INTERVAL) {
      console.log(`Throttling socket connection - last attempt was ${Math.round((now - lastConnectionAttempt)/1000)}s ago`);
      return () => { isMounted = false; };
    }
    
    // Limit total number of connection attempts to prevent infinite loops
    const MAX_ATTEMPTS = 3;
    if (connectionAttemptCount >= MAX_ATTEMPTS) {
      console.error(`Max connection attempts (${MAX_ATTEMPTS}) reached, giving up`);
      return () => { isMounted = false; };
    }

    // Clean up any existing socket that's not connected
    if (socket && !socket.connected) {
      console.log('Cleaning up existing disconnected socket');
      socket.disconnect();
      setSocket(null);
    }
    
    // Initialize socket connection process
    const initializeSocket = async () => {
      // Track this attempt
      setLastConnectionAttempt(now);
      setConnectionAttemptCount(prev => prev + 1);
      
      console.log(`Socket connection attempt ${connectionAttemptCount + 1}/${MAX_ATTEMPTS}`);
      
      try {
        // First validate the token without calling the API
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token available, not connecting socket');
          return;
        }
        
        // Simple client-side token validation to avoid unnecessary API calls
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length !== 3) {
            console.error('Invalid token format, not connecting socket');
            return;
          }
          
          const payload = JSON.parse(atob(tokenParts[1]));
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            console.error('Token expired, not connecting socket');
            return;
          }
        } catch (error) {
          console.error('Token validation failed, not connecting socket:', error);
          return;
        }
        
        // Create the socket connection with delay to prevent rapid reconnects
        setTimeout(() => {
          if (isMounted) {
            const newSocket = connectSocket(token);
            if (newSocket) {
              console.log('Socket connection initiated');
            }
          }
        }, 1000);
      } catch (error) {
        console.error('Socket initialization error:', error);
      }
    };

    initializeSocket();

    return () => {
      isMounted = false;
    };
  // Carefully control when this effect runs to prevent infinite loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // -------------------- Helper Functions --------------------
  // Socket action functions are defined above

  // Socket room functions are defined above

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
    notifyNewComplaint
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
