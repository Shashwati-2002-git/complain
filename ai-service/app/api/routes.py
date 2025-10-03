from flask import Blueprint, request, jsonify
from app.chatbot.rasa_connector import RasaConnector
from app.chatbot.dialogflow_connector import DialogflowConnector
from app.models.classifier import ComplaintClassifier
from app.models.sentiment import SentimentAnalyzer

api_bp = Blueprint('api', __name__)

# Initialize connectors and models
rasa_connector = RasaConnector()
dialogflow_connector = DialogflowConnector()
classifier = ComplaintClassifier()
sentiment_analyzer = SentimentAnalyzer()

@api_bp.route('/chatbot/message', methods=['POST'])
def chatbot_message():
    """Handle chatbot conversation"""
    try:
        data = request.get_json()
        message = data.get('message', '')
        session_id = data.get('session_id', 'default')
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Use Rasa for chatbot response
        response = rasa_connector.get_response(message, session_id)
        
        return jsonify({
            'response': response,
            'session_id': session_id
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/analyze/complaint', methods=['POST'])
def analyze_complaint():
    """Analyze complaint text for category, priority, and sentiment"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        # Perform analysis
        category = classifier.classify(text)
        priority = classifier.get_priority(text)
        sentiment = sentiment_analyzer.analyze(text)
        
        return jsonify({
            'category': category,
            'priority': priority,
            'sentiment': sentiment,
            'analysis': {
                'confidence': classifier.get_confidence(),
                'keywords': classifier.extract_keywords(text),
                'urgency_score': classifier.get_urgency_score(text)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/models/retrain', methods=['POST'])
def retrain_models():
    """Retrain AI models with new data"""
    try:
        data = request.get_json()
        training_data = data.get('training_data', [])
        
        if not training_data:
            return jsonify({'error': 'Training data is required'}), 400
        
        # Retrain classifier
        result = classifier.retrain(training_data)
        
        return jsonify({
            'status': 'success',
            'message': 'Models retrained successfully',
            'accuracy': result.get('accuracy', 0)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/extract-complaint-data', methods=['POST'])
def extract_complaint_data():
    """Extract structured complaint data from conversation"""
    try:
        data = request.get_json()
        conversation = data.get('conversation', '')
        analysis = data.get('analysis', {})
        user_info = data.get('user_info', {})
        
        if not conversation:
            return jsonify({'error': 'Conversation text is required'}), 400
        
        # Extract structured data from conversation
        extracted_data = {
            'title': _generate_complaint_title(conversation, analysis),
            'description': _format_complaint_description(conversation, user_info),
            'tags': _extract_tags(conversation, analysis),
            'entities': _extract_entities(conversation),
            'actions': _suggest_actions(conversation, analysis),
            'estimatedTime': _estimate_resolution_time(analysis)
        }
        
        return jsonify(extracted_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def _generate_complaint_title(conversation, analysis):
    """Generate a concise title for the complaint"""
    category = analysis.get('category', 'General')
    # Simple title generation - can be enhanced with NLP
    lines = conversation.split('\n')
    user_lines = [line for line in lines if line.startswith('User:')]
    
    if user_lines:
        first_user_message = user_lines[0].replace('User:', '').strip()
        # Truncate to first sentence or 50 characters
        title = first_user_message.split('.')[0][:50]
        return f"{category}: {title}..."
    
    return f"{category} - Complaint from Chat"

def _format_complaint_description(conversation, user_info):
    """Format conversation into complaint description"""
    description = f"Complaint auto-generated from chat conversation.\n\n"
    description += f"User: {user_info.get('name', 'Unknown')} ({user_info.get('email', 'Unknown')})\n\n"
    description += "Conversation:\n"
    description += conversation.replace('User:', '\n**User:**').replace('Bot:', '\n**Assistant:**')
    return description

def _extract_tags(conversation, analysis):
    """Extract relevant tags from conversation"""
    tags = ['auto-generated', 'chat-based']
    
    if analysis.get('category'):
        tags.append(analysis['category'])
    
    if analysis.get('priority'):
        tags.append(f"priority-{analysis['priority']}")
    
    # Add common keywords as tags
    keywords = ['billing', 'technical', 'service', 'account', 'payment', 'bug', 'error']
    conversation_lower = conversation.lower()
    
    for keyword in keywords:
        if keyword in conversation_lower:
            tags.append(keyword)
    
    return list(set(tags))  # Remove duplicates

def _extract_entities(conversation):
    """Extract entities like emails, phone numbers, order IDs"""
    import re
    
    entities = {}
    
    # Extract email addresses
    emails = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', conversation)
    if emails:
        entities['emails'] = emails
    
    # Extract phone numbers (simple pattern)
    phones = re.findall(r'\b\d{3}-\d{3}-\d{4}\b|\b\(\d{3}\)\s*\d{3}-\d{4}\b', conversation)
    if phones:
        entities['phones'] = phones
    
    # Extract order/ticket IDs (pattern: letters followed by numbers)
    order_ids = re.findall(r'\b[A-Z]{2,}\d{4,}\b', conversation)
    if order_ids:
        entities['order_ids'] = order_ids
    
    return entities

def _suggest_actions(conversation, analysis):
    """Suggest appropriate actions based on conversation"""
    actions = []
    
    priority = analysis.get('priority', 'medium')
    category = analysis.get('category', 'general')
    
    if priority == 'high':
        actions.append('Immediate response required')
        actions.append('Escalate to senior support')
    
    if 'billing' in category.lower():
        actions.append('Review billing records')
        actions.append('Contact billing department')
    
    if 'technical' in category.lower():
        actions.append('Technical investigation required')
        actions.append('Assign to technical team')
    
    if not actions:
        actions.append('Standard support review')
        actions.append('Contact customer for follow-up')
    
    return actions

def _estimate_resolution_time(analysis):
    """Estimate resolution time based on analysis"""
    priority = analysis.get('priority', 'medium')
    category = analysis.get('category', 'general')
    
    if priority == 'high':
        return '4-8 hours'
    elif priority == 'medium':
        return '24-48 hours'
    elif 'billing' in category.lower():
        return '2-3 business days'
    elif 'technical' in category.lower():
        return '1-2 business days'
    else:
        return '24-72 hours'
