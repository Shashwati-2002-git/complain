import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'email' | 'sms';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  channel?: 'app' | 'email' | 'sms';
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (type: Notification['type'], title: string, message: string, channel?: 'app' | 'email' | 'sms') => void;
  sendEmailNotification: (title: string, message: string) => void;
  sendSmsNotification: (title: string, message: string) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (type: Notification['type'], title: string, message: string, channel: 'app' | 'email' | 'sms' = 'app') => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date(),
      read: false,
      channel,
    };
    setNotifications(prev => [newNotification, ...prev]);

    // Auto-remove after 5 seconds for success notifications
    if (type === 'success') {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 5000);
    }
  };

  const sendEmailNotification = (title: string, message: string) => {
    // Simulate email notification
    addNotification('email', `📧 ${title}`, message, 'email');
    console.log(`EMAIL SENT: ${title} - ${message}`);
  };

  const sendSmsNotification = (title: string, message: string) => {
    // Simulate SMS notification
    addNotification('sms', `📱 ${title}`, message, 'sms');
    console.log(`SMS SENT: ${title} - ${message}`);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      sendEmailNotification,
      sendSmsNotification,
      markAsRead,
      clearAll,
      unreadCount,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}