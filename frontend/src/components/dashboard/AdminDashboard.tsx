import { useState } from 'react';
import { 
  FileText, Clock, CheckCircle, AlertTriangle, 
  Search, TrendingUp, Shield, ChevronRight
} from 'lucide-react';
import { useComplaints, Complaint } from '../../contexts/ComplaintContext';
import { ComplaintDetails } from '../complaints/ComplaintDetails';
import { StatsCard } from '../common/StatsCard';
import { Header } from '../common/Header';
import { AnalyticsChart } from '../analytics/AnalyticsChart';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  joinDate: Date;
  totalComplaints: number;
  resolvedComplaints: number;
  activeComplaints: number;
  lastActive: Date;
  status: 'active' | 'inactive' | 'banned';
}

interface Team {
  id: string;
  name: string;
  members: number;
  activeTickets: number;
  avgResolutionTime: number;
  performance: number;
}

export function AdminDashboard() {
  const { complaints } = useComplaints();
  
  // State management
  const [activeView, setActiveView] = useState<'overview' | 'complaints' | 'users' | 'analytics' | 'settings'>('overview');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Calculate admin-specific statistics
  const stats = {
    total: complaints.length,
    open: complaints.filter(c => ['Open', 'In Progress'].includes(c.status)).length,
    resolved: complaints.filter(c => c.status === 'Resolved').length,
    escalated: complaints.filter(c => c.isEscalated).length,
    highPriority: complaints.filter(c => ['High', 'Urgent'].includes(c.priority)).length,
    avgResolutionTime: 3.4, // Mock data
    satisfactionRate: 4.2, // Mock data
    pendingAssignment: complaints.filter(c => !c.assignedTo && c.status === 'Open').length,
  };

  const todayComplaints = complaints.filter(c => 
    new Date(c.createdAt).toDateString() === new Date().toDateString()
  ).length;

  // Mock data for admin teams
  const teams: Team[] = [
    { id: '1', name: 'Technical Support', members: 8, activeTickets: 23, avgResolutionTime: 4.2, performance: 92 },
    { id: '2', name: 'Billing Department', members: 5, activeTickets: 15, avgResolutionTime: 2.8, performance: 95 },
    { id: '3', name: 'Customer Service', members: 12, activeTickets: 31, avgResolutionTime: 3.5, performance: 88 },
    { id: '4', name: 'Product Support', members: 6, activeTickets: 18, avgResolutionTime: 5.1, performance: 90 },
  ];

  const adminUsers: AdminUser[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'user@example.com',
      role: 'User',
      joinDate: new Date('2024-01-15'),
      totalComplaints: 12,
      resolvedComplaints: 10,
      activeComplaints: 2,
      lastActive: new Date(),
      status: 'active'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'User',
      joinDate: new Date('2024-03-20'),
      totalComplaints: 8,
      resolvedComplaints: 7,
      activeComplaints: 1,
      lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: 'active'
    }
  ];

  // Filter complaints
  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || complaint.status.toLowerCase().replace(/\s+/g, '').includes(statusFilter.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || complaint.priority.toLowerCase() === priorityFilter.toLowerCase();
    const matchesCategory = categoryFilter === 'all' || complaint.category.toLowerCase() === categoryFilter.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

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

  // Overview Dashboard
  if (activeView === 'overview') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
        <Header />
        
        <div className="container mx-auto px-4 py-8">
          {/* Admin Welcome Section */}
          <div className="bg-gradient-to-r from-orange-600 via-red-600 to-purple-700 rounded-xl p-8 text-white mb-8 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-10 h-10 text-yellow-300" />
                  <h1 className="text-4xl font-bold">Admin Control Center</h1>
                </div>
                <p className="text-orange-100 text-lg mb-6">
                  🛡️ System-wide complaint management and administrative oversight
                  {stats.pendingAssignment > 0 && 
                  ` • ${stats.pendingAssignment} complaints need immediate assignment`}
                </p>
                
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => setActiveView('complaints')}
                    className="bg-white text-orange-700 px-6 py-3 rounded-lg flex items-center gap-2 font-semibold hover:bg-gray-100 transition-colors shadow-lg"
                  >
                    <FileText className="w-5 h-5" />
                    Manage All Complaints ({stats.open} active)
                  </button>
                  <button
                    onClick={() => setActiveView('users')}
                    className="bg-white text-purple-700 px-6 py-3 rounded-lg flex items-center gap-2 font-semibold hover:bg-gray-100 transition-colors shadow-lg"
                  >
                    <Shield className="w-5 h-5" />
                    User Management
                  </button>
                  <button
                    onClick={() => setActiveView('analytics')}
                    className="bg-white bg-opacity-20 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold hover:bg-opacity-30 transition-colors border border-white border-opacity-30"
                  >
                    <TrendingUp className="w-5 h-5" />
                    System Analytics
                  </button>
                </div>
              </div>
              
              <div className="text-right">
                <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
                  <div className="text-3xl font-bold text-yellow-300">{todayComplaints}</div>
                  <div className="text-orange-100">New Today</div>
                  <div className="text-sm text-orange-200 mt-1">Admin View</div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Complaints"
              value={stats.total}
              icon={FileText}
              color="blue"
              subtitle={`${todayComplaints} added today`}
            />
            <StatsCard
              title="Active Cases"
              value={stats.open}
              icon={Clock}
              color="orange"
              subtitle={`${stats.pendingAssignment} unassigned`}
            />
            <StatsCard
              title="Resolved This Month"
              value={stats.resolved}
              icon={CheckCircle}
              color="green"
              subtitle={`${stats.satisfactionRate}/5 avg rating`}
            />
            <StatsCard
              title="Escalated Cases"
              value={stats.escalated}
              icon={AlertTriangle}
              color="red"
              subtitle="Need immediate attention"
            />
          </div>

          {/* Quick Actions & Recent Complaints */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* New Complaints Feed */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">📋 Recent Complaints</h2>
                <button 
                  onClick={() => setActiveView('complaints')}
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium"
                >
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {complaints
                  .filter(c => c.status === 'Open' || c.status === 'In Progress')
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 8)
                  .map((complaint) => (
                    <div key={complaint.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{complaint.title}</h3>
                        <div className="flex gap-2 flex-shrink-0 ml-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                            {complaint.priority}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(complaint.status)}`}>
                            {complaint.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{complaint.description}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <div className="flex items-center gap-4">
                          <span>ID: {complaint.id}</span>
                          <span>Category: {complaint.category}</span>
                          {complaint.assignedTo && (
                            <span>Assigned: {complaint.assignedTo}</span>
                          )}
                        </div>
                        <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                      </div>
                      {!complaint.assignedTo && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                            ⚠️ Needs Assignment
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                
                {complaints.filter(c => c.status === 'Open' || c.status === 'In Progress').length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-gray-600">All complaints are resolved!</p>
                    <p className="text-sm text-gray-500">Great work from the team!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Critical Complaints */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">🚨 Critical Complaints</h2>
                <button 
                  onClick={() => setActiveView('complaints')}
                  className="text-red-600 hover:text-red-700 flex items-center gap-1 text-sm font-medium"
                >
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                {complaints
                  .filter(c => c.priority === 'Urgent' || c.isEscalated)
                  .slice(0, 5)
                  .map((complaint) => (
                    <div key={complaint.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{complaint.title}</h3>
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                            {complaint.priority}
                          </span>
                          {complaint.isEscalated && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                              Escalated
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{complaint.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          ID: {complaint.id} • {new Date(complaint.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => setSelectedComplaint(complaint)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Take Action →
                        </button>
                      </div>
                    </div>
                  ))}
                
                {complaints.filter(c => c.priority === 'Urgent' || c.isEscalated).length === 0 && (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-gray-600">No critical complaints at the moment</p>
                    <p className="text-sm text-gray-500">Great job keeping things under control!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Team Performance Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">👥 Team Performance</h2>
              <button className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium">
                Manage Teams <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              {teams.map((team) => (
                <div key={team.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-900">{team.name}</h3>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      team.performance >= 95 ? 'bg-green-100 text-green-800' :
                      team.performance >= 90 ? 'bg-blue-100 text-blue-800' :
                      team.performance >= 85 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {team.performance}% Performance
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Members</div>
                      <div className="font-semibold">{team.members}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Active Tickets</div>
                      <div className="font-semibold">{team.activeTickets}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Avg Resolution</div>
                      <div className="font-semibold">{team.avgResolutionTime}h</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Complaints Management View
  if (activeView === 'complaints') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <button
              onClick={() => setActiveView('overview')}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4"
            >
              ← Back to Overview
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complaint Management</h1>
            <p className="text-gray-600">
              Manage all customer complaints, assign to teams, and track resolution progress.
            </p>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="grid lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2 relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by ID, title, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="inprogress">In Progress</option>
                <option value="underreview">Under Review</option>
                <option value="resolved">Resolved</option>
                <option value="escalated">Escalated</option>
              </select>
              
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="billing">Billing</option>
                <option value="technical">Technical</option>
                <option value="service">Service</option>
                <option value="product">Product</option>
                <option value="general">General</option>
              </select>
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-600">
                Showing {filteredComplaints.length} of {complaints.length} complaints
              </div>
            </div>
          </div>

          {/* Complaints Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Complaint</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">User</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Priority</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Created</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredComplaints.map((complaint) => (
                    <tr key={complaint.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{complaint.title}</div>
                          <div className="text-sm text-gray-600">#{complaint.id} • {complaint.category}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{adminUsers.find(u => u.id === complaint.userId)?.name || 'Unknown User'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(complaint.priority)}`}>
                          {complaint.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(complaint.status)}`}>
                          {complaint.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedComplaint(complaint)}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredComplaints.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No complaints match your current filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Complaint Details View
  if (selectedComplaint) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <button
              onClick={() => {
                setSelectedComplaint(null);
                setActiveView('complaints');
              }}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4"
            >
              ← Back to Complaints
            </button>
          </div>
          
          <ComplaintDetails 
            complaint={selectedComplaint} 
            onBack={() => {
              setSelectedComplaint(null);
              setActiveView('complaints');
            }}
          />
        </div>
      </div>
    );
  }

  // Analytics View
  if (activeView === 'analytics') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <button
              onClick={() => setActiveView('overview')}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4"
            >
              ← Back to Overview
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics & Reports</h1>
            <p className="text-gray-600">Comprehensive insights into complaint management performance.</p>
          </div>
          
          <AnalyticsChart title="System Analytics" type="line" data={complaints} />
        </div>
      </div>
    );
  }

  return null;
}