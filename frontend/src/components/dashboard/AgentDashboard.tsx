import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useComplaints } from '../../contexts/ComplaintContext';
import { Header } from '../common/Header';
import { StatsCard } from '../common/StatsCard';
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
  Search
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
    updateComplaintStatus(ticketId, status as any, comment);
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
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Agent Dashboard</h1>
          <p className="text-gray-600">Manage your assigned tickets and track your performance.</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-white p-1 rounded-lg shadow-sm">
          {[
            { id: 'overview', label: 'Overview', icon: FileText },
            { id: 'my-tickets', label: 'My Tickets', icon: User },
            { id: 'workload', label: 'Performance', icon: TrendingUp },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                activeTab === id
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-blue-500 hover:bg-blue-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="My Active Tickets"
                value={activeTickets.length}
                icon={Clock}
                color="blue"
                subtitle="Currently assigned to you"
              />
              <StatsCard
                title="Resolved Today"
                value={resolvedToday.length}
                icon={CheckCircle}
                color="green"
                subtitle="Great progress!"
              />
              <StatsCard
                title="Urgent Cases"
                value={urgentTickets.length}
                icon={AlertTriangle}
                color="red"
                subtitle="Requires immediate attention"
              />
              <StatsCard
                title="Total Assigned"
                value={myTickets.length}
                icon={Target}
                color="purple"
                subtitle="All time assignments"
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('my-tickets')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-center group"
                >
                  <Clock className="w-8 h-8 text-gray-400 group-hover:text-blue-500 mx-auto mb-2" />
                  <div className="font-medium text-gray-700 group-hover:text-blue-600">View Active Tickets</div>
                  <div className="text-sm text-gray-500">{activeTickets.length} pending</div>
                </button>
                
                <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200 text-center group">
                  <CheckCircle className="w-8 h-8 text-gray-400 group-hover:text-green-500 mx-auto mb-2" />
                  <div className="font-medium text-gray-700 group-hover:text-green-600">Mark as Resolved</div>
                  <div className="text-sm text-gray-500">Quick resolution</div>
                </button>
                
                <button
                  onClick={() => setActiveTab('workload')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 text-center group"
                >
                  <TrendingUp className="w-8 h-8 text-gray-400 group-hover:text-purple-500 mx-auto mb-2" />
                  <div className="font-medium text-gray-700 group-hover:text-purple-600">View Performance</div>
                  <div className="text-sm text-gray-500">Track metrics</div>
                </button>
              </div>
            </div>

            {/* Recent Tickets */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Assignments</h2>
              {myTickets.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No tickets assigned yet</p>
                  <p className="text-sm text-gray-400">New assignments will appear here</p>
                </div>
              ) : (
                <ComplaintList 
                  complaints={myTickets.slice(0, 5)} 
                  showActions={true} 
                  isAgent={true}
                  onSelectComplaint={setSelectedComplaint}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'my-tickets' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search my tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex gap-4">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">My Assigned Tickets</h2>
                <div className="text-sm text-gray-500">
                  {filteredTickets.length} of {myTickets.length} tickets
                </div>
              </div>
              <ComplaintList 
                complaints={filteredTickets} 
                showActions={true} 
                isAgent={true}
                onSelectComplaint={setSelectedComplaint}
              />
            </div>
          </div>
        )}

        {activeTab === 'workload' && (
          <div className="space-y-8">
            {/* Performance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Resolution Rate"
                value="94%"
                icon={Target}
                color="green"
                subtitle="Above team average"
              />
              <StatsCard
                title="Avg Response Time"
                value="2.1h"
                icon={Clock}
                color="blue"
                subtitle="Within SLA targets"
              />
              <StatsCard
                title="Customer Rating"
                value="4.8/5"
                icon={User}
                color="purple"
                subtitle="Based on resolved tickets"
              />
              <StatsCard
                title="Tickets This Week"
                value={myTickets.filter(t => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return t.createdAt >= weekAgo;
                }).length}
                icon={TrendingUp}
                color="orange"
                subtitle="Weekly performance"
              />
            </div>

            {/* Performance Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Weekly Performance</h2>
              <div className="space-y-4">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                  const resolved = Math.floor(Math.random() * 8) + 1; // Mock data
                  const maxDaily = 10;
                  const percentage = (resolved / maxDaily) * 100;
                  
                  return (
                    <div key={day} className="flex items-center gap-4">
                      <div className="w-12 text-sm font-medium text-gray-600">{day}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-500">Tickets Resolved</span>
                          <span className="text-sm font-medium text-gray-700">{resolved}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {myTickets.slice(0, 5).map((ticket) => (
                  <div key={ticket.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-full ${
                      ticket.priority === 'Urgent' ? 'bg-red-100 text-red-600' :
                      ticket.priority === 'High' ? 'bg-orange-100 text-orange-600' :
                      ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">#{ticket.id}</div>
                      <div className="text-sm text-gray-600">{ticket.title}</div>
                      <div className="text-xs text-gray-500">{ticket.updatedAt.toLocaleString()}</div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      ticket.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                      ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {ticket.status}
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