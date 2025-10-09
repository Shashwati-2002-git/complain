/**
 * Agent assistance API routes
 * Provides endpoints for AI-powered agent assistance features
 */

import express from 'express';
import { AIService } from '../services/aiService.js';
import { Complaint } from '../models/Complaint.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const aiService = new AIService();

/**
 * @route POST /api/agent-assist/analyze-complaint
 * @desc Analyze a complaint using AI to get classification, priority, and sentiment
 * @access Private (agents only)
 */
router.post('/analyze-complaint', authenticate(['agent', 'admin']), function(req, res) {
  (async function() {
    try {
      const { complaintText } = req.body;
      
      if (!complaintText) {
        return res.status(400).json({ 
          success: false, 
          message: 'Complaint text is required' 
        });
      }
      
      const analysis = await aiService.classifyComplaint(complaintText);
      
      return res.status(200).json({
        success: true,
        analysis
      });
    } catch (error) {
      console.error('Error analyzing complaint:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to analyze complaint',
        error: error.message
      });
    }
  })();
});

/**
 * @route POST /api/agent-assist/generate-response
 * @desc Generate an AI-assisted response for an agent to use
 * @access Private (agents only)
 */
router.post('/generate-response', authenticate(['agent', 'admin']), function(req, res) {
  (async function() {
    try {
      const { complaintId, customPrompt } = req.body;
      
      if (!complaintId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Complaint ID is required' 
        });
      }
      
      // Find the complaint
      const complaint = await Complaint.findOne({ complaintId }).populate('customer');
      
      if (!complaint) {
        return res.status(404).json({ 
          success: false, 
          message: 'Complaint not found' 
        });
      }
      
      // Generate response using AI
      const response = await aiService.generateAgentResponse(customPrompt || '', { 
        complaint, 
        customer: complaint.customer 
      });
      
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

/**
 * @route POST /api/agent-assist/suggest-next-steps
 * @desc Get AI suggestions for next steps to resolve a complaint
 * @access Private (agents only)
 */
router.post('/suggest-next-steps', authenticate(['agent', 'admin']), function(req, res) {
  (async function() {
    try {
      const { complaintId } = req.body;
      
      if (!complaintId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Complaint ID is required' 
        });
      }
      
      // Find the complaint
      const complaint = await Complaint.findOne({ complaintId }).populate('customer');
      
      if (!complaint) {
        return res.status(404).json({ 
          success: false, 
          message: 'Complaint not found' 
        });
      }
      
      // Generate next steps using AI
      const suggestions = await aiService.suggestNextSteps(complaint);
      
      return res.status(200).json({
        success: true,
        suggestions
      });
    } catch (error) {
      console.error('Error suggesting next steps:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to suggest next steps',
        error: error.message
      });
    }
  })();
});

/**
 * @route POST /api/agent-assist/free-form-query
 * @desc Allow agents to ask any question about a complaint and get AI-generated insights
 * @access Private (agents only)
 */
router.post('/free-form-query', authenticate(['agent', 'admin']), function(req, res) {
  (async function() {
    try {
      const { complaintId, query } = req.body;
      
      if (!complaintId || !query) {
        return res.status(400).json({ 
          success: false, 
          message: 'Complaint ID and query are required' 
        });
      }
      
      // Find the complaint
      const complaint = await Complaint.findOne({ complaintId }).populate('customer');
      
      if (!complaint) {
        return res.status(404).json({ 
          success: false, 
          message: 'Complaint not found' 
        });
      }
      
      // Generate response to query using AI
      const response = await aiService.answerAgentQuery(query, complaint);
      
      return res.status(200).json({
        success: true,
        response
      });
    } catch (error) {
      console.error('Error processing agent query:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to process query',
        error: error.message
      });
    }
  })();
});

export default router;