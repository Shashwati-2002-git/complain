import express from 'express';
import { Complaint } from '../models/Complaint.js';
import { User } from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateComplaint, validateComplaintUpdate } from '../validators/complaintValidators.js';
import { AIService } from '../services/aiService.js';

const router = express.Router();
const aiService = new AIService();

// Get all complaints (with filters)
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const {
    status,
    category,
    priority,
    assignedTo,
    userId,
    isEscalated,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter object
  const filter = {};

  // Regular users can only see their own complaints
  if (req.user.role === 'user') {
    filter.userId = req.user._id;
  } else if (userId && (req.user.role === 'admin' || req.user.role === 'agent')) {
    filter.userId = userId;
  }

  // Agents can see complaints assigned to them or their department
  if (req.user.role === 'agent') {
    filter.$or = [
      { assignedTo: req.user._id },
      { assignedTeam: req.user.department }
    ];
  }

  if (status) filter.status = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (isEscalated !== undefined) filter.isEscalated = isEscalated === 'true';

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const complaints = await Complaint.find(filter)
    .populate('userId', 'firstName lastName email')
    .populate('assignedTo', 'firstName lastName email')
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

// Get complaint by ID
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('userId', 'firstName lastName email profile')
    .populate('assignedTo', 'firstName lastName email department')
    .populate('updates.authorId', 'firstName lastName email');

  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  // Check permissions
  if (req.user.role === 'user' && complaint.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json(complaint);
}));

// Create new complaint
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { error } = validateComplaint(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { title, description, category, attachments } = req.body;

  // Use AI service to analyze the complaint
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

  const complaint = new Complaint({
    userId: req.user._id,
    title,
    description,
    category: category || aiAnalysis.category,
    priority: aiAnalysis.priority,
    sentiment: aiAnalysis.sentiment,
    slaTarget,
    attachments: attachments || [],
    aiAnalysis: {
      confidence: aiAnalysis.confidence,
      suggestedCategory: aiAnalysis.category,
      suggestedPriority: aiAnalysis.priority,
      keywords: aiAnalysis.keywords || [],
      processedAt: new Date()
    },
    updates: [{
      message: 'Complaint has been created and classified automatically.',
      author: 'System',
      authorId: req.user._id,
      timestamp: new Date(),
      type: 'status_change',
      isInternal: false
    }]
  });

  await complaint.save();
  res.status(201).json(complaint);
}));

// Update complaint status
router.patch('/:id/status', authenticate, authorize('agent', 'admin'), asyncHandler(async (req, res) => {
  const { status, message } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  // Check if agent can update this complaint
  if (req.user.role === 'agent' && 
      complaint.assignedTo?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'You can only update complaints assigned to you' });
  }

  const oldStatus = complaint.status;
  complaint.status = status;
  complaint.updatedAt = new Date();

  // Add update record
  const updateRecord = {
    message: message || `Status changed from ${oldStatus} to ${status}`,
    author: `${req.user.firstName} ${req.user.lastName}`,
    authorId: req.user._id,
    timestamp: new Date(),
    type: 'status_change',
    isInternal: false
  };
  complaint.updates.push(updateRecord);

  // Calculate resolution time if resolved
  if (status === 'Resolved' && !complaint.metrics.resolutionTime) {
    complaint.metrics.resolutionTime = 
      (new Date().getTime() - complaint.createdAt.getTime()) / (1000 * 60 * 60); // hours
  }

  await complaint.save();

  // Emit socket event for real-time updates
  const io = req.app.get('io');
  io.emit('complaintUpdated', {
    complaintId: complaint._id,
    status: complaint.status,
    updatedBy: req.user._id
  });

  res.json(complaint);
}));

