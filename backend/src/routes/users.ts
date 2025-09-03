import express from 'express';
import { User } from '../models/User';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateUserUpdate, validatePasswordChange } from '../validators/userValidators';

const router = express.Router();

// Get current user profile
router.get('/profile', authenticate, asyncHandler(async (req: any, res: any) => {
  res.json(req.user);
}));

// Update user profile
router.patch('/profile', authenticate, asyncHandler(async (req: any, res: any) => {
  const { error } = validateUserUpdate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const allowedUpdates = ['firstName', 'lastName', 'profile', 'preferences'];
  const updates = Object.keys(req.body);
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({ error: 'Invalid updates' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    updates.forEach(update => {
      if (update === 'profile' || update === 'preferences') {
        user[update] = { ...user[update], ...req.body[update] };
      } else {
        (user as any)[update] = req.body[update];
      }
    });

    await user.save();
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

// Change password
router.patch('/password', authenticate, asyncHandler(async (req: any, res: any) => {
  const { error } = validatePasswordChange(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: 'Password updated successfully' });
}));

// Get all users (admin only)
router.get('/', authenticate, authorize('admin'), asyncHandler(async (req: any, res: any) => {
  const {
    role,
    department,
    isActive,
    page = 1,
    limit = 10,
    search
  } = req.query;

  // Build filter object
  const filter: any = {};
  if (role) filter.role = role;
  if (department) filter.department = department;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  // Add search functionality
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const users = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 })
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

// Get user by ID (admin only)
router.get('/:id', authenticate, authorize('admin'), asyncHandler(async (req: any, res: any) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
}));

// Update user (admin only)
router.patch('/:id', authenticate, authorize('admin'), asyncHandler(async (req: any, res: any) => {
  const { error } = validateUserUpdate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const allowedUpdates = ['firstName', 'lastName', 'email', 'role', 'department', 'isActive', 'profile', 'preferences'];
  const updates = Object.keys(req.body);
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({ error: 'Invalid updates' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    updates.forEach(update => {
      if (update === 'profile' || update === 'preferences') {
        user[update] = { ...user[update], ...req.body[update] };
      } else {
        (user as any)[update] = req.body[update];
      }
    });

    await user.save();
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

// Delete user (admin only)
router.delete('/:id', authenticate, authorize('admin'), asyncHandler(async (req: any, res: any) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Don't allow deletion of the last admin
  if (user.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last admin user' });
    }
  }

  // Soft delete by setting isActive to false
  user.isActive = false;
  await user.save();

  res.json({ message: 'User deactivated successfully' });
}));

// Get agents by department (admin only)
router.get('/agents/:department', authenticate, authorize('admin', 'agent'), asyncHandler(async (req: any, res: any) => {
  const { department } = req.params;
  
  const agents = await User.find({
    role: 'agent',
    department,
    isActive: true
  }).select('firstName lastName email department');

  res.json(agents);
}));

export default router;
