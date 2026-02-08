import os
import joblib
import logging
import numpy as np
from urllib.parse import urlparse
from app.ml.feature_extractor import FeatureExtractor
from app.ml.preprocessing import URLPreprocessor

logger = logging.getLogger(__name__)

class PhishingPredictor:
    def __init__(self, model_path='models/phishing_model.pkl', scaler_path='models/scaler.pkl'):
        self.model_path = model_path
        self.scaler_path = scaler_path
        self.model = None
        self.scaler = None
        self.extractor = FeatureExtractor()
        self.preprocessor = URLPreprocessor()
        self.whitelist = {
            'google.com', 'google.co.in', 'youtube.com', 'facebook.com', 'github.com',
            'gmail.com', 'linkedin.com', 'twitter.com', 'instagram.com', 'microsoft.com',
            'apple.com', 'amazon.com', 'netflix.com', 'wikipedia.org', 'github.io',
            'stackoverflow.com', 'stackexchange.com'
        }
        self.load_artifacts()

    def _is_whitelisted(self, url):
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower().replace('www.', '')
            parts = domain.split('.')
            if len(parts) >= 2:
                base_domain = '.'.join(parts[-2:])
                if base_domain in self.whitelist:
                    return True
            return domain in self.whitelist
        except:
            return False
        
    def load_artifacts(self):
        """Loads the trained model and scaler from disk"""
        try:
            if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
                self.model = joblib.load(self.model_path)
                self.scaler = joblib.load(self.scaler_path)
                logger.info(f"Model and scaler loaded successfully from models/")
            else:
                logger.warning(f"ML Artifacts not found. Falling back to rule-based system.")
                self.model = None
                self.scaler = None
        except Exception as e:
            logger.error(f"Error loading artifacts: {str(e)}")
            self.model = None
            self.scaler = None
            
    def predict(self, url, deep_scan=True):
        """
        Predicts if a URL is phishing or safe using a Hybrid Model.
        ML provides base intelligence, Heuristics provide production safety.
        """
        try:
            # 0. Check Whitelist
            if self._is_whitelisted(url):
                return {
                    'url': url,
                    'result': "SAFE",
                    'confidence': 1.0,
                    'signals': ["Trusted domain (Whitelisted)"],
                    'explanation': "This domain is recognized as a globally trusted platform.",
                    'features': self.extractor.extract_features(url, deep_scan=False)
                }

            # 1. Preprocess & Extract
            clean_url = self.preprocessor.preprocess(url)
            features_dict = self.extractor.extract_features(clean_url, deep_scan=deep_scan)
            
            # Prepare ML vector (Original 10 features)
            ml_feature_names = self.extractor.feature_names[:10]
            ml_vector = [features_dict[f] for f in ml_feature_names]
            
            # 2. ML Prediction (if artifacts available)
            ml_verdict = "SAFE"
            ml_confidence = 0.5
            
            if self.model and self.scaler:
                try:
                    X = np.array([ml_vector])
                    X_scaled = self.scaler.transform(X)
                    prediction = self.model.predict(X_scaled)[0]
                    proba = self.model.predict_proba(X_scaled)[0]
                    
                    # 0 = PHISHING, 1 = SAFE
                    if prediction == 0:
                        ml_verdict = "MALICIOUS"
                        ml_confidence = proba[0]
                    else:
                        ml_verdict = "SAFE"
                        ml_confidence = proba[1]
                except Exception as e:
                    logger.error(f"ML Processing error: {e}")

            # 3. Production Heuristic Engine (Rules)
            risk_score = 0
            signals = []
            
            # --- HIGH RISK SIGNALS ---
            if features_dict['is_ip']:
                risk_score += 90
                signals.append("Host is a direct IP address (Highly unusual for legitimate sites)")
                
            if deep_scan:
                # Domain Age Rules
                age = features_dict['domain_age_days']
                if age > 0 and age < 60:
                    risk_score += 70
                    signals.append(f"Domain is very young ({age} days old)")
                elif age == 0:
                    risk_score += 20
                    signals.append("Unable to verify domain registration history")
                
                # Redirect Rules
                redirects = features_dict['redirect_count']
                if redirects > 2:
                    risk_score += 40
                    signals.append(f"Excessive number of redirects ({redirects})")

            # --- MEDIUM RISK SIGNALS ---
            if features_dict['suspicious_keyword_count'] > 0:
                risk_score += (features_dict['suspicious_keyword_count'] * 20)
                signals.append(f"Detected {features_dict['suspicious_keyword_count']} sensitive keywords")
                
            if features_dict['count_subdomains'] > 3:
                risk_score += 30
                signals.append("Suspiciously long subdomain chain")
                
            if features_dict['has_https'] == 0:
                risk_score += 30
                signals.append("Connection is not secured (No HTTPS)")

            if features_dict['url_length'] > 100:
                risk_score += 15
                signals.append("URL length is unusually high")

            # 4. Final Verdict Resolution
            # Resolve between ML and Heuristics
            final_result = "SAFE"
            final_confidence = 0.5
            
            # If Heuristics say it's deadly, it's deadly.
            if risk_score >= 80:
                final_result = "MALICIOUS"
                final_confidence = min(risk_score / 100.0, 0.99)
            elif ml_verdict == "MALICIOUS":
                final_result = "MALICIOUS"
                final_confidence = ml_confidence
            elif risk_score >= 40:
                final_result = "SUSPICIOUS"
                final_confidence = risk_score / 100.0
            else:
                final_result = "SAFE"
                final_confidence = ml_confidence

            # Explanation generation
            explanation = "This URL appears safe based on structural analysis."
            if final_result == "MALICIOUS":
                explanation = f"Detected high-risk patterns: {', '.join(signals[:2])}"
            elif final_result == "SUSPICIOUS":
                explanation = "Some attributes of this URL are atypical and suggest potential risk."

            return {
                'url': url,
                'result': final_result,
                'confidence': float(final_confidence),
                'signals': signals if signals else ["No significant threats detected"],
                'explanation': explanation,
                'features': features_dict
            }
                
        except Exception as e:
            logger.error(f"Prediction error: {str(e)}")
            return {
                'url': url,
                'result': "UNKNOWN",
                'confidence': 0.0,
                'signals': ["Error during analysis"],
                'explanation': "An internal error occurred while analyzing this URL."
            }
