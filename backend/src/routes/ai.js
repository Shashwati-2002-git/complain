/**
 * AI API routes
 * Provides endpoints for AI-powered features and chatbot functionality
 */

import express from 'express';
import { AIService } from '../services/aiService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const aiService = new AIService();

/**
 * @route POST /api/ai/classify
 * @desc Classify text using AI
 * @access Private
 */
router.post('/classify', authenticate(), function(req, res) {
  (async function() {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ 
          success: false, 
          message: 'Text is required for classification' 
        });
      }
      
      const analysis = await aiService.classifyComplaint(text);
      
      return res.status(200).json({
        success: true,
        analysis
      });
    } catch (error) {
      console.error('Error classifying text:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to classify text',
        error: error.message
      });
    }
  })();
});

/**
 * @route POST /api/ai/chat
 * @desc Generate chatbot response
 * @access Public (no auth required for customer-facing chatbot)
 */
router.post('/chat', function(req, res) {
  (async function() {
    try {
      const { message, sessionId, context } = req.body;
      
      if (!message) {
        return res.status(400).json({ 
          success: false, 
          message: 'Message text is required' 
        });
      }
      
      const response = await aiService.generateChatResponse(message, sessionId, context);
      
      return res.status(200).json({
        success: true,
        response
      });
    } catch (error) {
      console.error('Error generating chatbot response:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate chatbot response',
        error: error.message
      });
    }
  })();
});

/**
 * @route POST /api/ai/agent-response
 * @desc Generate agent assistance response
 * @access Private (agents only)
 */
router.post('/agent-response', authenticate(['agent', 'admin']), function(req, res) {
  (async function() {
    try {
      const { prompt, context } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ 
          success: false, 
          message: 'Prompt is required' 
        });
      }
      
      const response = await aiService.generateAgentResponse(prompt, context);
      
      return res.status(200).json({
        success: true,
        response
      });
    } catch (error) {
      console.error('Error generating agent response:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate agent response',
        error: error.message
      });
    }
  })();
});

export default router;