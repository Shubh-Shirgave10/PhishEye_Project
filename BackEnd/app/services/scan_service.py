import re
import requests
import hashlib
import json
import logging
from urllib.parse import urlparse
from bs4 import BeautifulSoup
import time
from datetime import datetime, timedelta
from app import db
from app.models.scan import Scan
from app.ml.prediction import PhishingPredictor
from app.ml.preprocessing import URLPreprocessor

logger = logging.getLogger(__name__)

class URLScanner:
    """URL scanning service with Hybrid Detection and Caching"""
    
    def __init__(self):
        self.predictor = PhishingPredictor()
        self.preprocessor = URLPreprocessor()
        
        # Fallback patterns
        self.suspicious_keywords = [
            'verify', 'account', 'suspend', 'update', 'confirm', 'login',
            'password', 'secure', 'banking', 'paypal', 'amazon', 'ebay'
        ]
        
        self.malicious_patterns = [
            r'\.tk$', r'\.ml$', r'\.ga$', r'\.cf$', r'\.gq$',  # Free domains
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}',  # IP addresses
            r'bit\.ly', r'tinyurl',  # URL shorteners
        ]
    
    def scan(self, url, user_id=None):
        """
        Main entry point for scanning.
        1. Normalize URL
        2. Check Cache
        3. If miss, run ML
        4. Store and return
        """
        # 1. Normalize
        normalized_url = self.preprocessor.preprocess(url)
        
        # 2. Check Cache
        cached_result = self._check_cache(normalized_url)
        if cached_result:
            logger.info(f"CACHE HIT: {normalized_url}")
            return cached_result
            
        logger.info(f"CACHE MISS: {normalized_url} - Running ML...")
        
        # 3. Run ML Pipeline
        ml_result = self.predictor.predict(url) # Predictor handles internal preprocessing too, but we need fresh features
        
        if ml_result:
            # Construct result
            scan_result = {
                'url': url,
                'normalized_url': normalized_url,
                'verdict': ml_result['result'],
                'risk_score': ml_result['confidence'], # Using confidence as risk score for now
                'confidence': ml_result['confidence'],
                'cached': False,
                'threats': ml_result['signals'],
                'details': {
                    'ml_scan': True,
                    'features': ml_result['features']
                }
            }
            
            # Generate feature hash for signature
            feature_str = json.dumps(ml_result['features'], sort_keys=True)
            feature_hash = hashlib.sha256(feature_str.encode()).hexdigest()
            
            # 4. Store Result
            if user_id:
                self._save_to_db(user_id, scan_result, feature_hash)
            
            return scan_result
            
        else:
            # Fallback if ML fails
            return self._fallback_scan(url, normalized_url)

    def _check_cache(self, normalized_url):
        """Checks DB for recent existing scan of this URL"""
        # Look for scan within last 24 hours (optional policy) or just latest
        recent_scan = Scan.query.filter_by(normalized_url=normalized_url)\
            .order_by(Scan.created_at.desc()).first()
            
        if recent_scan:
            return {
                'url': recent_scan.url,
                'normalized_url': recent_scan.normalized_url,
                'verdict': recent_scan.status.upper(),
                'risk_score': recent_scan.confidence_score,
                'confidence': recent_scan.confidence_score,
                'cached': True,
                'threats': recent_scan.threats,
                'details': recent_scan.details
            }
        return None

    def _save_to_db(self, user_id, result, feature_hash):
        """Saves scan result to database"""
        try:
            new_scan = Scan(
                user_id=user_id,
                url=result['url'],
                normalized_url=result['normalized_url'],
                status=result['verdict'].lower(),
                confidence_score=result['risk_score'],
                scan_type='quick',
                threats=result['threats'],
                details=result['details'],
                feature_hash=feature_hash
            )
            db.session.add(new_scan)
            db.session.commit()
            logger.info(f"Stored result for {result['normalized_url']}")
        except Exception as e:
            logger.error(f"Failed to save scan result: {str(e)}")
            db.session.rollback()

    def _fallback_scan(self, url, normalized_url):
        """Rule-based fallback"""
        # (Simplified fallback logic reuse)
        return {
            'url': url,
            'normalized_url': normalized_url,
            'verdict': 'SUSPICIOUS',
            'risk_score': 0.5,
            'confidence': 0.5,
            'cached': False,
            'threats': ['scan_error', 'fallback_used'],
            'details': {'error': 'ML Service Unavailable'}
        }

    # API compatibility wrappers
    def quick_scan(self, url, user_id=None):
        return self.scan(url, user_id)
        
    def deep_scan(self, url, user_id=None):
        # reuse quick scan for now as base
        return self.scan(url, user_id)
