import express from 'express';
import { Complaint } from '../models/Complaint.js';
import { User } from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Get analytics dashboard data
router.get('/dashboard', authenticate, authorize('admin', 'agent'), asyncHandler(async (req, res) => {
  const { timeRange = '30' } = req.query; // days
  const days = parseInt(timeRange);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    // Total complaints
    const totalComplaints = await Complaint.countDocuments({ createdAt: { $gte: startDate } });

    // Complaints by status
    const complaintsByStatus = await Complaint.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Complaints by category
    const complaintsByCategory = await Complaint.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Complaints by priority
    const complaintsByPriority = await Complaint.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Resolution time statistics
    const resolutionStats = await Complaint.aggregate([
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
          avgResolutionTime: { $avg: '$metrics.resolutionTime' },
          minResolutionTime: { $min: '$metrics.resolutionTime' },
          maxResolutionTime: { $max: '$metrics.resolutionTime' }
        }
      }
    ]);

    // Customer satisfaction
    const satisfactionStats = await Complaint.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate },
          'feedback.rating': { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$feedback.rating' },
          totalFeedback: { $sum: 1 }
        }
      }
    ]);

    // SLA compliance
    const slaBreaches = await Complaint.countDocuments({
      createdAt: { $gte: startDate },
      status: { $nin: ['Resolved', 'Closed'] },
      slaTarget: { $lt: new Date() }
    });

    // Daily complaint trends
    const dailyTrends = await Complaint.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top agents by resolved complaints
    const topAgents = await Complaint.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate },
          status: { $in: ['Resolved', 'Closed'] },
          assignedTo: { $exists: true }
        }
      },
      { $group: { _id: '$assignedTo', resolvedCount: { $sum: 1 } } },
      { $sort: { resolvedCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'agent'
        }
      },
      { $unwind: '$agent' },
      {
        $project: {
          agentName: { $concat: ['$agent.firstName', ' ', '$agent.lastName'] },
          resolvedCount: 1
        }
      }
    ]);

    // Escalation rate
    const escalatedComplaints = await Complaint.countDocuments({
      createdAt: { $gte: startDate },
      isEscalated: true
    });
    const escalationRate = totalComplaints > 0 ? (escalatedComplaints / totalComplaints) * 100 : 0;

    res.json({
      summary: {
        totalComplaints,
        escalationRate: parseFloat(escalationRate.toFixed(2)),
        slaBreaches,
        avgResolutionTime: resolutionStats[0]?.avgResolutionTime || 0,
        avgSatisfaction: satisfactionStats[0]?.avgRating || 0
      },
      charts: {
        complaintsByStatus,
        complaintsByCategory,
        complaintsByPriority,
        dailyTrends,
        topAgents
      },
      timeRange: days
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
}));

// Get team performance metrics
router.get('/team-performance', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { timeRange = '30' } = req.query;
  const days = parseInt(timeRange);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    const teamPerformance = await Complaint.aggregate([
      { $match: { createdAt: { $gte: startDate }, assignedTeam: { $exists: true } } },
      {
        $group: {
          _id: '$assignedTeam',
          totalAssigned: { $sum: 1 },
          resolved: {
            $sum: {
              $cond: [{ $in: ['$status', ['Resolved', 'Closed']] }, 1, 0]
            }
          },
          avgResolutionTime: {
            $avg: {
              $cond: [
                { $and: [
                  { $in: ['$status', ['Resolved', 'Closed']] },
                  { $ne: ['$metrics.resolutionTime', null] }
                ]},
                '$metrics.resolutionTime',
                null
              ]
            }
          },
          escalated: {
            $sum: {
              $cond: ['$isEscalated', 1, 0]
            }
          }
        }
      },
      {
        $project: {
          team: '$_id',
          totalAssigned: 1,
          resolved: 1,
          resolutionRate: {
            $cond: [
              { $eq: ['$totalAssigned', 0] },
              0,
              { $multiply: [{ $divide: ['$resolved', '$totalAssigned'] }, 100] }
            ]
          },
          avgResolutionTime: { $ifNull: ['$avgResolutionTime', 0] },
          escalationRate: {
            $cond: [
              { $eq: ['$totalAssigned', 0] },
              0,
              { $multiply: [{ $divide: ['$escalated', '$totalAssigned'] }, 100] }
            ]
          }
        }
      },
      { $sort: { resolutionRate: -1 } }
    ]);

    res.json(teamPerformance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team performance data' });
  }
}));

// Get complaint trends by category
router.get('/trends/category', authenticate, authorize('admin', 'agent'), asyncHandler(async (req, res) => {
  const { timeRange = '90' } = req.query;
  const days = parseInt(timeRange);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    const trends = await Complaint.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            category: '$category',
            month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.category',
          data: {
            $push: {
              month: '$_id.month',
              count: '$count'
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch category trends' });
  }
}));

// Get SLA compliance report
router.get('/sla-compliance', authenticate, authorize('admin', 'agent'), asyncHandler(async (req, res) => {
  const { timeRange = '30' } = req.query;
  const days = parseInt(timeRange);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    const slaCompliance = await Complaint.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$priority',
          total: { $sum: 1 },
          breached: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $not: { $in: ['$status', ['Resolved', 'Closed']] } },
                    { $lt: ['$slaTarget', new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          },
          compliant: {
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
          }
        }
      },
      {
        $project: {
          priority: '$_id',
          total: 1,
          breached: 1,
          compliant: 1,
          complianceRate: {
            $cond: [
              { $eq: ['$total', 0] },
              0,
              { $multiply: [{ $divide: ['$compliant', '$total'] }, 100] }
            ]
          }
        }
      },
      { $sort: { priority: 1 } }
    ]);

    res.json(slaCompliance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch SLA compliance data' });
  }
}));

export default router;
