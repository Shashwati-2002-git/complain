import express from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Get user notifications
router.get('/', authenticate, asyncHandler(async (req: any, res: any) => {
  // In a real application, you would fetch notifications from a database
  // For now, we'll return mock notifications
  const mockNotifications = [
    {
      id: '1',
      type: 'complaint_assigned',
      title: 'New complaint assigned',
      message: 'You have been assigned a new complaint #COMP-001',
      userId: req.user._id,
      read: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      data: {
        complaintId: 'COMP-001'
      }
    },
    {
      id: '2',
      type: 'complaint_updated',
      title: 'Complaint status updated',
      message: 'Complaint #COMP-002 has been resolved',
      userId: req.user._id,
      read: false,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      data: {
        complaintId: 'COMP-002',
        status: 'Resolved'
      }
    },
    {
      id: '3',
      type: 'sla_breach',
      title: 'SLA breach warning',
      message: 'Complaint #COMP-003 is approaching SLA deadline',
      userId: req.user._id,
      read: true,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      data: {
        complaintId: 'COMP-003',
        slaTarget: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
      }
    }
  ];

  res.json(mockNotifications);
}));

// Mark notification as read
router.patch('/:id/read', authenticate, asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  
  // In a real application, you would update the notification in the database
  res.json({ message: 'Notification marked as read', id });
}));

// Mark all notifications as read
router.patch('/read-all', authenticate, asyncHandler(async (req: any, res: any) => {
  // In a real application, you would update all user notifications in the database
  res.json({ message: 'All notifications marked as read' });
}));

// Delete notification
router.delete('/:id', authenticate, asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  
  // In a real application, you would delete the notification from the database
  res.json({ message: 'Notification deleted', id });
}));

// Get notification preferences
router.get('/preferences', authenticate, asyncHandler(async (req: any, res: any) => {
  // Return user notification preferences
  const preferences = {
    email: {
      complaintAssigned: true,
      complaintUpdated: true,
      slaBreaches: true,
      escalations: true,
      feedbackReceived: false
    },
    push: {
      complaintAssigned: true,
      complaintUpdated: false,
      slaBreaches: true,
      escalations: true,
      feedbackReceived: false
    },
    sms: {
      complaintAssigned: false,
      complaintUpdated: false,
      slaBreaches: true,
      escalations: true,
      feedbackReceived: false
    }
  };

  res.json(preferences);
}));

// Update notification preferences
router.patch('/preferences', authenticate, asyncHandler(async (req: any, res: any) => {
  const { email, push, sms } = req.body;
  
  // In a real application, you would save these preferences to the user's profile
  const updatedPreferences = {
    email: email || {},
    push: push || {},
    sms: sms || {}
  };

  res.json({ 
    message: 'Notification preferences updated successfully',
    preferences: updatedPreferences 
  });
}));

export default router;
