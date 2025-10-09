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
import { useAuth } from './hooks/useAuth';
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
  
  // Log user data for debugging
  console.log("DashboardRoute - Current user:", user);
  console.log("DashboardRoute - User role:", user?.role);
  
  // If user data isn't available, check localStorage as fallback
  const [fallbackUser, setFallbackUser] = React.useState(null);
  const [hasAttemptedRecovery, setHasAttemptedRecovery] = React.useState(false);
  
  React.useEffect(() => {
    // Only attempt recovery once per component lifecycle
    if (hasAttemptedRecovery) return;
    
    if (!user) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log("No user in context, using fallback from localStorage:", parsedUser);
          setFallbackUser(parsedUser);
          
          // Track that we've attempted recovery
          setHasAttemptedRecovery(true);
          
          // Force reload once to properly initialize auth context if needed
          // But only if we haven't tried before in this session
          if (!sessionStorage.getItem('dashboard_loaded')) {
            console.log("First dashboard load, forcing refresh to initialize auth context");
            sessionStorage.setItem('dashboard_loaded', 'true');
            // Use a small timeout to prevent immediate reload loops
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        } catch (error) {
          console.error("Error parsing user from localStorage:", error);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  
  const activeUser = user || fallbackUser;

  return (
    <div className="min-h-screen bg-gray-900">
      <Notifications />
      {activeUser?.role === 'admin' && <AdminDashboard />}
      {activeUser?.role === 'agent' && <AgentDashboard />}
      {activeUser?.role === 'user' && <UserDashboard />}
      {activeUser?.role === 'analytics' && <AnalyticsReportsDashboard />}
      {!activeUser?.role && (
        <div className="p-8 text-white flex flex-col items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <div className="text-xl">Loading dashboard...</div>
        </div>
      )}
      <ChatBot />
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state when auth is initializing
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="p-8 text-white text-xl">
          <div className="flex items-center">
            <svg className="animate-spin h-8 w-8 mr-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading Application...
          </div>
        </div>
      </div>
    );
  }

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