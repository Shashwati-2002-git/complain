import React, { useState } from 'react';
import { Complaint, useComplaints } from '../../contexts/ComplaintContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Tag, 
  AlertTriangle, 
  MessageSquare, 
  Send,
  FileText,
  Calendar,
  CheckCircle,
  Edit3
} from 'lucide-react';

interface ComplaintDetailsProps {
  complaint: Complaint;
  onBack: () => void;
  onUpdate?: (ticketId: string, status: string, comment: string) => void;
  isAgent?: boolean;
}

export function ComplaintDetails({ complaint, onBack, onUpdate, isAgent = false }: ComplaintDetailsProps) {
  const [newComment, setNewComment] = useState('');
  const [newStatus, setNewStatus] = useState(complaint.status);
  const [showEscalationDialog, setShowEscalationDialog] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');
  const { addComplaintUpdate, escalateComplaint } = useComplaints();
  const { addNotification } = useNotifications();

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    if (onUpdate) {
      onUpdate(complaint.id, newStatus, newComment);
    } else {
      addComplaintUpdate(complaint.id, newComment, 'User', 'comment');
    }
    
    setNewComment('');
    addNotification('success', 'Comment Added', 'Your comment has been added to the ticket.');
  };

  const handleEscalation = () => {
    if (!escalationReason.trim()) return;
    
    escalateComplaint(complaint.id, escalationReason);
    setShowEscalationDialog(false);
    setEscalationReason('');
    addNotification('warning', 'Complaint Escalated', 'This complaint has been escalated to management.');
  };

  const getSlaStatus = () => {
    const now = new Date();
    const timeLeft = complaint.slaTarget.getTime() - now.getTime();
    const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
    
    if (timeLeft <= 0) {
      return { status: 'breached', message: 'SLA Breached', color: 'text-red-600', bgColor: 'bg-red-100' };
    } else if (hoursLeft <= 4) {
      return { status: 'critical', message: `${hoursLeft}h remaining`, color: 'text-orange-600', bgColor: 'bg-orange-100' };
    } else if (hoursLeft <= 12) {
      return { status: 'warning', message: `${hoursLeft}h remaining`, color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    } else {
      return { status: 'ok', message: `${hoursLeft}h remaining`, color: 'text-green-600', bgColor: 'bg-green-100' };
    }
  };

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Complaint Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Complaint Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{complaint.title}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Ticket #{complaint.id}</span>
                  <span>•</span>
                  <span>Created {complaint.createdAt.toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
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
            </div>

            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Description</h3>
              <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                {complaint.description}
              </p>
            </div>
          </div>

          {/* Updates Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Updates & Comments
            </h3>
            
            <div className="space-y-4 mb-6">
              {complaint.updates.map((update, index) => (
                <div key={update.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`p-2 rounded-full ${
                      update.type === 'status_change' ? 'bg-blue-100 text-blue-600' :
                      update.type === 'assignment' ? 'bg-purple-100 text-purple-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {update.type === 'status_change' ? <Edit3 className="w-4 h-4" /> :
                       update.type === 'assignment' ? <User className="w-4 h-4" /> :
                       <MessageSquare className="w-4 h-4" />}
                    </div>
                    {index < complaint.updates.length - 1 && (
                      <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800">{update.author}</span>
                      <span className="text-sm text-gray-500">{update.timestamp.toLocaleString()}</span>
                    </div>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{update.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Comment */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={isAgent ? "Add a comment or update..." : "Add a comment..."}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <div className="flex items-center justify-between mt-3">
                    {isAgent && (
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    )}
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2 ml-auto"
                    >
                      <Send className="w-4 h-4" />
                      {isAgent ? 'Update Ticket' : 'Add Comment'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* SLA Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              SLA Status
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-2">Target Resolution</div>
                <div className="font-medium text-gray-800">{complaint.slaTarget.toLocaleString()}</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500 mb-2">Time Remaining</div>
                <div className={`px-3 py-2 rounded-lg font-medium ${getSlaStatus().bgColor} ${getSlaStatus().color}`}>
                  {getSlaStatus().message}
                </div>
              </div>

              {complaint.assignedTeam && (
                <div>
                  <div className="text-sm text-gray-500 mb-2">Assigned Team</div>
                  <div className="font-medium text-gray-800">{complaint.assignedTeam}</div>
                </div>
              )}

              {complaint.isEscalated && (
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 text-orange-800 font-medium mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    Escalated
                  </div>
                  {complaint.escalationReason && (
                    <div className="text-sm text-orange-700">{complaint.escalationReason}</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Ticket Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Ticket Information</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Ticket ID</div>
                  <div className="font-medium text-gray-800">#{complaint.id}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Created</div>
                  <div className="font-medium text-gray-800">{complaint.createdAt.toLocaleDateString()}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Last Updated</div>
                  <div className="font-medium text-gray-800">{complaint.updatedAt.toLocaleString()}</div>
                </div>
              </div>
              
              {complaint.assignedTo && (
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Assigned To</div>
                    <div className="font-medium text-gray-800">{complaint.assignedTo}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Classification */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5" />
              AI Classification
            </h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500 mb-1">Category</div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(complaint.category)}`}>
                  {complaint.category}
                </span>
              </div>
              
              <div>
                <div className="text-sm text-gray-500 mb-1">Sentiment</div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                  complaint.sentiment === 'Positive' ? 'bg-green-100 text-green-800 border-green-200' :
                  complaint.sentiment === 'Negative' ? 'bg-red-100 text-red-800 border-red-200' :
                  'bg-gray-100 text-gray-800 border-gray-200'
                }`}>
                  {complaint.sentiment}
                </span>
              </div>
              
              <div>
                <div className="text-sm text-gray-500 mb-1">Priority Level</div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(complaint.priority)}`}>
                  {complaint.priority}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {isAgent && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => onUpdate?.(complaint.id, 'In Progress', 'Agent has started working on this ticket.')}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Start Working
                </button>
                
                <button
                  onClick={() => onUpdate?.(complaint.id, 'Under Review', 'Ticket is under review by the team.')}
                  className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Mark for Review
                </button>
                
                <button
                  onClick={() => onUpdate?.(complaint.id, 'Resolved', 'This complaint has been resolved successfully.')}
                  className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Resolved
                </button>

                {!complaint.isEscalated && getSlaStatus().status === 'breached' && (
                  <button
                    onClick={() => setShowEscalationDialog(true)}
                    className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Escalate to Management
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Escalation Dialog */}
          {showEscalationDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Escalate Complaint</h3>
                <textarea
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  placeholder="Please provide a reason for escalation..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none mb-4"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEscalationDialog(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEscalation}
                    disabled={!escalationReason.trim()}
                    className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Escalate
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}