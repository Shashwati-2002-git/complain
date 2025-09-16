import { useState } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, 
  Download, RefreshCw, Calendar, Settings, 
  Clock, CheckCircle, AlertTriangle, Users, Target,
  Award, ArrowUp, ArrowDown, Activity,
  FileText, Star, Timer,
  Plus
} from 'lucide-react';
import { useComplaints } from '../../contexts/ComplaintContext';
import { Header } from '../common/Header';
import { AnalyticsChart } from '../analytics/AnalyticsChart';

interface AnalyticsData {
  slaCompliance: number;
  avgResolutionTime: number;
  customerSatisfaction: number;
  firstContactResolution: number;
  totalComplaints: number;
  resolvedComplaints: number;
  escalatedComplaints: number;
  overdueComplaints: number;
}

interface AgentPerformance {
  id: string;
  name: string;
  resolved: number;
  avgResolutionTime: number;
  customerRating: number;
  firstContactRate: number;
  totalAssigned: number;
  responseTime: number;
}

interface CategoryStats {
  category: string;
  count: number;
  percentage: number;
  avgResolutionTime: number;
  satisfactionScore: number;
  trend: 'up' | 'down' | 'stable';
}

export function AnalyticsReportsDashboard() {
  const { complaints } = useComplaints();
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedReport, setSelectedReport] = useState<'overview' | 'sla' | 'agents' | 'trends' | 'export'>('overview');

  // Calculate analytics data
  const analyticsData: AnalyticsData = {
    slaCompliance: 94.2,
    avgResolutionTime: 3.4,
    customerSatisfaction: 4.6,
    firstContactResolution: 87,
    totalComplaints: complaints.length,
    resolvedComplaints: complaints.filter(c => c.status === 'Resolved').length,
    escalatedComplaints: complaints.filter(c => c.isEscalated).length,
    overdueComplaints: complaints.filter(c => 
      c.status !== 'Resolved' && 
      c.status !== 'Closed' && 
      new Date() > new Date(c.slaTarget)
    ).length,
  };

  // Mock agent performance data
  const agentPerformance: AgentPerformance[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      resolved: 156,
      avgResolutionTime: 2.8,
      customerRating: 4.9,
      firstContactRate: 92,
      totalAssigned: 168,
      responseTime: 1.2
    },
    {
      id: '2',
      name: 'Mike Chen',
      resolved: 142,
      avgResolutionTime: 3.1,
      customerRating: 4.8,
      firstContactRate: 89,
      totalAssigned: 160,
      responseTime: 1.5
    },
    {
      id: '3',
      name: 'Emily Davis',
      resolved: 138,
      avgResolutionTime: 2.9,
      customerRating: 4.7,
      firstContactRate: 91,
      totalAssigned: 152,
      responseTime: 1.3
    },
    {
      id: '4',
      name: 'James Wilson',
      resolved: 134,
      avgResolutionTime: 3.3,
      customerRating: 4.6,
      firstContactRate: 86,
      totalAssigned: 158,
      responseTime: 1.8
    },
  ];

  // Category statistics
  const categoryStats: CategoryStats[] = [
    {
      category: 'Technical Support',
      count: Math.floor(complaints.length * 0.35),
      percentage: 35,
      avgResolutionTime: 4.2,
      satisfactionScore: 4.3,
      trend: 'up'
    },
    {
      category: 'Billing',
      count: Math.floor(complaints.length * 0.25),
      percentage: 25,
      avgResolutionTime: 2.1,
      satisfactionScore: 4.7,
      trend: 'stable'
    },
    {
      category: 'Product Quality',
      count: Math.floor(complaints.length * 0.20),
      percentage: 20,
      avgResolutionTime: 5.6,
      satisfactionScore: 4.1,
      trend: 'down'
    },
    {
      category: 'Customer Service',
      count: Math.floor(complaints.length * 0.15),
      percentage: 15,
      avgResolutionTime: 3.8,
      satisfactionScore: 4.5,
      trend: 'up'
    },
    {
      category: 'Delivery',
      count: Math.floor(complaints.length * 0.05),
      percentage: 5,
      avgResolutionTime: 6.2,
      satisfactionScore: 3.9,
      trend: 'down'
    },
  ];

  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 3 months' },
    { value: '1y', label: 'Last year' },
    { value: 'custom', label: 'Custom range' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <div className="container mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-3 flex items-center gap-3">
                <BarChart3 className="w-10 h-10 text-blue-400" />
                Analytics & Reports Dashboard
              </h1>
              <p className="text-lg text-gray-400 mb-2">
                Comprehensive insights into complaint management performance, SLA tracking, and system metrics
              </p>
              <div className="flex items-center gap-2 bg-blue-600 px-3 py-1 rounded-full text-sm w-fit">
                <Award className="w-4 h-4" />
                <span className="font-medium">Analytics Manager Role</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export All
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700 font-medium">Time Range:</span>
            </div>
            <div className="flex gap-2">
              {timeRangeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedTimeRange(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedTimeRange === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-2 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'sla', label: 'SLA Tracking', icon: Timer },
              { id: 'agents', label: 'Agent Performance', icon: Users },
              { id: 'trends', label: 'Trends & Insights', icon: TrendingUp },
              { id: 'export', label: 'Export Reports', icon: Download },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedReport(id as 'overview' | 'sla' | 'agents' | 'trends' | 'export')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                  selectedReport === id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Section */}
        {selectedReport === 'overview' && (
          <div className="space-y-8">
            {/* Key Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                    <ArrowUp className="w-4 h-4" />
                    +12%
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{analyticsData.totalComplaints}</div>
                <div className="text-sm text-gray-600">Total Complaints</div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                    <ArrowUp className="w-4 h-4" />
                    +8%
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{analyticsData.resolvedComplaints}</div>
                <div className="text-sm text-gray-600">Resolved Complaints</div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <Timer className="w-6 h-6 text-orange-600" />
                  </div>
                  <span className="text-sm text-red-600 font-medium flex items-center gap-1">
                    <ArrowDown className="w-4 h-4" />
                    -5%
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{analyticsData.avgResolutionTime}h</div>
                <div className="text-sm text-gray-600">Avg Resolution Time</div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                    <ArrowUp className="w-4 h-4" />
                    +3%
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{analyticsData.customerSatisfaction}/5</div>
                <div className="text-sm text-gray-600">Customer Satisfaction</div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Main Analytics Chart */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Complaint Volume Trends</h3>
                  <select className="border border-gray-300 rounded-lg px-3 py-1 text-sm">
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                  </select>
                </div>
                <AnalyticsChart title="" type="line" data={complaints} />
              </div>

              {/* Category Distribution */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Complaints by Category</h3>
                <div className="space-y-4">
                  {categoryStats.map((category) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-700 font-medium">{category.category}</span>
                        <div className={`flex items-center gap-1 ${
                          category.trend === 'up' ? 'text-green-600' :
                          category.trend === 'down' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {category.trend === 'up' ? <TrendingUp className="w-3 h-3" /> :
                           category.trend === 'down' ? <TrendingDown className="w-3 h-3" /> :
                           <div className="w-3 h-3 bg-gray-400 rounded-full" />}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${category.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{category.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">System Activity Overview</h3>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View Details →
                </button>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-blue-100 p-4 rounded-xl w-fit mx-auto mb-3">
                    <Activity className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">1,247</div>
                  <div className="text-sm text-gray-600">Actions Taken Today</div>
                </div>
                
                <div className="text-center">
                  <div className="bg-green-100 p-4 rounded-xl w-fit mx-auto mb-3">
                    <Users className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">23</div>
                  <div className="text-sm text-gray-600">Active Agents</div>
                </div>
                
                <div className="text-center">
                  <div className="bg-purple-100 p-4 rounded-xl w-fit mx-auto mb-3">
                    <Target className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">97.2%</div>
                  <div className="text-sm text-gray-600">System Uptime</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLA Tracking Section */}
        {selectedReport === 'sla' && (
          <div className="space-y-8">
            {/* SLA Overview */}
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Target className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Overall SLA</span>
                </div>
                <div className="text-3xl font-bold text-green-600 mb-2">{analyticsData.slaCompliance}%</div>
                <div className="text-sm text-gray-600">Compliance Rate</div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Avg Response</span>
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-2">2.3h</div>
                <div className="text-sm text-gray-600">First Response Time</div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">SLA Breaches</span>
                </div>
                <div className="text-3xl font-bold text-orange-600 mb-2">{analyticsData.overdueComplaints}</div>
                <div className="text-sm text-gray-600">This Month</div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Award className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">First Contact</span>
                </div>
                <div className="text-3xl font-bold text-purple-600 mb-2">{analyticsData.firstContactResolution}%</div>
                <div className="text-sm text-gray-600">Resolution Rate</div>
              </div>
            </div>

            {/* SLA by Priority */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">SLA Performance by Priority</h3>
              <div className="space-y-4">
                {[
                  { priority: 'Urgent', target: '2h', actual: '1.8h', compliance: 98, color: 'red' },
                  { priority: 'High', target: '8h', actual: '6.2h', compliance: 94, color: 'orange' },
                  { priority: 'Medium', target: '24h', actual: '18.5h', compliance: 96, color: 'yellow' },
                  { priority: 'Low', target: '72h', actual: '52.3h', compliance: 91, color: 'green' },
                ].map((item) => (
                  <div key={item.priority} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium bg-${item.color}-100 text-${item.color}-800`}>
                        {item.priority}
                      </span>
                      <div>
                        <div className="font-medium text-gray-900">Target: {item.target}</div>
                        <div className="text-sm text-gray-600">Actual: {item.actual}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{item.compliance}%</div>
                      <div className="text-sm text-gray-600">Compliance</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Agent Performance Section */}
        {selectedReport === 'agents' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Agent Performance Leaderboard</h3>
                <select className="border border-gray-300 rounded-lg px-3 py-1 text-sm">
                  <option>This Month</option>
                  <option>Last Month</option>
                  <option>This Quarter</option>
                </select>
              </div>
              
              <div className="space-y-4">
                {agentPerformance.map((agent, index) => (
                  <div key={agent.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-500' :
                        'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{agent.name}</div>
                        <div className="text-sm text-gray-600">{agent.resolved} resolved tickets</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-8 text-center">
                      <div>
                        <div className="text-lg font-bold text-gray-900">{agent.avgResolutionTime}h</div>
                        <div className="text-xs text-gray-600">Avg Resolution</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900">{agent.customerRating}</div>
                        <div className="text-xs text-gray-600">Rating</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900">{agent.firstContactRate}%</div>
                        <div className="text-xs text-gray-600">First Contact</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900">{agent.responseTime}h</div>
                        <div className="text-xs text-gray-600">Response Time</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Export Reports Section */}
        {selectedReport === 'export' && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: 'Performance Report',
                  description: 'Complete performance analytics and KPI metrics',
                  icon: BarChart3,
                  color: 'blue',
                  formats: ['PDF', 'Excel', 'CSV']
                },
                {
                  title: 'SLA Compliance Report',
                  description: 'SLA tracking and compliance analysis',
                  icon: Timer,
                  color: 'green',
                  formats: ['PDF', 'Excel']
                },
                {
                  title: 'Agent Performance Report',
                  description: 'Individual and team performance metrics',
                  icon: Users,
                  color: 'purple',
                  formats: ['PDF', 'Excel', 'CSV']
                },
                {
                  title: 'Customer Satisfaction Report',
                  description: 'Customer feedback and satisfaction scores',
                  icon: Star,
                  color: 'yellow',
                  formats: ['PDF', 'Excel']
                },
                {
                  title: 'Trend Analysis Report',
                  description: 'Historical trends and forecasting',
                  icon: TrendingUp,
                  color: 'orange',
                  formats: ['PDF', 'Excel', 'CSV']
                },
                {
                  title: 'Custom Report Builder',
                  description: 'Build your own custom analytics report',
                  icon: Settings,
                  color: 'gray',
                  formats: ['PDF', 'Excel', 'CSV', 'JSON']
                },
              ].map((report) => (
                <div key={report.title} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 bg-${report.color}-100 rounded-xl`}>
                      <report.icon className={`w-6 h-6 text-${report.color}-600`} />
                    </div>
                    <h3 className="font-semibold text-gray-900">{report.title}</h3>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4">{report.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {report.formats.map((format) => (
                      <span key={format} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {format}
                      </span>
                    ))}
                  </div>
                  
                  <button className={`w-full bg-${report.color}-600 text-white py-2 px-4 rounded-lg hover:bg-${report.color}-700 flex items-center justify-center gap-2`}>
                    <Download className="w-4 h-4" />
                    Generate Report
                  </button>
                </div>
              ))}
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Scheduled Reports</h3>
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Set up automated report generation and delivery</p>
                <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto">
                  <Plus className="w-4 h-4" />
                  Schedule New Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}