import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { aiService } from '../../services/aiService';
import { useComplaints } from '../../contexts/ComplaintContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: "Hello! I'm your AI assistant. I can help you file complaints, check status, or answer questions. How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { createComplaint, getUserComplaints } = useComplaints();
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (text: string, sender: 'user' | 'bot') => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage = inputValue;
    setInputValue('');
    addMessage(userMessage, 'user');
    setLoading(true);

    try {
      // Check if user wants to file a complaint
      if (userMessage.toLowerCase().includes('complaint') || 
          userMessage.toLowerCase().includes('issue') || 
          userMessage.toLowerCase().includes('problem')) {
        
        // Extract complaint details if provided
        if (userMessage.length > 50 && user) {
          // Create complaint from chat message
          const title = userMessage.substring(0, 60) + '...';
          const complaint = await createComplaint(title, userMessage, user.id);
          
          addMessage(
            `I've created a complaint for you (Ticket #${complaint.id}). It has been classified as ${complaint.category} with ${complaint.priority} priority. You'll receive updates on its progress.`,
            'bot'
          );
          
          addNotification('success', 'Complaint Filed via Chat', 
            `Ticket #${complaint.id} has been created and assigned ${complaint.priority} priority.`);
        } else {
          addMessage(
            "I'd be happy to help you file a complaint. Could you please provide more details about the issue you're experiencing?",
            'bot'
          );
        }
      } else if (userMessage.toLowerCase().includes('status')) {
        // Check complaint status
        if (user) {
          const userComplaints = getUserComplaints(user.id);
          if (userComplaints.length === 0) {
            addMessage("You don't have any complaints filed yet. Would you like to file one?", 'bot');
          } else {
            const recentComplaint = userComplaints[userComplaints.length - 1];
            addMessage(
              `Your most recent complaint (Ticket #${recentComplaint.id}) is currently "${recentComplaint.status}". ${
                recentComplaint.assignedTo ? `It's assigned to ${recentComplaint.assignedTo}.` : 'It will be assigned to an agent soon.'
              }`,
              'bot'
            );
          }
        }
      } else {
        // General AI response
        const response = await aiService.generateResponse('general', userMessage);
        addMessage(response, 'bot');
      }
    } catch (error) {
      addMessage("I'm sorry, I encountered an error. Please try again or contact support directly.", 'bot');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 z-50"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white bg-opacity-20 p-2 rounded-full">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">AI Assistant</h3>
            <p className="text-xs text-blue-100">Online • Ready to help</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`p-2 rounded-full ${
              message.sender === 'user' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white border border-gray-200 text-blue-500'
            }`}>
              {message.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[80%] p-3 rounded-xl ${
              message.sender === 'user'
                ? 'bg-blue-500 text-white ml-auto'
                : 'bg-white border border-gray-200 text-gray-800'
            }`}>
              <p className="text-sm leading-relaxed">{message.text}</p>
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
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
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
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
            onKeyPress={handleKeyPress}
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
      </div>
    </div>
  );
}