import { useState } from 'react';
import { 
  FileText, Clock, CheckCircle, AlertTriangle, 
  Search, TrendingUp, Shield, ChevronRight,
  UserPlus, Edit, Trash2, Download, 
  BarChart3, PieChart, Calendar, RefreshCw,
  ArrowUp, ArrowDown, Eye,
  Star, Award, Target, Activity, Zap, UserCheck
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        
        <div className="container mx-auto px-4 py-8">
          {/* Admin Welcome Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white mb-8 shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-10 h-10 text-white" />
                  <h1 className="text-4xl font-bold">Admin Control Center</h1>
                </div>
                <p className="text-blue-100 text-lg mb-6">
                  🛡️ System-wide complaint management and administrative oversight
                  {stats.pendingAssignment > 0 && 
                  ` • ${stats.pendingAssignment} complaints need immediate assignment`}
                </p>
                
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => setActiveView('complaints')}
                    className="bg-white text-blue-700 px-6 py-3 rounded-lg flex items-center gap-2 font-semibold hover:bg-gray-50 transition-colors shadow-lg"
                  >
                    <FileText className="w-5 h-5" />
                    Manage All Complaints ({stats.open} active)
                  </button>
                  <button
                    onClick={() => setActiveView('users')}
                    className="bg-white bg-opacity-20 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold hover:bg-opacity-30 transition-colors border border-white border-opacity-30"
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
                  <div className="text-3xl font-bold text-white">{todayComplaints}</div>
                  <div className="text-blue-100">New Today</div>
                  <div className="text-sm text-blue-200 mt-1">Admin View</div>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">QuickFix</h1>
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

  // User Management View
  if (activeView === 'users') {
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
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">User & Agent Management</h1>
                <p className="text-gray-600">Manage all users, agents, and system administrators.</p>
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Add New User
              </button>
            </div>
          </div>

          {/* User Management Tabs */}
          <div className="bg-white rounded-xl shadow-sm mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button className="py-4 px-1 border-b-2 border-blue-500 text-blue-600 font-medium">
                  All Users ({adminUsers.length})
                </button>
                <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700">
                  Agents (8)
                </button>
                <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700">
                  Administrators (3)
                </button>
                <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700">
                  Inactive Users (2)
                </button>
              </nav>
            </div>

            {/* Search and Filters */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search users by name, email, or ID..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <select className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500">
                  <option>All Roles</option>
                  <option>Users</option>
                  <option>Agents</option>
                  <option>Admins</option>
                </select>
                <select className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500">
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Banned</option>
                </select>
                <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>

            {/* User List */}
            <div className="p-6">
              <div className="space-y-4">
                {adminUsers.map((user) => (
                  <div key={user.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserCheck className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{user.name}</h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'Agent' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {user.role}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.status === 'active' ? 'bg-green-100 text-green-800' :
                              user.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {user.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{user.totalComplaints} Complaints</div>
                          <div className="text-xs text-gray-600">{user.resolvedComplaints} resolved</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Last Active</div>
                          <div className="text-xs text-gray-500">
                            {new Date(user.lastActive).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-gray-600">
                  Showing 1-10 of {adminUsers.length} users
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">Previous</button>
                  <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">1</button>
                  <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">2</button>
                  <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">Next</button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-green-600" />
                Bulk Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full bg-green-50 text-green-700 p-3 rounded-lg hover:bg-green-100 text-left">
                  Create Multiple Users
                </button>
                <button className="w-full bg-blue-50 text-blue-700 p-3 rounded-lg hover:bg-blue-100 text-left">
                  Import from CSV
                </button>
                <button className="w-full bg-orange-50 text-orange-700 p-3 rounded-lg hover:bg-orange-100 text-left">
                  Send Bulk Notifications
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Recent Activity
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span>New user registered</span>
                  <span className="text-gray-500">2m ago</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Agent role assigned</span>
                  <span className="text-gray-500">5m ago</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>User account suspended</span>
                  <span className="text-gray-500">1h ago</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                Security Overview
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">2FA Enabled</span>
                  <span className="font-medium">78%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Failed Logins</span>
                  <span className="font-medium text-red-600">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Locked Accounts</span>
                  <span className="font-medium text-orange-600">3</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced Analytics View
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
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics & Reports</h1>
                <p className="text-gray-600">Comprehensive insights into complaint management performance and system metrics.</p>
              </div>
              <div className="flex gap-3">
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export Report
                </button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Refresh Data
                </button>
              </div>
            </div>
          </div>

          {/* Analytics Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                  <ArrowUp className="w-4 h-4" />
                  +12%
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stats.avgResolutionTime}h</div>
              <div className="text-sm text-gray-600">Avg Resolution Time</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                  <ArrowUp className="w-4 h-4" />
                  +8%
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stats.satisfactionRate}/5</div>
              <div className="text-sm text-gray-600">Customer Satisfaction</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-sm text-red-600 font-medium flex items-center gap-1">
                  <ArrowDown className="w-4 h-4" />
                  -3%
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">94.2%</div>
              <div className="text-sm text-gray-600">SLA Compliance</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Zap className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                  <ArrowUp className="w-4 h-4" />
                  +15%
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">87%</div>
              <div className="text-sm text-gray-600">First Contact Resolution</div>
            </div>
          </div>

          {/* Charts and Analytics */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Main Analytics Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Complaint Trends</h3>
                <select className="border border-gray-300 rounded-lg px-3 py-1 text-sm">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 3 months</option>
                  <option>Last year</option>
                </select>
              </div>
              <AnalyticsChart title="" type="line" data={complaints} />
            </div>

            {/* Category Breakdown */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Complaints by Category</h3>
              <div className="space-y-4">
                {['Technical Support', 'Billing', 'Product Quality', 'Customer Service', 'Delivery'].map((category, index) => {
                  const percentage = Math.floor(Math.random() * 30) + 10;
                  return (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-gray-700">{category}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              index === 0 ? 'bg-blue-500' :
                              index === 1 ? 'bg-green-500' :
                              index === 2 ? 'bg-yellow-500' :
                              index === 3 ? 'bg-purple-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-10 text-right">{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Agent Performance */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Agent Performance Metrics</h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All Agents →
              </button>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Top Performers This Month</h4>
                <div className="space-y-3">
                  {[
                    { name: 'Sarah Johnson', resolved: 156, rating: 4.9, efficiency: 98 },
                    { name: 'Mike Chen', resolved: 142, rating: 4.8, efficiency: 95 },
                    { name: 'Emily Davis', resolved: 138, rating: 4.7, efficiency: 93 },
                  ].map((agent, index) => (
                    <div key={agent.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          'bg-orange-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{agent.name}</div>
                          <div className="text-sm text-gray-600">{agent.resolved} resolved</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          {agent.rating}
                        </div>
                        <div className="text-sm text-gray-600">{agent.efficiency}% efficiency</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Resolution Time by Priority</h4>
                <div className="space-y-4">
                  {[
                    { priority: 'Urgent', avgTime: '2.1h', target: '2h', status: 'warning' },
                    { priority: 'High', avgTime: '6.3h', target: '8h', status: 'good' },
                    { priority: 'Medium', avgTime: '18.5h', target: '24h', status: 'good' },
                    { priority: 'Low', avgTime: '52.2h', target: '72h', status: 'good' },
                  ].map((item) => (
                    <div key={item.priority} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                          item.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                          item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {item.priority}
                        </span>
                        <span className="text-gray-700">Avg: {item.avgTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Target: {item.target}</span>
                        <div className={`w-3 h-3 rounded-full ${
                          item.status === 'good' ? 'bg-green-500' : 'bg-yellow-500'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Export Reports</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <div className="flex items-center gap-3 mb-2">
                  <PieChart className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Performance Report</span>
                </div>
                <p className="text-sm text-gray-600">Complete performance analytics and metrics</p>
              </button>
              
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Monthly Summary</span>
                </div>
                <p className="text-sm text-gray-600">Monthly complaint trends and resolutions</p>
              </button>
              
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <span className="font-medium">Custom Report</span>
                </div>
                <p className="text-sm text-gray-600">Build your own custom analytics report</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}