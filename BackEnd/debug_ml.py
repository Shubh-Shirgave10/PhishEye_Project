import sys
import os
import pandas as pd

# Add current directory to path so we can import app modules
sys.path.append(os.getcwd())

from app.ml.feature_extractor import FeatureExtractor
from app.ml.prediction import PhishingPredictor

def test_url(url):
    print(f"\n--- Testing URL: {url} ---")
    
    # 1. Feature Extraction
    extractor = FeatureExtractor()
    features = extractor.extract_features(url)
    print("\n[Features]:")
    for k, v in features.items():
        if v != 0 and v != -1: # Only print interesting non-zero/non-default values
             print(f"  {k}: {v}")
    
    # 2. Prediction
    predictor = PhishingPredictor()
    result = predictor.predict(url)
    
    print("\n[Prediction Result]:")
    print(f"  Verdict: {result['result']}")
    print(f"  Confidence: {result['confidence']:.4f}")
    print(f"  Signals: {result['signals']}")

if __name__ == "__main__":
    # Test a few examples
    safe_url = "https://www.google.com"
    sus_url = "http://secure-login-paypal-verify.account-update.tk/login.php"
    ip_url = "http://192.168.1.1/admin"
    
    test_url(safe_url)
    test_url(sus_url)
    test_url(ip_url)
