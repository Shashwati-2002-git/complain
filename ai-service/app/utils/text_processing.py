import re
import string
from typing import List, Dict, Any

def preprocess_text(text: str) -> str:
    """Clean and preprocess text for analysis"""
    # Convert to lowercase
    text = text.lower()
    
    # Remove URLs
    text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', text)
    
    # Remove email addresses
    text = re.sub(r'\S+@\S+', '', text)
    
    # Remove punctuation
    text = text.translate(str.maketrans('', '', string.punctuation))
    
    # Remove extra whitespace
    text = ' '.join(text.split())
    
    return text

def tokenize_text(text: str) -> List[str]:
    """Tokenize text into words"""
    cleaned_text = preprocess_text(text)
    return cleaned_text.split()

def extract_features(text: str) -> Dict[str, Any]:
    """Extract various features from text"""
    tokens = tokenize_text(text)
    
    features = {
        'word_count': len(tokens),
        'char_count': len(text),
        'sentence_count': len([s for s in text.split('.') if s.strip()]),
        'avg_word_length': sum(len(word) for word in tokens) / len(tokens) if tokens else 0,
        'exclamation_count': text.count('!'),
        'question_count': text.count('?'),
        'capital_letters': sum(1 for c in text if c.isupper()),
        'capital_ratio': sum(1 for c in text if c.isupper()) / len(text) if text else 0
    }
    
    return features

def get_text_statistics(text: str) -> Dict[str, Any]:
    """Get comprehensive text statistics"""
    features = extract_features(text)
    tokens = tokenize_text(text)
    
    # Word frequency
    word_freq = {}
    for word in tokens:
        word_freq[word] = word_freq.get(word, 0) + 1
    
    # Most common words
    most_common = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:10]
    
    return {
        'basic_features': features,
        'vocabulary_size': len(set(tokens)),
        'most_common_words': most_common,
        'unique_word_ratio': len(set(tokens)) / len(tokens) if tokens else 0
    }

def clean_complaint_text(text: str) -> str:
    """Specifically clean complaint text for processing"""
    # Remove common complaint form artifacts
    text = re.sub(r'complaint\s*id\s*:?\s*\d+', '', text, flags=re.IGNORECASE)
    text = re.sub(r'date\s*:?\s*\d{1,2}[/-]\d{1,2}[/-]\d{2,4}', '', text, flags=re.IGNORECASE)
    text = re.sub(r'time\s*:?\s*\d{1,2}:\d{2}', '', text, flags=re.IGNORECASE)
    
    # Remove excessive repetition
    text = re.sub(r'(.)\1{3,}', r'\1\1', text)  # Reduce repeated characters
    
    # Clean up spacing
    text = ' '.join(text.split())
    
    return text.strip()

def validate_complaint_text(text: str) -> Dict[str, Any]:
    """Validate complaint text quality and completeness"""
    if not text or not text.strip():
        return {
            'is_valid': False,
            'issues': ['Text is empty'],
            'recommendations': ['Please provide a description of your complaint']
        }
    
    issues = []
    recommendations = []
    
    # Check minimum length
    if len(text.strip()) < 10:
        issues.append('Text too short')
        recommendations.append('Please provide more details about your complaint')
    
    # Check maximum length
    if len(text) > 5000:
        issues.append('Text too long')
        recommendations.append('Please summarize your complaint to under 5000 characters')
    
    # Check for meaningful content
    tokens = tokenize_text(text)
    if len(tokens) < 3:
        issues.append('Insufficient detail')
        recommendations.append('Please describe your issue with more detail')
    
    # Check for contact info (which should be in separate fields)
    if re.search(r'\b\d{10}\b|\b\d{3}-\d{3}-\d{4}\b', text):
        issues.append('Contains phone number')
        recommendations.append('Please use the contact fields instead of including phone in description')
    
    if re.search(r'\S+@\S+\.\S+', text):
        issues.append('Contains email address')
        recommendations.append('Please use the contact fields instead of including email in description')
    
    return {
        'is_valid': len(issues) == 0,
        'issues': issues,
        'recommendations': recommendations,
        'word_count': len(tokens),
        'char_count': len(text)
    }
