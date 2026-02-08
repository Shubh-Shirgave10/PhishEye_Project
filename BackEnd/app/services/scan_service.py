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
    
    def scan(self, url, user_id, deep_scan=True):
        """
        Main entry point for scanning.
        1. Normalize URL
        2. Check Cache
        3. If miss, run Predictive Engine
        4. Store and return (always save to user's history)
        """
        # 1. Normalize and validate URL
        # Ensure URL has a protocol
        if not url.startswith(('http://', 'https://', 'ftp://', 'file://')):
            url = 'http://' + url
        
        normalized_url = self.preprocessor.preprocess(url)
        
        # 2. Check Cache (Recent matches within 24 hours)
        cached_result = self._check_cache(normalized_url)
        
        # 3. If cache hit, still save to user's history (but mark as cached)
        if cached_result:
            logger.info(f"CACHE HIT: {normalized_url}")
            # Always save to user's history, even if cached
            # Check if this user already has this scan in their history (to avoid duplicates)
            existing_user_scan = Scan.query.filter_by(
                user_id=user_id,
                normalized_url=normalized_url
            ).order_by(Scan.created_at.desc()).first()
            
            # Only save if user doesn't have this scan yet, or if it's older than 1 minute
            if not existing_user_scan or (datetime.utcnow() - existing_user_scan.created_at).total_seconds() > 60:
                self._save_to_db(user_id, normalized_url, cached_result, None)
            return cached_result
            
        logger.info(f"CACHE MISS: {normalized_url} - Running Analysis Pipeline...")
        
        # 4. Run Modernized Prediction Engine
        # Returns: {result, confidence, signals, explanation, features}
        analysis = self.predictor.predict(url, deep_scan=deep_scan)
        
        # Construct production-ready result
        scan_result = {
            'url': url,
            'status': analysis['result'],
            'confidenceScore': analysis['confidence'],
            'explanation': analysis['explanation'],
            'threats': analysis['signals'],
            'cached': False,
            'details': {
                'deep_scan': deep_scan,
                'features': analysis['features']
            }
        }
        
        # Generate feature hash for signature verification
        feature_str = json.dumps(analysis['features'], sort_keys=True)
        feature_hash = hashlib.sha256(feature_str.encode()).hexdigest()
        
        # 5. Store Result (always save to user's history)
        self._save_to_db(user_id, normalized_url, scan_result, feature_hash)
        
        return scan_result

    def _check_cache(self, normalized_url):
        """Checks DB for recent existing scan of this URL"""
        cache_expiry = datetime.utcnow() - timedelta(hours=24)
        recent_scan = Scan.query.filter(
            Scan.normalized_url == normalized_url,
            Scan.created_at >= cache_expiry
        ).order_by(Scan.created_at.desc()).first()
            
        if recent_scan:
            return {
                'url': recent_scan.url,
                'status': recent_scan.status.upper(),
                'confidenceScore': recent_scan.confidence_score,
                'explanation': recent_scan.details.get('explanation', 'Result retrieved from recent cache.'),
                'threats': recent_scan.threats,
                'cached': True,
                'details': recent_scan.details
            }
        return None

    def _save_to_db(self, user_id, normalized_url, result, feature_hash):
        """Saves scan result to database"""
        try:
            # We store the explanation in the 'details' JSON field
            details = result['details']
            details['explanation'] = result['explanation']

            new_scan = Scan(
                user_id=user_id,
                url=result['url'],
                normalized_url=normalized_url,
                status=result['status'].lower(),
                confidence_score=result['confidenceScore'],
                scan_type='deep' if details.get('deep_scan') else 'quick',
                threats=result['threats'],
                details=details,
                feature_hash=feature_hash
            )
            db.session.add(new_scan)
            db.session.commit()
            logger.info(f"Stored result for {normalized_url}")
        except Exception as e:
            logger.error(f"Failed to save scan result: {str(e)}")
            db.session.rollback()

    # Compatibility wrappers
    def quick_scan(self, url, user_id):
        return self.scan(url, user_id, deep_scan=False)
        
    def deep_scan(self, url, user_id):
        return self.scan(url, user_id, deep_scan=True)
