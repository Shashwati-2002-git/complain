interface AIAnalysis {
  category: 'Billing' | 'Technical' | 'Service' | 'Product' | 'General';
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  confidence: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

class AIService {
  private keywords = {
    billing: ['bill', 'charge', 'payment', 'refund', 'invoice', 'money', 'cost', 'price', 'fee'],
    technical: ['error', 'bug', 'crash', 'login', 'password', 'app', 'website', 'connection', 'loading'],
    service: ['support', 'staff', 'representative', 'customer service', 'help', 'agent', 'response time'],
    product: ['defective', 'broken', 'quality', 'delivery', 'shipping', 'wrong item', 'damaged'],
  };

  private urgentKeywords = ['urgent', 'emergency', 'critical', 'down', 'outage', 'immediately', 'asap'];
  private negativeKeywords = ['angry', 'frustrated', 'terrible', 'worst', 'hate', 'disappointed', 'unacceptable'];
  private positiveKeywords = ['thank', 'great', 'excellent', 'satisfied', 'good', 'appreciate', 'helpful'];

  // For backend integration, we'll make API calls
  async classifyComplaint(text: string): Promise<AIAnalysis> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ text })
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('API classification failed, using fallback logic');
    }

    // Fallback to local classification if API fails
    return this.localClassification(text);
  }

  private localClassification(text: string): AIAnalysis {
    const lowercaseText = text.toLowerCase();
    
    // Category classification
    let category: AIAnalysis['category'] = 'General';
    let maxScore = 0;

    for (const [cat, keywords] of Object.entries(this.keywords)) {
      const score = keywords.filter(keyword => lowercaseText.includes(keyword)).length;
      if (score > maxScore) {
        maxScore = score;
        category = cat.charAt(0).toUpperCase() + cat.slice(1) as AIAnalysis['category'];
      }
    }

    // Sentiment analysis
    let sentiment: AIAnalysis['sentiment'] = 'Neutral';
    const negativeScore = this.negativeKeywords.filter(keyword => lowercaseText.includes(keyword)).length;
    const positiveScore = this.positiveKeywords.filter(keyword => lowercaseText.includes(keyword)).length;

    if (negativeScore > positiveScore) {
      sentiment = 'Negative';
    } else if (positiveScore > negativeScore) {
      sentiment = 'Positive';
    }

    // Priority assignment
    let priority: AIAnalysis['priority'] = 'Low';
    const urgentScore = this.urgentKeywords.filter(keyword => lowercaseText.includes(keyword)).length;

    if (urgentScore > 0 || (sentiment === 'Negative' && (category === 'Technical' || category === 'Billing'))) {
      priority = 'Urgent';
    } else if (sentiment === 'Negative' || category === 'Technical') {
      priority = 'High';
    } else if (category === 'Billing' || category === 'Service') {
      priority = 'Medium';
    }

    // Calculate confidence score
    const confidence = Math.min(0.95, 0.6 + (maxScore * 0.1) + (urgentScore * 0.1) + (Math.abs(negativeScore - positiveScore) * 0.05));

    return {
      category,
      sentiment,
      priority,
      confidence,
    };
  }

  async generateResponse(intent: string, text: string): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ intent, text })
      });

      if (response.ok) {
        const data = await response.json();
        return data.response;
      }
    } catch (error) {
      console.warn('API response generation failed, using fallback');
    }

    // Fallback responses
    const responses = {
      greeting: "Hello! I'm here to help you with your complaints. How can I assist you today?",
      file_complaint: "I'd be happy to help you file a complaint. Could you please describe the issue you're experiencing?",
      check_status: "Let me check the status of your complaints for you.",
      faq_billing: "For billing inquiries, you can view your invoice in your account dashboard. If you notice any discrepancies, please file a complaint.",
      faq_technical: "For technical issues, please try refreshing the page or clearing your browser cache. If the problem persists, I can help you file a technical complaint.",
      faq_general: "Is there something specific I can help you with? I can assist with filing complaints, checking status, or answering common questions.",
      escalation: "I understand your frustration. Let me escalate this to our priority queue and assign it to a senior agent.",
    };

    // Simple intent detection
    if (text.toLowerCase().includes('hello') || text.toLowerCase().includes('hi')) {
      return responses.greeting;
    }
    if (text.toLowerCase().includes('status') || text.toLowerCase().includes('update')) {
      return responses.check_status;
    }
    if (text.toLowerCase().includes('complaint') || text.toLowerCase().includes('issue') || text.toLowerCase().includes('problem')) {
      return responses.file_complaint;
    }
    if (text.toLowerCase().includes('billing') || text.toLowerCase().includes('payment')) {
      return responses.faq_billing;
    }
    if (text.toLowerCase().includes('technical') || text.toLowerCase().includes('error')) {
      return responses.faq_technical;
    }

    return responses.faq_general;
  }
}

export const aiService = new AIService();