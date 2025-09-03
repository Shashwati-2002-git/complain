import React, { useState } from 'react';
import { Complaint, useComplaints } from '../../contexts/ComplaintContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  MessageSquare, 
  User,
  Calendar,
  Tag,
  MoreHorizontal,
  UserCheck,
  Eye,
  FileText,
  Star
} from 'lucide-react';
import { FeedbackForm } from './FeedbackForm';

interface ComplaintCardProps {
  complaint: Complaint;
  showActions: boolean;
  isAdmin?: boolean;
  isAgent?: boolean;
  onSelectComplaint?: (id: string) => void;
}

export function ComplaintCard({ complaint, showActions, isAdmin = false, isAgent = false, onSelectComplaint }: ComplaintCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const { updateComplaintStatus, assignComplaint, addComplaintUpdate } = useComplaints();
  const { addNotification } = useNotifications();

  const isResolved = complaint.status === 'Resolved' || complaint.status === 'Closed';
  const hasFeedback = complaint.feedback !== undefined;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'In Progress': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Under Review': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'Closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Billing': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Technical': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Service': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Product': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleStatusChange = (newStatus: Complaint['status']) => {
    updateComplaintStatus(complaint.id, newStatus);
    addNotification('info', 'Status Updated', `Complaint #${complaint.id} status changed to ${newStatus}`);
  };

  const handleAssign = (agentId: string) => {
    assignComplaint(complaint.id, agentId);
    setShowAssignModal(false);
    addNotification('success', 'Complaint Assigned', `Complaint #${complaint.id} assigned to agent ${agentId}`);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-800">{complaint.title}</h3>
              <span className="text-sm text-gray-500">#{complaint.id}</span>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(complaint.priority)}`}>
                {complaint.priority} Priority
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(complaint.status)}`}>
                {complaint.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(complaint.category)}`}>
                {complaint.category}
              </span>
            </div>

            <p className="text-gray-600 text-sm line-clamp-2 mb-3">{complaint.description}</p>

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {complaint.createdAt.toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {complaint.updatedAt.toLocaleTimeString()}
              </div>
              {complaint.assignedTo && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Agent {complaint.assignedTo}
                </div>
              )}
              {complaint.feedback && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-500" />
                  {complaint.feedback.rating}/5 Rating
                </div>
              )}
            </div>
          </div>

          {showActions && (
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                title="View Details"
              >
                <Eye className="w-4 h-4" />
              </button>
              
              {/* Feedback button for user on resolved complaints */}
              {!isAdmin && !isAgent && isResolved && !hasFeedback && (
                <button
                  onClick={() => setShowFeedbackForm(true)}
                  className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors duration-200"
                  title="Rate Experience"
                >
                  <Star className="w-4 h-4" />
                </button>
              )}
              
              {(isAdmin || isAgent) && onSelectComplaint && (
                <button
                  onClick={() => onSelectComplaint(complaint.id)}
                  className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors duration-200"
                  title="Open Details"
                >
                  <FileText className="w-4 h-4" />
                </button>
              )}
              
              {isAdmin && (
                <>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-colors duration-200"
                    title="Assign Agent"
                  >
                    <UserCheck className="w-4 h-4" />
                  </button>
                  
                  <div className="relative group">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[150px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      {['In Progress', 'Under Review', 'Resolved', 'Closed'].map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(status as Complaint['status'])}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                        >
                          Mark as {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Expanded Details */}
        {showDetails && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Full Description</h4>
                <p className="text-gray-600 text-sm leading-relaxed">{complaint.description}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">Recent Updates</h4>
                <div className="space-y-2">
                  {complaint.updates.slice(-3).map((update) => (
                    <div key={update.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{update.author}</span>
                        <span className="text-xs text-gray-500">{update.timestamp.toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-600">{update.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Form */}
      {showFeedbackForm && (
        <FeedbackForm
          complaintId={complaint.id}
          onClose={() => setShowFeedbackForm(false)}
        />
      )}

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Assign to Agent</h3>
            <div className="space-y-3">
              {['Agent-001', 'Agent-002', 'Agent-003'].map((agentId) => (
                <button
                  key={agentId}
                  onClick={() => handleAssign(agentId)}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200"
                >
                  <div className="font-medium text-gray-800">{agentId}</div>
                  <div className="text-sm text-gray-500">Available • Specializes in {complaint.category}</div>
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}