import React, { useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export function Notifications() {
  const { notifications, markAsRead } = useNotifications();

  // Show only the latest unread notification as a toast
  const latestNotification = notifications.find(n => !n.read);

  useEffect(() => {
    if (latestNotification) {
      const timer = setTimeout(() => {
        markAsRead(latestNotification.id);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [latestNotification, markAsRead]);

  if (!latestNotification) return null;

  const getIcon = () => {
    switch (latestNotification.type) {
      case 'success': return <CheckCircle className="w-5 h-5" />;
      case 'error': return <AlertCircle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'info': return <Info className="w-5 h-5" />;
    }
  };

  const getColorClasses = () => {
    switch (latestNotification.type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div className={`max-w-md w-full border rounded-xl shadow-lg p-4 ${getColorClasses()}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm mb-1">{latestNotification.title}</h4>
            <p className="text-sm opacity-90">{latestNotification.message}</p>
          </div>
          <button
            onClick={() => markAsRead(latestNotification.id)}
            className="flex-shrink-0 p-1 hover:bg-black hover:bg-opacity-10 rounded-lg transition-colors duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}