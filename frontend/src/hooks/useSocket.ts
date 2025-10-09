import { useEffect, useContext } from 'react';
import { SocketContext } from '../contexts/SocketContextStore';

// Main hook to use the socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};

// Custom hook to request notification permission
export const useNotificationPermission = () => {
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }, []);
};

// Custom hook for handling real-time events
export const useRealTimeEvents = () => {
  useEffect(() => {
    const handleComplaintUpdate = (event: CustomEvent) => {
      console.log('Complaint updated:', event.detail);
      // Handle complaint update in components
    };

    const handleDashboardUpdate = (event: CustomEvent) => {
      console.log('Dashboard update:', event.detail);
      // Handle dashboard update
    };

    const handleNewMessage = (event: CustomEvent) => {
      console.log('New message:', event.detail);
      // Handle new message
    };

    // Add event listeners
    window.addEventListener('complaintUpdated', handleComplaintUpdate as EventListener);
    window.addEventListener('dashboardUpdate', handleDashboardUpdate as EventListener);
    window.addEventListener('newMessage', handleNewMessage as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('complaintUpdated', handleComplaintUpdate as EventListener);
      window.removeEventListener('dashboardUpdate', handleDashboardUpdate as EventListener);
      window.removeEventListener('newMessage', handleNewMessage as EventListener);
    };
  }, []);
};