import React, { createContext, useContext, useState, ReactNode } from 'react';
import { aiService } from '../services/aiService';
import { useNotifications } from './NotificationContext';

export interface Complaint {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: 'Billing' | 'Technical' | 'Service' | 'Product' | 'General';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Under Review' | 'Resolved' | 'Closed' | 'Escalated';
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  assignedTo?: string;
  assignedTeam?: string;
  slaTarget: Date;
  responseTime?: number; // in hours
  resolutionTime?: number; // in hours
  isEscalated: boolean;
  escalationReason?: string;
  feedback?: {
    rating: number;
    comment: string;
    submittedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  updates: ComplaintUpdate[];
}

export interface ComplaintUpdate {
  id: string;
  complaintId: string;
  message: string;
  author: string;
  timestamp: Date;
  type: 'status_change' | 'comment' | 'assignment';
}

interface ComplaintContextType {
  complaints: Complaint[];
  createComplaint: (title: string, description: string, userId: string) => Promise<Complaint>;
  updateComplaintStatus: (id: string, status: Complaint['status'], message?: string) => void;
  assignComplaint: (id: string, agentId: string) => void;
  escalateComplaint: (id: string, reason: string) => void;
  addComplaintUpdate: (id: string, message: string, author: string, type: ComplaintUpdate['type']) => void;
  submitFeedback: (id: string, rating: number, comment: string) => void;
  getComplaintsByUser: (userId: string) => Complaint[];
  getUserComplaints: (userId: string) => Complaint[];
  getEscalatedComplaints: () => Complaint[];
  getSlaBreaches: () => Complaint[];
  autoAssignComplaint: (complaint: Complaint) => string;
}

const ComplaintContext = createContext<ComplaintContextType | undefined>(undefined);

export function ComplaintProvider({ children }: { children: ReactNode }) {
  const [complaints, setComplaints] = useState<Complaint[]>([
    // Sample complaints for testing
    {
      id: 'COMP-001',
      userId: 'user-1',
      title: 'Internet connection keeps dropping',
      description: 'My internet connection has been unstable for the past 3 days. It drops every 2-3 hours and I have to restart my router.',
      category: 'Technical',
      priority: 'High',
      status: 'In Progress',
      sentiment: 'Negative',
      slaTarget: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
      isEscalated: false,
      assignedTo: 'Alex Kumar',
      assignedTeam: 'Tech Support Team',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      updates: [
        {
          id: 'update-1',
          complaintId: 'COMP-001',
          message: 'Complaint has been created and classified automatically.',
          author: 'System',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          type: 'status_change',
        },
        {
          id: 'update-2',
          complaintId: 'COMP-001',
          message: 'Assigned to Tech Support Team. Agent Alex Kumar will handle this case.',
          author: 'System',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000),
          type: 'assignment',
        },
        {
          id: 'update-3',
          complaintId: 'COMP-001',
          message: 'I have investigated the issue and it appears to be related to your ISP. We are contacting them on your behalf.',
          author: 'Alex Kumar',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
          type: 'comment',
        }
      ],
    },
    {
      id: 'COMP-002',
      userId: 'user-1',
      title: 'Billing discrepancy in last month invoice',
      description: 'I was charged twice for my monthly subscription. The amount $29.99 appears twice in my billing statement.',
      category: 'Billing',
      priority: 'Medium',
      status: 'Resolved',
      sentiment: 'Neutral',
      slaTarget: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago (SLA met)
      isEscalated: false,
      assignedTo: 'Sarah Johnson',
      assignedTeam: 'Billing Team',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      updates: [
        {
          id: 'update-4',
          complaintId: 'COMP-002',
          message: 'Complaint has been created and classified automatically.',
          author: 'System',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          type: 'status_change',
        },
        {
          id: 'update-5',
          complaintId: 'COMP-002',
          message: 'I have reviewed your billing and confirmed the duplicate charge. A refund of $29.99 has been processed.',
          author: 'Sarah Johnson',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          type: 'comment',
        }
      ],
    },
    {
      id: 'COMP-003',
      userId: 'user-2',
      title: 'Application crashes when uploading files',
      description: 'Every time I try to upload a file larger than 5MB, the application crashes and I lose all my work. This is very frustrating!',
      category: 'Technical',
      priority: 'Urgent',
      status: 'Open',
      sentiment: 'Negative',
      slaTarget: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago (SLA breached)
      isEscalated: true,
      escalationReason: 'SLA breach - critical issue affecting user productivity',
      assignedTo: 'David Park',
      assignedTeam: 'Tech Support Team',
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      updatedAt: new Date(Date.now() - 7 * 60 * 60 * 1000), // 7 hours ago
      updates: [
        {
          id: 'update-6',
          complaintId: 'COMP-003',
          message: 'Complaint has been created and classified automatically.',
          author: 'System',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
          type: 'status_change',
        },
        {
          id: 'update-7',
          complaintId: 'COMP-003',
          message: 'Complaint escalated: SLA breach - critical issue affecting user productivity',
          author: 'System',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          type: 'status_change',
        }
      ],
    }
  ]);

