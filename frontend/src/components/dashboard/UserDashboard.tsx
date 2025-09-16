import { useState } from 'react';
import { 
  Plus, FileText, Clock, CheckCircle, AlertTriangle, Bell, User, 
  MessageCircle, Star, Search, Filter, ChevronRight, 
  Eye, Calendar, Tag, Award, Edit3, X, Paperclip,
  Download, Upload, RefreshCw,
  Shield, Key
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useComplaints, Complaint } from '../../contexts/ComplaintContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { ComplaintForm } from '../complaints/ComplaintForm';
import { ComplaintDetails } from '../complaints/ComplaintDetails';
import { StatsCard } from '../common/StatsCard';
import { Header } from '../common/Header';
import { ChatBot } from '../chatbot/ChatBot';

export function UserDashboard() {
  const { user } = useAuth();
  const { getUserComplaints } = useComplaints();
  const { notifications } = useNotifications();
  
  // State management
  const [activeView, setActiveView] = useState<'dashboard' | 'new-complaint' | 'complaint-details' | 'profile'>('dashboard');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showChatBot, setShowChatBot] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackComplaint, setFeedbackComplaint] = useState<Complaint | null>(null);
  const [rating, setRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');

  // Get user complaints
  const userComplaints = getUserComplaints(user?.id || '');
  
  // Filter complaints based on search and status
  const filteredComplaints = userComplaints.filter(complaint => {
    const matchesSearch = complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         complaint.status.toLowerCase().replace(/\s+/g, '').includes(statusFilter.toLowerCase());
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    total: userComplaints.length,
    open: userComplaints.filter(c => ['Open', 'In Progress'].includes(c.status)).length,
    resolved: userComplaints.filter(c => c.status === 'Resolved').length,
    pending: userComplaints.filter(c => c.status === 'Under Review').length,
    escalated: userComplaints.filter(c => c.isEscalated).length,
    highPriority: userComplaints.filter(c => ['High', 'Urgent'].includes(c.priority)).length,
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  // Utility functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Under Review': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'Closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Escalated': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'text-red-600 bg-red-50';
      case 'High': return 'text-orange-600 bg-orange-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'Open': return 25;
      case 'In Progress': return 50;
      case 'Under Review': return 75;
      case 'Resolved': 
      case 'Closed': return 100;
      default: return 0;
    }
  };

  const handleViewComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setActiveView('complaint-details');
  };

  const handleSubmitFeedback = () => {
    if (feedbackComplaint && rating > 0) {
      // Here you would typically call an API to submit feedback
      console.log('Submitting feedback:', { 
        complaintId: feedbackComplaint.id, 
        rating, 
        comment: feedbackComment 
      });
      setShowFeedbackModal(false);
      setRating(0);
      setFeedbackComment('');
      setFeedbackComplaint(null);
    }
  };

  // Main dashboard view
  if (activeView === 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        
        <div className="container mx-auto px-4 py-8">
          {/* Welcome Section with Quick Actions */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white mb-8">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-3">
                  Welcome back, {user?.name}! 👋
                </h1>
                <p className="text-blue-100 text-lg mb-6">
                  {stats.open > 0 
                    ? `You have ${stats.open} active complaint${stats.open > 1 ? 's' : ''} being processed by our support team.` 
                    : stats.total > 0 
                      ? 'All your complaints are up to date. Great work staying on top of things!'
                      : 'Ready to get started? Our AI-powered system makes filing complaints quick and easy.'}
                </p>
                
                {/* Quick Action Buttons */}
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => setActiveView('new-complaint')}
                    className="bg-white text-blue-700 px-6 py-3 rounded-lg flex items-center gap-2 font-semibold hover:bg-gray-50 transition-all duration-200 shadow-lg"
                  >
                    <Plus className="w-5 h-5" />
                    File New Complaint
                  </button>
                  <button
                    onClick={() => setShowChatBot(true)}
                    className="bg-white bg-opacity-20 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold hover:bg-opacity-30 transition-all duration-200 border border-white border-opacity-30"
                  >
                    <MessageCircle className="w-5 h-5" />
                    AI Assistant
                  </button>
                  {stats.total > 0 && (
                    <button
                      onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })}
                      className="bg-white bg-opacity-20 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold hover:bg-opacity-30 transition-all duration-200 border border-white border-opacity-30"
                    >
                      <Eye className="w-5 h-5" />
                      View My Complaints
                    </button>
                  )}
                </div>
              </div>
              
              {/* Action Icons */}
              <div className="flex gap-3 ml-6">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative bg-white bg-opacity-20 p-3 rounded-lg hover:bg-opacity-30 transition-colors"
                >
                  <Bell className="w-6 h-6" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => setActiveView('profile')}
                  className="bg-white bg-opacity-20 p-3 rounded-lg hover:bg-opacity-30 transition-colors"
                >
                  <User className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Statistics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Complaints"
              value={stats.total}
              icon={FileText}
              color="blue"
              subtitle="All time submissions"
            />
            <StatsCard
              title="Active Cases"
              value={stats.open}
              icon={Clock}
              color="orange"
              subtitle="Currently being processed"
            />
            <StatsCard
              title="Resolved Successfully"
              value={stats.resolved}
              icon={CheckCircle}
              color="green"
              subtitle="Issues fixed"
            />
            <StatsCard
              title="High Priority"
              value={stats.highPriority}
              icon={AlertTriangle}
              color="red"
              subtitle="Urgent & high priority"
            />
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search complaints by title, description, or ticket ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <Filter className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white min-w-[200px]"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="inprogress">In Progress</option>
                  <option value="underreview">Under Review</option>
                  <option value="resolved">Resolved</option>
                  <option value="escalated">Escalated</option>
                </select>
              </div>
            </div>

            {/* Complaints List */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  My Complaints ({filteredComplaints.length})
                </h2>
                {userComplaints.length > 0 && (
                  <div className="text-sm text-gray-500">
                    Showing {filteredComplaints.length} of {userComplaints.length} complaints
                  </div>
                )}
              </div>
              
              {filteredComplaints.length === 0 ? (
                <div className="text-center py-16">
                  <FileText className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                    {userComplaints.length === 0 ? 'No complaints yet' : 'No complaints match your search'}
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    {userComplaints.length === 0 
                      ? 'Get started by filing your first complaint. Our AI will help categorize and prioritize it automatically, and you\'ll be able to track its progress in real-time.'
                      : 'Try adjusting your search terms or filters to find what you\'re looking for. You can search by title, description, or ticket ID.'}
                  </p>
                  {userComplaints.length === 0 && (
                    <button
                      onClick={() => setActiveView('new-complaint')}
                      className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 font-semibold text-lg transition-colors"
                    >
                      File Your First Complaint
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredComplaints.map((complaint) => (
                    <div
                      key={complaint.id}
                      className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer bg-white"
                      onClick={() => handleViewComplaint(complaint)}
                    >
                      {/* Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-semibold text-gray-900">{complaint.title}</h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(complaint.status)}`}>
                              {complaint.status}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(complaint.priority)}`}>
                              {complaint.priority} Priority
                            </span>
                            {complaint.isEscalated && (
                              <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
                                Escalated
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 mb-4 line-clamp-2">{complaint.description}</p>
                        </div>
                        <ChevronRight className="w-6 h-6 text-gray-400 flex-shrink-0 ml-4" />
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Progress</span>
                          <span>{getProgressPercentage(complaint.status)}% Complete</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all duration-300 ${
                              complaint.status === 'Resolved' || complaint.status === 'Closed' ? 'bg-green-500' :
                              complaint.status === 'Under Review' ? 'bg-purple-500' :
                              complaint.status === 'In Progress' ? 'bg-blue-500' :
                              'bg-gray-400'
                            }`}
                            style={{ width: `${getProgressPercentage(complaint.status)}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* Details */}
                      <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <Tag className="w-4 h-4" />
                          ID: {complaint.id}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {complaint.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Created: {new Date(complaint.createdAt).toLocaleDateString()}
                        </span>
                        {complaint.assignedTo && (
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            Assigned to: {complaint.assignedTo}
                          </span>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex justify-between items-center">
                        <div className="flex gap-3">
                          {complaint.status === 'Resolved' && !complaint.feedback && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setFeedbackComplaint(complaint);
                                setShowFeedbackModal(true);
                              }}
                              className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-yellow-200 transition-colors"
                            >
                              <Star className="w-4 h-4" />
                              Rate Our Service
                            </button>
                          )}
                          {complaint.feedback && (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <Award className="w-4 h-4" />
                              Rated: {complaint.feedback.rating}/5 stars
                            </div>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewComplaint(complaint);
                            }}
                            className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-200 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View Full Details
                          </button>
                        </div>
                        <div className="text-sm text-gray-500">
                          Last updated: {new Date(complaint.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tips and Help Section */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">💡 Tips for Better Support Experience</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-blue-600" />
                  Filing Effective Complaints
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Be specific and detailed about your issue. Include relevant information like account numbers, 
                  order IDs, error messages, or timestamps. The more context you provide, the faster our 
                  support team can understand and resolve your problem.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Paperclip className="w-5 h-5 text-green-600" />
                  Supporting Documents
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Upload screenshots, photos, receipts, or any relevant documents that support your complaint. 
                  Visual evidence helps our agents understand the issue better and provides faster resolution.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-purple-600" />
                  AI Assistant Help
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Try our AI chatbot first for instant help! It can answer common questions, check your 
                  complaint status, provide quick solutions, and even help you file new complaints through 
                  a conversational interface.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  Your Feedback Matters
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  After your complaint is resolved, please take a moment to rate our service and leave 
                  feedback. Your input helps us improve our support quality and serve you better in the future.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modals and Overlays */}
        {showChatBot && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
                <button
                  onClick={() => setShowChatBot(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="h-96">
                <ChatBot />
              </div>
            </div>
          </div>
        )}

        {/* Notifications Panel */}
        {showNotifications && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
            <div className="bg-white w-96 h-full shadow-xl overflow-y-auto">
              <div className="p-6 border-b bg-gray-50">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                {unreadNotifications > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    {unreadNotifications} unread notification{unreadNotifications > 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <div className="p-6">
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No notifications yet</p>
                    <p className="text-sm text-gray-400 mt-2">
                      You'll receive updates about your complaints here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.slice(0, 20).map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-lg border transition-colors ${
                          notification.read 
                            ? 'bg-gray-50 border-gray-200' 
                            : 'bg-blue-50 border-blue-200 shadow-sm'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">{notification.title}</h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{notification.message}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Feedback Modal */}
        {showFeedbackModal && feedbackComplaint && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Rate Our Service</h3>
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  How satisfied are you with the resolution of complaint #{feedbackComplaint.id}?
                </p>
                <div className="flex justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`text-3xl transition-colors ${
                        star <= rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
                <textarea
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Tell us about your experience (optional)..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitFeedback}
                  disabled={rating === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Feedback
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // New complaint view
  if (activeView === 'new-complaint') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <button
                onClick={() => setActiveView('dashboard')}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">File a New Complaint</h1>
              <p className="text-gray-600">
                Describe your issue in detail. Our AI will automatically categorize and prioritize your complaint.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-8">
              <ComplaintForm 
                onSuccess={() => setActiveView('dashboard')} 
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Complaint details view
  if (activeView === 'complaint-details' && selectedComplaint) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <button
              onClick={() => setActiveView('dashboard')}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4"
            >
              ← Back to Dashboard
            </button>
          </div>
          <ComplaintDetails 
            complaint={selectedComplaint} 
            onBack={() => setActiveView('dashboard')}
          />
        </div>
      </div>
    );
  }

  // Profile view
  if (activeView === 'profile') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <button
                onClick={() => setActiveView('dashboard')}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile & Settings</h1>
              <p className="text-gray-600">Manage your account information and preferences</p>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Personal Information */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <User className="w-6 h-6 text-blue-600" />
                  Personal Information
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={user?.name || ''}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company/Organization</label>
                    <input
                      type="text"
                      placeholder="Your company name"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <input
                      type="text"
                      placeholder="Your address"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                {/* Security Settings */}
                <div className="mt-8 pt-8 border-t">
                  <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    Security Settings
                  </h4>
                  
                  <div className="space-y-6">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">Change Password</h5>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                          <input
                            type="password"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                          <input
                            type="password"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-900">Two-Factor Authentication</p>
                          <p className="text-sm text-green-700">Add an extra layer of security to your account</p>
                        </div>
                      </div>
                      <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
                        Enable 2FA
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-3">
                        <Key className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-blue-900">Account Recovery</p>
                          <p className="text-sm text-blue-700">Set up recovery options for your account</p>
                        </div>
                      </div>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                        Configure
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex gap-4">
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium">
                    Save Changes
                  </button>
                  <button className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 font-medium">
                    Cancel
                  </button>
                </div>
              </div>
              
              {/* Preferences & Settings Sidebar */}
              <div className="space-y-6">
                {/* Notification Preferences */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-purple-600" />
                    Notifications
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span className="text-gray-700">Email notifications</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-gray-700">SMS notifications</span>
                      <input type="checkbox" className="rounded" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-gray-700">Status updates</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-gray-700">Promotional emails</span>
                      <input type="checkbox" className="rounded" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-gray-700">Weekly summaries</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </label>
                  </div>
                </div>
                
                {/* Privacy Settings */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    Privacy
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span className="text-gray-700">Profile visibility</span>
                      <select className="border border-gray-300 rounded px-2 py-1 text-sm">
                        <option>Private</option>
                        <option>Public</option>
                      </select>
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-gray-700">Data analytics</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-gray-700">Cookie preferences</span>
                      <button className="text-blue-600 text-sm hover:underline">Manage</button>
                    </label>
                  </div>
                </div>
                
                {/* Account Actions */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
                  <div className="space-y-3">
                    <button className="w-full flex items-center gap-2 p-3 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                      <Download className="w-4 h-4" />
                      Download My Data
                    </button>
                    <button className="w-full flex items-center gap-2 p-3 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                      <Upload className="w-4 h-4" />
                      Export Complaints
                    </button>
                    <button className="w-full flex items-center gap-2 p-3 text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                      <RefreshCw className="w-4 h-4" />
                      Reset Preferences
                    </button>
                    <button className="w-full flex items-center gap-2 p-3 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                      <X className="w-4 h-4" />
                      Delete Account
                    </button>
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Statistics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Member since</span>
                      <span className="font-medium">Jan 2024</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total complaints</span>
                      <span className="font-medium">{stats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Resolved cases</span>
                      <span className="font-medium text-green-600">{stats.resolved}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Satisfaction rating</span>
                      <span className="font-medium flex items-center gap-1">
                        4.8 <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}