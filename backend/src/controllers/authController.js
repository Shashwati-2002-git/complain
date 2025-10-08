import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import fetch from "node-fetch";
import { sendOtpEmail, generateOTP } from "../services/emailService.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Generate Refresh Token (longer expiration)
const generateRefreshToken = (id) => {
  return jwt.sign({ id, tokenType: 'refresh' }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// Simple validation helper
const validateSignup = (name, email, password) => {
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long");
  }

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    errors.push("Please provide a valid email");
  }

  if (!password || password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  return errors;
};

// Signup with OTP verification
export const registerUser = async (req, res) => {
  const { name, email, password, role = "user" } = req.body;
  
  console.log("Registration request received:", { name, email, role });

  try {
    // Validate input
    if (!name || !email || !password) {
      console.log("Missing required fields");
      return res.status(400).json({
        message: "Missing required fields: name, email, and password are all required",
      });
    }
    
    const validationErrors = validateSignup(name, email, password);
    if (validationErrors.length > 0) {
      console.log("Validation errors:", validationErrors);
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    // Validate role
    if (role && !["user", "admin", "agent", "analytics"].includes(role)) {
      console.log("Invalid role:", role);
      return res.status(400).json({
        message: "Invalid role. Must be 'user', 'admin', 'agent', or 'analytics'",
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    console.log(`Attempting to create user with role: ${role}`);
    
    // Special check for admin role to enforce additional security
    if (role === "admin") {
      // For development purposes, allow admin creation
      // In production, you might want to restrict this or require additional verification
      console.log("Creating admin account - special permissions granted for development");
    }
    
    // Generate OTP for verification
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      otp,
      otpExpiry,
      isVerified: false
    });

    // Send OTP via email
    try {
      await sendOtpEmail(user.email, user.name, otp);
      console.log("OTP email sent to user");
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      // We continue even if email fails, but log the error
    }

    console.log("User registered (unverified):", {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully. Please verify your email with the OTP sent to your inbox.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: false
      },
      requiresVerification: true,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// Login
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user && (await user.matchPassword(password))) {
      // Check if user is verified (except for OAuth users who are pre-verified)
      if (!user.isVerified && !user.isGoogleUser && !user.isFacebookUser) {
        // Generate new OTP for unverified users
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();
        
        // Send new OTP
        await sendOtpEmail(user.email, user.name, otp);
        
        return res.status(401).json({
          message: "Account not verified. A new verification OTP has been sent to your email.",
          requiresVerification: true,
          userId: user._id
        });
      }
      
      console.log("User logged in successfully:", {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });

      // Generate both access and refresh tokens
      const accessToken = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);
      
      res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name || `${user.firstName} ${user.lastName}`,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
        token: accessToken,
        refreshToken: refreshToken,
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// Google Login
export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Google token is required" });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error("GOOGLE_CLIENT_ID environment variable is not set");
      return res.status(500).json({ message: "Server configuration error" });
    }

    // Verify token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ message: "Invalid Google token" });
    }

    const { name, email, email_verified } = payload;

    if (!email_verified) {
      return res.status(400).json({ message: "Email not verified with Google" });
    }

    if (!email || !name) {
      return res.status(400).json({ message: "Required user information not available from Google" });
    }

    let user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      // Create user if not exists
      user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: Math.random().toString(36).slice(-8), // dummy password
        role: "user",
        isGoogleUser: true, // Mark as Google user
      });
      
      console.log("New Google user created:", {
        id: user._id,
        name: user.name,
        email: user.email,
      });
    } else {
      console.log("Existing Google user logged in:", {
        id: user._id,
        name: user.name,
        email: user.email,
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Google login error:", error);
    
    // More specific error messages
    if (error.message && error.message.includes('Token used too early')) {
      return res.status(400).json({ message: "Invalid token timing. Please try again." });
    }
    
    if (error.message && error.message.includes('Invalid token signature')) {
      return res.status(400).json({ message: "Invalid Google token. Please try again." });
    }
    
    if (error.message && error.message.includes('Token expired')) {
      return res.status(400).json({ message: "Google token expired. Please try again." });
    }

    res.status(500).json({ 
      message: "Server error during Google login",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Decode Google token without creating user
export const decodeGoogleToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Google token is required" });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error("GOOGLE_CLIENT_ID environment variable is not set");
      return res.status(500).json({ message: "Server configuration error" });
    }

    // Verify token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ message: "Invalid Google token" });
    }

    const { name, email, email_verified } = payload;

    if (!email_verified) {
      return res.status(400).json({ message: "Email not verified with Google" });
    }

    if (!email || !name) {
      return res.status(400).json({ message: "Required user information not available from Google" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });

    res.json({
      success: true,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      userExists: !!existingUser,
    });
  } catch (error) {
    console.error("Google token decode error:", error);
    
    if (error.message && error.message.includes('Token used too early')) {
      return res.status(400).json({ message: "Invalid token timing. Please try again." });
    }
    
    if (error.message && error.message.includes('Invalid token signature')) {
      return res.status(400).json({ message: "Invalid Google token. Please try again." });
    }
    
    if (error.message && error.message.includes('Token expired')) {
      return res.status(400).json({ message: "Google token expired. Please try again." });
    }

    res.status(500).json({ 
      message: "Server error during Google token decode",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Google signup with role selection
export const googleSignupWithRole = async (req, res) => {
  try {
    const { token, role = "user" } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Google token is required" });
    }

    // Validate role
    if (!["user", "admin", "agent", "analytics"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Must be 'user', 'admin', 'agent', or 'analytics'",
      });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error("GOOGLE_CLIENT_ID environment variable is not set");
      return res.status(500).json({ message: "Server configuration error" });
    }

    // Verify token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ message: "Invalid Google token" });
    }

    const { name, email, email_verified } = payload;

    if (!email_verified) {
      return res.status(400).json({ message: "Email not verified with Google" });
    }

    if (!email || !name) {
      return res.status(400).json({ message: "Required user information not available from Google" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (existingUser) {
      return res.status(409).json({ 
        message: "User already exists. Please use regular Google login instead." 
      });
    }

    // Create new user with selected role
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: Math.random().toString(36).slice(-8), // dummy password
      role: role,
      isGoogleUser: true,
    });
    
    console.log("New Google user created with role:", {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Google signup error:", error);
    
    if (error.message && error.message.includes('Token used too early')) {
      return res.status(400).json({ message: "Invalid token timing. Please try again." });
    }
    
    if (error.message && error.message.includes('Invalid token signature')) {
      return res.status(400).json({ message: "Invalid Google token. Please try again." });
    }
    
    if (error.message && error.message.includes('Token expired')) {
      return res.status(400).json({ message: "Google token expired. Please try again." });
    }

    if (error.code === 11000) {
      return res.status(409).json({ message: "User with this email already exists" });
    }

    res.status(500).json({ 
      message: "Server error during Google signup",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Facebook Login
export const facebookLogin = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Facebook authorization code is required" });
    }

    if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
      console.error("Facebook OAuth environment variables are not set");
      return res.status(500).json({ message: "Server configuration error" });
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
  client_id: process.env.FACEBOOK_APP_ID,
  client_secret: process.env.FACEBOOK_APP_SECRET,
  redirect_uri: 'http://localhost:5000/auth/facebook/callback',
  code: code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return res.status(400).json({ 
        message: "Facebook authentication failed", 
        error: tokenData.error.message 
      });
    }

    // Get user information
    const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${tokenData.access_token}&fields=id,name,email`);
    const facebookUser = await userResponse.json();

    if (facebookUser.error) {
      return res.status(400).json({ 
        message: "Failed to get user information from Facebook", 
        error: facebookUser.error.message 
      });
    }

    const { name, email, id } = facebookUser;

    if (!email) {
      return res.status(400).json({ 
        message: "Email not available from Facebook account" 
      });
    }

    let user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      // Create user if not exists
      user = await User.create({
        name: name,
        email: email.toLowerCase().trim(),
        password: Math.random().toString(36).slice(-8), // dummy password
        role: "user",
        isFacebookUser: true, // Mark as Facebook user
        facebookId: id,
      });
      
      console.log("New Facebook user created:", {
        id: user._id,
        name: user.name,
        email: user.email,
        facebookId: id,
      });
    } else {
      // Update Facebook info if user exists
      if (!user.facebookId) {
        user.facebookId = id;
        user.isFacebookUser = true;
        await user.save();
      }
      
      console.log("Existing Facebook user logged in:", {
        id: user._id,
        name: user.name,
        email: user.email,
        facebookId: id,
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Facebook login error:", error);

    if (error.message && error.message.includes('fetch')) {
      return res.status(500).json({ 
        message: "Facebook API temporarily unavailable. Please try again." 
      });
    }

    res.status(500).json({ 
      message: "Server error during Facebook login",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Decode GitHub code and get user info without creating user
export const decodeGithubCode = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "GitHub authorization code is required" });
    }

    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      console.error("GitHub OAuth environment variables are not set");
      return res.status(500).json({ message: "Server configuration error" });
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return res.status(400).json({ 
        message: "GitHub authentication failed", 
        error: tokenData.error_description 
      });
    }

    // Get user information
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    const githubUser = await userResponse.json();

    if (!githubUser.email) {
      // Get user's primary email if not public
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      const emails = await emailResponse.json();
      const primaryEmail = emails.find(email => email.primary && email.verified);
      
      if (!primaryEmail) {
        return res.status(400).json({ 
          message: "No verified email found in GitHub account" 
        });
      }
      
      githubUser.email = primaryEmail.email;
    }

    const { name, email, login } = githubUser;

    if (!email || !login) {
      return res.status(400).json({ 
        message: "Required user information not available from GitHub" 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });

    res.json({
      success: true,
      name: name || login,
      email: email.toLowerCase().trim(),
      githubUsername: login,
      userExists: !!existingUser,
    });
  } catch (error) {
    console.error("GitHub code decode error:", error);

    if (error.message && error.message.includes('fetch')) {
      return res.status(500).json({ 
        message: "GitHub API temporarily unavailable. Please try again." 
      });
    }

    res.status(500).json({ 
      message: "Server error during GitHub code decode",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GitHub signup with role selection
export const githubSignupWithRole = async (req, res) => {
  try {
    const { code, role = "user" } = req.body;

    if (!code) {
      return res.status(400).json({ message: "GitHub authorization code is required" });
    }

    // Validate role
    if (!["user", "admin", "agent", "analytics"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Must be 'user', 'admin', 'agent', or 'analytics'",
      });
    }

    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      console.error("GitHub OAuth environment variables are not set");
      return res.status(500).json({ message: "Server configuration error" });
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return res.status(400).json({ 
        message: "GitHub authentication failed", 
        error: tokenData.error_description 
      });
    }

    // Get user information
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    const githubUser = await userResponse.json();

    if (!githubUser.email) {
      // Get user's primary email if not public
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      const emails = await emailResponse.json();
      const primaryEmail = emails.find(email => email.primary && email.verified);
      
      if (!primaryEmail) {
        return res.status(400).json({ 
          message: "No verified email found in GitHub account" 
        });
      }
      
      githubUser.email = primaryEmail.email;
    }

    const { name, email, login } = githubUser;

    if (!email || !login) {
      return res.status(400).json({ 
        message: "Required user information not available from GitHub" 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (existingUser) {
      return res.status(409).json({ 
        message: "User already exists. Please use regular GitHub login instead." 
      });
    }

    // Create new user with selected role
    const user = await User.create({
      name: name || login,
      email: email.toLowerCase().trim(),
      password: Math.random().toString(36).slice(-8), // dummy password
      role: role,
      isGithubUser: true,
      githubId: githubUser.id,
      githubUsername: login,
    });
    
    console.log("New GitHub user created with role:", {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      githubUsername: login,
    });

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("GitHub signup error:", error);

    if (error.message && error.message.includes('fetch')) {
      return res.status(500).json({ 
        message: "GitHub API temporarily unavailable. Please try again." 
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({ message: "User with this email already exists" });
    }

    res.status(500).json({ 
      message: "Server error during GitHub signup",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// AI Service Integration for Complaint Auto-Generation
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

// Helper function to call AI service
const callAIService = async (endpoint, data) => {
  try {
    const response = await fetch(`${AI_SERVICE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`AI Service error: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('AI Service call failed:', error);
    throw error;
  }
};

// Auto-generate complaint from user chat
export const generateComplaintFromChat = async (req, res) => {
  try {
    const { userId, chatHistory, userMessage } = req.body;

    if (!userId || !chatHistory || !userMessage) {
      return res.status(400).json({ 
        message: "User ID, chat history, and user message are required" 
      });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Step 1: Get chatbot response from AI service
    const chatbotResponse = await callAIService('/api/chatbot/message', {
      message: userMessage,
      session_id: userId,
      user_context: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

    // Step 2: Analyze chat for complaint indicators
    const complaintAnalysis = await callAIService('/classify', {
      text: `${chatHistory}\nUser: ${userMessage}\nBot: ${chatbotResponse.response}`
    });

    // Step 3: Check if this conversation indicates a complaint
    const isComplaintWorthy = complaintAnalysis.category !== 'general_inquiry' && 
                             (complaintAnalysis.sentiment === 'negative' || 
                              complaintAnalysis.priority === 'high' ||
                              complaintAnalysis.category.includes('complaint'));

    if (isComplaintWorthy) {
      // Step 4: Generate structured complaint from chat
      const complaintData = await generateStructuredComplaint(chatHistory, userMessage, complaintAnalysis, user);
      
      return res.json({
        success: true,
        chatbotResponse: chatbotResponse.response,
        complaintGenerated: true,
        complaintData: complaintData,
        analysis: complaintAnalysis,
        message: "I've detected this might be a complaint. Would you like me to automatically create a complaint ticket for you?"
      });
    } else {
      // Regular chat response
      return res.json({
        success: true,
        chatbotResponse: chatbotResponse.response,
        complaintGenerated: false,
        analysis: complaintAnalysis,
        message: chatbotResponse.response
      });
    }

  } catch (error) {
    console.error("Complaint generation error:", error);
    
    // Fallback response if AI service is down
    return res.json({
      success: true,
      chatbotResponse: "I understand your concern. Let me help you with that. Could you please provide more details about the issue you're experiencing?",
      complaintGenerated: false,
      error: "AI service temporarily unavailable",
      message: "I'm here to help! Please describe your issue and I'll assist you."
    });
  }
};

// Generate structured complaint data
const generateStructuredComplaint = async (chatHistory, userMessage, analysis, user) => {
  try {
    // Extract key information from chat
    const fullConversation = `${chatHistory}\nUser: ${userMessage}`;
    
    // Use AI to extract structured data
    const extractedData = await callAIService('/api/extract-complaint-data', {
      conversation: fullConversation,
      analysis: analysis,
      user_info: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

    return {
      title: extractedData.title || `${analysis.category} - Auto-generated from chat`,
      description: extractedData.description || fullConversation,
      category: analysis.category,
      priority: analysis.priority,
      sentiment: analysis.sentiment,
      tags: extractedData.tags || [analysis.category, 'auto-generated', 'chat-based'],
      source: 'ai-chat',
      confidence: analysis.confidence,
      extractedEntities: extractedData.entities || {},
      suggestedActions: extractedData.actions || [],
      estimatedResolutionTime: extractedData.estimatedTime || '24-48 hours'
    };
  } catch (error) {
    console.error("Error generating structured complaint:", error);
    
    // Fallback structure
    return {
      title: `${analysis.category} - Auto-generated Complaint`,
      description: `${chatHistory}\nUser: ${userMessage}`,
      category: analysis.category,
      priority: analysis.priority,
      sentiment: analysis.sentiment,
      tags: ['auto-generated', 'chat-based', analysis.category],
      source: 'ai-chat',
      confidence: analysis.confidence || 0.7
    };
  }
};

// Process chat and potentially create complaint
export const processChatForComplaint = async (req, res) => {
  try {
    const { userId, message, sessionId } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ 
        message: "User ID and message are required" 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get AI chatbot response
    const aiResponse = await callAIService('/api/chatbot/message', {
      message: message,
      session_id: sessionId || userId,
      user_context: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

    // Analyze message for complaint indicators
    const analysis = await callAIService('/classify', {
      text: message
    });

    // Check if user wants to create a complaint
    const createComplaint = analysis.intent === 'create_complaint' || 
                           message.toLowerCase().includes('complaint') ||
                           message.toLowerCase().includes('issue') ||
                           analysis.sentiment === 'negative' && analysis.priority === 'high';

    res.json({
      success: true,
      response: aiResponse.response,
      shouldCreateComplaint: createComplaint,
      analysis: {
        category: analysis.category,
        priority: analysis.priority,
        sentiment: analysis.sentiment,
        confidence: analysis.confidence
      },
      sessionId: sessionId || userId
    });

  } catch (error) {
    console.error("Chat processing error:", error);
    
    // Fallback response
    res.json({
      success: true,
      response: "I'm here to help you! Could you please tell me more about what you need assistance with?",
      shouldCreateComplaint: false,
      error: "AI service temporarily unavailable"
    });
  }
};

// IBM Watson Assistant Integration
// Using dynamic imports for compatibility
let AssistantV2;
let IamAuthenticator;

// Load Watson modules
const loadWatsonModules = async () => {
  try {
    const watsonPkg = await import('ibm-watson/assistant/v2.js');
    const authPkg = await import('ibm-watson/auth/index.js');
    
    AssistantV2 = watsonPkg.default;
    IamAuthenticator = authPkg.IamAuthenticator;
    
    return true;
  } catch (error) {
    console.error("Error loading Watson modules:", error);
    return false;
  }
};

// Watson Assistant configuration
let watsonAssistant;

// Initialize Watson
const initializeWatson = async () => {
  try {
    // Debug environment variables
    console.log('Watson Configuration Debug:');
    console.log('- API Key:', process.env.WATSON_API_KEY ? 
      `${process.env.WATSON_API_KEY.substring(0, 5)}...${process.env.WATSON_API_KEY.substring(process.env.WATSON_API_KEY.length - 5)}` : 
      'MISSING');
    console.log('- Region:', process.env.WATSON_REGION || 'Not set (using default)');
    console.log('- Service Instance ID:', process.env.WATSON_SERVICE_INSTANCE_ID || 'MISSING');
    console.log('- Assistant ID:', process.env.WATSON_ASSISTANT_ID || 'MISSING');
    console.log('- Skill ID:', process.env.WATSON_SKILL_ID || 'MISSING');
    console.log('- Draft Environment ID:', process.env.WATSON_DRAFT_ENVIRONMENT_ID || 'MISSING');
    console.log('- Live Environment ID:', process.env.WATSON_LIVE_ENVIRONMENT_ID || 'MISSING');
    
    if (!process.env.WATSON_API_KEY) {
      throw new Error('Watson API key is missing in environment variables');
    }
    
    if (!process.env.WATSON_SERVICE_INSTANCE_ID) {
      throw new Error('Watson service instance ID is missing in environment variables');
    }
    
    if (!process.env.WATSON_ASSISTANT_ID) {
      throw new Error('Watson assistant ID is missing in environment variables');
    }
    
    // Load Watson modules
    const modulesLoaded = await loadWatsonModules();
    if (!modulesLoaded) {
      throw new Error('Failed to load Watson modules');
    }
    
    // Use au-syd as default region if not specified
    const region = process.env.WATSON_REGION || 'au-syd';
    const serviceUrl = `https://${region}.assistant.watson.cloud.ibm.com/instances/${process.env.WATSON_SERVICE_INSTANCE_ID}/v2`;
    
    console.log('- Service URL:', serviceUrl);
    
    watsonAssistant = new AssistantV2({
      version: '2023-06-15',
      authenticator: new IamAuthenticator({
        apikey: process.env.WATSON_API_KEY,
      }),
      serviceUrl: serviceUrl,
      disableSslVerification: false,
    });
    console.log('Watson Assistant configured successfully');
    return true;
  } catch (error) {
    console.warn('Watson Assistant not configured, using fallback:', error.message);
    console.error('Watson initialization error details:', error);
    return false;
  }
};

// Define Watson constants
const WATSON_ASSISTANT_ID = process.env.WATSON_ASSISTANT_ID;

// Initialize Watson when the server starts
initializeWatson().then(success => {
  if (success) {
    console.log('Watson Assistant initialized successfully at startup');
  } else {
    console.warn('Failed to initialize Watson Assistant at startup, will try again when needed');
  }
});

// Watson Assistant session management
const watsonSessions = new Map();

// Create Watson session
const createWatsonSession = async (userId) => {
  try {
    // Ensure Watson Assistant is initialized
    if (!watsonAssistant) {
      const initialized = await initializeWatson();
      if (!initialized) {
        console.error('Cannot create Watson session: Failed to initialize Watson Assistant');
        throw new Error('Watson Assistant initialization failed');
      }
    }
    
    if (!WATSON_ASSISTANT_ID) {
      console.error('Cannot create Watson session: Assistant ID not configured');
      throw new Error('Watson Assistant ID not configured');
    }
    
    // Check for existing session
    if (watsonSessions.has(userId)) {
      console.log(`Using existing Watson session for user ${userId}`);
      return watsonSessions.get(userId);
    }
    
    console.log(`Creating new Watson session for user ${userId} with assistant ${WATSON_ASSISTANT_ID}`);
    
    const response = await watsonAssistant.createSession({
      assistantId: WATSON_ASSISTANT_ID,
    });
    
    if (!response || !response.result || !response.result.session_id) {
      console.error('Invalid response from Watson createSession:', response);
      throw new Error('Failed to create Watson session: Invalid response');
    }
    
    const sessionId = response.result.session_id;
    console.log(`Watson session created successfully: ${sessionId.substring(0, 8)}...`);
    
    watsonSessions.set(userId, sessionId);
    
    // Auto-delete session after 1 hour to prevent memory leaks
    setTimeout(() => {
      watsonSessions.delete(userId);
    }, 3600000);

    return sessionId;
  } catch (error) {
    console.error('Error creating Watson session:', error);
    if (error.body) {
      try {
        const errorDetails = JSON.parse(error.body);
        console.error('Watson error details:', errorDetails);
      } catch (e) {
        console.error('Watson error body (raw):', error.body);
      }
    }
    throw error;
  }
};

// Send message to Watson Assistant
export const chatWithWatson = async (req, res) => {
  try {
    const { userId, message, context = {} } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ 
        message: "User ID and message are required" 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Try to initialize Watson if not already initialized
    if (!watsonAssistant) {
      const initialized = await initializeWatson();
      if (!initialized) {
        return res.json({
          success: true,
          response: "Hello! I'm here to help you with your concerns. Watson Assistant is currently being configured. How can I assist you today?",
          fallback: true,
          sessionId: userId
        });
      }
    }

    const sessionId = await createWatsonSession(userId);

    const response = await watsonAssistant.message({
      assistantId: WATSON_ASSISTANT_ID,
      sessionId: sessionId,
      input: {
        message_type: 'text',
        text: message,
        options: {
          return_context: true,
        },
      },
      context: {
        ...context,
        user_info: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      },
    });

    const watsonResponse = response.result.output.generic;
    const updatedContext = response.result.context;
    const intents = response.result.output.intents || [];
    const entities = response.result.output.entities || [];

    const isComplaintDetected = intents.some(intent => 
      intent.intent.includes('complaint') || 
      intent.intent.includes('issue') || 
      intent.intent.includes('problem')
    );
    
    res.json({
      success: true,
      response: watsonResponse.map(msg => msg.text).join(' ') || "I understand. Could you tell me more about your concern?",
      context: updatedContext,
      sessionId: sessionId,
      complaintDetected: isComplaintDetected,
      entities: entities,
      intents: intents,
      user: {
        id: user._id,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Watson chat error:", error);
    
    res.json({
      success: true,
      response: "I'm here to help you! Could you please tell me more about your concern?",
      error: "Watson Assistant temporarily unavailable",
      fallback: true,
      sessionId: userId
    });
  }
};

// Generate complaint from Watson conversation
export const generateComplaintFromWatson = async (req, res) => {
  try {
    const { userId, conversationHistory, currentMessage, context } = req.body;

    if (!userId || !conversationHistory) {
      return res.status(400).json({ 
        message: "User ID and conversation history are required" 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!watsonAssistant) {
      // Fallback complaint generation
      const complaintData = {
        title: `Issue reported by ${user.name}`,
        description: `${conversationHistory}\n\nLatest message: ${currentMessage}`,
        category: 'general',
        priority: 'medium',
        tags: ['watson-fallback', 'auto-generated'],
        source: 'watson-chat',
        confidence: 0.7
      };

      return res.json({
        success: true,
        watsonResponse: "I've noted your concern and will help create a complaint ticket for you.",
        complaintData: complaintData,
        fallback: true
      });
    }

    const sessionId = await createWatsonSession(userId);

    const response = await watsonAssistant.message({
      assistantId: WATSON_ASSISTANT_ID,
      sessionId: sessionId,
      input: {
        message_type: 'text',
        text: currentMessage,
        options: {
          return_context: true,
        },
      },
      context: {
        ...context,
        action: 'extract_complaint_data',
        conversation_history: conversationHistory,
        user_info: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      },
    });

    const watsonResponse = response.result.output.generic;
    const entities = response.result.output.entities || [];
    const intents = response.result.output.intents || [];

    const complaintData = {
      title: extractTitle(conversationHistory, currentMessage, entities),
      description: formatComplaintDescription(conversationHistory, currentMessage),
      category: extractCategory(intents, entities),
      priority: extractPriority(intents, entities),
      tags: extractTags(entities, intents),
      source: 'watson-chat',
      extractedEntities: entities,
      watsonIntents: intents,
      confidence: calculateConfidence(intents)
    };

    res.json({
      success: true,
      watsonResponse: watsonResponse.map(msg => msg.text).join(' '),
      complaintData: complaintData,
      entities: entities,
      intents: intents,
      sessionId: sessionId
    });

  } catch (error) {
    console.error("Watson complaint generation error:", error);
    
    res.status(500).json({
      success: false,
      message: "Error generating complaint from Watson conversation",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper functions for Watson complaint extraction
const extractTitle = (history, message, entities) => {
  const products = entities.filter(e => e.entity === 'product' || e.entity === 'service');
  const issues = entities.filter(e => e.entity === 'issue_type' || e.entity === 'problem');
  
  if (products.length > 0 && issues.length > 0) {
    return `${issues[0].value} with ${products[0].value}`;
  }
  
  return message.split(' ').slice(0, 8).join(' ') + '...';
};

const formatComplaintDescription = (history, message) => {
  return `Conversation History:\n${history}\n\nCurrent Issue:\n${message}`;
};

const extractCategory = (intents, entities) => {
  const intentCategoryMap = {
    'billing_issue': 'billing',
    'technical_problem': 'technical',
    'service_complaint': 'service',
    'product_issue': 'product',
    'account_problem': 'account'
  };

  for (const intent of intents) {
    if (intentCategoryMap[intent.intent]) {
      return intentCategoryMap[intent.intent];
    }
  }

  const categoryEntities = entities.filter(e => e.entity === 'category' || e.entity === 'department');
  if (categoryEntities.length > 0) {
    return categoryEntities[0].value.toLowerCase();
  }

  return 'general';
};

const extractPriority = (intents, entities) => {
  const urgentIntents = ['urgent_issue', 'critical_problem', 'emergency'];
  const highPriorityEntities = entities.filter(e => 
    e.value && (e.value.includes('urgent') || e.value.includes('critical') || e.value.includes('emergency'))
  );

  if (urgentIntents.some(urgent => intents.some(intent => intent.intent === urgent)) || 
      highPriorityEntities.length > 0) {
    return 'high';
  }

  const highConfidenceIntents = intents.filter(intent => intent.confidence > 0.8);
  if (highConfidenceIntents.length > 0) {
    return 'medium';
  }

  return 'low';
};

const extractTags = (entities, intents) => {
  const tags = ['watson-generated', 'auto-complaint'];
  
  entities.forEach(entity => {
    if (entity.value && entity.value.length > 2) {
      tags.push(entity.value.toLowerCase().replace(/\s+/g, '-'));
    }
  });

  intents.forEach(intent => {
    tags.push(intent.intent.replace(/_/g, '-'));
  });

  return [...new Set(tags)];
};

const calculateConfidence = (intents) => {
  if (intents.length === 0) return 0.5;
  
  const avgConfidence = intents.reduce((sum, intent) => sum + intent.confidence, 0) / intents.length;
  return Math.round(avgConfidence * 100) / 100;
};

// Facebook signup with role selection
export const facebookSignupWithRole = async (req, res) => {
  try {
    const { code, role = "user" } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Facebook authorization code is required" });
    }

    // Validate role
    if (!["user", "admin", "agent", "analytics"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Must be 'user', 'admin', 'agent', or 'analytics'",
      });
    }

    if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
      console.error("Facebook OAuth environment variables are not set");
      return res.status(500).json({ message: "Server configuration error" });
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
  client_id: process.env.FACEBOOK_APP_ID,
  client_secret: process.env.FACEBOOK_APP_SECRET,
  redirect_uri: 'http://localhost:5000/auth/facebook/callback',
  code: code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return res.status(400).json({ 
        message: "Facebook authentication failed", 
        error: tokenData.error.message 
      });
    }

    // Get user information
    const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${tokenData.access_token}&fields=id,name,email`);
    const facebookUser = await userResponse.json();

    if (facebookUser.error) {
      return res.status(400).json({ 
        message: "Failed to get user information from Facebook", 
        error: facebookUser.error.message 
      });
    }

    const { name, email, id } = facebookUser;

    if (!email) {
      return res.status(400).json({ 
        message: "Email not available from Facebook account" 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (existingUser) {
      // If user exists, update Facebook info and return user data
      if (!existingUser.facebookId) {
        existingUser.facebookId = id;
        existingUser.isFacebookUser = true;
        await existingUser.save();
      }

      return res.json({
        success: true,
        user: {
          id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
        },
        token: generateToken(existingUser._id),
      });
    }

    // Create new user with specified role
    const user = await User.create({
      name: name,
      email: email.toLowerCase().trim(),
      password: Math.random().toString(36).slice(-8), // dummy password
      role: role,
      isFacebookUser: true,
      facebookId: id,
    });

    console.log("New Facebook user created with role:", {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      facebookId: id,
    });

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Facebook signup error:", error);

    if (error.code === 11000) {
      return res.status(409).json({ message: "User with this email already exists" });
    }

    res.status(500).json({ 
      message: "Server error during Facebook signup",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Token Refresh Endpoint
export const refreshToken = async (req, res) => {
  try {
    // Get the token from the request
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find the user
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Generate new tokens
      const newToken = generateToken(user._id);
      const newRefreshToken = generateRefreshToken(user._id);
      
      // Return the new tokens
      return res.status(200).json({
        token: newToken,
        refreshToken: newRefreshToken,
        user: {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        }
      });
    } catch (tokenError) {
      // If token verification fails, try the refresh token
      const refreshToken = req.body.refreshToken;
      
      if (!refreshToken) {
        return res.status(401).json({ message: 'No refresh token provided' });
      }
      
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        
        // Check if it's actually a refresh token
        if (!decoded.tokenType || decoded.tokenType !== 'refresh') {
          return res.status(401).json({ message: 'Invalid refresh token' });
        }
        
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        // Generate new tokens
        const newToken = generateToken(user._id);
        const newRefreshToken = generateRefreshToken(user._id);
        
        // Return the new tokens
        return res.status(200).json({
          token: newToken,
          refreshToken: newRefreshToken,
          user: {
            id: user._id,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role
          }
        });
      } catch (refreshError) {
        return res.status(401).json({ message: 'Invalid or expired refresh token' });
      }
    }
  } catch (error) {
    console.error('Error in token refresh:', error);
    return res.status(500).json({ message: 'Server error during token refresh' });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if OTP matches and has not expired
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpiry && new Date() > new Date(user.otpExpiry)) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one" });
    }

    // Mark user as verified and clear OTP fields
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    console.log("User verified successfully:", user.email);

    // Generate tokens after verification
    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      message: "Email verified successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: true
      },
      token: accessToken,
      refreshToken: refreshToken
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ message: "Server error during OTP verification" });
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send new OTP via email
    await sendOtpEmail(user.email, user.name, otp);

    res.json({
      success: true,
      message: "New OTP sent to your email",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ message: "Server error during OTP resend" });
  }
};
