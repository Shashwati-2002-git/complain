import { useState } from 'react';
import { 
  Plus, FileText, Clock, CheckCircle, Bell, User, MessageCircle, 
  Search, Eye, Calendar, Tag, X, Shield, Home, 
  Inbox, BarChart3, Settings, HelpCircle, Menu, Users,
  Brain, Bot, Crown
} from 'lucide-react';
import { ComplaintForm } from '../complaints/ComplaintForm';
import { ComplaintDetails } from '../complaints/ComplaintDetails';
import { FeedbackForm } from '../complaints/FeedbackForm';
import { ChatBot } from '../chatbot/ChatBot';
import { Notifications } from '../notifications/Notifications';

// Mock data for demonstration
const mockComplaints = [
  {
    id: '1',
    title: 'Billing discrepancy in last month invoice',
    description: 'There seems to be an error in my billing statement for August.',
    category: 'Billing',
    priority: 'High',
    status: 'Open',
    createdAt: '2024-10-01T10:00:00Z',
    user: 'john.doe@example.com'
  },
  {
    id: '2', 
    title: 'Product delivery delayed by 3 days',
    description: 'My order was supposed to arrive on October 1st but still pending.',
    category: 'Delivery',
    priority: 'Medium',
    status: 'In Progress',
    createdAt: '2024-09-30T14:30:00Z',
    user: 'jane.smith@example.com'
  },
  {
    id: '3',
    title: 'Unable to access customer portal',
    description: 'Getting authentication errors when trying to log in.',
    category: 'Technical',
    priority: 'High',
    status: 'Resolved',
    createdAt: '2024-09-29T09:15:00Z',
    user: 'mike.johnson@example.com'
  }
];

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  user: string;
}

interface UserDashboardProps {
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

export function UserDashboard({ user }: UserDashboardProps) {
  const [activeView, setActiveView] = useState('dashboard');
  const [complaints] = useState<Complaint[]>(mockComplaints);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>(mockComplaints);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showChatBot, setShowChatBot] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Calculate statistics
  const stats = {
    total: complaints.length,
    open: complaints.filter(c => c.status === 'Open').length,
    inProgress: complaints.filter(c => c.status === 'In Progress').length,
    resolved: complaints.filter(c => c.status === 'Resolved').length,
    urgent: complaints.filter(c => c.priority === 'High').length,
    thisWeek: 5,
    aiResolved: 12,
    avgResponseTime: '2.5h',
    satisfactionScore: 4.8
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
          >
            <Home className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setActiveView('tickets')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              activeView === 'tickets' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Inbox className="w-5 h-5" />
          </button>
          
          <button className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <Users className="w-5 h-5" />
          </button>
          
          <button className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <MessageCircle className="w-5 h-5" />
          </button>
          
          <button className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <BarChart3 className="w-5 h-5" />
          </button>
          
          <button className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <User className="w-5 h-5" />
          </button>
          
          <button className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <Settings className="w-5 h-5" />
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
            <h1 className="text-xl font-semibold text-gray-900">My Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveView('new-ticket')}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg"
            >
              <Plus className="w-4 h-4" />
              New
            </button>
            
            <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
              <Search className="w-5 h-5" />
            </button>
            
            <button 
              onClick={() => setShowNotifications(true)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
            >
              <Bell className="w-5 h-5" />
            </button>
            
            <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
              <HelpCircle className="w-5 h-5" />
            </button>
            
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.charAt(0).toUpperCase() || 'S'}
            </div>
            
            <div className="text-right">
              <button className="text-blue-600 hover:text-blue-700 text-sm">Recent activities</button>
            </div>
          </div>
        </header>

