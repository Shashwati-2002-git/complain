import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
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

// Signup
export const registerUser = async (req, res) => {
  const { name, email, password, role = "user" } = req.body;

  try {
    // Validate input
    const validationErrors = validateSignup(name, email, password);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    // Validate role
    if (role && !["user", "admin", "agent", "analytics"].includes(role)) {
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

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
    });

    console.log("User created successfully:", {
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
      console.log("User logged in successfully:", {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });

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