// Assign complaint to agent
router.patch('/:id/assign', authenticate, authorize('admin', 'agent'), asyncHandler(async (req, res) => {
  const { agentId } = req.body;

  if (!agentId) {
    return res.status(400).json({ error: 'Agent ID is required' });
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  complaint.assignedTo = agentId;
  complaint.status = 'In Progress';
  complaint.updatedAt = new Date();

  // Add update record
  complaint.updates.push({
    message: `Complaint assigned to agent`,
    author: `${req.user.firstName} ${req.user.lastName}`,
    authorId: req.user._id,
    timestamp: new Date(),
    type: 'assignment',
    isInternal: false
  });

  await complaint.save();

  // Emit socket event
  const io = req.app.get('io');
  io.emit('complaintAssigned', {
    complaintId: complaint._id,
    assignedTo: agentId,
    assignedBy: req.user._id
  });

  res.json(complaint);
}));

// Add comment/update to complaint
router.post('/:id/updates', authenticate, asyncHandler(async (req, res) => {
  const { error } = validateComplaintUpdate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { message, type = 'comment', isInternal = false, attachments } = req.body;

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  // Check permissions
  if (req.user.role === 'user' && complaint.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Access denied' });
  }

  complaint.updates.push({
    message,
    author: `${req.user.firstName} ${req.user.lastName}`,
    authorId: req.user._id,
    timestamp: new Date(),
    type,
    isInternal,
    attachments: attachments || []
  });

  complaint.updatedAt = new Date();
  await complaint.save();

  // Emit socket event
  const io = req.app.get('io');
  io.emit('complaintCommentAdded', {
    complaintId: complaint._id,
    update: complaint.updates[complaint.updates.length - 1],
    addedBy: req.user._id
  });

  res.json(complaint);
}));

// Escalate complaint
router.patch('/:id/escalate', authenticate, authorize('agent', 'admin'), asyncHandler(async (req, res) => {
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ error: 'Escalation reason is required' });
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  complaint.isEscalated = true;
  complaint.escalationReason = reason;
  complaint.escalatedAt = new Date();
  complaint.status = 'Escalated';
  complaint.updatedAt = new Date();

  // Add update record
  complaint.updates.push({
    message: `Complaint escalated: ${reason}`,
    author: `${req.user.firstName} ${req.user.lastName}`,
    authorId: req.user._id,
    timestamp: new Date(),
    type: 'escalation',
    isInternal: false
  });

  await complaint.save();

  // Emit socket event
  const io = req.app.get('io');
  io.emit('complaintEscalated', {
    complaintId: complaint._id,
    reason,
    escalatedBy: req.user._id
  });

  res.json(complaint);
}));

// Submit feedback
router.post('/:id/feedback', authenticate, asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  // Only the complaint owner can submit feedback
  if (complaint.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Only the complaint owner can submit feedback' });
  }

  // Can only submit feedback for resolved/closed complaints
  if (!['Resolved', 'Closed'].includes(complaint.status)) {
    return res.status(400).json({ error: 'Feedback can only be submitted for resolved or closed complaints' });
  }

  complaint.feedback = {
    rating,
    comment: comment || '',
    submittedAt: new Date(),
    submittedBy: req.user._id
  };

  complaint.metrics.customerSatisfaction = rating;
  complaint.updatedAt = new Date();

  await complaint.save();

  res.json({ message: 'Feedback submitted successfully', feedback: complaint.feedback });
}));

// Bulk operations for admin dashboard
router.patch('/bulk/assign', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { complaintIds, assignedTo, assignedTeam } = req.body;

  if (!complaintIds || !Array.isArray(complaintIds) || complaintIds.length === 0) {
    return res.status(400).json({ error: 'Please provide complaint IDs' });
  }

  const updateData = { updatedAt: new Date() };
  if (assignedTo) updateData.assignedTo = assignedTo;
  if (assignedTeam) updateData.assignedTeam = assignedTeam;

  const result = await Complaint.updateMany(
    { _id: { $in: complaintIds } },
    updateData
  );

  // Add updates to each complaint
  await Promise.all(complaintIds.map(async (id) => {
    await Complaint.findByIdAndUpdate(id, {
      $push: {
        updates: {
          message: `Complaint bulk assigned to ${assignedTo ? 'agent' : 'team'}`,
          author: `${req.user.firstName} ${req.user.lastName}`,
          authorId: req.user._id,
          timestamp: new Date(),
          type: 'assignment',
          isInternal: false
        }
      }
    });
  }));

  res.json({ 
    message: `${result.modifiedCount} complaints updated successfully`,
    modifiedCount: result.modifiedCount 
  });
}));

// Bulk status update
router.patch('/bulk/status', authenticate, authorize('admin', 'agent'), asyncHandler(async (req, res) => {
  const { complaintIds, status, message } = req.body;

  if (!complaintIds || !Array.isArray(complaintIds) || complaintIds.length === 0) {
    return res.status(400).json({ error: 'Please provide complaint IDs' });
  }

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const result = await Complaint.updateMany(
    { _id: { $in: complaintIds } },
    { 
      status, 
      updatedAt: new Date(),
      ...(status === 'Resolved' && { resolvedAt: new Date() })
    }
  );

  // Add updates to each complaint
  await Promise.all(complaintIds.map(async (id) => {
    await Complaint.findByIdAndUpdate(id, {
      $push: {
        updates: {
          message: message || `Status updated to ${status}`,
          author: `${req.user.firstName} ${req.user.lastName}`,
          authorId: req.user._id,
          timestamp: new Date(),
          type: 'status_change',
          isInternal: false
        }
      }
    });
  }));

  res.json({ 
    message: `${result.modifiedCount} complaints updated successfully`,
    modifiedCount: result.modifiedCount 
  });
}));

