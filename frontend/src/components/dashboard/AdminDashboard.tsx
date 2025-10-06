import { useState, useEffect, useCallback } from 'react';
import { Clock, TrendingUp, Settings, Bell, Search, Plus, ChevronDown, Gift, FileText, BarChart3, Shield, MessageCircle, LogOut, CheckCircle, AlertCircle, Activity, UserCheck, RefreshCw, UserX } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';

export const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('user-agent-control');
  const { socket, isConnected, onlineUsers } = useSocket();
  
  // Real-time agent data
  const [agents, setAgents] = useState([
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
  
  const [ticketsData, setTicketsData] = useState({
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
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Agent performance data
  const [agentPerformance, setAgentPerformance] = useState([
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
  
  // Function to handle real-time updates
  const handleAgentStatusUpdate = useCallback((agentData) => {
    setAgents(prevAgents => {
      const updatedAgents = [...prevAgents];
      const agentIndex = updatedAgents.findIndex(agent => agent.id === agentData.id);
      
      if (agentIndex >= 0) {
        updatedAgents[agentIndex] = {
          ...updatedAgents[agentIndex],
          status: agentData.status,
          currentLoad: agentData.currentLoad,
          lastUpdated: new Date()
        };
      }
      
      return updatedAgents;
    });
  }, []);
  
  // Simulate agent status update periodically
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate an agent's status changing
      const randomAgentIndex = Math.floor(Math.random() * agents.length);
      const randomAgent = {...agents[randomAgentIndex]};
      
      // Randomly change status
      const statuses = ['available', 'busy', 'offline'];
      randomAgent.status = statuses[Math.floor(Math.random() * statuses.length)];
      
      // Update load based on status
      if (randomAgent.status === 'available') {
        randomAgent.currentLoad = Math.floor(Math.random() * 5); // 0-4 tickets
      } else if (randomAgent.status === 'busy') {
        randomAgent.currentLoad = Math.floor(Math.random() * 5) + 5; // 5-9 tickets
      } else {
        randomAgent.currentLoad = 0; // offline agents have 0 tickets
      }
      
      handleAgentStatusUpdate(randomAgent);
      
    }, 15000); // Update every 15 seconds
    
    return () => clearInterval(interval);
  }, [agents, handleAgentStatusUpdate]);
  
  // Socket event listener for real-time updates
  useEffect(() => {
    if (socket) {
      // Listen for agent status updates
      socket.on('agent:statusUpdate', handleAgentStatusUpdate);
      
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
      
      return () => {
        socket.off('agent:statusUpdate');
        socket.off('tickets:update');
      };
    }
  }, [socket, handleAgentStatusUpdate]);
  
  // Complaint categories data
  const [complaintCategories, setComplaintCategories] = useState([
    { name: 'Technical Issues', count: 34, percentage: 37 },
    { name: 'Billing Problems', count: 26, percentage: 28 },
    { name: 'Product Quality', count: 18, percentage: 20 },
    { name: 'Delivery Issues', count: 9, percentage: 10 },
    { name: 'Other', count: 5, percentage: 5 }
  ]);
  
  // Refresh data on demand
  const refreshData = () => {
    setIsRefreshing(true);
    
    // Simulate API fetch delay
    setTimeout(() => {
      // Update ticket data with small random changes
      setTicketsData(prevData => ({
        ...prevData,
        total: prevData.total + Math.floor(Math.random() * 5),
        resolved: prevData.resolved + Math.floor(Math.random() * 3),
        pending: prevData.pending + Math.floor(Math.random() * 2)
      }));
      
      setIsRefreshing(false);
    }, 1000);
  };
  
  // Assign ticket function
  const assignTicket = (agentId) => {
    setAgents(prevAgents => {
      return prevAgents.map(agent => {
        if (agent.id === agentId && agent.status === 'available') {
          return { ...agent, currentLoad: agent.currentLoad + 1 };
        }
        return agent;
      });
    });
    
    // Show success toast or notification
    alert('Ticket assigned successfully!');
  };

  const userAgentControl = [
    { 
      icon: '👥', 
      title: 'User Management', 
      description: 'Add, modify, and deactivate users with different permission levels.', 
      status: 'active' 
    },
    { 
      icon: '🟢', 
      title: 'Agent Status', 
      description: 'View real-time status of agents (free/busy) and their current workload.', 
      status: 'active' 
    },
    { 
      icon: '📋', 
      title: 'Ticket Assignment', 
      description: 'Manually assign tickets to agents or configure auto-assignment rules.', 
      status: 'active' 
    },
    { 
      icon: '🔍', 
      title: 'Ticket Tracking', 
      description: 'Monitor which agent is handling each ticket and their progress.', 
      status: 'active', 
      badge: '✓' 
    },
    { 
      icon: '⚖️', 
      title: 'Workload Distribution', 
      description: 'Balance ticket load across agents to ensure efficient handling of complaints.', 
      status: 'active' 
    },
    { 
      icon: '🔄', 
      title: 'Agent Rotation', 
      description: 'Configure automatic rotation of agents for specific complaint categories.', 
      status: 'new', 
      isNew: true 
    }
  ];

  const complaintManagement = [
    { 
      icon: '📊', 
      title: 'Complaint Overview', 
      description: 'View all complaints with filtering by status, priority, category, and more.' 
    },
    { 
      icon: '🏷️', 
      title: 'Categorization', 
      description: 'Assign and modify complaint categories with AI-assisted suggestions.' 
    },
    { 
      icon: '⚡', 
      title: 'Priority Management', 
      description: 'Set and adjust complaint priorities based on urgency and impact.' 
    },
    { 
      icon: '🔄', 
      title: 'Status Updates', 
      description: 'Update complaint statuses and track resolution progress.' 
    },
    { 
      icon: '🤖', 
      title: 'AI Assistance', 
      description: 'Get AI-powered insights and suggestions for complaint resolution.' 
    },
    { 
      icon: '📝', 
      title: 'Case Notes', 
      description: 'Add and review detailed notes on complaint handling and resolution steps.' 
    }
  ];

  const analytics = [
    { 
      icon: '📈', 
      title: 'Ticket Metrics', 
      description: 'Track total, pending, and resolved tickets with filtering options.' 
    },
    { 
      icon: '⏱️', 
      title: 'Response Times', 
      description: 'Monitor average response and resolution times across different categories.' 
    },
    { 
      icon: '👤', 
      title: 'Agent Performance', 
      description: 'Analyze individual agent performance, resolution rates, and customer satisfaction.' 
    },
    { 
      icon: '📊', 
      title: 'Category Analysis', 
      description: 'View complaint distribution by category to identify problem areas.' 
    },
    { 
      icon: '📥', 
      title: 'Export Reports', 
      description: 'Generate and download detailed reports in various formats.' 
    }
  ];

  const automationSettings = [
    { 
      icon: '🤖', 
      title: 'AI Rules', 
      description: 'Configure AI-powered automation rules for complaint handling.' 
    },
    { 
      icon: '👥', 
      title: 'Role Management', 
      description: 'Define user roles and access permissions across the system.' 
    },
    { 
      icon: '🔔', 
      title: 'Notification Settings', 
      description: 'Configure email, SMS, and in-app notification triggers.' 
    },
    { 
      icon: '🏷️', 
      title: 'Category Configuration', 
      description: 'Create and manage complaint categories and subcategories.' 
    }
  ];

  const securityTools = [
    { 
      icon: '🔒', 
      title: 'Session Monitoring', 
      description: 'View active user sessions and IP access information.' 
    },
    { 
      icon: '📝', 
      title: 'Activity Logs', 
      description: 'Review detailed logs of all system activities and changes.' 
    },
    { 
      icon: '💾', 
      title: 'Backup Management', 
      description: 'Configure and manage automated data backup schedules.' 
    }
  ];

  const supportTools = [
    { 
      icon: '💬', 
      title: 'Internal Chat', 
      description: 'Communication tool for agents and administrators within the system.' 
    },
    { 
      icon: '⬆️', 
      title: 'Escalation Handling', 
      description: 'Manage and monitor escalated complaints requiring special attention.' 
    },
    { 
      icon: '🤖', 
      title: 'Chatbot Monitoring', 
      description: 'View chatbot conversations and adjust AI responses as needed.' 
    }
  ];

  const sidebarMenuItems = [
    { icon: UserCheck, label: 'User & Agent Control', sublabel: 'Manage users and agent workload', key: 'user-agent-control', active: true },
    { icon: FileText, label: 'Complaint Management', sublabel: 'View, categorize and update complaint statuses', key: 'complaint-management' },
    { icon: Activity, label: 'Agent Performance', sublabel: 'Track complaint handling and resolution metrics', key: 'agent-performance' },
    { icon: BarChart3, label: 'Analytics', sublabel: 'Track tickets and agent performance metrics', key: 'analytics' },
    { icon: Settings, label: 'Automation & Settings', sublabel: 'Configure AI rules, roles and notifications', key: 'automation-settings' },
    { icon: Shield, label: 'Security', sublabel: 'Monitor sessions, logs and manage backups', key: 'security' },
    { icon: MessageCircle, label: 'Support Tools', sublabel: 'Internal chat and escalation handling', key: 'support-tools' }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Dark Theme */}
      <div className="w-64 bg-gray-900 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">◉</span>
            </div>
            <span className="font-semibold text-white text-lg">Admin</span>
          </div>
        </div>

        {/* Sidebar Menu */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {sidebarMenuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              className={`w-full flex items-start space-x-3 px-3 py-3 rounded-lg mb-1 transition-colors ${
                activeSection === item.key 
                  ? 'bg-gray-800 text-white' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              <item.icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-medium truncate">
                  {item.label}
                </div>
                <div className="text-xs text-gray-500 mt-0.5 leading-tight">
                  {item.sublabel}
                </div>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-gray-800">Admin</h1>
              <div className="flex items-center space-x-3">
                <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100">
                  Get started (16%)
                </button>
                <button className="flex items-center space-x-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                  <Plus className="w-4 h-4" />
                  <span>New</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Search className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                  <Bell className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Gift className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Settings className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg text-red-500" title="Logout">
                  <LogOut className="w-5 h-5" />
                </button>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">A</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-8 py-8">
            {/* User & Agent Control Section */}
            {activeSection === 'user-agent-control' && (
              <div className="mb-12">
                <div className="flex items-center space-x-3 mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">User & Agent Control</h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      {agents.filter(a => a.status === 'available').length} Agents Active
                    </span>
                    <span className="text-xs font-medium px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                      {agents.filter(a => a.status === 'busy').length} Agents Busy
                    </span>
                    <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                      {ticketsData.total} Total Tickets
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
                  <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-800 text-lg">User Management</h3>
                      <button className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                        <Plus className="w-4 h-4" />
                        <span>Add User</span>
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium">JD</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800">John Doe</h4>
                            <span className="text-xs text-gray-500">Admin • Last active 2m ago</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
                            <Settings className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-green-600 font-medium">AS</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800">Alice Smith</h4>
                            <span className="text-xs text-gray-500">Support Agent • Active now</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
                            <Settings className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-purple-600 font-medium">RJ</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800">Robert Johnson</h4>
                            <span className="text-xs text-gray-500">Support Agent • Last active 15m ago</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
                            <Settings className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <button className="mt-4 w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200">
                      View All Users
                    </button>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-800 text-lg">Agent Rotation & Ticket Assignment</h3>
                      <div className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Active</div>
                    </div>
                    
                    <div className="space-y-4 mb-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-700 mb-2">Auto-assignment Rules</h4>
                        <div className="flex items-center justify-between text-sm mb-2 pb-2 border-b border-gray-200">
                          <span>Technical Issues</span>
                          <span className="font-medium">Round Robin</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mb-2 pb-2 border-b border-gray-200">
                          <span>Billing Queries</span>
                          <span className="font-medium">Balanced Load</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>General Support</span>
                          <span className="font-medium">Skill Match</span>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-3">
                          <RefreshCw className="w-4 h-4 text-blue-600" />
                          <h4 className="font-medium text-blue-800">Real-time Rotation</h4>
                        </div>
                        <p className="text-sm text-blue-700 mb-2">
                          Agents are automatically rotated based on workload and availability.
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-blue-600">Next rotation in: 42 minutes</span>
                          <button className="text-xs text-blue-700 font-medium hover:text-blue-800">
                            Rotate Now
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <button className="mt-2 w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200">
                      Manage Assignment Rules
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-800 mb-2">Active Agents</h3>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-bold text-gray-800">{agents.filter(a => a.status !== 'offline').length}</span>
                      <span className="text-sm text-green-600">of {agents.length} total</span>
                    </div>
                    <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full" 
                        style={{ width: `${(agents.filter(a => a.status !== 'offline').length / agents.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-800 mb-2">Avg. Response Time</h3>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-bold text-gray-800">4m 15s</span>
                      <span className="text-sm text-green-600">-12% from last week</span>
                    </div>
                    <div className="mt-4 flex justify-between text-xs text-gray-500">
                      <span>Target: 5m 00s</span>
                      <span>Current: 4m 15s</span>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-800 mb-2">Workload Distribution</h3>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-bold text-gray-800">Balanced</span>
                      <span className="text-sm text-yellow-600">3 agents overloaded</span>
                    </div>
                    <div className="mt-4 flex items-center space-x-1">
                      <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
                      <span className="text-xs">Balanced</span>
                      <span className="ml-2 inline-block w-3 h-3 rounded-full bg-yellow-500"></span>
                      <span className="text-xs">Medium</span>
                      <span className="ml-2 inline-block w-3 h-3 rounded-full bg-red-500"></span>
                      <span className="text-xs">Heavy</span>
                    </div>
                  </div>
                </div>

                {/* Agent Workload Quick View */}
                <div className="mt-8 bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Agent Workload <span className="text-xs font-normal text-gray-500">Real-time status</span></h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">{isConnected ? 'Live updates active' : 'Live updates inactive'}</span>
                      <button 
                        className={`p-2 rounded-full ${isRefreshing ? 'bg-gray-100 text-gray-400' : 'hover:bg-gray-100'}`}
                        onClick={refreshData}
                        disabled={isRefreshing}
                        title="Refresh data"
                      >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      {agents.filter(a => a.status === 'available').length} Available
                    </span>
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                      {agents.filter(a => a.status === 'busy').length} Busy
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      {agents.filter(a => a.status === 'offline').length} Offline
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="px-4 py-3 font-medium">Agent</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium">Current Load</th>
                          <th className="px-4 py-3 font-medium">Avg. Response</th>
                          <th className="px-4 py-3 font-medium">Last Updated</th>
                          <th className="px-4 py-3 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {agents.map(agent => (
                          <tr key={agent.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 flex items-center space-x-2">
                              <div className={`w-8 h-8 bg-${agent.color}-100 rounded-full flex items-center justify-center`}>
                                <span className={`text-${agent.color}-600 text-xs font-medium`}>{agent.initials}</span>
                              </div>
                              <span>{agent.name}</span>
                            </td>
                            <td className="px-4 py-3">
                              {agent.status === 'available' && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Available</span>
                              )}
                              {agent.status === 'busy' && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Busy</span>
                              )}
                              {agent.status === 'offline' && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">Offline</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <span>{agent.currentLoad} tickets</span>
                                {agent.currentLoad > 5 && (
                                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full" title="High workload"></span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">{agent.avgResponseTime}</td>
                            <td className="px-4 py-3 text-xs text-gray-500">
                              {agent.lastUpdated.toLocaleTimeString()}
                            </td>
                            <td className="px-4 py-3">
                              {agent.status === 'available' ? (
                                <button 
                                  onClick={() => assignTicket(agent.id)}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                  Assign Ticket
                                </button>
                              ) : (
                                <button className="text-gray-400 cursor-not-allowed text-sm font-medium">
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
              </div>
            )}

            {/* Complaint Management Section */}
            {activeSection === 'complaint-management' && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">Complaint Management</h2>
                  <div className="flex items-center space-x-2">
                    <span className="flex items-center space-x-1 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>{ticketsData.resolved} Resolved</span>
                    </span>
                    <span className="flex items-center space-x-1 text-sm">
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      <span>{ticketsData.pending} Pending</span>
                    </span>
                    {ticketsData.critical > 0 && (
                      <span className="flex items-center space-x-1 text-sm">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span>{ticketsData.critical} Critical</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {complaintManagement.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="text-3xl flex-shrink-0">
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 text-base mb-2">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analytics Section */}
            {activeSection === 'analytics' && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">Analytics</h2>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    Export Reports
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-gray-500 text-sm font-medium">Total Tickets</h3>
                      <Activity className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-bold text-gray-800">{ticketsData.total}</span>
                      <span className="text-sm text-green-600">{ticketsData.trend} from last month</span>
                    </div>
                    <div className="mt-3 text-xs text-gray-500">
                      Last updated: {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-gray-500 text-sm font-medium">Avg Resolution Time</h3>
                      <Clock className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-bold text-gray-800">1.4 days</span>
                      <span className="text-sm text-green-600">-12% from last month</span>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-gray-500 text-sm font-medium">Customer Satisfaction</h3>
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-bold text-gray-800">87%</span>
                      <span className="text-sm text-green-600">+5% from last month</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {analytics.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="text-3xl flex-shrink-0">
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 text-base mb-2">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Automation & Settings Section */}
            {activeSection === 'automation-settings' && (
              <div className="mb-12">
                <div className="flex items-center space-x-3 mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">Automation & Settings</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {automationSettings.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="text-3xl flex-shrink-0">
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 text-base mb-2">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security Section */}
            {activeSection === 'security' && (
              <div className="mb-12">
                <div className="flex items-center space-x-3 mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">Security</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {securityTools.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="text-3xl flex-shrink-0">
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 text-base mb-2">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agent Performance Section */}
            {activeSection === 'agent-performance' && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">Agent Performance Dashboard</h2>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-500">{isConnected ? 'Live updates active' : 'Live updates inactive'}</span>
                    <button 
                      className={`p-2 rounded-full ${isRefreshing ? 'bg-gray-100 text-gray-400' : 'hover:bg-gray-100'}`}
                      onClick={refreshData}
                      disabled={isRefreshing}
                      title="Refresh data"
                    >
                      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                      Export Report
                    </button>
                  </div>
                </div>
                
                {/* Complaint Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 mb-8">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-gray-500 text-sm font-medium">Total Complaints</h3>
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-bold text-gray-800">{ticketsData.total}</span>
                      <span className="text-sm text-green-600">{ticketsData.trend}</span>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-gray-500 text-sm font-medium">Resolved</h3>
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-bold text-gray-800">{ticketsData.resolved}</span>
                      <span className="text-sm text-gray-500">{Math.round((ticketsData.resolved/ticketsData.total)*100)}%</span>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-gray-500 text-sm font-medium">In Progress</h3>
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Activity className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-bold text-gray-800">{ticketsData.inProgress}</span>
                      <span className="text-sm text-gray-500">{Math.round((ticketsData.inProgress/ticketsData.total)*100)}%</span>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-gray-500 text-sm font-medium">Pending</h3>
                      <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      </div>
                    </div>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-bold text-gray-800">{ticketsData.pending}</span>
                      <span className="text-sm text-gray-500">{Math.round((ticketsData.pending/ticketsData.total)*100)}%</span>
                    </div>
                  </div>
                </div>
                
                {/* Additional Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-gray-700 text-sm font-medium mb-2">Complaint Status Overview</h3>
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="h-2 bg-green-500 rounded-full" style={{width: `${(ticketsData.resolved/ticketsData.total)*100}%`}}></div>
                      <div className="h-2 bg-blue-500 rounded-full" style={{width: `${(ticketsData.inProgress/ticketsData.total)*100}%`}}></div>
                      <div className="h-2 bg-yellow-500 rounded-full" style={{width: `${(ticketsData.pending/ticketsData.total)*100}%`}}></div>
                      <div className="h-2 bg-red-500 rounded-full" style={{width: `${(ticketsData.critical/ticketsData.total)*100}%`}}></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>Resolved ({ticketsData.resolved})</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span>In Progress ({ticketsData.inProgress})</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                        <span>Pending ({ticketsData.pending})</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        <span>Critical ({ticketsData.critical})</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-gray-700 text-sm font-medium mb-2">Today's Activity</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">New complaints:</span>
                        <span className="font-medium">{ticketsData.newToday}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Resolved today:</span>
                        <span className="font-medium">{agentPerformance.reduce((sum, agent) => sum + agent.resolvedToday, 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Reopened:</span>
                        <span className="font-medium">{ticketsData.reopened}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Avg. resolution time:</span>
                        <span className="font-medium">{ticketsData.avgResolutionTime}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-gray-700 text-sm font-medium mb-2">Complaint Categories</h3>
                    <div className="space-y-3">
                      {complaintCategories.map((category, index) => (
                        <div key={index}>
                          <div className="flex justify-between items-center text-xs mb-1">
                            <span>{category.name}</span>
                            <span>{category.count} ({category.percentage}%)</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-600 rounded-full" 
                              style={{ width: `${category.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Agent Performance Table */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
                  <h3 className="font-semibold text-gray-800 mb-4">Agent Performance Metrics</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="px-4 py-3 font-medium">Agent</th>
                          <th className="px-4 py-3 font-medium">Resolved Today</th>
                          <th className="px-4 py-3 font-medium">Total Resolved</th>
                          <th className="px-4 py-3 font-medium">Avg. Resolution Time</th>
                          <th className="px-4 py-3 font-medium">Customer Satisfaction</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {agentPerformance.map((agent) => {
                          const currentAgent = agents.find(a => a.id === agent.id);
                          return (
                            <tr key={agent.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 flex items-center space-x-2">
                                <div className={`w-8 h-8 bg-${agent.color}-100 rounded-full flex items-center justify-center`}>
                                  <span className={`text-${agent.color}-600 text-xs font-medium`}>{agent.initials}</span>
                                </div>
                                <span>{agent.name}</span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center">
                                  <span>{agent.resolvedToday}</span>
                                  {agent.resolvedToday > 5 && (
                                    <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-800 rounded text-xs">High</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">{agent.totalResolved}</td>
                              <td className="px-4 py-3">{agent.avgResolutionTime}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center space-x-2">
                                  <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${agent.satisfaction >= 95 ? 'bg-green-500' : agent.satisfaction >= 90 ? 'bg-green-400' : agent.satisfaction >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                      style={{ width: `${agent.satisfaction}%` }}
                                    ></div>
                                  </div>
                                  <span>{agent.satisfaction}%</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {currentAgent?.status === 'available' && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Available</span>
                                )}
                                {currentAgent?.status === 'busy' && (
                                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Busy</span>
                                )}
                                {currentAgent?.status === 'offline' && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">Offline</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Trends and Insights */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Performance Insights</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Top Performing Agents</h4>
                      <div className="space-y-3">
                        {agentPerformance
                          .sort((a, b) => b.satisfaction - a.satisfaction)
                          .slice(0, 3)
                          .map((agent, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className={`w-6 h-6 bg-${agent.color}-100 rounded-full flex items-center justify-center`}>
                                  <span className={`text-${agent.color}-600 text-xs font-medium`}>{agent.initials}</span>
                                </div>
                                <span className="text-sm">{agent.name}</span>
                              </div>
                              <div className="text-sm font-medium">{agent.satisfaction}% satisfaction</div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Areas for Improvement</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Response time optimization</span>
                          <span className="text-sm font-medium text-yellow-600">Moderate priority</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Technical issue resolution</span>
                          <span className="text-sm font-medium text-red-600">High priority</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Customer satisfaction follow-up</span>
                          <span className="text-sm font-medium text-yellow-600">Moderate priority</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Support Tools Section */}
            {activeSection === 'support-tools' && (
              <div className="mb-12">
                <div className="flex items-center space-x-3 mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">Support Tools</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {supportTools.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="text-3xl flex-shrink-0">
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 text-base mb-2">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

// Export is handled via named export at the component declaration