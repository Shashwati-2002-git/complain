import express from 'express';
import { Complaint } from '../models/Complaint';
import { User } from '../models/User';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Get system statistics
router.get('/stats', authenticate, authorize('admin'), asyncHandler(async (req: any, res: any) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAgents = await User.countDocuments({ role: 'agent', isActive: true });
    const totalComplaints = await Complaint.countDocuments();
    const openComplaints = await Complaint.countDocuments({ status: { $in: ['Open', 'In Progress'] } });
    const escalatedComplaints = await Complaint.countDocuments({ isEscalated: true });

    res.json({
      totalUsers,
      totalAgents,
      totalComplaints,
      openComplaints,
      escalatedComplaints
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch system statistics' });
  }
}));

// Get all users with enhanced filtering
router.get('/users', authenticate, authorize('admin'), asyncHandler(async (req: any, res: any) => {
  const {
    role,
    department,
    isActive,
    page = 1,
    limit = 10,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const filter: any = {};
  if (role) filter.role = role;
  if (department) filter.department = department;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort: any = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const users = await User.find(filter)
    .select('-password')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await User.countDocuments(filter);

  res.json({
    users,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total
    }
  });
}));

// Bulk update users
router.patch('/users/bulk', authenticate, authorize('admin'), asyncHandler(async (req: any, res: any) => {
  const { userIds, updates } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ error: 'User IDs array is required' });
  }

  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Updates object is required' });
  }

  try {
    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: updates }
    );

    res.json({
      message: `${result.modifiedCount} users updated successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

// Get all complaints with admin-level access
router.get('/complaints', authenticate, authorize('admin'), asyncHandler(async (req: any, res: any) => {
  const {
    status,
    category,
    priority,
    assignedTo,
    isEscalated,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    dateFrom,
    dateTo
  } = req.query;

  const filter: any = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (isEscalated !== undefined) filter.isEscalated = isEscalated === 'true';

  // Date range filter
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort: any = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const complaints = await Complaint.find(filter)
    .populate('userId', 'firstName lastName email')
    .populate('assignedTo', 'firstName lastName email department')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Complaint.countDocuments(filter);

  res.json({
    complaints,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total
    }
  });
}));

// Bulk assign complaints
router.patch('/complaints/bulk-assign', authenticate, authorize('admin'), asyncHandler(async (req: any, res: any) => {
  const { complaintIds, agentId, teamName } = req.body;

  if (!complaintIds || !Array.isArray(complaintIds) || complaintIds.length === 0) {
    return res.status(400).json({ error: 'Complaint IDs array is required' });
  }

  if (!agentId) {
    return res.status(400).json({ error: 'Agent ID is required' });
  }

  try {
    const agent = await User.findById(agentId);
    if (!agent || agent.role !== 'agent') {
      return res.status(400).json({ error: 'Invalid agent ID' });
    }

    const updateData: any = {
      assignedTo: agentId,
      assignedTeam: teamName || agent.department,
      status: 'In Progress',
      updatedAt: new Date()
    };

    const result = await Complaint.updateMany(
      { _id: { $in: complaintIds } },
      { $set: updateData }
    );

    res.json({
      message: `${result.modifiedCount} complaints assigned successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

// Close multiple complaints
router.patch('/complaints/bulk-close', authenticate, authorize('admin'), asyncHandler(async (req: any, res: any) => {
  const { complaintIds, reason } = req.body;

  if (!complaintIds || !Array.isArray(complaintIds) || complaintIds.length === 0) {
    return res.status(400).json({ error: 'Complaint IDs array is required' });
  }

  try {
    const result = await Complaint.updateMany(
      { _id: { $in: complaintIds } },
      {
        $set: {
          status: 'Closed',
          updatedAt: new Date()
        },
        $push: {
          updates: {
            message: reason || 'Complaint closed by administrator',
            author: `${req.user.firstName} ${req.user.lastName}`,
            authorId: req.user._id,
            timestamp: new Date(),
            type: 'status_change',
            isInternal: false
          }
        }
      }
    );

    res.json({
      message: `${result.modifiedCount} complaints closed successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

// Get system configuration
router.get('/config', authenticate, authorize('admin'), asyncHandler(async (req: any, res: any) => {
  // Return system configuration that can be modified
  const config = {
    slaTargets: {
      Urgent: 4, // hours
      High: 24,
      Medium: 48,
      Low: 72
    },
    autoAssignment: {
      enabled: true,
      rules: [
        { category: 'Billing', department: 'Billing Team' },
        { category: 'Technical', department: 'Tech Support Team' },
        { category: 'Service', department: 'Customer Service Team' },
        { category: 'Product', department: 'Product Team' },
        { category: 'General', department: 'General Support Team' }
      ]
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: false,
      escalationThreshold: 2 // hours past SLA
    },
    features: {
      aiClassification: true,
      realTimeUpdates: true,
      fileUploads: true,
      feedbackRequired: true
    }
  };

  res.json(config);
}));

// Update system configuration
router.patch('/config', authenticate, authorize('admin'), asyncHandler(async (req: any, res: any) => {
  // In a real application, you would save this to a configuration collection
  // For now, we'll just validate and return the updated configuration
  const { slaTargets, autoAssignment, notifications, features } = req.body;

  // Basic validation
  if (slaTargets) {
    const validPriorities = ['Urgent', 'High', 'Medium', 'Low'];
    for (const priority of validPriorities) {
      if (slaTargets[priority] && (slaTargets[priority] < 1 || slaTargets[priority] > 168)) {
        return res.status(400).json({ error: `Invalid SLA target for ${priority} priority` });
      }
    }
  }

  // TODO: Save configuration to database
  res.json({ message: 'Configuration updated successfully' });
}));

// Export data
router.get('/export/:type', authenticate, authorize('admin'), asyncHandler(async (req: any, res: any) => {
  const { type } = req.params;
  const { format = 'json', dateFrom, dateTo } = req.query;

  if (!['complaints', 'users'].includes(type)) {
    return res.status(400).json({ error: 'Invalid export type' });
  }

  if (!['json', 'csv'].includes(format)) {
    return res.status(400).json({ error: 'Invalid export format' });
  }

  try {
    let data;
    const filter: any = {};

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    if (type === 'complaints') {
      data = await Complaint.find(filter)
        .populate('userId', 'firstName lastName email')
        .populate('assignedTo', 'firstName lastName email')
        .lean();
    } else {
      data = await User.find(filter).select('-password').lean();
    }

    if (format === 'csv') {
      // In a real application, you would use a CSV library to format the data
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-export.csv`);
      res.send('CSV export not implemented in this demo');
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-export.json`);
      res.json(data);
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Export failed' });
  }
}));

export default router;
