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
