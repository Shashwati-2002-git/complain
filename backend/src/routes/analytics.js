import express from "express";
import { Complaint } from "../models/Complaint.js";
import { User } from "../models/User.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Simple async handler utility
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * @route   GET /api/analytics/overview
 * @desc    Get complaint analytics overview
 * @access  Private (Admin/Agent)
 */
router.get("/overview", authenticate, async (req, res) => {
  try {
    const { role, _id: userId } = req.user;
    const match = role === "agent" ? { assignedTo: userId } : {};

    const total = await Complaint.countDocuments(match);
    const resolved = await Complaint.countDocuments({ ...match, status: "Resolved" });
    const escalated = await Complaint.countDocuments({ ...match, status: "Escalated" });
    const overdue = await Complaint.countDocuments({ ...match, isOverdue: true });

    const resolutionRate = total ? ((resolved / total) * 100).toFixed(1) : 0;

    res.json({ total, resolved, escalated, overdue, resolutionRate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching overview" });
  }
});

/**
 * @route   GET /api/analytics/status
 * @desc    Get complaint distribution by status
 * @access  Private (Admin/Agent)
 */
router.get("/status", authenticate, async (req, res) => {
  try {
    const { role, _id: userId } = req.user;
    const match = role === "agent" ? { assignedTo: userId } : {};

    const result = await Complaint.aggregate([
      { $match: match },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching status distribution" });
  }
});

/**
 * @route   GET /api/analytics/category
 * @desc    Get complaint distribution by category
 * @access  Private (Admin/Agent)
 */
router.get("/category", authenticate, async (req, res) => {
  try {
    const { role, _id: userId } = req.user;
    const match = role === "agent" ? { assignedTo: userId } : {};

    const result = await Complaint.aggregate([
      { $match: match },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching category distribution" });
  }
});

/**
 * @route   GET /api/analytics/agent-performance
 * @desc    Get complaint resolution performance by agent
 * @access  Private (Admin only)
 */
router.get("/agent-performance", authenticate, authorize('admin', 'analytics'), async (req, res) => {
  try {
    const result = await Complaint.aggregate([
      {
        $group: {
          _id: "$assignedTo",
          total: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] },
          },
          avgResolutionTime: { $avg: "$resolutionTime" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "agent",
        },
      },
      {
        $unwind: {
          path: "$agent",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          agentName: "$agent.name",
          total: 1,
          resolved: 1,
          avgResolutionTime: 1,
          resolutionRate: {
            $cond: [
              { $eq: ["$total", 0] },
              0,
              { $multiply: [{ $divide: ["$resolved", "$total"] }, 100] },
            ],
          },
        },
      },
      { $sort: { resolutionRate: -1 } },
    ]);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching agent performance" });
  }
});

// Get comprehensive dashboard analytics  
router.get("/dashboard", authenticate, authorize('admin', 'agent', 'analytics'), asyncHandler(async (req, res) => {
  const { timeRange = '30' } = req.query;
  const days = parseInt(timeRange);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    // Role-based filtering
    let matchFilter = { createdAt: { $gte: startDate } };
    if (req.user.role === 'agent') {
      matchFilter.assignedTo = req.user._id;
    }

    // Total complaints
    const totalComplaints = await Complaint.countDocuments(matchFilter);
    
    // Resolved complaints
    const resolvedComplaints = await Complaint.countDocuments({
      ...matchFilter,
      status: 'Resolved'
    });
    
    // Open complaints
    const openComplaints = await Complaint.countDocuments({
      ...matchFilter,
      status: { $in: ['New', 'Open', 'In Progress'] }
    });
    
    // High priority complaints
    const highPriorityComplaints = await Complaint.countDocuments({
      ...matchFilter,
      priority: 'High'
    });
    
    // In progress complaints
    const inProgressComplaints = await Complaint.countDocuments({
      ...matchFilter,
      status: 'In Progress'
    });
    
    // New today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const newTodayComplaints = await Complaint.countDocuments({
      ...matchFilter,
      createdAt: { $gte: todayStart }
    });
    
    // Reopened complaints
    const reopenedComplaints = await Complaint.countDocuments({
      ...matchFilter,
      reopened: true
    });
    
    // Calculate trend
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - days);
    const previousPeriodComplaints = await Complaint.countDocuments({
      createdAt: { $gte: previousPeriodStart, $lt: startDate }
    });
    
    let trend = '0%';
    if (previousPeriodComplaints > 0) {
      const trendPercentage = ((totalComplaints - previousPeriodComplaints) / previousPeriodComplaints) * 100;
      trend = `${trendPercentage > 0 ? '+' : ''}${trendPercentage.toFixed(1)}%`;
    }
    
    // Average resolution time
    const resolvedComplaints2 = await Complaint.find({
      ...matchFilter,
      status: 'Resolved',
      resolvedAt: { $exists: true },
      createdAt: { $exists: true }
    });
    
    let avgResolutionTime = '0 days';
    if (resolvedComplaints2.length > 0) {
      const totalResolutionTimeMs = resolvedComplaints2.reduce((total, complaint) => {
        const resolutionTimeMs = new Date(complaint.resolvedAt) - new Date(complaint.createdAt);
        return total + resolutionTimeMs;
      }, 0);
      
      const avgResolutionTimeDays = totalResolutionTimeMs / (resolvedComplaints2.length * 24 * 60 * 60 * 1000);
      avgResolutionTime = `${avgResolutionTimeDays.toFixed(1)} days`;
    }
    
    // Return the data
    res.json({
      totalComplaints,
      resolvedComplaints,
      openComplaints,
      highPriorityComplaints,
      inProgressComplaints,
      newTodayComplaints,
      reopenedComplaints,
      trend,
      avgResolutionTime
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      message: 'Error fetching dashboard analytics',
      error: err.message
    });
  }
}));

