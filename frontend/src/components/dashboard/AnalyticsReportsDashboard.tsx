import { useState, useEffect } from 'react';
import { 
  TrendingUp, Download, Settings, 
  Clock, Users, Shield, Home,
  Bell, HelpCircle, 
  ChevronDown, LogOut
} from 'lucide-react';
import { useComplaints } from '../../contexts/ComplaintContext';
import { useAuth } from '../../hooks/useAuth';
import { Notifications } from '../notifications/Notifications';

export function AnalyticsReportsDashboard() {
  const { complaints } = useComplaints();
  const { user, logout } = useAuth();
  
  // State management
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedReport, setSelectedReport] = useState<'overview' | 'sla' | 'agents' | 'trends' | 'export'>('overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Analyst profile data
  const analystProfile = {
    name: user?.name || 'Analyst',
    email: user?.email || 'analyst@example.com',
    phone: '+1 (555) 456-7890',
    department: 'Analytics',
    role: user?.role || 'analyst',
    joinDate: '2023-11-10',
    lastLogin: new Date().toLocaleString()
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
  
  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Freshdesk-style Sidebar */}
      <div className="bg-slate-800 w-16 flex flex-col items-center py-4 space-y-4">
        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        
        <div className="space-y-2">
          <button 
            onClick={() => setSelectedReport('overview')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              selectedReport === 'overview' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Overview"
          >
            <Home className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setSelectedReport('sla')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              selectedReport === 'sla' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="SLA Compliance"
          >
            <Clock className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setSelectedReport('agents')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              selectedReport === 'agents' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Agent Performance"
          >
            <Users className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setSelectedReport('trends')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              selectedReport === 'trends' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Trends Analysis"
          >
            <TrendingUp className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mt-auto space-y-2">
          <button 
            onClick={() => setSelectedReport('export')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              selectedReport === 'export' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Export Reports"
          >
            <Download className="w-5 h-5" />
          </button>
          
          <button 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Freshdesk-style Header */}
        <header className="bg-white border-b border-gray-200 py-3 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-800">
                QuickFix <span className="font-normal text-gray-500">| Analytics Dashboard</span>
              </h1>
              
              <div className="flex items-center gap-2 ml-8">
                <button 
                  onClick={() => setSelectedTimeRange('7d')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    selectedTimeRange === '7d' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  7 days
                </button>
                <button 
                  onClick={() => setSelectedTimeRange('30d')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    selectedTimeRange === '30d' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  30 days
                </button>
                <button 
                  onClick={() => setSelectedTimeRange('90d')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    selectedTimeRange === '90d' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  90 days
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors relative"
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="user-menu-container relative">
                <button 
                  className="flex items-center gap-2 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold">
                    {analystProfile.name.charAt(0)}
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <p className="font-medium text-gray-800">{analystProfile.name}</p>
                      <p className="text-sm text-gray-500">{analystProfile.email}</p>
                      <p className="text-xs mt-1 text-gray-500">Role: {analystProfile.role}</p>
                    </div>
                    <div className="p-2">
                      <button 
                        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 rounded-md transition-colors text-left"
                      >
                        <Settings className="w-4 h-4 text-gray-500" />
                        <span>Account Settings</span>
                      </button>
                      <button 
                        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 rounded-md transition-colors text-left"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-4 h-4 text-gray-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Dashboard Content will go here */}
        <div className="flex-1 overflow-auto p-6">
          {showNotifications && (
            <div className="absolute right-6 top-16 z-50">
              <Notifications />
            </div>
          )}
          
          {/* Dashboard content based on selected report */}
          <div>
            {selectedReport === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-800">Analytics Overview</h2>
                <p className="text-gray-600">Data for the past {selectedTimeRange === '7d' ? '7 days' : selectedTimeRange === '30d' ? '30 days' : '90 days'}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500">Total Complaints</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{complaints.length}</p>
                    <div className="mt-2 text-sm text-green-600">+12% from previous period</div>
                  </div>
                  
                  <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500">Resolved Complaints</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{complaints.filter(c => c.status === 'Resolved').length}</p>
                    <div className="mt-2 text-sm text-green-600">+5% from previous period</div>
                  </div>
                  
                  <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500">Avg. Resolution Time</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-1">3.4 days</p>
                    <div className="mt-2 text-sm text-red-500">+0.2 days from previous period</div>
                  </div>
                  
                  <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500">Customer Satisfaction</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-1">4.6/5</p>
                    <div className="mt-2 text-sm text-green-600">+0.1 from previous period</div>
                  </div>
                </div>
                
                {/* Additional content would go here */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="font-semibold text-gray-800">Volume Trends</h3>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    [Charts would go here - visualization component]
                  </div>
                </div>
              </div>
            )}
            
            {selectedReport === 'sla' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-800">SLA Compliance</h2>
                <p className="text-gray-600">Performance metrics for service level agreements</p>
                
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="font-semibold text-gray-800">SLA Overview</h3>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    [SLA metrics visualization would go here]
                  </div>
                </div>
              </div>
            )}
            
            {selectedReport === 'agents' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-800">Agent Performance</h2>
                <p className="text-gray-600">Individual agent metrics and comparisons</p>
                
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="font-semibold text-gray-800">Agent Comparison</h3>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    [Agent performance visualization would go here]
                  </div>
                </div>
              </div>
            )}
            
            {selectedReport === 'trends' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-800">Trends Analysis</h2>
                <p className="text-gray-600">Long-term trends and patterns</p>
                
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="font-semibold text-gray-800">Complaint Trends</h3>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    [Trends visualization would go here]
                  </div>
                </div>
              </div>
            )}
            
            {selectedReport === 'export' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-800">Export Reports</h2>
                <p className="text-gray-600">Download analytics reports</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-800">Monthly Performance Report</h3>
                    <p className="text-sm text-gray-600 mt-2">Complete overview of system performance and metrics</p>
                    <button className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800">
                      <Download className="w-4 h-4" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                  
                  <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-800">Agent Efficiency Data</h3>
                    <p className="text-sm text-gray-600 mt-2">Detailed metrics on agent performance and resolution rates</p>
                    <button className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800">
                      <Download className="w-4 h-4" />
                      <span>Download CSV</span>
                    </button>
                  </div>
                  
                  <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-800">Customer Satisfaction Report</h3>
                    <p className="text-sm text-gray-600 mt-2">Analysis of customer feedback and satisfaction scores</p>
                    <button className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800">
                      <Download className="w-4 h-4" />
                      <span>Download Excel</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}