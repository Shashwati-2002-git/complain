import { User } from "../models/User.js";
import jwt from "jsonwebtoken";

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
  const { name, email, password } = req.body;
  
  try {
    // Validate input
    const validationErrors = validateSignup(name, email, password);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validationErrors 
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password });
    
    console.log("User created successfully:", { id: user._id, name: user.name, email: user.email });
    
    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
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
      return res.status(400).json({ message: "Please provide email and password" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user && (await user.matchPassword(password))) {
      console.log("User logged in successfully:", { id: user._id, name: user.name, email: user.email });
      
      res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
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