// Get comprehensive dashboard analytics (detailed version)
router.get("/dashboard-complete", authenticate, authorize('admin', 'agent', 'analytics'), asyncHandler(async (req, res) => {
  const { timeRange = '30' } = req.query;
  const days = parseInt(timeRange);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    // Role-based filtering
    let matchFilter = { createdAt: { $gte: startDate } };
    if (req.user.role === 'agent') {
      matchFilter.assignedTo = req.user._id;
    }

    const [
      overview,
      slaMetrics,
      categoryPerformance,
      agentSummary,
      trendData
    ] = await Promise.all([
      // Basic overview
      Complaint.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            resolved: { $sum: { $cond: [{ $in: ['$status', ['Resolved', 'Closed']] }, 1, 0] } },
            escalated: { $sum: { $cond: ['$isEscalated', 1, 0] } },
            overdue: { 
              $sum: { 
                $cond: [
                  { 
                    $and: [
                      { $nin: ['$status', ['Resolved', 'Closed']] },
                      { $lt: ['$slaTarget', new Date()] }
                    ]
                  }, 
                  1, 
                  0
                ] 
              } 
            }
          }
        }
      ]),
      // SLA compliance metrics
      Complaint.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: '$priority',
            total: { $sum: 1 },
            onTime: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $in: ['$status', ['Resolved', 'Closed']] },
                      { $gte: ['$slaTarget', new Date()] }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            avgResolutionTime: { $avg: '$metrics.resolutionTime' }
          }
        },
        {
          $project: {
            priority: '$_id',
            total: 1,
            onTime: 1,
            compliance: { $multiply: [{ $divide: ['$onTime', '$total'] }, 100] },
            avgResolutionTime: 1
          }
        }
      ]),
      // Category performance
      Complaint.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            resolved: { $sum: { $cond: [{ $in: ['$status', ['Resolved', 'Closed']] }, 1, 0] } },
            avgSatisfaction: { $avg: '$feedback.rating' },
            avgResolutionTime: { $avg: '$metrics.resolutionTime' }
          }
        },
        {
          $project: {
            category: '$_id',
            count: 1,
            resolved: 1,
            resolutionRate: { $multiply: [{ $divide: ['$resolved', '$count'] }, 100] },
            avgSatisfaction: { $round: ['$avgSatisfaction', 1] },
            avgResolutionTime: { $round: ['$avgResolutionTime', 2] }
          }
        },
        { $sort: { count: -1 } }
      ]),
      // Agent performance summary (admin and analytics only)
      (req.user.role === 'admin' || req.user.role === 'analytics') ? User.aggregate([
        { $match: { role: 'agent', isActive: true } },
        {
          $lookup: {
            from: 'complaints',
            let: { agentId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$assignedTo', '$$agentId'] },
                  createdAt: { $gte: startDate }
                }
              }
            ],
            as: 'assignedComplaints'
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
                  status: { $in: ['Resolved', 'Closed'] },
                  createdAt: { $gte: startDate }
                }
              }
            ],
            as: 'resolvedComplaints'
          }
        },
        {
          $project: {
            name: { $concat: ['$firstName', ' ', '$lastName'] },
            totalAssigned: { $size: '$assignedComplaints' },
            totalResolved: { $size: '$resolvedComplaints' },
            resolutionRate: {
              $cond: [
                { $eq: [{ $size: '$assignedComplaints' }, 0] },
                0,
                { $multiply: [{ $divide: [{ $size: '$resolvedComplaints' }, { $size: '$assignedComplaints' }] }, 100] }
              ]
            }
          }
        },
        { $sort: { resolutionRate: -1 } },
        { $limit: 10 }
      ]) : Promise.resolve([]),
      // Trend data - weekly
      Complaint.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: { 
              week: { $isoWeek: '$createdAt' },
              year: { $isoWeekYear: '$createdAt' }
            },
            total: { $sum: 1 },
            resolved: { $sum: { $cond: [{ $in: ['$status', ['Resolved', 'Closed']] }, 1, 0] } }
          }
        },
        { $sort: { '_id.year': 1, '_id.week': 1 } }
      ])
    ]);

    const overviewData = overview[0] || { total: 0, resolved: 0, escalated: 0, overdue: 0 };
    const resolutionRate = overviewData.total > 0 ? (overviewData.resolved / overviewData.total * 100) : 0;
    const slaCompliance = overviewData.total > 0 ? ((overviewData.total - overviewData.overdue) / overviewData.total * 100) : 100;

    res.json({
      success: true,
      data: {
        overview: {
          ...overviewData,
          resolutionRate: Math.round(resolutionRate * 10) / 10,
          slaCompliance: Math.round(slaCompliance * 10) / 10
        },
        slaMetrics,
        categoryPerformance,
        agentSummary: (req.user.role === 'admin' || req.user.role === 'analytics') ? agentSummary : [],
        trends: trendData,
        timeRange: days
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard analytics',
      error: error.message
    });
  }
}));

