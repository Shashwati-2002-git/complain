from flask import Flask, request, jsonify
from flask_cors import CORS
from app.api.routes import api_bp
from app.models.classifier import ComplaintClassifier
from app.models.sentiment import SentimentAnalyzer
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(api_bp, url_prefix='/api')

# Initialize AI models
classifier = ComplaintClassifier()
sentiment_analyzer = SentimentAnalyzer()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'AI Service'}), 200

@app.route('/classify', methods=['POST'])
def classify_complaint():
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        # Classify complaint
        category = classifier.classify(text)
        priority = classifier.get_priority(text)
        sentiment = sentiment_analyzer.analyze(text)
        
        return jsonify({
            'category': category,
            'priority': priority,
            'sentiment': sentiment,
            'confidence': classifier.get_confidence()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)
