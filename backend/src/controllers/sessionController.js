// Adding validate-session controller handler to authController.js
export const validateSession = async (req, res) => {
  try {
    // If we got here, it means the auth middleware has already validated the token
    // and attached the user to the request
    if (!req.user) {
      return res.status(401).json({ 
        valid: false,
        message: 'Invalid session' 
      });
    }
    
    // Return session validation success with user info and a unique session ID
    // The session ID helps detect server restarts
    res.json({
      valid: true,
      sessionId: global.SERVER_SESSION_ID || 'session-' + Date.now(),
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        isVerified: req.user.isVerified
      }
    });
  } catch (error) {
    console.error('Session validation error:', error);
    res.status(500).json({ 
      valid: false,
      message: 'Server error during session validation' 
    });
  }
};