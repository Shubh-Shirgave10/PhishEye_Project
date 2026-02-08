import re
import ipaddress
import whois
import requests
import tldextract
from urllib.parse import urlparse
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class FeatureExtractor:
    """
    Enhanced Feature Extractor for production-grade phishing detection.
    Includes network-level lookups (WHOIS, Redirects) and structural features.
    """
    
    def __init__(self):
        self.feature_names = [
            'url_length', 'count_dots', 'count_hyphens', 'count_subdomains',
            'is_ip', 'has_https', 'suspicious_keyword_count', 'special_char_count',
            'path_length', 'query_param_count', 'domain_age_days', 'redirect_count'
        ]
        
        self.suspicious_keywords = [
            'secure', 'account', 'update', 'banking', 'login', 'click', 'confirm', 'verify', 
            'signin', 'webscr', 'ebayisapi', 'bonus', 'lucky', 'free', 'paypal', 'wallet', 'billing'
        ]
        
        self.special_chars = ['@', '!', '$', '%', '^', '&', '*', '(', ')', '+', '{', '}', '[', ']', '|', '<', '>', '~', '`', ';', ',']
        
        # Cache for whois results (in memory for this session)
        self._whois_cache = {}

    def extract_features(self, url, deep_scan=True):
        """
        Extracts numerical features from a URL.
        If deep_scan is True, performs WHOIS and Redirect lookups.
        """
        features = {}
        
        try:
            parsed = urlparse(url)
            hostname = parsed.netloc
            path = parsed.path
            query = parsed.query
            
            # Use tldextract for accurate subdomain/domain parsing
            ext = tldextract.extract(url)
            domain = f"{ext.domain}.{ext.suffix}"
            subdomain = ext.subdomain
        except Exception as e:
            logger.error(f"Error parsing URL {url}: {e}")
            return {f: 0 for f in self.feature_names}
            
        # 1. Structural Features
        features['url_length'] = len(url)
        features['count_dots'] = url.count('.')
        features['count_hyphens'] = url.count('-')
        features['count_subdomains'] = len(subdomain.split('.')) if subdomain else 0
        features['is_ip'] = self._is_ip(hostname)
        features['has_https'] = 1 if parsed.scheme == 'https' else 0
        features['suspicious_keyword_count'] = self._count_suspicious_words(url)
        features['special_char_count'] = sum(url.count(c) for c in self.special_chars)
        features['path_length'] = len(path)
        features['query_param_count'] = len(query.split('&')) if query else 0
        
        # 2. Network/Deep Features
        features['domain_age_days'] = 0
        features['redirect_count'] = 0
        
        if deep_scan:
            features['domain_age_days'] = self._get_domain_age(domain)
            features['redirect_count'] = self._get_redirect_count(url)
            
        return features

    def get_feature_vector(self, url, deep_scan=True):
        """Returns feature values as a list in defined order"""
        feat_dict = self.extract_features(url, deep_scan)
        return [feat_dict.get(f, 0) for f in self.feature_names]

    def _is_ip(self, hostname):
        try:
            if ':' in hostname:
                hostname = hostname.split(':')[0]
            ipaddress.ip_address(hostname)
            return 1
        except:
            return 0

    def _count_suspicious_words(self, url):
        url_lower = url.lower()
        return sum(1 for word in self.suspicious_keywords if word in url_lower)

    def _get_domain_age(self, domain):
        """Calculates domain age in days using WHOIS lookup."""
        if domain in self._whois_cache:
            return self._whois_cache[domain]
            
        try:
            w = whois.whois(domain)
            creation_date = w.creation_date
            
            if isinstance(creation_date, list):
                creation_date = creation_date[0]
                
            if creation_date:
                age = (datetime.now() - creation_date).days
                self._whois_cache[domain] = age
                return age
        except Exception as e:
            logger.warning(f"WHOIS lookup failed for {domain}: {e}")
            
        return 0

    def _get_redirect_count(self, url):
        """Counts the number of redirects for a given URL."""
        try:
            response = requests.head(url, allow_redirects=True, timeout=5)
            # history is the list of Response objects that were retrieved in order to fulfill the request
            return len(response.history)
        except Exception as e:
            logger.warning(f"Redirect check failed for {url}: {e}")
            return 0
