// Load environment variables first, before any other imports
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import connectDB from "./config/db.js";
import { handleConnection } from "./socket/socketHandlers.js";
import { User } from "./models/User.js";

// Log system information on startup
console.log('=== QuickFix Complaint Management System ===');
console.log('Starting server with Socket.IO real-time updates');
console.log('Node environment:', process.env.NODE_ENV);

// Connect to MongoDB
connectDB();

const app = express();
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Allow localhost on any port for development
      if (origin && origin.match(/^http:\/\/localhost:\d+$/)) {
        return callback(null, true);
      }
      
      // Allow your specific origins
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:4173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:4173'
      ];
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

// Add authentication middleware
io.use(async (socket, next) => {
  try {
    console.log('Socket authentication attempt:', socket.id);
    
    const token = socket.handshake.auth?.token;
    if (!token) {
      console.error('Socket auth failed: Missing token', socket.id);
      return next(new Error("Authentication failed: Missing token"));
    }

    try {
      // Log token format to help with debugging
      console.log(`Token format: ${token.substring(0, 10)}...${token.substring(token.length - 5)}`);
      
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key');
      console.log('Token decoded successfully:', JSON.stringify(decoded));
      
      // Extract userId from different possible fields
      const userId = decoded.id || decoded.userId || decoded.sub;
      if (!userId) {
        console.error('Socket auth failed: Invalid token payload (no userId)', socket.id);
        return next(new Error("Authentication failed: Invalid token payload - missing user ID"));
      }
      
      // Look up the user in the database
      console.log('Looking up user:', userId);
      const user = await User.findById(userId).select('-password');
      
      if (!user) {
        console.error('Socket auth failed: User not found', userId, socket.id);
        return next(new Error("Authentication failed: User not found"));
      }
      
      console.log('Socket authenticated successfully:', user.name, user.role, socket.id);
      
      // Attach user to socket for later use
      socket.user = user;
      next();
    } catch (err) {
      console.error('Socket token verification error:', err.message, socket.id);
      next(new Error(`Authentication failed: ${err.message}`));
    }
  } catch (error) {
    console.error('Socket middleware uncaught error:', error, socket.id);
    next(new Error("Server error during authentication"));
  }
});

// Setup socket handlers
handleConnection(io);

// Make io available to routes
app.set('io', io);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: 'QuickFix Backend API',
    version: '1.0.0'
  });
});

// Middleware
// Add request logger for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com", "https://apis.google.com"],
      frameSrc: ["'self'", "https://accounts.google.com"],
      connectSrc: ["'self'", "https://accounts.google.com", "https://www.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    console.log('Request origin:', origin);
    
    // Allow localhost on any port for development
    if (origin && origin.match(/^http:\/\/localhost:\d+$/)) {
      console.log('Allowing localhost origin:', origin);
      return callback(null, true);
    }
    
    // Allow your specific origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:4173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:4173'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('Allowing origin from allowedOrigins list:', origin);
      return callback(null, true);
    }
    
    console.log('Rejecting origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Authorization']
}));

app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
import authRoutes from "./routes/auth.js";
import complaintsRoutes from "./routes/complaints.js";
import usersRoutes from "./routes/users.js";
import notificationsRoutes from "./routes/notifications.js";
import analyticsRoutes from "./routes/analytics.js";
import adminRoutes from "./routes/admin.js";
import agentsRoutes from "./routes/agents.js";

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/agents", agentsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔌 Socket.IO server initialized`);
});
