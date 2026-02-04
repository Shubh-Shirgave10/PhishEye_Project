import os
import joblib
import logging
import numpy as np
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
        self.load_artifacts()
        
    def load_artifacts(self):
        """Loads the trained model and scaler from disk"""
        try:
            if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
                self.model = joblib.load(self.model_path)
                self.scaler = joblib.load(self.scaler_path)
                logger.info(f"Model and scaler loaded successfully from models/")
            else:
                logger.warning(f"Artifacts not found. Please run training script.")
                self.model = None
                self.scaler = None
        except Exception as e:
            logger.error(f"Error loading artifacts: {str(e)}")
            self.model = None
            self.scaler = None
            
    def predict(self, url):
        """
        Predicts if a URL is phishing or safe.
        Returns: detailed result dictionary
        """
        try:
            if not self.model or not self.scaler:
                return None
                
            # 1. Preprocess
            clean_url = self.preprocessor.preprocess(url)
            
            # 2. Extract Features
            features_dict = self.extractor.extract_features(clean_url)
            feature_vector = [features_dict[f] for f in self.extractor.feature_names]
            
            # 3. Scale Features
            X = np.array([feature_vector])
            X_scaled = self.scaler.transform(X)
            
            # 4. Predict
            prediction = self.model.predict(X_scaled)[0]
            proba = self.model.predict_proba(X_scaled)[0]
            # Prediction 0 = PHISHING, 1 = SAFE (Based on debug findings)
            ml_confidence = proba[0] if prediction == 0 else proba[1]
            
            # --- HYBRID HEURISTIC OVERRIDE ---
            # Calculate heuristic risk score (0-100)
            heuristic_score = 0
            
            if features_dict['is_ip']: 
                heuristic_score += 80
            
            if features_dict['suspicious_keyword_count'] > 0:
                heuristic_score += (features_dict['suspicious_keyword_count'] * 20)
                
            if features_dict['count_subdomains'] > 3:
                heuristic_score += 20
                
            if features_dict['url_length'] > 75:
                heuristic_score += 10
                
            if features_dict['has_https'] == 0:
                heuristic_score += 10
            
            # Cap at 100
            heuristic_score = min(heuristic_score, 100)
            
            # Determine Final Verdict
            final_result = "SAFE"
            final_confidence = 0.0
            
            # Logic: If ML is PHISHING (0), trust it. 
            # If ML is SAFE (1) but heuristics are high, override.
            
            if prediction == 0:
                final_result = "MALICIOUS"
                final_confidence = max(ml_confidence, heuristic_score / 100.0)
            else:
                if heuristic_score >= 80:
                    final_result = "MALICIOUS"
                    final_confidence = float(heuristic_score) / 100.0
                elif heuristic_score >= 40:
                    final_result = "SUSPICIOUS"
                    final_confidence = float(heuristic_score) / 100.0
                else:
                    final_result = "SAFE"
                    final_confidence = ml_confidence

            # Identify significant signals (Expanded)
            signals = []
            if features_dict['is_ip']: signals.append("Host is an IP address")
            if features_dict['has_https'] == 0: signals.append("Not using HTTPS")
            if features_dict['url_length'] > 75: signals.append("URL is unusually long")
            if features_dict['count_subdomains'] > 3: signals.append("Multiple subdomains detected")
            if features_dict['suspicious_keyword_count'] > 0: signals.append(f"Found {features_dict['suspicious_keyword_count']} suspicious keywords")
            if prediction == 0: signals.append("ML Model flagged as Malicious")
            
            return {
                'url': url,
                'result': final_result,
                'confidence': float(final_confidence),
                'signals': signals,
                'features': features_dict
            }
                
        except Exception as e:
            logger.error(f"Prediction error: {str(e)}")
            return None