// Export analytics data
router.post('/export-report', authenticate, authorize('admin', 'analytics'), asyncHandler(async (req, res) => {
  const { reportType, format = 'json', timeRange = '30', filters = {} } = req.body;

  const days = parseInt(timeRange);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    let data;
    let filename;

    switch (reportType) {
      case 'complaints':
        data = await Complaint.find({ 
          createdAt: { $gte: startDate },
          ...filters 
        }).populate('userId', 'firstName lastName email').lean();
        filename = `complaints-report-${Date.now()}`;
        break;
      
      case 'agents':
        data = await User.aggregate([
          { $match: { role: 'agent', isActive: true } },
          {
            $lookup: {
              from: 'complaints',
              let: { agentId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$assignedTo', '$$agentId'] },
                    createdAt: { $gte: startDate }
                  }
                }
              ],
              as: 'assignedComplaints'
            }
          },
          {
            $project: {
              name: { $concat: ['$firstName', ' ', '$lastName'] },
              email: 1,
              department: 1,
              totalAssigned: { $size: '$assignedComplaints' }
            }
          }
        ]);
        filename = `agent-performance-${Date.now()}`;
        break;
      
      case 'analytics':
        // Comprehensive analytics export
        const [complaints, users, categories] = await Promise.all([
          Complaint.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ]),
          User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
          ]),
          Complaint.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: '$category', count: { $sum: 1 } } }
          ])
        ]);
        
        data = {
          generatedAt: new Date(),
          timeRange: days,
          summary: {
            complaintsByStatus: complaints,
            usersByRole: users,
            complaintsByCategory: categories
          }
        };
        filename = `analytics-summary-${Date.now()}`;
        break;
      
      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    // Set appropriate headers for file download
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.json`);
      res.json(data);
    } else {
      // For CSV format (simplified - in production you'd use a proper CSV library)
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
      res.send('CSV export functionality would be implemented here');
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating report',
      error: error.message
    });
  }
}));

/**
 * @route   GET /api/analytics/team-performance
 * @desc    Get team performance metrics
 * @access  Private (Admin/Manager)
 */
router.get("/team-performance", authenticate, authorize('admin', 'manager', 'analytics'), asyncHandler(async (req, res) => {
  const { timeRange = '30' } = req.query;
  const days = parseInt(timeRange);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  try {
    // Get all agents
    const agents = await User.find({ role: 'agent' }).select('_id firstName lastName');
    
    // Prepare the result array
    const performanceData = await Promise.all(agents.map(async (agent) => {
      // Total resolved complaints
      const totalResolved = await Complaint.countDocuments({
        assignedTo: agent._id,
        status: 'Resolved',
        resolvedAt: { $exists: true, $gte: startDate }
      });
      
      // Resolved today
      const resolvedToday = await Complaint.countDocuments({
        assignedTo: agent._id,
        status: 'Resolved',
        resolvedAt: { $exists: true, $gte: todayStart }
      });
      
      // Average resolution time
      const resolvedComplaints = await Complaint.find({
        assignedTo: agent._id,
        status: 'Resolved',
        resolvedAt: { $exists: true },
        createdAt: { $exists: true, $gte: startDate }
      });
      
      let avgResolutionTime = '0 days';
      if (resolvedComplaints.length > 0) {
        const totalResolutionTimeMs = resolvedComplaints.reduce((total, complaint) => {
          const resolutionTimeMs = new Date(complaint.resolvedAt) - new Date(complaint.createdAt);
          return total + resolutionTimeMs;
        }, 0);
        
        const avgResolutionTimeDays = totalResolutionTimeMs / (resolvedComplaints.length * 24 * 60 * 60 * 1000);
        avgResolutionTime = `${avgResolutionTimeDays.toFixed(1)} days`;
      }
      
      // Satisfaction score
      const complaintsWithFeedback = await Complaint.find({
        assignedTo: agent._id,
        'feedback.rating': { $exists: true },
        updatedAt: { $gte: startDate }
      });
      
      let satisfactionScore = 0;
      if (complaintsWithFeedback.length > 0) {
        const totalScore = complaintsWithFeedback.reduce((total, complaint) => {
          return total + (complaint.feedback?.rating || 0);
        }, 0);
        
        satisfactionScore = Math.round((totalScore / complaintsWithFeedback.length) * 20); // Convert 1-5 to percentage
      }
      
      return {
        agentId: agent._id,
        agentName: `${agent.firstName} ${agent.lastName}`,
        resolvedToday,
        totalResolved,
        avgResolutionTime,
        satisfactionScore
      };
    }));
    
    res.json(performanceData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching team performance", error: err.message });
  }
}));

export default router;