        {/* Dashboard View - Freshdesk Style */}
        {activeView === 'dashboard' && (
          <div className="p-6 bg-gray-50 min-h-screen">
            {/* Top Metrics Cards - Freshdesk Style */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Unresolved</h3>
                <div className="text-3xl font-bold text-gray-900">{stats.open + stats.inProgress}</div>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Overdue</h3>
                <div className="text-3xl font-bold text-gray-900">{stats.urgent}</div>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Due today</h3>
                <div className="text-3xl font-bold text-gray-400">0</div>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Open</h3>
                <div className="text-3xl font-bold text-gray-900">{stats.open}</div>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-2">On hold</h3>
                <div className="text-3xl font-bold text-gray-900">{stats.inProgress}</div>
              </div>
            </div>

            {/* Main Content Grid - Freshdesk Style */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* To-do Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">To-do ({filteredComplaints.length})</h3>
                </div>
                <div className="p-6">
                  <button 
                    onClick={() => setActiveView('new-ticket')}
                    className="flex items-center text-green-600 hover:text-green-700 mb-4 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add a to-do
                  </button>
                  
                  <div className="space-y-4">
                    {filteredComplaints.slice(0, 3).map((complaint) => (
                      <div key={complaint.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <input type="checkbox" className="mt-1 rounded border-gray-300" />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-sm mb-1">{complaint.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              <span>{complaint.category}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-blue-600 mt-2">
                              <Clock className="w-3 h-3" />
                              <span>SET REMINDER</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Leaderboard/Achievements Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6">
                  <div className="flex gap-4 mb-6 border-b border-gray-200">
                    <button className="pb-3 px-1 text-green-600 border-b-2 border-green-600 font-medium text-sm">
                      Leaderboard
                    </button>
                    <button className="pb-3 px-1 text-gray-500 hover:text-gray-700 font-medium text-sm">
                      Achievements
                    </button>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">Across helpdesk this month</p>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-6">View all</button>
                    
                    <div className="flex justify-center items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Crown className="w-4 h-4 text-purple-600" />
                      </div>
                    </div>
                    
                    <h4 className="font-semibold text-gray-900 mb-1">{user?.name || 'User'}</h4>
                    <p className="text-sm text-gray-600">Most valuable player</p>
                  </div>
                </div>
              </div>

              {/* Customer Satisfaction */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Customer satisfaction</h3>
                  <p className="text-sm text-gray-600 mb-6">My tickets this month</p>
                  
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">Responses received</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.total || 40}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Positive</p>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold text-gray-900">93%</p>
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                        </div>
                        <div className="w-16 h-1 bg-green-500 rounded-full mt-1"></div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">Neutral</p>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold text-gray-900">5%</p>
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-yellow-600" />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Negative</p>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold text-gray-900">2%</p>
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <X className="w-5 h-5 text-red-600" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tickets View */}
        {activeView === 'tickets' && (
          <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">All Tickets</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {filteredComplaints.map((complaint) => (
                    <div key={complaint.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedComplaint(complaint)}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm mb-1">{complaint.title}</h4>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{complaint.category}</span>
                            <span>{complaint.priority}</span>
                            <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          complaint.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                          complaint.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {complaint.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* New Ticket View */}
        {activeView === 'new-ticket' && (
          <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Create New Ticket</h3>
                  <button 
                    onClick={() => setActiveView('dashboard')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <ComplaintForm 
                  onSubmit={() => {
                    setActiveView('dashboard');
                    // Add logic to handle form submission
                  }}
                  onCancel={() => setActiveView('dashboard')}
                />
              </div>
            </div>
          </div>
        )}

        {/* Complaint Details Modal */}
        {selectedComplaint && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4 max-h-[90vh] overflow-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Ticket Details</h3>
                  <button 
                    onClick={() => setSelectedComplaint(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <ComplaintDetails 
                  complaint={selectedComplaint}
                  onClose={() => setSelectedComplaint(null)}
                  onFeedback={() => {
                    setSelectedComplaint(null);
                    setShowFeedbackForm(true);
                  }}
                />
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
              <div className="h-[500px]">
                <ChatBot onClose={() => setShowChatBot(false)} />
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
                <FeedbackForm 
                  onSubmit={() => setShowFeedbackForm(false)}
                  onCancel={() => setShowFeedbackForm(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}