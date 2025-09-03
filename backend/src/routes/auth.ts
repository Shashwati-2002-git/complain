import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { asyncHandler } from '../middleware/errorHandler';
import { validateUser, validateLogin } from '../validators/userValidators';

const router = express.Router();

// Register user
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { error } = validateUser(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { firstName, lastName, email, password, role, department } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ error: 'User already exists with this email' });
  }

  // Create new user
  const user = new User({
    firstName,
    lastName,
    email,
    password,
    role: role || 'user',
    department: (role === 'agent' || role === 'admin') ? department : undefined
  });

  await user.save();

  // Generate JWT token
  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET || 'default-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.status(201).json({
    message: 'User registered successfully',
    token,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      department: user.department
    }
  });
}));

// Login user
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { error } = validateLogin(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({ error: 'Account is deactivated' });
  }

  // Validate password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate JWT token
  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET || 'default-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      department: user.department,
      lastLogin: user.lastLogin
    }
  });
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    return res.status(401).json({ error: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key') as { userId: string };
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new token
    const newToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'default-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token: newToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
}));

// Logout (client-side should remove token)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

// Password reset request (placeholder - would need email service)
router.post('/forgot-password', asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if email exists for security
    return res.json({ message: 'If the email exists, a reset link has been sent' });
  }

  // TODO: Implement email service to send reset link
  // For now, just return success message
  res.json({ message: 'If the email exists, a reset link has been sent' });
}));

export default router;
