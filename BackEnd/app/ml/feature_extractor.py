import re
import ipaddress
from urllib.parse import urlparse

class FeatureExtractor:
    """
    Extracts numerical features from URLs for phishing detection.
    Features: Length, Dots, Hyphens, Subdomains, IP Check, HTTPS, Suspicious Keywords, Special Chars, Path Length, Query Params
    """
    
    def __init__(self):
        self.feature_names = [
            'url_length', 'count_dots', 'count_hyphens', 'count_subdomains',
            'is_ip', 'has_https', 'suspicious_keyword_count', 'special_char_count',
            'path_length', 'query_param_count'
        ]
        
        self.suspicious_keywords = [
            'secure', 'account', 'update', 'banking', 'login', 'click', 'confirm', 'verify', 
            'signin', 'webscr', 'ebayisapi', 'bonus', 'lucky', 'free', 'paypal', 'wallet', 'billing'
        ]
        
        self.special_chars = ['@', '!', '$', '%', '^', '&', '*', '(', ')', '+', '{', '}', '[', ']', '|', '<', '>', '~', '`', ';', ',']

    def extract_features(self, url):
        """
        Extracts 10 specific numerical features from a URL.
        Returns a dictionary of features.
        """
        features = {}
        
        try:
            parsed = urlparse(url)
            hostname = parsed.netloc
            path = parsed.path
            query = parsed.query
        except:
            hostname = ""
            path = ""
            query = ""
            
        # 1. URL Length
        features['url_length'] = len(url)
        
        # 2. Count Dots
        features['count_dots'] = url.count('.')
        
        # 3. Count Hyphens
        features['count_hyphens'] = url.count('-')
        
        # 4. Number of Subdomains
        clean_host = hostname.replace("www.", "")
        features['count_subdomains'] = len(clean_host.split('.'))
        
        # 5. Presence of IP Address
        features['is_ip'] = self._is_ip(hostname)
        
        # 6. HTTPS Usage
        features['has_https'] = 1 if parsed.scheme == 'https' else 0
        
        # 7. Suspicious Keyword Count
        features['suspicious_keyword_count'] = self._count_suspicious_words(url)
        
        # 8. Special Character Count
        features['special_char_count'] = sum(url.count(c) for c in self.special_chars)
        
        # 9. Path Length
        features['path_length'] = len(path)
        
        # 10. Query Parameter Count
        features['query_param_count'] = len(query.split('&')) if query else 0
        
        return features

    def get_feature_vector(self, url):
        """Returns feature values as a list in defined order"""
        feat_dict = self.extract_features(url)
        return [feat_dict[f] for f in self.feature_names]

    def _is_ip(self, hostname):
        try:
            # Remove port if exists
            if ':' in hostname:
                hostname = hostname.split(':')[0]
            ipaddress.ip_address(hostname)
            return 1
        except:
            return 0

    def _count_suspicious_words(self, url):
        count = 0
        url_lower = url.lower()
        for word in self.suspicious_keywords:
            if word in url_lower:
                count += 1
        return count
