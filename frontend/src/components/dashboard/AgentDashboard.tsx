import { useState, useEffect, useMemo } from 'react';
import { 
  Clock, CheckCircle, Bell, User, MessageCircle, 
  Search, Calendar, X, Shield, Home, 
  Inbox, HelpCircle, Menu, Download,
  Bot, Star, AlertCircle, Eye, LogOut, Settings, ChevronDown
} from 'lucide-react';
import { Notifications } from '../notifications/Notifications';
import { useAuth } from '../../hooks/useAuth';
import { useComplaints, Complaint } from '../../contexts/ComplaintContext';
import { useSocket } from '../../hooks/useSocket';
import { 
  getStatusColor,
  getPriorityColor,
  getConnectionStatusColor,
  getNavItemClasses,
  getMessageSendButtonClasses,
  getProgressBarStyle
} from '../../utils/agentDashboardUtils';

export function AgentDashboard() {
  const { user, logout } = useAuth();
  const { complaints } = useComplaints();
  const { isConnected, socket, joinComplaintRoom, updateComplaint, sendMessage } = useSocket();
  const [activeView, setActiveView] = useState('my-tickets');
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showChatBot, setShowChatBot] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedComplaintForMessage, setSelectedComplaintForMessage] = useState<Complaint | null>(null);
  
  // We'll implement filtering directly in the component for now
  const [searchQuery, setSearchQuery] = useState('');
  
  // Simple filtering based on search query
  const filteredTickets = useMemo(() => {
    if (!searchQuery.trim()) return filteredComplaints;
    
    const query = searchQuery.toLowerCase().trim();
    return filteredComplaints.filter(complaint => 
      complaint.title.toLowerCase().includes(query) ||
      complaint.description.toLowerCase().includes(query) ||
      complaint.id.toLowerCase().includes(query) ||
      (complaint.category && complaint.category.toLowerCase().includes(query))
    );
  }, [filteredComplaints, searchQuery]);
  const [agentProfile, setAgentProfile] = useState({
    name: user?.name || 'Agent',
    email: user?.email || 'agent@example.com',
    phone: '+1 (555) 123-4567',
    department: 'Support',
    role: user?.role || 'agent',
    joinDate: '2024-01-15',
    availability: 'Available'
  });

  // Update agent profile when user changes
  useEffect(() => {
    if (user) {
      setAgentProfile(prev => ({
        ...prev,
        name: user.name,
        email: user.email,
        role: user.role,
      }));
    }
  }, [user]);

  // Debug socket connection status
  useEffect(() => {
    console.log('Socket connection status:', isConnected);
    console.log('Socket instance:', socket ? 'exists' : 'null');
    
    // Monitor connection status but don't try to reconnect here
    // Let the SocketContext handle reconnection
  }, [isConnected, socket]);

  // Update filtered complaints to show only assigned tickets
  useEffect(() => {
    setLoading(true);
    if (complaints && user) {
      // Filter complaints to show only tickets assigned to this agent
      const assignedComplaints = complaints.filter(c => c.assignedTo === user.id);
      setFilteredComplaints(assignedComplaints);
      
      // Join socket rooms for all assigned complaints to receive real-time updates
      if (isConnected) {
        assignedComplaints.forEach(complaint => {
          joinComplaintRoom(complaint.id);
          console.log(`Joined complaint room: ${complaint.id}`);
        });
      }
    }
    setLoading(false);
  }, [complaints, user, isConnected, joinComplaintRoom]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };
  
  const handleSendMessage = () => {
    if (selectedComplaintForMessage && messageText.trim()) {
      // Join the complaint room if not already joined
      joinComplaintRoom(selectedComplaintForMessage.id);
      
      // Send the message via socket
      sendMessage(selectedComplaintForMessage.id, messageText);
      
      // Clear the input and close the modal
      setMessageText('');
      setShowMessageModal(false);
      
      // Show success notification
      alert('Message sent successfully');
    }
  };
  
  const openMessageModal = (complaint: Complaint) => {
    setSelectedComplaintForMessage(complaint);
    setShowMessageModal(true);
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showUserMenu && !target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleStatusUpdate = async (complaintId: string, newStatus: 'Open' | 'In Progress' | 'Under Review' | 'Resolved' | 'Closed' | 'Escalated') => {
    try {
      // Use socket to update complaint status in real-time
      if (socket && isConnected) {
        // First join the complaint room if not already joined
        joinComplaintRoom(complaintId);
        
        // Then send the update via socket
        updateComplaint(complaintId, { status: newStatus }, `Status updated to ${newStatus} by ${user?.name}`);
      } else {
        console.warn('Cannot update status: Socket not connected');
        // Fallback to API call if socket is not connected
        // await api.updateComplaint(complaintId, { status: newStatus });
      }
      
      setFilteredComplaints(prev => 
        prev.map(c => c.id === complaintId ? { ...c, status: newStatus } : c)
      );
      if (selectedComplaint?.id === complaintId) {
        setSelectedComplaint({ ...selectedComplaint, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleEscalate = async (complaintId: string) => {
    await handleStatusUpdate(complaintId, 'Escalated');
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Title', 'Category', 'Priority', 'Status', 'Created', 'User'];
    const rows = filteredComplaints.map(c => [
      c.id,
      c.title,
      c.category,
      c.priority,
      c.status,
      new Date(c.createdAt).toLocaleDateString(),
      c.userId
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent_complaints_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Calculate statistics from real data
  const stats = {
    total: filteredComplaints.length,
    pending: filteredComplaints.filter(c => c.status === 'Open').length,
    inProgress: filteredComplaints.filter(c => c.status === 'In Progress' || c.status === 'Under Review').length,
    resolved: filteredComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length,
    escalated: filteredComplaints.filter(c => c.status === 'Escalated').length,
    urgent: filteredComplaints.filter(c => c.priority === 'High' || c.priority === 'Urgent').length,
    thisWeek: filteredComplaints.filter(c => {
      const createdDate = new Date(c.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return createdDate >= weekAgo;
    }).length,
    avgResponseTime: '2.5h'
  };

  // Using imported helper functions for consistent styling

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Freshdesk-style Clean Sidebar */}
      <div className="bg-slate-800 w-16 flex flex-col items-center py-4 space-y-4">
        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        
        <div className="space-y-2">
          <button 
            onClick={() => setActiveView('dashboard')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${getNavItemClasses(activeView === 'dashboard')}`}
            title="Dashboard"
          >
            <Home className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setActiveView('my-tickets')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${getNavItemClasses(activeView === 'my-tickets')}`}
            title="My Assigned Tickets"
          >
            <Inbox className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setActiveView('performance')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${getNavItemClasses(activeView === 'performance')}`}
            title="Performance Metrics"
          >
            <Star className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setActiveView('profile')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${getNavItemClasses(activeView === 'profile')}`}
            title="Profile Management"
          >
            <User className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setShowNotifications(true)}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setShowChatBot(true)}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="AI Assistant"
          >
            <Bot className="w-5 h-5" />
          </button>
          
          <button className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Help & Support"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Freshdesk-style Clean Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              {activeView === 'dashboard' && 'Agent Dashboard'}
              {activeView === 'my-tickets' && 'My Assigned Tickets'}
              {activeView === 'performance' && 'Performance Metrics'}
              {activeView === 'profile' && 'Profile Management'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Socket Connection Status Indicator with debug info */}
            <div className="flex items-center gap-1.5 text-sm group relative">
              <div className={`w-2.5 h-2.5 rounded-full ${getConnectionStatusColor(isConnected)}`}></div>
              <span className="text-gray-600">{isConnected ? 'Connected' : 'Disconnected'}</span>
              
              {/* Debug tooltip */}
              <div className="hidden group-hover:block absolute top-full left-0 mt-1 w-64 bg-gray-800 text-white p-2 rounded text-xs z-50">
                <p>Socket ID: {socket?.id || 'Not connected'}</p>
                <p>Auth token: {localStorage.getItem('token') ? '✓ Present' : '✗ Missing'}</p>
                <p>User ID: {user?.id || 'Unknown'}</p>
                <button 
                  className="mt-1 bg-blue-500 hover:bg-blue-600 px-2 py-0.5 rounded text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (socket) {
                      socket.disconnect();
                      setTimeout(() => socket.connect(), 500);
                    }
                  }}
                >
                  Reconnect
                </button>
              </div>
            </div>
            
            {activeView === 'my-tickets' && (
              <button
                onClick={exportToCSV}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            )}
            
            <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
              <Search className="w-5 h-5" />
            </button>
            
            <button 
              onClick={() => setShowNotifications(true)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg relative"
            >
              <Bell className="w-5 h-5" />
              {stats.pending > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {stats.pending}
                </span>
              )}
            </button>
            
            <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
              <HelpCircle className="w-5 h-5" />
            </button>
            
            <div className="relative user-menu-container">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
              >
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {agentProfile.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{agentProfile.name}</p>
                  <p className="text-xs text-gray-500">{agentProfile.role}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <button 
                    onClick={() => {
                      setActiveView('profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Profile Settings
                  </button>
                  <hr className="my-1" />
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard View - Core Complaint Features */}
        {activeView === 'dashboard' && (
          <div className="p-6 bg-gray-50 min-h-screen">
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Complaints</h3>
                <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Open</h3>
                <div className="text-3xl font-bold text-blue-600">{stats.pending}</div>
                <p className="text-xs text-gray-500 mt-1">Needs attention</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-2">In Progress</h3>
                <div className="text-3xl font-bold text-yellow-600">{stats.inProgress}</div>
                <p className="text-xs text-gray-500 mt-1">Being processed</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Resolved</h3>
                <div className="text-3xl font-bold text-green-600">{stats.resolved}</div>
                <p className="text-xs text-gray-500 mt-1">Completed</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Urgent</h3>
                <div className="text-3xl font-bold text-orange-600">{stats.urgent}</div>
                <p className="text-xs text-gray-500 mt-1">High priority</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Escalated</h3>
                <div className="text-3xl font-bold text-red-600">{stats.escalated}</div>
                <p className="text-xs text-gray-500 mt-1">Needs review</p>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Complaints */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Assigned Tickets</h3>
                  <button 
                    onClick={() => setActiveView('my-tickets')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View all
                  </button>
                </div>
                <div className="p-6">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Loading tickets...</p>
                    </div>
                  ) : filteredComplaints.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Inbox className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No assigned tickets</p>
                      <p className="text-sm">Tickets assigned to you will appear here</p>
                      <button 
                        onClick={() => setActiveView('performance')}
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        View Performance
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredComplaints.slice(0, 3).map((complaint) => (
                        <div key={complaint.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setSelectedComplaint(complaint)}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 text-sm mb-1">{complaint.title}</h4>
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{complaint.description}</p>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(complaint.createdAt).toLocaleDateString()}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(complaint.priority)}`}>
                                  {complaint.priority}
                                </span>
                              </div>
                            </div>
                            <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(complaint.status)}`}>
                              {complaint.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <button 
                      onClick={() => setActiveView('performance')}
                      className="w-full flex items-center gap-3 p-4 text-left border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Star className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">View Performance</h4>
                        <p className="text-sm text-gray-600">See your metrics and statistics</p>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => setActiveView('my-tickets')}
                      className="w-full flex items-center gap-3 p-4 text-left border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-200 transition-colors"
                    >
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Inbox className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">View My Complaints</h4>
                        <p className="text-sm text-gray-600">Track status and updates</p>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => setActiveView('profile')}
                      className="w-full flex items-center gap-3 p-4 text-left border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-200 transition-colors"
                    >
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Update Profile</h4>
                        <p className="text-sm text-gray-600">Manage your account details</p>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => setShowChatBot(true)}
                      className="w-full flex items-center gap-3 p-4 text-left border border-gray-200 rounded-lg hover:bg-yellow-50 hover:border-yellow-200 transition-colors"
                    >
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Bot className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">AI Assistant</h4>
                        <p className="text-sm text-gray-600">Get instant help and guidance</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Tracking Overview */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Ticket Status Overview</h3>
                <p className="text-sm text-gray-600 mt-1">Track the progress of your assigned tickets</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3 p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-blue-900">Open</p>
                      <p className="text-sm text-blue-700">New complaints</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-yellow-900">In Progress</p>
                      <p className="text-sm text-yellow-700">Under review</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 border border-green-200 rounded-lg bg-green-50">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-green-900">Resolved</p>
                      <p className="text-sm text-green-700">Successfully completed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 border border-red-200 rounded-lg bg-red-50">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-red-900">Escalated</p>
                      <p className="text-sm text-red-700">Needs attention</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Complaints List View */}
        {activeView === 'my-tickets' && (
          <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">My Assigned Tickets</h3>
                  <p className="text-sm text-gray-600">Manage all tickets assigned to you</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={exportToCSV}
                    className="border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                  <button 
                    onClick={() => setActiveView('performance')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Star className="w-4 h-4" />
                    View Performance
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {/* Simple Search */}
                <div className="mb-6">
                  <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="search"
                      className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Search complaints..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Loading your assigned tickets...</p>
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Inbox className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-xl font-medium mb-2">No tickets found</p>
                    <p className="text-sm mb-6">
                      {filteredComplaints.length === 0
                        ? "You don't have any tickets assigned to you yet"
                        : "No tickets match your search"}
                    </p>
                    {filteredComplaints.length === 0 ? (
                      <button 
                        onClick={() => setActiveView('dashboard')}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                      >
                        Go To Dashboard
                      </button>
                    ) : (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTickets.map((complaint) => (
                      <div key={complaint.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div 
                            className="flex-1 cursor-pointer" 
                            onClick={() => setSelectedComplaint(complaint)}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-gray-900">{complaint.title}</h4>
                              <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(complaint.status)}`}>
                                {complaint.status}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-3 line-clamp-2">{complaint.description}</p>
                            <div className="flex items-center gap-6 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(complaint.createdAt).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="w-4 h-4" />
                                {complaint.category}
                              </span>
                              <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                                <AlertCircle className="w-3 h-3" />
                                {complaint.priority} Priority
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 ml-4">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedComplaint(complaint);
                              }}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              View Details
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openMessageModal(complaint);
                              }}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              <MessageCircle className="w-4 h-4" />
                              Message
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Performance Metrics View */}
        {activeView === 'performance' && (
          <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
                    <p className="text-sm text-gray-600">Track your productivity and service quality</p>
                  </div>
                  <button 
                    onClick={() => setActiveView('my-tickets')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-500 mb-1">Average Response Time</p>
                    <p className="text-2xl font-bold text-blue-600">2.5 hours</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-500 mb-1">Resolution Rate</p>
                    <p className="text-2xl font-bold text-green-600">85%</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-500 mb-1">Customer Satisfaction</p>
                    <p className="text-2xl font-bold text-amber-600">4.7/5</p>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Tickets Resolved This Week</span>
                      <span className="text-sm font-bold text-green-600">12</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={getProgressBarStyle(75)}></div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Average Handle Time</span>
                      <span className="text-sm font-bold text-blue-600">3.2 hours</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={getProgressBarStyle(60)}></div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">First Contact Resolution</span>
                      <span className="text-sm font-bold text-purple-600">72%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={getProgressBarStyle(72)}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Management View */}
        {activeView === 'profile' && (
          <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Profile Management</h3>
                    <p className="text-sm text-gray-600">View and update your account details</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                      {agentProfile.name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900">{agentProfile.name}</h4>
                      <p className="text-gray-600">{agentProfile.email}</p>
                      <p className="text-sm text-gray-500">{agentProfile.role} • Member since {new Date(agentProfile.joinDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input 
                        type="text" 
                        value={agentProfile.name}
                        onChange={(e) => setAgentProfile({...agentProfile, name: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input 
                        type="email" 
                        value={agentProfile.email}
                        onChange={(e) => setAgentProfile({...agentProfile, email: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input 
                        type="tel" 
                        value={agentProfile.phone}
                        onChange={(e) => setAgentProfile({...agentProfile, phone: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                      <input 
                        type="text" 
                        value={agentProfile.department}
                        onChange={(e) => setAgentProfile({...agentProfile, department: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Availability Status</label>
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={agentProfile.availability}
                        onChange={(e) => setAgentProfile({...agentProfile, availability: e.target.value})}
                      >
                        <option value="Available">Available</option>
                        <option value="Busy">Busy</option>
                        <option value="Away">Away</option>
                        <option value="Offline">Offline</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex gap-4">
                      <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                        Save Changes
                      </button>
                      <button 
                        onClick={() => setActiveView('my-tickets')}
                        className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Complaint Details Modal */}
        {selectedComplaint && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-[90vh] overflow-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Complaint Details</h3>
                  <button 
                    onClick={() => setSelectedComplaint(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {/* Header with Status and Priority */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">{selectedComplaint.title}</h4>
                      <div className="flex items-center gap-4 mb-4">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(selectedComplaint.status)}`}>
                          {selectedComplaint.status}
                        </span>
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(selectedComplaint.priority)}`}>
                          {selectedComplaint.priority} Priority
                        </span>
                        <span className="text-sm text-gray-500">
                          Filed on {new Date(selectedComplaint.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {selectedComplaint.status === 'Resolved' && (
                      <button 
                        onClick={() => {
                          setSelectedComplaint(null);
                          setShowFeedbackForm(true);
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Star className="w-4 h-4" />
                        Give Feedback
                      </button>
                    )}
                  </div>

                  {/* Description */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">Description</h5>
                    <p className="text-gray-700">{selectedComplaint.description}</p>
                  </div>

                  {/* Timeline/Updates Section */}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-4">Timeline & Updates</h5>
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Clock className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">Complaint Submitted</p>
                          <p className="text-sm text-gray-600">Your complaint has been received and assigned ID #{selectedComplaint.id}</p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(selectedComplaint.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      
                      {selectedComplaint.status !== 'Open' && (
                        <div className="flex gap-4">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <Eye className="w-4 h-4 text-yellow-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">Under Review</p>
                            <p className="text-sm text-gray-600">Your complaint is being reviewed by our support team</p>
                            <p className="text-xs text-gray-500 mt-1">Updated recently</p>
                          </div>
                        </div>
                      )}
                      
                      {selectedComplaint.status === 'Resolved' && (
                        <div className="flex gap-4">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">Complaint Resolved</p>
                            <p className="text-sm text-gray-600">Your complaint has been successfully resolved</p>
                            <p className="text-xs text-gray-500 mt-1">Resolved recently</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Agent Actions Section */}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-4">Agent Actions</h5>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex flex-wrap gap-3">
                        {selectedComplaint.status !== 'In Progress' && (
                          <button 
                            onClick={() => handleStatusUpdate(selectedComplaint.id, 'In Progress')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1"
                          >
                            <Clock className="w-4 h-4" />
                            Mark In Progress
                          </button>
                        )}
                        
                        {selectedComplaint.status !== 'Resolved' && (
                          <button 
                            onClick={() => handleStatusUpdate(selectedComplaint.id, 'Resolved')}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm flex items-center gap-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Mark Resolved
                          </button>
                        )}
                        
                        {selectedComplaint.status !== 'Escalated' && (
                          <button 
                            onClick={() => handleEscalate(selectedComplaint.id)}
                            className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 text-sm flex items-center gap-1"
                          >
                            <AlertCircle className="w-4 h-4" />
                            Escalate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Communication Section */}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-4">Customer Communication</h5>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <MessageCircle className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Send updates to the customer</span>
                      </div>
                      <textarea
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
                        placeholder="Type your message here..."
                        rows={3}
                      ></textarea>
                      <button 
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Send Message
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ChatBot Modal */}
        {showChatBot && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4 max-h-[600px]">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
                  </div>
                  <button 
                    onClick={() => setShowChatBot(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="h-[500px] p-4">
                <div className="text-center text-gray-500">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                  <p>AI Assistant is ready to help!</p>
                  <p className="text-sm mt-2">Ask me about your complaints or get support.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Modal */}
        {showNotifications && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4 max-h-[600px]">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="h-[500px] overflow-auto">
                <Notifications />
              </div>
            </div>
          </div>
        )}

        {/* Feedback Form Modal */}
        {showFeedbackForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Submit Feedback</h3>
                  <button 
                    onClick={() => setShowFeedbackForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} className="text-yellow-400 hover:text-yellow-500">
                          ⭐
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                    <textarea 
                      className="w-full border border-gray-300 rounded-lg p-3 h-24"
                      placeholder="Share your feedback..."
                    />
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowFeedbackForm(false)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Submit
                    </button>
                    <button 
                      onClick={() => setShowFeedbackForm(false)}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Direct Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Send Message to User</h3>
                <button 
                  onClick={() => setShowMessageModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {selectedComplaintForMessage && (
                  <div className="mb-4">
                    <p className="font-medium text-gray-700">Complaint: {selectedComplaintForMessage.title}</p>
                    <p className="text-sm text-gray-500">
                      ID: {selectedComplaintForMessage.id} • Status: {selectedComplaintForMessage.status}
                    </p>
                  </div>
                )}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Type your message to the user here..."
                  />
                </div>
                
                <div className="flex justify-between pt-4">
                  <div className="text-sm text-gray-500">
                    {isConnected ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        Disconnected (Cannot send messages)
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowMessageModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSendMessage}
                      disabled={!isConnected || !messageText.trim()}
                      className={`px-4 py-2 rounded-lg ${getMessageSendButtonClasses(isConnected && Boolean(messageText.trim()))}`}
                    >
                      Send Message
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}