/**
 * Main Socket.io handler entry point
 * This file orchestrates all socket-related functionality by importing
 * and initializing specialized handlers for different domains
 */
import { initConnectionHandler } from './handlers/connectionHandler.js';
import { initComplaintHandler } from './handlers/complaintHandler.js';
import { initChatHandler } from './handlers/chatHandler.js';
import { initNotificationHandler } from './handlers/notificationHandler.js';
import { initAgentHandler } from './handlers/agentHandler.js';
import { initDashboardHandler } from './handlers/dashboardHandler.js';

// Store io instance for global access within socket modules
let ioInstance;

/**
 * Initialize all socket handlers and set up global socket.io instance
 * @param {object} io - Socket.io instance
 */
export const handleConnection = (io) => {
  // Store io instance for potential use in imported handlers
  ioInstance = io;
  
  // Initialize all domain-specific socket handlers
  initConnectionHandler(io);
  initComplaintHandler(io);
  initChatHandler(io);
  initNotificationHandler(io);
  initAgentHandler(io);
  initDashboardHandler(io);
  
  console.log('Socket handlers initialized successfully');
  
  // Return io instance in case it's needed by the caller
  return ioInstance;
};

/**
 * Get the global socket.io instance
 * @returns {object} Socket.io instance
 */
export const getIoInstance = () => {
  if (!ioInstance) {
    throw new Error('Socket.io instance not initialized. Call handleConnection first.');
  }
  return ioInstance;
};
