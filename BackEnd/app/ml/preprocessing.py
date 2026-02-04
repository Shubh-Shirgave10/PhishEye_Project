import re
from urllib.parse import urlparse, unquote

class URLPreprocessor:
    """
    Handles cleaning and normalization of URLs.
    """
    
    @staticmethod
    def preprocess(url):
        """
        Applies preprocessing steps:
        - Lowercase
        - Strip whitespace
        - Normalize scheme (add http if missing)
        - Decode encoded characters
        - Remove fragments and trailing slashes
        """
        if not url:
            return ""
            
        # 1. Lowercase and strip
        url = url.lower().strip()
        
        # 2. Normalize scheme
        if not url.startswith(('http://', 'https://')):
            url = 'http://' + url
            
        # 3. Decode characters
        try:
            url = unquote(url)
        except:
            pass
            
        # 4. Remove fragments
        if '#' in url:
            url = url.split('#')[0]
            
        # 5. Remove trailing slash
        if url.endswith('/'):
            url = url.rstrip('/')
            
        return url