  // Helper function to determine team based on category
  const getTeamForCategory = (category: Complaint['category']): string => {
    const teamMapping = {
      'Billing': 'Billing Team',
      'Technical': 'Tech Support Team',
      'Service': 'Customer Service Team',
      'Product': 'Product Team',
      'General': 'General Support Team'
    };
    return teamMapping[category];
  };

  // Helper function to auto-assign complaints to agents
  const autoAssignComplaint = (complaint: Complaint): string => {
    // Mock agent assignment logic
    const agents = {
      'Billing': ['Sarah Johnson', 'Mike Chen', 'Lisa Rodriguez'],
      'Technical': ['Alex Kumar', 'David Park', 'Emma Wilson'],
      'Service': ['John Smith', 'Maria Garcia', 'Tom Brown'],
      'Product': ['Rachel Green', 'Steven Taylor', 'Amy Liu'],
      'General': ['Chris Davis', 'Nicole White', 'Mark Johnson']
    };

    const categoryAgents = agents[complaint.category];
    return categoryAgents[Math.floor(Math.random() * categoryAgents.length)];
  };

  const createComplaint = async (title: string, description: string, userId: string): Promise<Complaint> => {
    // Use AI service to classify the complaint
    const aiAnalysis = await aiService.classifyComplaint(description);
    
    // Calculate SLA target based on priority
    const slaHours = {
      'Urgent': 4,
      'High': 24,
      'Medium': 48,
      'Low': 72
    };
    const slaTarget = new Date();
    slaTarget.setHours(slaTarget.getHours() + slaHours[aiAnalysis.priority]);
    
    const newComplaint: Complaint = {
      id: Date.now().toString(),
      userId,
      title,
      description,
      category: aiAnalysis.category,
      priority: aiAnalysis.priority,
      status: 'Open',
      sentiment: aiAnalysis.sentiment,
      slaTarget,
      isEscalated: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      updates: [{
        id: Date.now().toString() + '_init',
        complaintId: Date.now().toString(),
        message: 'Complaint has been created and classified automatically.',
        author: 'System',
        timestamp: new Date(),
        type: 'status_change',
      }],
    };

    // Auto-assign to agent
    const assignedAgent = autoAssignComplaint(newComplaint);
    if (assignedAgent) {
      newComplaint.assignedTo = assignedAgent;
      newComplaint.assignedTeam = getTeamForCategory(newComplaint.category);
      newComplaint.updates.push({
        id: Date.now().toString() + '_assign',
        complaintId: newComplaint.id,
        message: `Automatically assigned to ${assignedAgent} from ${newComplaint.assignedTeam} team`,
        author: 'System',
        timestamp: new Date(),
        type: 'assignment',
      });
    }

    setComplaints(prev => [...prev, newComplaint]);
    return newComplaint;
  };

