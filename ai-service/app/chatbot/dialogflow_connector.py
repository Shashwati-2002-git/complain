import os
from google.cloud import dialogflow
from typing import Dict, Any

class DialogflowConnector:
    """Connector for Google Dialogflow integration"""
    
    def __init__(self, project_id: str = None, language_code: str = "en"):
        self.project_id = project_id or os.environ.get('DIALOGFLOW_PROJECT_ID')
        self.language_code = language_code
        self.session_client = None
        
        if self.project_id:
            try:
                self.session_client = dialogflow.SessionsClient()
            except Exception as e:
                print(f"Failed to initialize Dialogflow client: {e}")
    
    def get_response(self, message: str, session_id: str = "default") -> str:
        """Get response from Dialogflow"""
        if not self.session_client or not self.project_id:
            return self._get_fallback_response(message)
        
        try:
            session = self.session_client.session_path(self.project_id, session_id)
            text_input = dialogflow.TextInput(text=message, language_code=self.language_code)
            query_input = dialogflow.QueryInput(text=text_input)
            
            response = self.session_client.detect_intent(
                request={"session": session, "query_input": query_input}
            )
            
            return response.query_result.fulfillment_text or self._get_fallback_response(message)
            
        except Exception as e:
            print(f"Dialogflow error: {e}")
            return self._get_fallback_response(message)
    
    def _get_fallback_response(self, message: str) -> str:
        """Provide fallback responses when Dialogflow is unavailable"""
        message_lower = message.lower()
        
        if any(word in message_lower for word in ["hello", "hi", "hey", "start"]):
            return "Hello! I'm your complaint assistant. How can I help you today?"
        elif any(word in message_lower for word in ["complaint", "issue", "problem"]):
            return "I can help you file a complaint. Please describe your issue in detail."
        elif any(word in message_lower for word in ["status", "track", "update"]):
            return "To track your complaint, please provide your complaint reference number."
        elif any(word in message_lower for word in ["urgent", "emergency", "immediate"]):
            return "I understand this is urgent. Please file a high-priority complaint with all necessary details."
        elif any(word in message_lower for word in ["help", "support", "assist"]):
            return "I can assist you with filing complaints, tracking status, and providing information about our services."
        else:
            return "I'm here to help with your complaints and questions. What would you like to know?"
    
    def check_connection(self) -> bool:
        """Check if Dialogflow is properly configured"""
        return self.session_client is not None and self.project_id is not None
