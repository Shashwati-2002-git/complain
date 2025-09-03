import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import re
from typing import List, Dict, Any

class ComplaintClassifier:
    """AI model for classifying complaints into categories and determining priority"""
    
    def __init__(self):
        self.categories = [
            'Technical Support',
            'Billing',
            'Product Quality',
            'Customer Service',
            'Delivery',
            'General Inquiry',
            'Refund Request',
            'Account Issues'
        ]
        
        self.priority_levels = ['Low', 'Medium', 'High', 'Critical']
        
        # Initialize models
        self.category_model = Pipeline([
            ('tfidf', TfidfVectorizer(max_features=5000, stop_words='english')),
            ('classifier', MultinomialNB())
        ])
        
        self.priority_model = Pipeline([
            ('tfidf', TfidfVectorizer(max_features=3000, stop_words='english')),
            ('classifier', MultinomialNB())
        ])
        
        self.confidence_score = 0.0
        self.is_trained = False
        
        # Load pre-trained models if available
        self._load_models()
        
        # If no models loaded, train with sample data
        if not self.is_trained:
            self._train_with_sample_data()
    
    def _load_models(self):
        """Load pre-trained models from disk"""
        try:
            self.category_model = joblib.load('models/category_model.pkl')
            self.priority_model = joblib.load('models/priority_model.pkl')
            self.is_trained = True
            print("Loaded pre-trained models successfully")
        except FileNotFoundError:
            print("No pre-trained models found, will train with sample data")
    
    def _save_models(self):
        """Save trained models to disk"""
        import os
        os.makedirs('models', exist_ok=True)
        joblib.dump(self.category_model, 'models/category_model.pkl')
        joblib.dump(self.priority_model, 'models/priority_model.pkl')
    
    def _train_with_sample_data(self):
        """Train models with sample complaint data"""
        # Sample training data
        sample_data = [
            ("My internet connection is very slow", "Technical Support", "Medium"),
            ("I was charged twice for the same service", "Billing", "High"),
            ("The product I received is damaged", "Product Quality", "High"),
            ("Customer service representative was rude", "Customer Service", "Medium"),
            ("My order hasn't arrived yet", "Delivery", "Medium"),
            ("How do I change my password?", "General Inquiry", "Low"),
            ("I want to return this product", "Refund Request", "Medium"),
            ("Cannot login to my account", "Account Issues", "High"),
            ("Website is down and not working", "Technical Support", "Critical"),
            ("Urgent: Wrong amount deducted", "Billing", "Critical"),
            ("Product stopped working after one day", "Product Quality", "High"),
            ("Need help with installation", "Technical Support", "Low"),
            ("When will my refund be processed?", "Refund Request", "Medium"),
            ("Email notifications not working", "Technical Support", "Low"),
            ("Overcharged on my monthly bill", "Billing", "Medium"),
            ("Received wrong item", "Delivery", "Medium")
        ]
        
        texts = [item[0] for item in sample_data]
        categories = [item[1] for item in sample_data]
        priorities = [item[2] for item in sample_data]
        
        # Train category model
        self.category_model.fit(texts, categories)
        
        # Train priority model
        self.priority_model.fit(texts, priorities)
        
        self.is_trained = True
        self._save_models()
        print("Models trained with sample data")
    
    def classify(self, text: str) -> str:
        """Classify complaint into a category"""
        if not self.is_trained:
            return "General Inquiry"
        
        try:
            cleaned_text = self._preprocess_text(text)
            prediction = self.category_model.predict([cleaned_text])[0]
            
            # Get prediction probabilities for confidence
            probabilities = self.category_model.predict_proba([cleaned_text])[0]
            self.confidence_score = max(probabilities)
            
            return prediction
        except Exception as e:
            print(f"Classification error: {e}")
            return "General Inquiry"
    
    def get_priority(self, text: str) -> str:
        """Determine priority level of complaint"""
        if not self.is_trained:
            return self._rule_based_priority(text)
        
        try:
            cleaned_text = self._preprocess_text(text)
            prediction = self.priority_model.predict([cleaned_text])[0]
            return prediction
        except Exception as e:
            print(f"Priority prediction error: {e}")
            return self._rule_based_priority(text)
    
    def _rule_based_priority(self, text: str) -> str:
        """Rule-based priority assignment when ML model is unavailable"""
        text_lower = text.lower()
        
        # Critical keywords
        if any(word in text_lower for word in ['urgent', 'emergency', 'critical', 'down', 'not working', 'broken']):
            return 'Critical'
        
        # High priority keywords
        elif any(word in text_lower for word in ['billing', 'charged', 'payment', 'money', 'damaged', 'wrong']):
            return 'High'
        
        # Medium priority keywords
        elif any(word in text_lower for word in ['slow', 'late', 'delay', 'issue', 'problem']):
            return 'Medium'
        
        # Default to Low
        else:
            return 'Low'
    
    def get_confidence(self) -> float:
        """Get confidence score of last classification"""
        return float(self.confidence_score)
    
    def extract_keywords(self, text: str) -> List[str]:
        """Extract important keywords from complaint text"""
        # Simple keyword extraction
        cleaned_text = self._preprocess_text(text)
        words = cleaned_text.split()
        
        # Filter out common words and keep meaningful ones
        meaningful_words = [word for word in words if len(word) > 3]
        return meaningful_words[:10]  # Return top 10 keywords
    
    def get_urgency_score(self, text: str) -> float:
        """Calculate urgency score (0-1) based on text content"""
        text_lower = text.lower()
        urgency_keywords = {
            'urgent': 0.9,
            'emergency': 1.0,
            'critical': 0.9,
            'immediately': 0.8,
            'asap': 0.8,
            'broken': 0.7,
            'not working': 0.7,
            'down': 0.6,
            'problem': 0.4,
            'issue': 0.3
        }
        
        score = 0.0
        for keyword, weight in urgency_keywords.items():
            if keyword in text_lower:
                score = max(score, weight)
        
        return score
    
    def _preprocess_text(self, text: str) -> str:
        """Preprocess text for classification"""
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters and numbers
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        return text
    
    def retrain(self, training_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Retrain models with new data"""
        try:
            texts = [item['text'] for item in training_data]
            categories = [item['category'] for item in training_data]
            priorities = [item['priority'] for item in training_data]
            
            # Split data for validation
            X_train, X_test, y_cat_train, y_cat_test = train_test_split(
                texts, categories, test_size=0.2, random_state=42
            )
            
            _, _, y_pri_train, y_pri_test = train_test_split(
                texts, priorities, test_size=0.2, random_state=42
            )
            
            # Train models
            self.category_model.fit(X_train, y_cat_train)
            self.priority_model.fit(X_train, y_pri_train)
            
            # Calculate accuracy
            cat_predictions = self.category_model.predict(X_test)
            pri_predictions = self.priority_model.predict(X_test)
            
            cat_accuracy = accuracy_score(y_cat_test, cat_predictions)
            pri_accuracy = accuracy_score(y_pri_test, pri_predictions)
            
            # Save updated models
            self._save_models()
            
            return {
                'status': 'success',
                'category_accuracy': cat_accuracy,
                'priority_accuracy': pri_accuracy,
                'training_samples': len(training_data)
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': str(e)
            }