  const updateComplaintStatus = (id: string, status: Complaint['status'], message?: string) => {
    setComplaints(prev => prev.map(complaint => {
      if (complaint.id === id) {
        const update: ComplaintUpdate = {
          id: Date.now().toString(),
          complaintId: id,
          message: message || `Status changed to ${status}`,
          author: 'System',
          timestamp: new Date(),
          type: 'status_change',
        };
        return {
          ...complaint,
          status,
          updatedAt: new Date(),
          updates: [...complaint.updates, update],
        };
      }
      return complaint;
    }));
  };

  const assignComplaint = (id: string, agentId: string) => {
    setComplaints(prev => prev.map(complaint => {
      if (complaint.id === id) {
        const update: ComplaintUpdate = {
          id: Date.now().toString(),
          complaintId: id,
          message: `Complaint assigned to agent ${agentId}`,
          author: 'System',
          timestamp: new Date(),
          type: 'assignment',
        };
        return {
          ...complaint,
          assignedTo: agentId,
          status: 'In Progress',
          updatedAt: new Date(),
          updates: [...complaint.updates, update],
        };
      }
      return complaint;
    }));
  };

  const addComplaintUpdate = (id: string, message: string, author: string, type: ComplaintUpdate['type']) => {
    setComplaints(prev => prev.map(complaint => {
      if (complaint.id === id) {
        const update: ComplaintUpdate = {
          id: Date.now().toString(),
          complaintId: id,
          message,
          author,
          timestamp: new Date(),
          type,
        };
        return {
          ...complaint,
          updatedAt: new Date(),
          updates: [...complaint.updates, update],
        };
      }
      return complaint;
    }));
  };

  const escalateComplaint = (id: string, reason: string) => {
    setComplaints(prev => prev.map(complaint => {
      if (complaint.id === id) {
        const update: ComplaintUpdate = {
          id: Date.now().toString(),
          complaintId: id,
          message: `Complaint escalated: ${reason}`,
          author: 'System',
          timestamp: new Date(),
          type: 'status_change',
        };
        return {
          ...complaint,
          status: 'Escalated' as Complaint['status'],
          isEscalated: true,
          escalationReason: reason,
          updatedAt: new Date(),
          updates: [...complaint.updates, update],
        };
      }
      return complaint;
    }));
  };

  const submitFeedback = (id: string, rating: number, comment: string) => {
    setComplaints(prev => prev.map(complaint => {
      if (complaint.id === id) {
        return {
          ...complaint,
          feedback: {
            rating,
            comment,
            submittedAt: new Date(),
          },
          updatedAt: new Date(),
        };
      }
      return complaint;
    }));
  };

  const getComplaintsByUser = (userId: string): Complaint[] => {
    return complaints.filter(complaint => complaint.userId === userId);
  };

  const getUserComplaints = (userId: string): Complaint[] => {
    return complaints.filter(complaint => complaint.userId === userId);
  };

  const getEscalatedComplaints = (): Complaint[] => {
    return complaints.filter(complaint => complaint.isEscalated);
  };

  const getSlaBreaches = (): Complaint[] => {
    const now = new Date();
    return complaints.filter(complaint => 
      complaint.status !== 'Resolved' && 
      complaint.status !== 'Closed' && 
      now > complaint.slaTarget
    );
  };

  return (
    <ComplaintContext.Provider value={{
      complaints,
      createComplaint,
      updateComplaintStatus,
      assignComplaint,
      escalateComplaint,
      addComplaintUpdate,
      submitFeedback,
      getComplaintsByUser,
      getUserComplaints,
      getEscalatedComplaints,
      getSlaBreaches,
      autoAssignComplaint,
    }}>
      {children}
    </ComplaintContext.Provider>
  );
}

export function useComplaints() {
  const context = useContext(ComplaintContext);
  if (context === undefined) {
    throw new Error('useComplaints must be used within a ComplaintProvider');
  }
  return context;
}