import re
from typing import Dict, Any, List
from textblob import TextBlob

class SentimentAnalyzer:
    """Sentiment analysis for complaint text"""
    
    def __init__(self):
        self.sentiment_labels = {
            'positive': 'Positive',
            'negative': 'Negative',
            'neutral': 'Neutral'
        }
        
        # Keywords for enhanced sentiment detection
        self.positive_keywords = [
            'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
            'satisfied', 'happy', 'pleased', 'thank', 'appreciate', 'love'
        ]
        
        self.negative_keywords = [
            'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate',
            'angry', 'frustrated', 'disappointed', 'upset', 'annoyed',
            'broken', 'failed', 'wrong', 'issue', 'problem', 'error'
        ]
        
        self.urgency_keywords = [
            'urgent', 'emergency', 'critical', 'immediately', 'asap',
            'serious', 'important', 'priority'
        ]
    
    def analyze(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment of given text"""
        try:
            # Clean the text
            cleaned_text = self._preprocess_text(text)
            
            # Use TextBlob for basic sentiment analysis
            blob = TextBlob(cleaned_text)
            polarity = blob.sentiment.polarity
            subjectivity = blob.sentiment.subjectivity
            
            # Enhance with keyword-based analysis
            keyword_sentiment = self._keyword_based_sentiment(cleaned_text)
            
            # Combine scores
            final_polarity = (polarity + keyword_sentiment) / 2
            
            # Determine sentiment label
            if final_polarity > 0.1:
                sentiment = 'Positive'
            elif final_polarity < -0.1:
                sentiment = 'Negative'
            else:
                sentiment = 'Neutral'
            
            # Calculate confidence
            confidence = abs(final_polarity)
            
            # Detect urgency
            urgency_score = self._detect_urgency(cleaned_text)
            
            # Detect emotions
            emotions = self._detect_emotions(cleaned_text)
            
            return {
                'sentiment': sentiment,
                'polarity': round(final_polarity, 3),
                'subjectivity': round(subjectivity, 3),
                'confidence': round(confidence, 3),
                'urgency_score': round(urgency_score, 3),
                'emotions': emotions,
                'is_complaint': self._is_complaint(cleaned_text)
            }
            
        except Exception as e:
            print(f"Sentiment analysis error: {e}")
            return {
                'sentiment': 'Neutral',
                'polarity': 0.0,
                'subjectivity': 0.0,
                'confidence': 0.0,
                'urgency_score': 0.0,
                'emotions': [],
                'is_complaint': True
            }
    
    def _preprocess_text(self, text: str) -> str:
        """Preprocess text for sentiment analysis"""
        # Convert to lowercase
        text = text.lower()
        
        # Remove URLs, email addresses
        text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', text)
        text = re.sub(r'\S+@\S+', '', text)
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        return text
    
    def _keyword_based_sentiment(self, text: str) -> float:
        """Enhanced sentiment scoring based on keywords"""
        words = text.split()
        positive_count = sum(1 for word in words if word in self.positive_keywords)
        negative_count = sum(1 for word in words if word in self.negative_keywords)
        
        total_words = len(words)
        if total_words == 0:
            return 0.0
        
        # Calculate sentiment score
        sentiment_score = (positive_count - negative_count) / total_words
        
        # Normalize to [-1, 1] range
        return max(-1.0, min(1.0, sentiment_score * 10))
    
    def _detect_urgency(self, text: str) -> float:
        """Detect urgency level in text"""
        urgency_count = sum(1 for word in self.urgency_keywords if word in text)
        
        # Check for multiple exclamation marks
        exclamation_count = text.count('!')
        
        # Check for capital letters (indicating shouting)
        capital_ratio = sum(1 for c in text if c.isupper()) / len(text) if text else 0
        
        # Combine factors
        urgency_score = (urgency_count * 0.3 + 
                        min(exclamation_count, 3) * 0.1 + 
                        capital_ratio * 0.2)
        
        return min(1.0, urgency_score)
    
    def _detect_emotions(self, text: str) -> List[str]:
        """Detect specific emotions in text"""
        emotions = []
        
        # Emotion keywords mapping
        emotion_keywords = {
            'anger': ['angry', 'furious', 'mad', 'rage', 'pissed', 'livid'],
            'frustration': ['frustrated', 'annoyed', 'irritated', 'fed up'],
            'sadness': ['sad', 'disappointed', 'upset', 'depressed'],
            'fear': ['worried', 'concerned', 'anxious', 'scared'],
            'joy': ['happy', 'pleased', 'satisfied', 'delighted'],
            'surprise': ['surprised', 'shocked', 'amazed', 'unexpected']
        }
        
        for emotion, keywords in emotion_keywords.items():
            if any(keyword in text for keyword in keywords):
                emotions.append(emotion)
        
        return emotions
    
    def _is_complaint(self, text: str) -> bool:
        """Determine if text is likely a complaint"""
        complaint_indicators = [
            'complaint', 'issue', 'problem', 'error', 'bug', 'fault',
            'not working', 'broken', 'failed', 'wrong', 'bad', 'terrible',
            'disappointed', 'unsatisfied', 'refund', 'return'
        ]
        
        return any(indicator in text for indicator in complaint_indicators)
    
    def get_sentiment_summary(self, texts: List[str]) -> Dict[str, Any]:
        """Analyze sentiment for multiple texts and provide summary"""
        sentiments = []
        polarities = []
        urgencies = []
        
        for text in texts:
            result = self.analyze(text)
            sentiments.append(result['sentiment'])
            polarities.append(result['polarity'])
            urgencies.append(result['urgency_score'])
        
        # Calculate statistics
        sentiment_counts = {
            'Positive': sentiments.count('Positive'),
            'Negative': sentiments.count('Negative'),
            'Neutral': sentiments.count('Neutral')
        }
        
        avg_polarity = sum(polarities) / len(polarities) if polarities else 0
        avg_urgency = sum(urgencies) / len(urgencies) if urgencies else 0
        
        return {
            'total_analyzed': len(texts),
            'sentiment_distribution': sentiment_counts,
            'average_polarity': round(avg_polarity, 3),
            'average_urgency': round(avg_urgency, 3),
            'overall_sentiment': max(sentiment_counts, key=sentiment_counts.get)
        }
