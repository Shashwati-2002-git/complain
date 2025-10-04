import { useState, useEffect } from 'react';
import { 
  Plus, Clock, CheckCircle, Bell, User, MessageCircle, 
  Search, Calendar, X, Shield, Home, 
  Inbox, HelpCircle, Menu,
  Bot, Star, AlertCircle, Eye, LogOut, Settings, ChevronDown
} from 'lucide-react';
import { ComplaintForm } from '../complaints/ComplaintForm';
import { Notifications } from '../notifications/Notifications';
import { useAuth } from '../../contexts/AuthContext';
import { useComplaints, Complaint } from '../../contexts/ComplaintContext';

export function UserDashboard() {
  const { user, logout } = useAuth();
  const { complaints } = useComplaints();
  const [activeView, setActiveView] = useState('dashboard');
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showChatBot, setShowChatBot] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState({
    name: user?.name || 'User',
    email: user?.email || 'user@example.com',
    phone: '+1 (555) 123-4567',
    organization: 'ABC Company',
    role: user?.role || 'user',
    joinDate: '2024-01-15'
  });

  // Update user profile when user changes
  useEffect(() => {
    if (user) {
      setUserProfile({
        name: user.name,
        email: user.email,
        phone: '+1 (555) 123-4567',
        organization: 'ABC Company',
        role: user.role,
        joinDate: '2024-01-15'
      });
    }
  }, [user]);

  // Update filtered complaints when complaints change
  useEffect(() => {
    setLoading(true);
    if (complaints && user) {
      // Filter complaints to show only current user's complaints
      const userComplaints = complaints.filter(c => c.userId === user.id);
      setFilteredComplaints(userComplaints);
    }
    setLoading(false);
  }, [complaints, user]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
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

  // Calculate statistics from real data
  const stats = {
    total: filteredComplaints.length,
    open: filteredComplaints.filter(c => c.status === 'Open').length,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved':
      case 'Closed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'In Progress':
      case 'Under Review':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Escalated':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Open':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
      case 'Urgent':
        return 'text-red-600 bg-red-50';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'Low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

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
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              activeView === 'dashboard' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Dashboard"
          >
            <Home className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setActiveView('complaints')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              activeView === 'complaints' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="My Complaints"
          >
            <Inbox className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setActiveView('new-complaint')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              activeView === 'new-complaint' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="File New Complaint"
          >
            <Plus className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setActiveView('profile')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              activeView === 'profile' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
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
              {activeView === 'dashboard' && 'User Dashboard'}
              {activeView === 'complaints' && 'My Complaints'}
              {activeView === 'new-complaint' && 'File New Complaint'}
              {activeView === 'profile' && 'Profile Management'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveView('new-complaint')}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg"
            >
              <Plus className="w-4 h-4" />
              New Complaint
            </button>
            
            <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
              <Search className="w-5 h-5" />
            </button>
            
            <button 
              onClick={() => setShowNotifications(true)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg relative"
            >
              <Bell className="w-5 h-5" />
              {stats.open > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {stats.open}
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
                  {userProfile.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{userProfile.name}</p>
                  <p className="text-xs text-gray-500">{userProfile.role}</p>
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
                <div className="text-3xl font-bold text-blue-600">{stats.open}</div>
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
                  <h3 className="text-lg font-semibold text-gray-900">Recent Complaints</h3>
                  <button 
                    onClick={() => setActiveView('complaints')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View all
                  </button>
                </div>
                <div className="p-6">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Loading complaints...</p>
                    </div>
                  ) : filteredComplaints.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Inbox className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No complaints yet</p>
                      <p className="text-sm">File your first complaint to get started</p>
                      <button 
                        onClick={() => setActiveView('new-complaint')}
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        File Complaint
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
                      onClick={() => setActiveView('new-complaint')}
                      className="w-full flex items-center gap-3 p-4 text-left border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Plus className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">File New Complaint</h4>
                        <p className="text-sm text-gray-600">Submit a new complaint or issue</p>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => setActiveView('complaints')}
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
                <h3 className="text-lg font-semibold text-gray-900">Complaint Status Overview</h3>
                <p className="text-sm text-gray-600 mt-1">Track the progress of your complaints</p>
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
        {activeView === 'complaints' && (
          <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">My Complaints</h3>
                  <p className="text-sm text-gray-600">Track all your submitted complaints</p>
                </div>
                <button 
                  onClick={() => setActiveView('new-complaint')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Complaint
                </button>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Loading your complaints...</p>
                  </div>
                ) : filteredComplaints.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Inbox className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-xl font-medium mb-2">No complaints found</p>
                    <p className="text-sm mb-6">You haven't filed any complaints yet</p>
                    <button 
                      onClick={() => setActiveView('new-complaint')}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                    >
                      File Your First Complaint
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredComplaints.map((complaint) => (
                      <div key={complaint.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setSelectedComplaint(complaint)}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
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
                          <div className="flex items-center gap-2 ml-4">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedComplaint(complaint);
                              }}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              View Details
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

        {/* New Complaint View */}
        {activeView === 'new-complaint' && (
          <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">File New Complaint</h3>
                    <p className="text-sm text-gray-600">Submit a new complaint or issue for review</p>
                  </div>
                  <button 
                    onClick={() => setActiveView('dashboard')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <ComplaintForm onSuccess={() => setActiveView('complaints')} />
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
                      {userProfile.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900">{userProfile.name}</h4>
                      <p className="text-gray-600">{userProfile.email}</p>
                      <p className="text-sm text-gray-500">{userProfile.role} • Member since {new Date(userProfile.joinDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input 
                        type="text" 
                        value={userProfile.name}
                        onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input 
                        type="email" 
                        value={userProfile.email}
                        onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input 
                        type="tel" 
                        value={userProfile.phone}
                        onChange={(e) => setUserProfile({...userProfile, phone: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
                      <input 
                        type="text" 
                        value={userProfile.organization}
                        onChange={(e) => setUserProfile({...userProfile, organization: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex gap-4">
                      <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                        Save Changes
                      </button>
                      <button 
                        onClick={() => setActiveView('dashboard')}
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

                  {/* Communication Section */}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-4">Communication</h5>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <MessageCircle className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Need to communicate with support?</span>
                      </div>
                      <button 
                        onClick={() => setShowChatBot(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Contact Support
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
    </div>
  );
}