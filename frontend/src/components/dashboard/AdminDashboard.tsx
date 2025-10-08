import { useState, useEffect, useCallback } from 'react';
import { Settings, Shield, BarChart3, Activity, FileText, UserCheck, UserX, MessageCircle, RefreshCw } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/apiService';
import { agentService } from '../../services/agentService';

// Helper function to get background color class based on agent color
const getAgentBgColorClass = (color: string): string => {
  switch (color) {
    case 'blue': return 'bg-blue-500';
    case 'green': return 'bg-green-500';
    case 'red': return 'bg-red-500';
    case 'orange': return 'bg-orange-500';
    case 'purple': return 'bg-purple-500';
    case 'pink': return 'bg-pink-500';
    default: return 'bg-gray-500';
  }
};

// Helper function to get status badge classes
const getStatusBadgeClasses = (status: string): string => {
  switch (status) {
    case 'available': return 'bg-green-100 text-green-800';
    case 'busy': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// Helper function to get workload bar color
const getWorkloadBarColor = (load: number): string => {
  if (load >= 7) return 'bg-red-500';
  if (load >= 5) return 'bg-orange-500';
  if (load >= 3) return 'bg-blue-500';
  return 'bg-green-500';
};

// Helper function to get satisfaction color
const getSatisfactionColor = (score: number): string => {
  if (score >= 90) return 'bg-green-500';
  if (score >= 80) return 'bg-blue-500';
  if (score >= 70) return 'bg-yellow-500';
  return 'bg-red-500';
};

// Define interfaces for type safety
interface Agent {
  id: string;
  name: string;
  initials: string;
  status: string;
  availability: string;
  currentLoad: number;
  avgResponseTime: string;
  color: string;
  lastUpdated: Date;
}

interface AgentPerformance {
  id: string;
  name: string;
  initials: string;
  color: string;
  resolvedToday: number;
  totalResolved: number;
  avgResolutionTime: string;
  satisfaction: number;
}

interface TicketData {
  total: number;
  resolved: number;
  pending: number;
  critical: number;
  inProgress: number;
  newToday: number;
  reopened: number;
  trend: string;
  avgResolutionTime: string;
}

interface ApiAgentData {
  _id?: string;
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  agentStatus?: string;
  availability?: string;
  activeComplaints?: any[];
  metrics?: {
    avgResponseTime?: number;
  };
  lastStatusChange?: string | Date;
}

interface ApiPerformanceData {
  agentId: string;
  agentName?: string;
  resolvedToday?: number;
  totalResolved?: number;
  avgResolutionTime?: string;
  satisfactionScore?: number;
}

interface ApiAnalyticsData {
  totalComplaints?: number;
  resolvedComplaints?: number;
  openComplaints?: number;
  highPriorityComplaints?: number;
  inProgressComplaints?: number;
  newTodayComplaints?: number;
  reopenedComplaints?: number;
  trend?: string;
  avgResolutionTime?: string;
}

interface Complaint {
  _id: string;
  ticketId?: string;
  title: string;
  description: string;
  status: string;
  priority?: string;
  category?: string;
  userId?: string;
  agentId?: string;
  createdAt: string;
  updatedAt: string;
}

export const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState<string>('user-agent-control');
  const { socket, isConnected } = useSocket();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // Admin profile information
  const [adminProfile, setAdminProfile] = useState<{name: string; email: string; role: string}>({ 
    name: user?.name || 'Admin',
    email: user?.email || 'admin@example.com',
    role: user?.role || 'admin'
  });

  // Real-time agent data with default values
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: '1',
      name: 'John Doe',
      initials: 'JD',
      status: 'available',
      currentLoad: 3,
      avgResponseTime: '4m 30s',
      color: 'blue',
      lastUpdated: new Date()
    },
    {
      id: '2',
      name: 'Alice Smith',
      initials: 'AS',
      status: 'busy',
      currentLoad: 6,
      avgResponseTime: '5m 12s',
      color: 'purple',
      lastUpdated: new Date()
    },
    {
      id: '3',
      name: 'Robert Johnson',
      initials: 'RJ',
      status: 'available',
      currentLoad: 2,
      avgResponseTime: '3m 45s',
      color: 'green',
      lastUpdated: new Date()
    },
    {
      id: '4',
      name: 'Emily Davis',
      initials: 'ED',
      status: 'offline',
      currentLoad: 0,
      avgResponseTime: '4m 15s',
      color: 'gray',
      lastUpdated: new Date()
    },
    {
      id: '5',
      name: 'Michael Wilson',
      initials: 'MW',
      status: 'busy',
      currentLoad: 8,
      avgResponseTime: '6m 20s',
      color: 'orange',
      lastUpdated: new Date()
    }
  ]);
  
  const [ticketsData, setTicketsData] = useState<TicketData>({
    total: 92,
    resolved: 68,
    pending: 24,
    critical: 3,
    inProgress: 15,
    newToday: 8,
    reopened: 2,
    trend: '+8%',
    avgResolutionTime: '1.4 days'
  });
  
  // Agent performance data
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([
    {
      id: '1',
      name: 'John Doe',
      initials: 'JD',
      color: 'blue',
      resolvedToday: 5,
      totalResolved: 28,
      avgResolutionTime: '1.2 days',
      satisfaction: 94
    },
    {
      id: '2',
      name: 'Alice Smith',
      initials: 'AS',
      color: 'purple',
      resolvedToday: 7,
      totalResolved: 42,
      avgResolutionTime: '1.0 days',
      satisfaction: 96
    },
    {
      id: '3',
      name: 'Robert Johnson',
      initials: 'RJ',
      color: 'green',
      resolvedToday: 3,
      totalResolved: 19,
      avgResolutionTime: '1.5 days',
      satisfaction: 88
    },
    {
      id: '4',
      name: 'Emily Davis',
      initials: 'ED',
      color: 'orange',
      resolvedToday: 0,
      totalResolved: 23,
      avgResolutionTime: '1.3 days',
      satisfaction: 92
    },
    {
      id: '5',
      name: 'Michael Wilson',
      initials: 'MW',
      color: 'pink',
      resolvedToday: 4,
      totalResolved: 31,
      avgResolutionTime: '1.1 days',
      satisfaction: 90
    }
  ]);

  // Update admin profile when user changes
  useEffect(() => {
    if (user) {
      setAdminProfile({
        name: user.name,
        email: user.email,
        role: user.role
      });
    }
  }, [user]);

  // Get initials from name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((part: string) => part[0] || '')
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };
  
  // Format response time
  const formatResponseTime = (minutes?: number): string => {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };
  
  // Get color based on workload
  const getAgentColor = (load: number): string => {
    if (load >= 7) return 'red';
    if (load >= 5) return 'orange';
    if (load >= 3) return 'blue';
    return 'green';
  };

  // Fetch real data from the API
  const fetchDashboardData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      
      // Fetch agents, including availability status, and dashboard analytics
      const [agentsResponse, analyticsResponse] = await Promise.all([
        agentService.getAllAgents(),
        apiService.getDashboardAnalytics('30')
      ]);
      
      if (agentsResponse.data && Array.isArray(agentsResponse.data)) {
        // Transform agent data to match our UI format
        const formattedAgents: Agent[] = agentsResponse.data.map((agent: ApiAgentData) => ({
          id: agent._id || agent.id || '',
          name: agent.name || `${agent.firstName || ''} ${agent.lastName || ''}`.trim(),
          initials: getInitials(agent.name || `${agent.firstName || ''} ${agent.lastName || ''}`),
          status: agent.agentStatus || 'available',
          availability: agent.availability || 'available',
          currentLoad: agent.activeComplaints?.length || 0,
          avgResponseTime: formatResponseTime(agent.metrics?.avgResponseTime),
          color: getAgentColor(agent.activeComplaints?.length || 0),
          lastUpdated: new Date(agent.lastStatusChange || Date.now())
        }));
        setAgents(formattedAgents);
      }
      
      if (analyticsResponse.data) {
        const stats = analyticsResponse.data as ApiAnalyticsData;
        setTicketsData({
          total: stats.totalComplaints || 0,
          resolved: stats.resolvedComplaints || 0,
          pending: stats.openComplaints || 0,
          critical: stats.highPriorityComplaints || 0,
          inProgress: stats.inProgressComplaints || 0,
          newToday: stats.newTodayComplaints || 0,
          reopened: stats.reopenedComplaints || 0,
          trend: stats.trend || '0%',
          avgResolutionTime: stats.avgResolutionTime || '0 days'
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [setIsRefreshing]);
  
  // Subscribe to real-time updates
  useEffect(() => {
    if (!isConnected) return;
    
    // Handle new complaints
    const handleNewComplaint = (event: Event) => {
      const newComplaint = (event as CustomEvent).detail;
      console.log('New complaint received in AdminDashboard:', newComplaint);
      
      // Update ticket data counts
      setTicketsData(prev => ({
        ...prev,
        total: prev.total + 1,
        pending: prev.pending + 1,
        newToday: prev.newToday + 1
      }));
    };
    
    // Handle status updates
    const handleStatusUpdate = (event: Event) => {
      const update = (event as CustomEvent).detail;
      console.log('Complaint status update in AdminDashboard:', update);
      
      // Refresh dashboard data to get accurate counts
      fetchDashboardData();
    };
    
    // Handle agent status updates
    const handleAgentStatusUpdate = (event: Event) => {
      const { agents: updatedAgents } = (event as CustomEvent).detail;
      console.log('Agent status update in AdminDashboard:', updatedAgents);
      
      if (Array.isArray(updatedAgents)) {
        // Format agent data
        const formattedAgents = updatedAgents.map(agent => ({
          id: agent._id,
          name: agent.name,
          initials: agent.name.split(' ').map((n: string) => n[0]).join(''),
          status: agent.isOnline ? 'available' : 'offline',
          currentLoad: agent.activeComplaints?.length || 0,
          avgResponseTime: agent.avgResponseTime || '5m',
          color: getAgentColor(agent.activeComplaints?.length || 0),
          lastUpdated: new Date(agent.lastActive || Date.now())
        }));
        setAgents(formattedAgents);
      }
    };
    
    // Handle dashboard stats updates
    const handleDashboardStatsUpdate = (event: Event) => {
      console.log('Dashboard stats update:', (event as CustomEvent).detail);
      fetchDashboardData();
    };
    
    // Register event listeners
    window.addEventListener('newComplaint', handleNewComplaint);
    window.addEventListener('complaintStatusUpdate', handleStatusUpdate);
    window.addEventListener('agentStatusUpdate', handleAgentStatusUpdate);
    window.addEventListener('dashboardStatsUpdate', handleDashboardStatsUpdate);
    
    // Cleanup
    return () => {
      window.removeEventListener('newComplaint', handleNewComplaint);
      window.removeEventListener('complaintStatusUpdate', handleStatusUpdate);
      window.removeEventListener('agentStatusUpdate', handleAgentStatusUpdate);
      window.removeEventListener('dashboardStatsUpdate', handleDashboardStatsUpdate);
    };
  }, [isConnected, fetchDashboardData]);

  // Fetch agent performance data
  const fetchAgentPerformance = useCallback(async () => {
    try {
      const response = await apiService.getTeamPerformance();
      
      if (response.data && Array.isArray(response.data)) {
        const formattedPerformance: AgentPerformance[] = response.data.map((agent: ApiPerformanceData) => ({
          id: agent.agentId,
          name: agent.agentName || 'Unknown Agent',
          initials: getInitials(agent.agentName || 'Unknown Agent'),
          color: ['blue', 'green', 'purple', 'orange', 'pink'][Math.floor(Math.random() * 5)],
          resolvedToday: agent.resolvedToday || 0,
          totalResolved: agent.totalResolved || 0,
          avgResolutionTime: agent.avgResolutionTime || '0 days',
          satisfaction: agent.satisfactionScore || 0
        }));
        
        setAgentPerformance(prevPerformance => {
          return formattedPerformance.length > 0 ? formattedPerformance : prevPerformance;
        });
      }
    } catch (error) {
      console.error('Error fetching agent performance:', error);
    }
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    // Fetch initial data
    Promise.all([
      fetchDashboardData(),
      fetchAgentPerformance()
    ]);
    
    // Set up a refresh interval
    const interval = setInterval(() => {
      Promise.all([
        fetchDashboardData(),
        fetchAgentPerformance()
      ]);
    }, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, [fetchDashboardData, fetchAgentPerformance]);
  
  // Handle logout
  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };
  
  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showUserMenu && !target.closest('.admin-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);
  
  // Function to handle real-time updates
  const handleAgentStatusUpdate = useCallback((agentData: { id: string; status: string; currentLoad: number }) => {
    setAgents(prevAgents => {
      return prevAgents.map(agent => {
        if (agent.id === agentData.id) {
          return {
            ...agent,
            status: agentData.status,
            currentLoad: agentData.currentLoad,
            lastUpdated: new Date()
          };
        }
        return agent;
      });
    });
  }, []);
  
  // Socket event listener for real-time updates
  useEffect(() => {
    if (socket && isConnected) {
      // Listen for agent status updates
      socket.on('agent:statusUpdate', handleAgentStatusUpdate);
      socket.on('agent_status_update', (updatedAgents) => {
        // Handle agent status updates from the server
        if (Array.isArray(updatedAgents)) {
          setAgents(prevAgents => {
            const agentMap = new Map(prevAgents.map(a => [a.id, a]));
            
            updatedAgents.forEach(agent => {
              const agentId = agent.id || agent._id;
              if (agentId && agentMap.has(agentId)) {
                const existingAgent = agentMap.get(agentId);
                if (existingAgent) {
                  agentMap.set(agentId, {
                    ...existingAgent,
                    status: agent.agentStatus || agent.status || existingAgent.status,
                    currentLoad: agent.activeComplaints?.length || agent.currentLoad || existingAgent.currentLoad,
                    lastUpdated: new Date()
                  });
                }
              }
            });
            
            return Array.from(agentMap.values());
          });
        }
      });
      
      // Listen for ticket updates
      socket.on('tickets:update', (data) => {
        setTicketsData(prevData => ({
          ...prevData,
          total: data.total || prevData.total,
          resolved: data.resolved || prevData.resolved,
          pending: data.pending || prevData.pending,
          critical: data.critical || prevData.critical
        }));
      });
      
      // Listen for dashboard stats updates
      socket.on('dashboard_stats_update', (stats) => {
        setTicketsData(prevData => ({
          ...prevData,
          total: stats.totalComplaints || prevData.total,
          resolved: stats.resolvedComplaints || prevData.resolved,
          pending: stats.openComplaints || prevData.pending,
          critical: stats.highPriorityComplaints || prevData.critical,
          inProgress: stats.inProgressComplaints || prevData.inProgress,
          newToday: stats.newTodayComplaints || prevData.newToday,
          reopened: stats.reopenedComplaints || prevData.reopened,
          trend: stats.trend || prevData.trend,
          avgResolutionTime: stats.avgResolutionTime || prevData.avgResolutionTime
        }));
      });

      // Listen for new complaints
      socket.on('new_complaint', () => {
        // Refresh dashboard data when a new complaint is received
        Promise.all([
          fetchDashboardData(),
          fetchAgentPerformance()
        ]);
      });
      
      return () => {
        socket.off('agent:statusUpdate');
        socket.off('agent_status_update');
        socket.off('tickets:update');
        socket.off('dashboard_stats_update');
        socket.off('new_complaint');
      };
    }
  }, [socket, isConnected, fetchDashboardData, handleAgentStatusUpdate, fetchAgentPerformance]);
  
  // Complaint categories data
  const [complaintCategories] = useState([
    { name: 'Technical Issues', count: 34, percentage: 37 },
    { name: 'Billing Problems', count: 26, percentage: 28 },
    { name: 'Product Quality', count: 18, percentage: 20 },
    { name: 'Delivery Issues', count: 9, percentage: 10 },
    { name: 'Other', count: 5, percentage: 5 }
  ]);
  
  // Refresh data on demand
  const refreshData = () => {
    if (isRefreshing) return;
    
    // Fetch fresh data from API
    Promise.all([
      fetchDashboardData(),
      fetchAgentPerformance()
    ]);
  };
  
  // Assign ticket function
  const assignTicket = async (agentId: string) => {
    try {
      setIsRefreshing(true);
      
      // Check if agent is available first
      const agent = agents.find(a => a.id === agentId);
      if (!agent) {
        alert('Agent not found');
        return;
      }
      
      if (agent.availability !== 'available') {
        alert(`Cannot assign ticket: Agent ${agent.name} is currently ${agent.availability}`);
        return;
      }
      
      // Get pending complaints
      const complaintsResponse = await apiService.getComplaints({ status: 'New' });
      if (!complaintsResponse.data || !Array.isArray(complaintsResponse.data) || complaintsResponse.data.length === 0) {
        alert('No new complaints available for assignment');
        return;
      }
      
      // Assign first pending complaint to selected agent
      const complaintToAssign = complaintsResponse.data[0] as Complaint;
      await apiService.assignComplaint(complaintToAssign._id, agentId);
      
      // Update agent availability to busy
      await agentService.updateAvailability(agentId, 'busy');
      
      // Update local state optimistically
      setAgents(prevAgents => {
        return prevAgents.map(agent => {
          if (agent.id === agentId) {
            return { 
              ...agent, 
              currentLoad: agent.currentLoad + 1,
              availability: 'busy',
              status: 'busy'
            };
          }
          return agent;
        });
      });
      
      // Refresh data after assignment
      Promise.all([
        fetchDashboardData(),
        fetchAgentPerformance()
      ]);
      
      // Inform the user
      alert(`Assigned complaint #${complaintToAssign.ticketId || complaintToAssign._id} to agent`);
    } catch (error) {
      console.error('Error assigning ticket:', error);
      alert('Failed to assign ticket');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-800">QuickFix Admin Dashboard</h1>
            </div>
            
            <div className="flex items-center gap-4 relative admin-menu-container">
              <button 
                onClick={refreshData}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 flex items-center gap-2"
                disabled={isRefreshing}
              >
                <RefreshCw size={18} className={`${isRefreshing ? "animate-spin" : ""}`} />
                <span className="text-sm">{isRefreshing ? "Refreshing..." : "Refresh"}</span>
              </button>
              
              <div className="flex items-center">
                <div className="flex items-center">
                  <span className={`w-3 h-3 rounded-full mr-2 ${isConnected ? "bg-green-500" : "bg-red-500"}`}></span>
                  <span className="text-sm text-gray-600">{isConnected ? "Connected" : "Disconnected"}</span>
                </div>
              </div>
              
              <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                  {adminProfile.name.substring(0, 2).toUpperCase()}
                </div>
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg z-10 py-1">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium">{adminProfile.name}</p>
                    <p className="text-xs text-gray-500">{adminProfile.email}</p>
                    <p className="text-xs text-gray-500 capitalize">{adminProfile.role}</p>
                  </div>
                  <a href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile Settings</a>
                  <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100">
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Stats Section */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Total Tickets</p>
                  <h3 className="text-2xl font-bold mt-1">{ticketsData.total}</h3>
                  <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-md">
                  <FileText size={20} className="text-blue-500" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Resolved</p>
                  <h3 className="text-2xl font-bold mt-1">{ticketsData.resolved}</h3>
                  <p className="text-xs text-gray-500 mt-1">{Math.round((ticketsData.resolved / ticketsData.total) * 100)}% resolution rate</p>
                </div>
                <div className="bg-green-50 p-3 rounded-md">
                  <UserCheck size={20} className="text-green-500" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Pending</p>
                  <h3 className="text-2xl font-bold mt-1">{ticketsData.pending}</h3>
                  <p className="text-xs text-gray-500 mt-1">Including {ticketsData.inProgress} in progress</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-md">
                  <Activity size={20} className="text-yellow-500" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Critical</p>
                  <h3 className="text-2xl font-bold mt-1">{ticketsData.critical}</h3>
                  <p className="text-xs text-gray-500 mt-1">Need immediate attention</p>
                </div>
                <div className="bg-red-50 p-3 rounded-md">
                  <Shield size={20} className="text-red-500" />
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Additional Stats */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">New Today</p>
                  <h3 className="text-2xl font-bold mt-1">{ticketsData.newToday}</h3>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Reopened</p>
                  <h3 className="text-2xl font-bold mt-1">{ticketsData.reopened}</h3>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Trend</p>
                  <h3 className="text-2xl font-bold mt-1">{ticketsData.trend}</h3>
                  <p className="text-xs text-gray-500 mt-1">vs. previous period</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Avg Resolution Time</p>
                  <h3 className="text-2xl font-bold mt-1">{ticketsData.avgResolutionTime}</h3>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Agent Workload Section */}
        <section className="mb-8">
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">Agent Workload</h2>
              <p className="text-sm text-gray-500">Current status and workload of support agents</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Load</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Response Time</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {agents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                            agent.color === 'blue' ? 'bg-blue-500' : 
                            agent.color === 'green' ? 'bg-green-500' : 
                            agent.color === 'red' ? 'bg-red-500' : 
                            agent.color === 'orange' ? 'bg-orange-500' : 
                            agent.color === 'purple' ? 'bg-purple-500' : 
                            agent.color === 'pink' ? 'bg-pink-500' : 'bg-gray-500'
                          }`}>
                            {agent.initials}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${agent.status === 'available' ? 'bg-green-100 text-green-800' : 
                            agent.status === 'busy' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-800'}`}>
                            {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                          </span>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${agent.availability === 'available' ? 'bg-green-100 text-green-800' : 
                            agent.availability === 'busy' ? 'bg-yellow-100 text-yellow-800' : 
                            agent.availability === 'offline' ? 'bg-gray-400 text-white' :
                            'bg-gray-100 text-gray-800'}`}>
                            Availability: {agent.availability.charAt(0).toUpperCase() + agent.availability.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {agent.currentLoad} tickets
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div 
                            className={`h-1.5 rounded-full ${
                              agent.currentLoad >= 7 ? 'bg-red-500' : 
                              agent.currentLoad >= 5 ? 'bg-orange-500' : 
                              agent.currentLoad >= 3 ? 'bg-blue-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(agent.currentLoad * 10, 100)}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {agent.avgResponseTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(agent.lastUpdated).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {agent.availability !== 'offline' && (
                          <button 
                            onClick={() => assignTicket(agent.id)}
                            className={`text-indigo-600 hover:text-indigo-900 ${
                              agent.availability !== 'available' || agent.currentLoad >= 5 ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            disabled={agent.availability !== 'available' || agent.currentLoad >= 5}
                            title={
                              agent.availability !== 'available' ? `Agent is ${agent.availability}` :
                              agent.currentLoad >= 5 ? 'Agent has maximum workload' : 
                              'Assign a new ticket to this agent'
                            }
                          >
                            Assign Ticket
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
        
        {/* Agent Performance Section */}
        <section className="mb-8">
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">Agent Performance</h2>
              <p className="text-sm text-gray-500">Resolution metrics and customer satisfaction</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resolved Today</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Resolved</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Resolution Time</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Satisfaction</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {agentPerformance.map((agent) => (
                    <tr key={agent.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                            agent.color === 'blue' ? 'bg-blue-500' : 
                            agent.color === 'green' ? 'bg-green-500' : 
                            agent.color === 'red' ? 'bg-red-500' : 
                            agent.color === 'orange' ? 'bg-orange-500' : 
                            agent.color === 'purple' ? 'bg-purple-500' : 
                            agent.color === 'pink' ? 'bg-pink-500' : 'bg-gray-500'
                          }`}>
                            {agent.initials}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{agent.resolvedToday}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{agent.totalResolved}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{agent.avgResolutionTime}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900 mr-2">{agent.satisfaction}%</span>
                          <div className="w-full max-w-24 bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${
                                agent.satisfaction >= 90 ? 'bg-green-500' : 
                                agent.satisfaction >= 80 ? 'bg-blue-500' : 
                                agent.satisfaction >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${agent.satisfaction}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
        
        {/* Categories Section */}
        <section className="mb-8">
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">Complaint Categories</h2>
              <p className="text-sm text-gray-500">Distribution of complaints by category</p>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {complaintCategories.map((category, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{category.name}</span>
                      <span className="text-sm text-gray-500">{category.count} ({category.percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="h-2.5 rounded-full bg-blue-600" 
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

