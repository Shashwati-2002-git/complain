import requests
import json
from typing import Dict, Any

class RasaConnector:
    """Connector for Rasa chatbot integration"""
    
    def __init__(self, rasa_url: str = "http://localhost:5005"):
        self.rasa_url = rasa_url
        self.webhook_url = f"{rasa_url}/webhooks/rest/webhook"
        
    def get_response(self, message: str, sender_id: str = "default") -> str:
        """Get response from Rasa chatbot"""
        try:
            payload = {
                "sender": sender_id,
                "message": message
            }
            
            response = requests.post(
                self.webhook_url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    return data[0].get("text", "I'm sorry, I didn't understand that.")
                else:
                    return "I'm here to help you with your complaints. How can I assist you today?"
            else:
                return "I'm experiencing some technical difficulties. Please try again later."
                
        except requests.exceptions.RequestException:
            # Fallback responses when Rasa is not available
            return self._get_fallback_response(message)
    
    def _get_fallback_response(self, message: str) -> str:
        """Provide fallback responses when Rasa is unavailable"""
        message_lower = message.lower()
        
        if any(word in message_lower for word in ["hello", "hi", "hey", "start"]):
            return "Hello! I'm here to help you with your complaints. What can I do for you?"
        elif any(word in message_lower for word in ["complaint", "issue", "problem"]):
            return "I understand you have a complaint. Can you please describe the issue you're facing?"
        elif any(word in message_lower for word in ["status", "track", "update"]):
            return "To check your complaint status, please provide your complaint ID or go to your dashboard."
        elif any(word in message_lower for word in ["help", "support", "assist"]):
            return "I can help you file a complaint, check status, or provide information about our services. What would you like to do?"
        else:
            return "I'm here to help with your complaints. You can file a new complaint, check existing ones, or ask for assistance."
    
    def check_connection(self) -> bool:
        """Check if Rasa server is available"""
        try:
            response = requests.get(f"{self.rasa_url}/health", timeout=5)
            return response.status_code == 200
        except requests.exceptions.RequestException:
            return False
