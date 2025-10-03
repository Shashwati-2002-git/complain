import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ComplaintProvider } from './contexts/ComplaintContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SocketProvider } from './contexts/SocketContext';
import { HomePage } from './components/home/HomePage';
import { LoginForm } from './components/auth/LoginForm';
import FacebookCallback from './components/auth/FacebookCallback';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { AgentDashboard } from './components/dashboard/AgentDashboard';
import { AnalyticsReportsDashboard } from './components/dashboard/AnalyticsReportsDashboard';
import { ChatBot } from './components/chatbot/ChatBot';
import { useAuth } from './contexts/AuthContext';
import { Notifications } from './components/notifications/Notifications';
import { useNotificationPermission } from './hooks/useSocket';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

// Dashboard Route Component
function DashboardRoute() {
  const { user } = useAuth();
  useNotificationPermission();

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

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <HomePage />
          )
        } 
      />
      <Route 
        path="/login" 
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginForm />
          )
        } 
      />

      <Route path="/auth/facebook/callback" element={<FacebookCallback />} />
      
      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardRoute />
          </ProtectedRoute>
        } 
      />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <ComplaintProvider>
          <NotificationProvider>
            <Router>
              <AppContent />
            </Router>
          </NotificationProvider>
        </ComplaintProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;