// AI-assisted auto-assignment
router.post('/auto-assign', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { complaintId, teamId } = req.body;

  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  // Simple auto-assignment logic based on workload
  const agents = await User.find({ 
    role: 'agent', 
    ...(teamId && { department: teamId }),
    isActive: true 
  });

  if (agents.length === 0) {
    return res.status(400).json({ error: 'No available agents found' });
  }

  // Get current workload for each agent
  const workloads = await Promise.all(agents.map(async (agent) => {
    const activeComplaints = await Complaint.countDocuments({
      assignedTo: agent._id,
      status: { $in: ['Open', 'In Progress'] }
    });
    return { agent, workload: activeComplaints };
  }));

  // Find agent with lowest workload
  const leastBusyAgent = workloads.reduce((min, current) => 
    current.workload < min.workload ? current : min
  );

  // Assign complaint to least busy agent
  complaint.assignedTo = leastBusyAgent.agent._id;
  complaint.assignedTeam = leastBusyAgent.agent.department;
  complaint.updatedAt = new Date();
  complaint.updates.push({
    message: `Auto-assigned to ${leastBusyAgent.agent.firstName} ${leastBusyAgent.agent.lastName}`,
    author: 'AI System',
    authorId: req.user._id,
    timestamp: new Date(),
    type: 'assignment',
    isInternal: false
  });

  await complaint.save();

  res.json({ 
    message: 'Complaint auto-assigned successfully',
    assignedTo: {
      id: leastBusyAgent.agent._id,
      name: `${leastBusyAgent.agent.firstName} ${leastBusyAgent.agent.lastName}`,
      workload: leastBusyAgent.workload
    }
  });
}));

// Add internal notes (for agents and admins)
router.post('/:id/internal-notes', authenticate, authorize('agent', 'admin'), asyncHandler(async (req, res) => {
  const { note } = req.body;

  if (!note || note.trim().length === 0) {
    return res.status(400).json({ error: 'Note content is required' });
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  // Check if agent is assigned to this complaint or is admin
  if (req.user.role === 'agent' && complaint.assignedTo?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'You can only add notes to complaints assigned to you' });
  }

  const internalNote = {
    message: note,
    author: `${req.user.firstName} ${req.user.lastName}`,
    authorId: req.user._id,
    timestamp: new Date(),
    type: 'internal_note',
    isInternal: true
  };

  complaint.updates.push(internalNote);
  complaint.updatedAt = new Date();
  await complaint.save();

  res.json({ 
    message: 'Internal note added successfully',
    note: internalNote
  });
}));

// Get internal notes for a complaint
router.get('/:id/internal-notes', authenticate, authorize('agent', 'admin'), asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  // Check if agent is assigned to this complaint or is admin
  if (req.user.role === 'agent' && complaint.assignedTo?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'You can only view notes for complaints assigned to you' });
  }

  const internalNotes = complaint.updates.filter(update => update.isInternal === true);

  res.json({ internalNotes });
}));

// Escalate complaint
router.patch('/:id/escalate', authenticate, authorize('agent', 'admin'), asyncHandler(async (req, res) => {
  const { reason, escalatedTo } = req.body;

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  complaint.isEscalated = true;
  complaint.escalation = {
    reason: reason || 'Manual escalation',
    escalatedBy: req.user._id,
    escalatedAt: new Date(),
    escalatedTo: escalatedTo || null
  };
  complaint.priority = 'Urgent'; // Auto-upgrade priority
  complaint.updatedAt = new Date();
  complaint.updates.push({
    message: `Complaint escalated: ${reason || 'Manual escalation'}`,
    author: `${req.user.firstName} ${req.user.lastName}`,
    authorId: req.user._id,
    timestamp: new Date(),
    type: 'escalation',
    isInternal: false
  });

  await complaint.save();

  res.json({ 
    message: 'Complaint escalated successfully',
    escalation: complaint.escalation
  });
}));

// Get dashboard statistics for current user
router.get('/stats/dashboard', authenticate, asyncHandler(async (req, res) => {
  let matchFilter = {};

  // Role-based filtering
  if (req.user.role === 'user') {
    matchFilter.userId = req.user._id;
  } else if (req.user.role === 'agent') {
    matchFilter.assignedTo = req.user._id;
  }
  // Admin sees all complaints

  const [
    totalComplaints,
    openComplaints,
    inProgressComplaints,
    resolvedComplaints,
    escalatedComplaints,
    overdueComplaints
  ] = await Promise.all([
    Complaint.countDocuments(matchFilter),
    Complaint.countDocuments({ ...matchFilter, status: 'Open' }),
    Complaint.countDocuments({ ...matchFilter, status: 'In Progress' }),
    Complaint.countDocuments({ ...matchFilter, status: 'Resolved' }),
    Complaint.countDocuments({ ...matchFilter, isEscalated: true }),
    Complaint.countDocuments({ 
      ...matchFilter, 
      status: { $nin: ['Resolved', 'Closed'] },
      slaTarget: { $lt: new Date() }
    })
  ]);

  const resolutionRate = totalComplaints > 0 ? ((resolvedComplaints / totalComplaints) * 100).toFixed(1) : 0;

  res.json({
    totalComplaints,
    openComplaints,
    inProgressComplaints,
    resolvedComplaints,
    escalatedComplaints,
    overdueComplaints,
    resolutionRate: parseFloat(resolutionRate)
  });
}));

export default router;
