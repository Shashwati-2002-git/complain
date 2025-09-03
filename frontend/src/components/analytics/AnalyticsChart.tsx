import React from 'react';
import { Complaint } from '../../contexts/ComplaintContext';
import { BarChart3, PieChart } from 'lucide-react';

interface AnalyticsChartProps {
  title: string;
  type: 'pie' | 'line';
  data: Complaint[];
}

export function AnalyticsChart({ title, type, data }: AnalyticsChartProps) {
  const getCategoryData = () => {
    const categories = data.reduce((acc, complaint) => {
      acc[complaint.category] = (acc[complaint.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  };

  const getResolutionTrend = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const resolved = data.filter(c => 
        c.status === 'Resolved' && 
        c.updatedAt.toISOString().split('T')[0] === date
      ).length;
      return { date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }), resolved };
    });
  };

  const categoryData = getCategoryData();
  const trendData = getResolutionTrend();

  if (type === 'pie') {
    const total = categoryData.reduce((sum, item) => sum + item.value, 0);
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <PieChart className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>

        <div className="space-y-4">
          {categoryData.map((item, index) => {
            const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
            const colors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-orange-500', 'bg-red-500'];
            
            return (
              <div key={item.name} className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${colors[index % colors.length]}`}></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    <span className="text-sm text-gray-500">{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${colors[index % colors.length]}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {total === 0 && (
          <div className="text-center py-8 text-gray-500">
            <PieChart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p>No data available</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>

      <div className="space-y-4">
        {trendData.map((item, index) => (
          <div key={item.date} className="flex items-center gap-3">
            <div className="w-12 text-sm text-gray-600">{item.date}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-500">Resolved</span>
                <span className="text-sm font-medium text-gray-700">{item.resolved}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, (item.resolved / 10) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {trendData.every(item => item.resolved === 0) && (
        <div className="text-center py-8 text-gray-500">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p>No resolution data available</p>
        </div>
      )}
    </div>
  );
}