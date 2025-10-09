import express from 'express';
import { Complaint } from '../models/Complaint.js';
import { User } from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Get system statistics
router.get('/stats', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch system statistics' });
  }
}));

// Get all users with enhanced filtering
router.get('/users', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
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

  const filter = {};
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
  const sort = {};
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
router.patch('/users/bulk', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
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
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// Get all complaints with admin-level access
router.get('/complaints', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
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

  const filter = {};
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
  const sort = {};
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
router.patch('/complaints/bulk-assign', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
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

    const updateData = {
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
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// Close multiple complaints
router.patch('/complaints/bulk-close', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
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
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// Get system configuration
router.get('/config', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
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
router.patch('/config', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
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
router.get('/export/:type', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
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
    const filter = {};

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
  } catch (error) {
    res.status(500).json({ error: 'Export failed' });
  }
}));

// System settings management
router.get('/settings', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  // In a real app, these would come from a settings collection
  const systemSettings = {
    slaTargets: {
      urgent: 4,
      high: 24,
      medium: 48,
      low: 72
    },
    autoAssignment: {
      enabled: true,
      algorithm: 'workload_based'
    },
    categories: [
      'Technical Issue',
      'Billing',
      'Account Management',
      'Product Support',
      'General Inquiry',
      'Feature Request',
      'Bug Report'
    ],
    departments: [
      'Technical Support',
      'Customer Service',
      'Billing',
      'Sales',
      'Management'
    ],
    notifications: {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true
    }
  };

  res.json(systemSettings);
}));

// Update system settings
router.patch('/settings', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { slaTargets, autoAssignment, categories, departments, notifications } = req.body;

  // In a real app, you would update a settings collection in the database
  // For now, we'll just return success
  res.json({
    message: 'System settings updated successfully',
    settings: req.body
  });
}));

// Advanced analytics for admin dashboard
router.get('/analytics/advanced', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { timeRange = '30' } = req.query;
  const days = parseInt(timeRange);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    // System performance metrics
    const [
      totalComplaints,
      resolvedComplaints,
      escalatedComplaints,
      overdueComplaints,
      avgResolutionTime,
      categoryDistribution,
      priorityDistribution,
      dailyVolume
    ] = await Promise.all([
      Complaint.countDocuments({ createdAt: { $gte: startDate } }),
      Complaint.countDocuments({ 
        createdAt: { $gte: startDate },
        status: { $in: ['Resolved', 'Closed'] }
      }),
      Complaint.countDocuments({ 
        createdAt: { $gte: startDate },
        isEscalated: true 
      }),
      Complaint.countDocuments({
        createdAt: { $gte: startDate },
        status: { $nin: ['Resolved', 'Closed'] },
        slaTarget: { $lt: new Date() }
      }),
      // Average resolution time
      Complaint.aggregate([
        { 
          $match: { 
            createdAt: { $gte: startDate },
            status: { $in: ['Resolved', 'Closed'] },
            'metrics.resolutionTime': { $exists: true }
          }
        },
        {
          $group: {
            _id: null,
            avgTime: { $avg: '$metrics.resolutionTime' }
          }
        }
      ]),
      // Category distribution
      Complaint.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // Priority distribution
      Complaint.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // Daily volume trends
      Complaint.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            resolved: {
              $sum: { $cond: [{ $in: ['$status', ['Resolved', 'Closed']] }, 1, 0] }
            }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // Calculate additional metrics
    const resolutionRate = totalComplaints > 0 ? (resolvedComplaints / totalComplaints * 100) : 0;
    const escalationRate = totalComplaints > 0 ? (escalatedComplaints / totalComplaints * 100) : 0;
    const slaCompliance = totalComplaints > 0 ? ((totalComplaints - overdueComplaints) / totalComplaints * 100) : 100;

    res.json({
      overview: {
        totalComplaints,
        resolvedComplaints,
        escalatedComplaints,
        overdueComplaints,
        resolutionRate: Math.round(resolutionRate * 10) / 10,
        escalationRate: Math.round(escalationRate * 10) / 10,
        slaCompliance: Math.round(slaCompliance * 10) / 10,
        avgResolutionTime: avgResolutionTime[0]?.avgTime || 0
      },
      distributions: {
        byCategory: categoryDistribution,
        byPriority: priorityDistribution
      },
      trends: {
        daily: dailyVolume
      },
      timeRange: days
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch advanced analytics' });
  }
}));

// Agent workload management
router.get('/agents/workload', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  try {
    const agentWorkloads = await User.aggregate([
      { $match: { role: 'agent', isActive: true } },
      {
        $lookup: {
          from: 'complaints',
          let: { agentId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$assignedTo', '$$agentId'] },
                status: { $nin: ['Resolved', 'Closed'] }
              }
            }
          ],
          as: 'activeComplaints'
        }
      },
      {
        $lookup: {
          from: 'complaints',
          let: { agentId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$assignedTo', '$$agentId'] },
                status: { $nin: ['Resolved', 'Closed'] },
                priority: 'Urgent'
              }
            }
          ],
          as: 'urgentComplaints'
        }
      },
      {
        $lookup: {
          from: 'complaints',
          let: { agentId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$assignedTo', '$$agentId'] },
                status: { $nin: ['Resolved', 'Closed'] },
                slaTarget: { $lt: new Date() }
              }
            }
          ],
          as: 'overdueComplaints'
        }
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          email: 1,
          department: 1,
          activeCount: { $size: '$activeComplaints' },
          urgentCount: { $size: '$urgentComplaints' },
          overdueCount: { $size: '$overdueComplaints' },
          workloadScore: {
            $add: [
              { $size: '$activeComplaints' },
              { $multiply: [{ $size: '$urgentComplaints' }, 2] },
              { $multiply: [{ $size: '$overdueComplaints' }, 1.5] }
            ]
          }
        }
      },
      { $sort: { workloadScore: -1 } }
    ]);

    res.json(agentWorkloads);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agent workloads' });
  }
}));

// System health check
router.get('/health', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  try {
    // Check database connectivity and basic metrics
    const dbStats = await Promise.all([
      User.countDocuments(),
      Complaint.countDocuments(),
      Complaint.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } })
    ]);

    const systemHealth = {
      status: 'healthy',
      timestamp: new Date(),
      database: {
        connected: true,
        totalUsers: dbStats[0],
        totalComplaints: dbStats[1],
        complaintsLast24h: dbStats[2]
      },
      performance: {
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      }
    };

    res.json(systemHealth);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date()
    });
  }
}));

// Bulk category/priority management
router.post('/complaints/bulk-update-category', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { oldCategory, newCategory } = req.body;

  if (!oldCategory || !newCategory) {
    return res.status(400).json({ error: 'Both old and new category are required' });
  }

  try {
    const result = await Complaint.updateMany(
      { category: oldCategory },
      { 
        category: newCategory,
        updatedAt: new Date()
      }
    );

    res.json({
      message: `Successfully updated ${result.modifiedCount} complaints`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update categories' });
  }
}));

export default router;
