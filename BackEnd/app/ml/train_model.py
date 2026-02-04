import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
from app.ml.feature_extractor import FeatureExtractor
from app.ml.preprocessing import URLPreprocessor
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ModelPipeline:
    def __init__(self, data_path=None):
        # Default to absolute path if not provided
        if data_path is None:
            self.data_path = r"c:\Users\Dell\Documents\Final Year Project\Dataset\final_dataset.csv"
        else:
            self.data_path = data_path
            
        self.extractor = FeatureExtractor()
        self.preprocessor = URLPreprocessor()
        self.scaler = StandardScaler()
        self.models = {
            'RandomForest': RandomForestClassifier(n_estimators=100, random_state=42),
            'LogisticRegression': LogisticRegression(max_iter=1000, random_state=42)
        }
        self.best_model = None
        self.best_scaler = None

    def load_and_process_data(self):
        """
        Loads data, preprocesses URLs, extracts features, and creates X, y.
        """
        if not os.path.exists(self.data_path):
            raise FileNotFoundError(f"Dataset not found at {self.data_path}")
            
        logger.info(f"Loading dataset from {self.data_path}...")
        df = pd.read_csv(self.data_path)
        
        # Ensure correct columns
        if 'url' not in df.columns or 'label' not in df.columns:
            raise ValueError("Dataset must contain 'url' and 'label' columns")
            
        logger.info("Preprocessing URLs and extracting features...")
        X = []
        y = df['label'].values
        
        total = len(df)
        for i, url in enumerate(df['url']):
            if i % 1000 == 0:
                logger.info(f"Processed {i}/{total} URLs")
                
            # 1. Preprocess
            clean_url = self.preprocessor.preprocess(str(url))
            
            # 2. Extract Features
            features = self.extractor.get_feature_vector(clean_url)
            X.append(features)
            
        return np.array(X), y

    def train_and_evaluate(self):
        """
        Main training pipeline:
        1. Load & Process Data
        2. Split Data
        3. Scale Features
        4. Train Models
        5. Evaluate & Select Best
        6. Save Artifacts
        """
        try:
            # 1. Load Data
            X, y = self.load_and_process_data()
            
            # 2. Split Data (80/20)
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            logger.info(f"Data Split: Train={X_train.shape[0]}, Test={X_test.shape[0]}")
            
            # 3. Scale Features
            self.scaler.fit(X_train)
            X_train_scaled = self.scaler.transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            self.best_scaler = self.scaler
            
            # 4. Train & Evaluate Models
            best_f1 = 0
            best_model_name = ""
            
            logger.info("Training models...")
            
            for name, model in self.models.items():
                logger.info(f"Training {name}...")
                model.fit(X_train_scaled, y_train)
                
                preds = model.predict(X_test_scaled)
                
                # Metrics
                acc = accuracy_score(y_test, preds)
                prec = precision_score(y_test, preds)
                rec = recall_score(y_test, preds)
                f1 = f1_score(y_test, preds)
                cm = confusion_matrix(y_test, preds)
                
                logger.info(f"\n--- {name} Results ---")
                logger.info(f"Accuracy:  {acc:.4f}")
                logger.info(f"Precision: {prec:.4f}")
                logger.info(f"Recall:    {rec:.4f}")
                logger.info(f"F1-Score:  {f1:.4f}")
                logger.info(f"Confusion Matrix:\n{cm}")
                
                if f1 > best_f1:
                    best_f1 = f1
                    self.best_model = model
                    best_model_name = name
                    
            logger.info(f"\n🏆 Best Model: {best_model_name} (F1: {best_f1:.4f})")
            
            # 5. Save Model & Scaler
            self._save_artifacts()
            
        except Exception as e:
            logger.error(f"Training failed: {str(e)}")
            raise

    def _save_artifacts(self):
        """Save model and scaler to disk"""
        os.makedirs('models', exist_ok=True)
        
        joblib.dump(self.best_model, 'models/phishing_model.pkl')
        joblib.dump(self.best_scaler, 'models/scaler.pkl')
        
        logger.info("Model and scaler saved to 'models/' directory")

if __name__ == "__main__":
    pipeline = ModelPipeline()
    pipeline.train_and_evaluate()
