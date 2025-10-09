import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Settings } from 'lucide-react';
import { aiService } from '../../services/aiService';
import { useComplaints } from '../../contexts/ComplaintContext';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../contexts/NotificationContext';

interface EntityType {
  entity: string;
  value: string;
  confidence?: number;
}

interface IntentType {
  intent: string;
  confidence?: number;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  complaintDetected?: boolean;
  entities?: EntityType[];
  intents?: IntentType[];
  fallback?: boolean;
}

interface WatsonResponse {
  success: boolean;
  response?: string;
  context?: Record<string, unknown>;
  sessionId?: string;
  complaintDetected?: boolean;
  shouldGenerateComplaint?: boolean;
  entities?: EntityType[];
  intents?: IntentType[];
  fallback?: boolean;
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [useWatson, setUseWatson] = useState(true);
  const [watsonSessionId, setWatsonSessionId] = useState<string | null>(null);
  const [watsonContext, setWatsonContext] = useState<Record<string, unknown>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: "Hello! I'm your AI assistant. I can help you file complaints, check status, or answer questions using advanced AI. How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { createComplaint } = useComplaints();
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (text: string, sender: 'user' | 'bot', metadata?: Partial<ChatMessage>) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date(),
      ...metadata,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const callWatsonAssistant = async (message: string): Promise<WatsonResponse> => {
    try {
      if (!user) throw new Error('User not authenticated');

      const response = await fetch('/api/auth/chat-watson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          userId: user.id,
          message,
          context: watsonContext,
        }),
      });

      const data = await response.json();

      if (data.sessionId) setWatsonSessionId(data.sessionId);
      if (data.context) setWatsonContext(data.context);

      return data;
    } catch (error) {
      console.error('Watson API call failed:', error);
      return {
        success: false,
        response: "I'm experiencing some technical difficulties. Let me try to help you anyway.",
        fallback: true,
      };
    }
  };

  const generateWatsonComplaint = async () => {
    if (!user) return;

    try {
      const conversationHistory = messages
        .map((msg) => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
        .join('\n');

      const response = await fetch('/api/auth/generate-complaint-watson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          userId: user.id,
          conversationHistory,
          currentMessage: inputValue,
          context: watsonContext,
        }),
      });

      const data = await response.json();

      if (data.success && data.complaintData) {
        const complaint = await createComplaint(
          data.complaintData.title,
          data.complaintData.description,
          user.id
        );

        addMessage(
          `Perfect! I've analyzed our conversation and created a complaint for you (Ticket #${complaint.id}). ${
            data.watsonResponse || 'Your issue has been properly categorized and will receive appropriate attention.'
          }`,
          'bot',
          { complaintDetected: true, entities: data.entities, intents: data.intents }
        );

        addNotification(
          'success',
          'Smart Complaint Filed',
          `Watson AI created Ticket #${complaint.id} with ${data.complaintData.confidence || 0.8} confidence.`
        );
      }
    } catch (error) {
      console.error('Watson complaint generation failed:', error);
      addMessage(
        "I had trouble creating the complaint automatically, but I can still help you file one manually. Could you describe your issue?",
        'bot'
      );
    }
  };

  const callBasicAI = async (message: string): Promise<string> => {
    try {
      const response = await aiService.generateResponse('general', message);
      return response || "I understand your concern. How can I help you file a complaint?";
    } catch (error) {
      console.error('Basic AI call failed:', error);
      return "I understand your concern. Could you provide more details so I can help you better?";
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;
    const userMessage = inputValue;
    setInputValue('');
    addMessage(userMessage, 'user');
    setLoading(true);

    try {
      if (useWatson) {
        const watsonResponse = await callWatsonAssistant(userMessage);

        if (watsonResponse.success) {
          addMessage(watsonResponse.response || "I understand. How can I help you further?", 'bot', {
            entities: watsonResponse.entities,
            intents: watsonResponse.intents,
          });

          if (watsonResponse.complaintDetected && watsonResponse.shouldGenerateComplaint) {
            await generateWatsonComplaint();
          }
        } else {
          const basicResponse = await callBasicAI(userMessage);
          addMessage(basicResponse, 'bot', { fallback: true });
        }
      } else {
        // Basic AI
        const response = await callBasicAI(userMessage);
        addMessage(response, 'bot');
      }
    } catch (error) {
      console.error('Chat error:', error);
      addMessage("I'm sorry, I'm having trouble processing your message right now. Please try again.", 'bot');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 z-50"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {isOpen && (
        <div className="fixed bottom-16 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="w-5 h-5" />
              <h3 className="font-semibold">AI Assistant</h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setUseWatson(!useWatson)}
                className={`px-2 py-1 rounded text-xs ${useWatson ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'}`}
                title={useWatson ? 'Using Watson AI' : 'Using Basic AI'}
              >
                {useWatson ? 'Watson' : 'Basic'}
              </button>
              <Settings className="cursor-pointer" />
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div key={message.id} className={`flex items-start gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className="bg-white p-3 rounded-xl max-w-[80%]">
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  {message.entities && message.entities.length > 0 && (
                    <div className="mt-1 text-xs opacity-75">Entities: {message.entities.map((e) => e.entity).join(', ')}</div>
                  )}
                  {message.intents && message.intents.length > 0 && (
                    <div className="mt-1 text-xs opacity-75">Intent: {message.intents[0]?.intent}</div>
                  )}
                  <p className="text-xs opacity-50 mt-1">{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-3">
                <div className="bg-white border border-gray-200 text-blue-500 p-2 rounded-full">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-gray-200 p-3 rounded-xl">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                disabled={loading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || loading}
                className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            {useWatson && watsonSessionId && (
              <div className="mt-2 text-xs text-gray-500 flex items-center">
                <Bot className="w-3 h-3 mr-1" />
                Watson Session: {watsonSessionId.substring(0, 8)}...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatBot;
