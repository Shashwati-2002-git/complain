import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ComplaintProvider } from './contexts/ComplaintContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SocketProvider } from './contexts/SocketContext';
import { HomePage } from './components/home/HomePage';
import { LoginForm } from './components/auth/LoginForm';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { AgentDashboard } from './components/dashboard/AgentDashboard';
import { AnalyticsReportsDashboard } from './components/dashboard/AnalyticsReportsDashboard';
import { ChatBot } from './components/chatbot/ChatBot';
import { useAuth } from './contexts/AuthContext';
import { Notifications } from './components/notifications/Notifications';
import { useNotificationPermission } from './hooks/useSocket';

function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  // Request notification permission
  useNotificationPermission();

  // Debug logging
  console.log('AppContent - isAuthenticated:', isAuthenticated);
  console.log('AppContent - user:', user);
  console.log('AppContent - user role:', user?.role);

  if (!isAuthenticated && !showLogin) {
    return <HomePage onShowLogin={() => setShowLogin(true)} />;
  }

  if (!isAuthenticated) {
    return <LoginForm onBack={() => setShowLogin(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Notifications />
      {user?.role === 'admin' && <AdminDashboard />}
      {user?.role === 'agent' && <AgentDashboard />}
      {user?.role === 'user' && <UserDashboard />}
      {user?.role === 'analytics' && <AnalyticsReportsDashboard />}
      {!user?.role && <div className="p-8 text-white">Loading user data...</div>}
      <ChatBot />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <ComplaintProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </ComplaintProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;