import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useComplaints } from '../../contexts/ComplaintContext';
import { Header } from '../common/Header';
import { ComplaintList } from '../complaints/ComplaintList';
import { ComplaintDetails } from '../complaints/ComplaintDetails';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  User,
  Target,
  TrendingUp,
  Filter,
  Search,
  Bell,
  Calendar,
  Star,
  Award,
  Zap,
  Users,
  BarChart3,
  MessageCircle,
  Activity,
  ChevronRight
} from 'lucide-react';

export function AgentDashboard() {
  const { user } = useAuth();
  const { complaints, updateComplaintStatus, addComplaintUpdate } = useComplaints();
  const [activeTab, setActiveTab] = useState<'overview' | 'my-tickets' | 'workload'>('overview');
  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Agent-specific data (in real app, this would be filtered by agent ID)
  const myTickets = complaints.filter(c => c.assignedTo === user?.id || c.assignedTo === `Agent-${user?.id}`);
  const activeTickets = myTickets.filter(c => c.status === 'In Progress' || c.status === 'Open');
  const resolvedToday = myTickets.filter(c => 
    c.status === 'Resolved' && 
    c.updatedAt.toDateString() === new Date().toDateString()
  );
  const urgentTickets = myTickets.filter(c => c.priority === 'Urgent');

  // Filter tickets based on selected filters and search
  const filteredTickets = myTickets.filter(ticket => {
    const matchesStatus = filterStatus === 'all' || ticket.status.toLowerCase().replace(' ', '_') === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority.toLowerCase() === filterPriority;
    const matchesSearch = searchTerm === '' || 
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.includes(searchTerm);
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const handleTicketUpdate = (ticketId: string, status: string, comment: string) => {
    updateComplaintStatus(ticketId, status as 'Open' | 'In Progress' | 'Under Review' | 'Resolved' | 'Closed', comment);
    addComplaintUpdate(ticketId, comment, user?.name || 'Agent', 'comment');
  };

  if (selectedComplaint) {
    const complaint = complaints.find(c => c.id === selectedComplaint);
    if (complaint) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          <Header />
          <ComplaintDetails 
            complaint={complaint} 
            onBack={() => setSelectedComplaint(null)}
            onUpdate={handleTicketUpdate}
            isAgent={true}
          />
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <div className="container mx-auto px-6 py-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white mb-8">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-3">
                Agent Dashboard
              </h1>
              <p className="text-blue-100 text-lg mb-6">
                Welcome, <span className="font-semibold">{user?.name || 'Agent'}</span>! 
                {activeTickets.length > 0 
                  ? ` You have ${activeTickets.length} active ticket${activeTickets.length > 1 ? 's' : ''} to resolve.` 
                  : ' All tickets are up to date. Great work!'}
              </p>
              
              {/* Quick Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setActiveTab('my-tickets')}
                  className="bg-white text-blue-700 px-6 py-3 rounded-lg flex items-center gap-2 font-semibold hover:bg-gray-50 transition-all duration-200 shadow-lg"
                >
                  <FileText className="w-5 h-5" />
                  View My Tickets
                </button>
                <button
                  onClick={() => setActiveTab('workload')}
                  className="bg-white bg-opacity-20 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold hover:bg-opacity-30 transition-all duration-200 border border-white border-opacity-30"
                >
                  <TrendingUp className="w-5 h-5" />
                  Performance Metrics
                </button>
              </div>
            </div>
            
            {/* Action Icons */}
            <div className="flex gap-3 ml-6">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-8 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3, description: 'Dashboard summary' },
            { id: 'my-tickets', label: 'My Tickets', icon: FileText, description: 'Assigned complaints' },
            { id: 'workload', label: 'Performance', icon: TrendingUp, description: 'Track metrics' },
          ].map(({ id, label, icon: Icon, description }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as 'overview' | 'my-tickets' | 'workload')}
              className={`group relative flex-1 flex flex-col items-center gap-2 px-6 py-4 rounded-lg font-medium transition-all duration-300 ${
                activeTab === id
                  ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <Icon className={`w-6 h-6 transition-transform duration-300 ${
                activeTab === id ? 'scale-110' : 'group-hover:scale-110'
              }`} />
              <span className="font-semibold">{label}</span>
              <span className="text-xs opacity-75 hidden sm:block">{description}</span>
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">{activeTickets.length}</div>
                    <div className="text-blue-600 text-sm font-medium">Active Tickets</div>
                  </div>
                </div>
                <div className="text-gray-600 text-sm">Currently assigned to you</div>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{width: '75%'}}></div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 p-3 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">{resolvedToday.length}</div>
                    <div className="text-green-600 text-sm font-medium">Resolved Today</div>
                  </div>
                </div>
                <div className="text-gray-600 text-sm">Great progress today!</div>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '92%'}}></div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-red-100 p-3 rounded-xl">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">{urgentTickets.length}</div>
                    <div className="text-red-600 text-sm font-medium">Urgent Cases</div>
                  </div>
                </div>
                <div className="text-gray-600 text-sm">Requires immediate attention</div>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{width: '45%'}}></div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-100 p-3 rounded-xl">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">{myTickets.length}</div>
                    <div className="text-purple-600 text-sm font-medium">Total Assigned</div>
                  </div>
                </div>
                <div className="text-gray-600 text-sm">All time assignments</div>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{width: '88%'}}></div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 p-2 rounded-xl">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button
                  onClick={() => setActiveTab('my-tickets')}
                  className="group bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 rounded-xl p-6 transition-all duration-300 transform hover:scale-105"
                >
                  <div className="text-center">
                    <Clock className="w-12 h-12 text-blue-600 group-hover:text-blue-700 mx-auto mb-4 transition-colors duration-300 group-hover:scale-110 transform" />
                    <div className="font-bold text-gray-900 text-lg group-hover:text-blue-700 transition-colors duration-300">View Active Tickets</div>
                    <div className="text-gray-600 text-sm mt-2">{activeTickets.length} pending tickets</div>
                  </div>
                </button>
                
                <button className="group bg-green-50 hover:bg-green-100 border border-green-200 hover:border-green-300 rounded-xl p-6 transition-all duration-300 transform hover:scale-105">
                  <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-green-600 group-hover:text-green-700 mx-auto mb-4 transition-colors duration-300 group-hover:scale-110 transform" />
                    <div className="font-bold text-gray-900 text-lg group-hover:text-green-700 transition-colors duration-300">Mark as Resolved</div>
                    <div className="text-gray-600 text-sm mt-2">Quick resolution</div>
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab('workload')}
                  className="group bg-purple-50 hover:bg-purple-100 border border-purple-200 hover:border-purple-300 rounded-xl p-6 transition-all duration-300 transform hover:scale-105"
                >
                  <div className="text-center">
                    <Award className="w-12 h-12 text-purple-600 group-hover:text-purple-700 mx-auto mb-4 transition-colors duration-300 group-hover:scale-110 transform" />
                    <div className="font-bold text-gray-900 text-lg group-hover:text-purple-700 transition-colors duration-300">View Performance</div>
                    <div className="text-gray-600 text-sm mt-2">Track your metrics</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Tickets */}
            <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-xl">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">My Recent Assignments</h2>
                </div>
                {myTickets.length > 0 && (
                  <button
                    onClick={() => setActiveTab('my-tickets')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 transition-colors duration-200"
                  >
                    View All <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {myTickets.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-100 p-6 rounded-2xl w-fit mx-auto mb-4">
                    <User className="w-16 h-16 text-gray-400 mx-auto" />
                  </div>
                  <p className="text-gray-900 text-lg mb-2">No tickets assigned yet</p>
                  <p className="text-gray-600">New assignments will appear here once you're assigned tickets</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Show new/recent assignments first */}
                  {myTickets
                    .filter(t => t.status === 'Open' || t.status === 'In Progress')
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 6)
                    .map((ticket) => {
                      const isNew = new Date().getTime() - new Date(ticket.createdAt).getTime() < 24 * 60 * 60 * 1000; // Less than 24 hours old
                      const isUrgent = ticket.priority === 'Urgent' || ticket.priority === 'High';
                      
                      return (
                        <div key={ticket.id} className={`relative border rounded-xl p-6 transition-all duration-300 hover:transform hover:scale-102 cursor-pointer ${
                          isUrgent ? 'border-red-300 bg-red-50' : 
                          isNew ? 'border-orange-300 bg-orange-50' : 
                          'border-gray-200 bg-white hover:shadow-lg'
                        }`}>
                          {isNew && (
                            <div className="absolute -top-2 -right-2">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500 text-white animate-pulse">
                                🆕 New
                              </span>
                            </div>
                          )}
                          
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h3 className="text-gray-900 font-semibold text-lg mb-2 line-clamp-1">{ticket.title}</h3>
                              <p className="text-gray-600 text-sm line-clamp-2 mb-3">{ticket.description}</p>
                              
                              <div className="flex items-center gap-4 text-xs">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  ticket.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                                  ticket.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                                  ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {ticket.priority} Priority
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  ticket.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                                  ticket.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {ticket.status}
                                </span>
                                <span className="text-gray-500">
                                  Category: {ticket.category}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-2 ml-4">
                              <span className="text-xs text-gray-500">
                                {new Date(ticket.createdAt).toLocaleDateString()}
                              </span>
                              <button
                                onClick={() => setSelectedComplaint(ticket.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                  isUrgent ? 'bg-red-500 hover:bg-red-600 text-white' :
                                  'bg-blue-500 hover:bg-blue-600 text-white'
                                } transform hover:scale-105`}
                              >
                                {ticket.status === 'Open' ? 'Start Working' : 'Continue'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  
                  {myTickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <p className="text-gray-900">All your tickets are resolved!</p>
                      <p className="text-gray-600 text-sm">Great work! New assignments will appear here.</p>
                    </div>
                  )}
                </div>
              )}
            </div> 
          </div>
        )}

        {activeTab === 'my-tickets' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <Filter className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Filter & Search Tickets</h3>
              </div>
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search tickets by ID, title, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-300"
                  />
                </div>
                
                <div className="flex gap-4">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-6 py-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 min-w-[150px] transition-all duration-300"
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="under_review">Under Review</option>
                    <option value="resolved">Resolved</option>
                  </select>

                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="px-6 py-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 min-w-[150px] transition-all duration-300"
                  >
                    <option value="all">All Priority</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* My Tickets List */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">My Assigned Tickets</h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-gray-100 px-4 py-2 rounded-xl border border-gray-200">
                    <span className="text-gray-600 text-sm">
                      <span className="text-blue-600 font-semibold">{filteredTickets.length}</span> of <span className="text-gray-900 font-semibold">{myTickets.length}</span> tickets
                    </span>
                  </div>
                  {urgentTickets.length > 0 && (
                    <div className="bg-red-100 text-red-800 px-4 py-2 rounded-xl border border-red-200 flex items-center gap-2">
                      <Bell className="w-4 h-4 animate-pulse" />
                      <span className="text-sm font-medium">{urgentTickets.length} urgent</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                <ComplaintList 
                  complaints={filteredTickets} 
                  showActions={true} 
                  isAgent={true}
                  onSelectComplaint={setSelectedComplaint}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'workload' && (
          <div className="space-y-8">
            {/* Performance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 p-3 rounded-xl">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">94%</div>
                    <div className="text-green-600 text-sm font-medium">Resolution Rate</div>
                  </div>
                </div>
                <div className="text-gray-600 text-sm">Above team average</div>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '94%'}}></div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">2.1h</div>
                    <div className="text-blue-600 text-sm font-medium">Avg Response</div>
                  </div>
                </div>
                <div className="text-gray-600 text-sm">Within SLA targets</div>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{width: '85%'}}></div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-yellow-100 p-3 rounded-xl">
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">4.8/5</div>
                    <div className="text-yellow-600 text-sm font-medium">Rating</div>
                  </div>
                </div>
                <div className="text-gray-600 text-sm">Customer satisfaction</div>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{width: '96%'}}></div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-100 p-3 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">{myTickets.filter(t => {
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return t.createdAt >= weekAgo;
                    }).length}</div>
                    <div className="text-purple-600 text-sm font-medium">This Week</div>
                  </div>
                </div>
                <div className="text-gray-600 text-sm">Weekly performance</div>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{width: '78%'}}></div>
                </div>
              </div>
            </div>

            {/* Performance Chart */}
            <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 p-2 rounded-xl">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Weekly Performance Breakdown</h2>
              </div>
              <div className="space-y-6">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                  const resolved = Math.floor(Math.random() * 8) + 1; // Mock data
                  const maxDaily = 10;
                  const percentage = (resolved / maxDaily) * 100;
                  
                  return (
                    <div key={day} className="group">
                      <div className="flex items-center gap-6">
                        <div className="w-16 text-lg font-bold text-gray-900">{day}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-600 font-medium">Tickets Resolved</span>
                            <span className="text-gray-900 font-bold text-lg">{resolved}</span>
                          </div>
                          <div className="relative">
                            <div className="w-full bg-gray-200 rounded-full h-4">
                              <div 
                                className="h-4 rounded-full bg-blue-500 transition-all duration-700 group-hover:bg-blue-600"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 p-2 rounded-xl">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Recent Activity Timeline</h2>
              </div>
              <div className="space-y-4">
                {myTickets.slice(0, 5).map((ticket) => (
                  <div key={ticket.id} className="group relative bg-gray-50 hover:bg-gray-100 rounded-xl p-6 transition-all duration-300 border border-gray-200 hover:border-blue-300">
                    <div className="flex items-center gap-6">
                      <div className={`relative p-3 rounded-xl ${
                        ticket.priority === 'Urgent' ? 'bg-red-100 text-red-600' :
                        ticket.priority === 'High' ? 'bg-orange-100 text-orange-600' :
                        ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-green-100 text-green-600'
                      } group-hover:scale-110 transition-transform duration-300`}>
                        <MessageCircle className="w-5 h-5" />
                        {ticket.priority === 'Urgent' && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="font-bold text-gray-900 text-lg">#{ticket.id}</div>
                          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                            ticket.status === 'Resolved' ? 'bg-green-100 text-green-800 border border-green-200' :
                            ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            'bg-gray-100 text-gray-800 border border-gray-200'
                          }`}>
                            {ticket.status}
                          </div>
                        </div>
                        <div className="text-gray-700 font-medium mb-1">{ticket.title}</div>
                        <div className="text-gray-500 text-sm">{ticket.updatedAt.toLocaleString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600 text-sm">User #{ticket.userId.slice(-8)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}