interface AIAnalysis {
  category: 'Billing' | 'Technical' | 'Service' | 'Product' | 'General';
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  confidence: number;
  keywords: string[];
}

export class AIService {
  private keywords = {
    billing: ['bill', 'charge', 'payment', 'refund', 'invoice', 'money', 'cost', 'price', 'fee', 'subscription', 'credit', 'debit'],
    technical: ['error', 'bug', 'crash', 'login', 'password', 'app', 'website', 'connection', 'loading', 'server', 'database', 'api'],
    service: ['support', 'staff', 'representative', 'customer service', 'help', 'agent', 'response time', 'waiting', 'queue'],
    product: ['defective', 'broken', 'quality', 'delivery', 'shipping', 'wrong item', 'damaged', 'missing', 'packaging'],
  };

  private urgentKeywords = ['urgent', 'emergency', 'critical', 'down', 'outage', 'immediately', 'asap', 'loss', 'security breach'];
  private negativeKeywords = ['angry', 'frustrated', 'terrible', 'worst', 'hate', 'disappointed', 'unacceptable', 'furious', 'disgusted'];
  private positiveKeywords = ['thank', 'great', 'excellent', 'satisfied', 'good', 'appreciate', 'helpful', 'amazing', 'wonderful'];

  async classifyComplaint(text: string): Promise<AIAnalysis> {
    const lowercaseText = text.toLowerCase();
    const words = lowercaseText.split(/\s+/);
    
    // Category classification with scoring
    let category: AIAnalysis['category'] = 'General';
    let maxScore = 0;
    const foundKeywords: string[] = [];

    for (const [cat, keywords] of Object.entries(this.keywords)) {
      const matchedKeywords = keywords.filter(keyword => lowercaseText.includes(keyword));
      const score = matchedKeywords.length;
      
      if (score > maxScore) {
        maxScore = score;
        category = cat.charAt(0).toUpperCase() + cat.slice(1) as AIAnalysis['category'];
        foundKeywords.push(...matchedKeywords);
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

    // Priority assignment with enhanced logic
    let priority: AIAnalysis['priority'] = 'Low';
    const urgentScore = this.urgentKeywords.filter(keyword => lowercaseText.includes(keyword)).length;
    
    // Check for specific high-priority scenarios
    const hasDataLoss = lowercaseText.includes('data') && (lowercaseText.includes('lost') || lowercaseText.includes('missing'));
    const hasSecurityIssue = lowercaseText.includes('security') || lowercaseText.includes('breach') || lowercaseText.includes('hack');
    const hasFinancialImpact = lowercaseText.includes('money') && (lowercaseText.includes('lost') || lowercaseText.includes('charged'));

    if (urgentScore > 0 || hasDataLoss || hasSecurityIssue || hasFinancialImpact) {
      priority = 'Urgent';
    } else if (sentiment === 'Negative' && (category === 'Technical' || category === 'Billing')) {
      priority = 'High';
    } else if (sentiment === 'Negative' || category === 'Technical' || category === 'Billing') {
      priority = 'Medium';
    }

    // Calculate confidence score based on keyword matches and text length
    const textLength = words.length;
    const keywordDensity = foundKeywords.length / textLength;
    const sentimentStrength = Math.abs(negativeScore - positiveScore) / textLength;
    
    const confidence = Math.min(0.95, 
      0.3 + // base confidence
      (keywordDensity * 0.4) + // keyword relevance
      (sentimentStrength * 0.2) + // sentiment clarity
      (urgentScore > 0 ? 0.1 : 0) // urgency bonus
    );

    return {
      category,
      sentiment,
      priority,
      confidence,
      keywords: [...new Set(foundKeywords)] // remove duplicates
    };
  }

  async generateResponse(intent: string, text: string, context?: any): Promise<string> {
    const lowercaseText = text.toLowerCase();
    
    // Enhanced response generation with context awareness
    const responses = {
      greeting: [
        "Hello! I'm here to help you with your complaints and inquiries. How can I assist you today?",
        "Hi there! I'm your AI assistant for the complaint management system. What can I help you with?",
        "Welcome! I'm here to guide you through the complaint process. How may I assist you?"
      ],
      
      file_complaint: [
        "I'd be happy to help you file a complaint. Could you please provide more details about the issue you're experiencing?",
        "Let me assist you in filing your complaint. Please describe the problem you're facing in detail.",
        "I'll help you submit your complaint. What specific issue would you like to report?"
      ],
      
      check_status: [
        "I can help you check the status of your complaints. Let me retrieve that information for you.",
        "Let me look up the current status of your complaints and any recent updates.",
        "I'll check on your complaint status right away."
      ],
      
      escalation: [
        "I understand your frustration. Let me escalate this to our priority queue and ensure it gets immediate attention from a senior agent.",
        "This issue requires immediate attention. I'm escalating it to our specialized team for urgent handling.",
        "I'm sorry you're experiencing this issue. Let me escalate this complaint to ensure it receives priority treatment."
      ],
      
      faq_billing: [
        "For billing inquiries, you can view your invoice in your account dashboard. If you notice any discrepancies, please file a detailed complaint.",
        "Billing issues are handled by our specialized billing team. I can help you file a complaint that will be routed directly to them.",
        "I can assist with billing-related questions. Would you like me to help you file a billing complaint or check existing ones?"
      ],
      
      faq_technical: [
        "For technical issues, please try refreshing the page or clearing your browser cache first. If the problem persists, I'll help you file a technical complaint.",
        "Technical problems can be frustrating. Let me help you document this issue properly so our technical team can resolve it quickly.",
        "I understand technical issues can impact your work. Would you like me to help you file a technical support complaint?"
      ],
      
      feedback: [
        "Thank you for your feedback! Your input helps us improve our services. Is there anything specific you'd like us to address?",
        "We appreciate your feedback. Would you like to submit formal feedback for any of your resolved complaints?",
        "Your feedback is valuable to us. I can help you submit detailed feedback for any completed complaints."
      ],
      
      default: [
        "I'm here to help with complaint management. I can assist you with filing complaints, checking status, or answering questions about our process.",
        "How can I assist you today? I can help with complaint submission, status updates, or general inquiries.",
        "I'm your complaint management assistant. What would you like to do today?"
      ]
    };

    // Determine intent based on keywords
    let responseKey = 'default';
    
    if (lowercaseText.includes('hello') || lowercaseText.includes('hi') || lowercaseText.includes('hey')) {
      responseKey = 'greeting';
    } else if (lowercaseText.includes('status') || lowercaseText.includes('update') || lowercaseText.includes('progress')) {
      responseKey = 'check_status';
    } else if (lowercaseText.includes('complaint') || lowercaseText.includes('issue') || lowercaseText.includes('problem') || lowercaseText.includes('file')) {
      responseKey = 'file_complaint';
    } else if (lowercaseText.includes('billing') || lowercaseText.includes('payment') || lowercaseText.includes('charge')) {
      responseKey = 'faq_billing';
    } else if (lowercaseText.includes('technical') || lowercaseText.includes('error') || lowercaseText.includes('bug')) {
      responseKey = 'faq_technical';
    } else if (lowercaseText.includes('escalate') || lowercaseText.includes('urgent') || lowercaseText.includes('supervisor')) {
      responseKey = 'escalation';
    } else if (lowercaseText.includes('feedback') || lowercaseText.includes('review') || lowercaseText.includes('rate')) {
      responseKey = 'feedback';
    }

    // Select a random response from the appropriate category
    const responseArray = responses[responseKey as keyof typeof responses];
    const randomIndex = Math.floor(Math.random() * responseArray.length);
    
    return responseArray[randomIndex];
  }

  async suggestCategories(text: string): Promise<string[]> {
    const analysis = await this.classifyComplaint(text);
    const suggestions = [analysis.category];
    
    // Add alternative suggestions based on keywords
    const lowercaseText = text.toLowerCase();
    
    for (const [cat, keywords] of Object.entries(this.keywords)) {
      const category = cat.charAt(0).toUpperCase() + cat.slice(1);
      const matchCount = keywords.filter(keyword => lowercaseText.includes(keyword)).length;
      
      if (matchCount > 0 && !suggestions.includes(category)) {
        suggestions.push(category);
      }
    }
    
    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  async extractKeywords(text: string): Promise<string[]> {
    const lowercaseText = text.toLowerCase();
    const allKeywords: string[] = [];
    
    // Extract keywords from all categories
    for (const keywords of Object.values(this.keywords)) {
      const found = keywords.filter(keyword => lowercaseText.includes(keyword));
      allKeywords.push(...found);
    }
    
    // Add urgent and sentiment keywords
    const urgentFound = this.urgentKeywords.filter(keyword => lowercaseText.includes(keyword));
    const negativeFound = this.negativeKeywords.filter(keyword => lowercaseText.includes(keyword));
    const positiveFound = this.positiveKeywords.filter(keyword => lowercaseText.includes(keyword));
    
    allKeywords.push(...urgentFound, ...negativeFound, ...positiveFound);
    
    // Return unique keywords
    return [...new Set(allKeywords)];
  }
}
