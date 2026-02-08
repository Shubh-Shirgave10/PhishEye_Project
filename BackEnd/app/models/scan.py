from app import db
from datetime import datetime

class Scan(db.Model):
    __tablename__ = 'scans'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    url = db.Column(db.String(2048), nullable=False)
    status = db.Column(db.String(20)) # safe, suspicious, malicious
    confidence_score = db.Column(db.Float)
    scan_type = db.Column(db.String(10)) # quick, deep
    threats = db.Column(db.JSON) # List of threats
    details = db.Column(db.JSON) # Detailed analysis
    normalized_url = db.Column(db.String(2048), index=True) # Normalized for caching
    feature_hash = db.Column(db.String(64)) # Feature signature
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'url': self.url,
            'status': self.status,
            'confidenceScore': self.confidence_score,
            'scanType': self.scan_type,
            'detectTime': self.created_at.isoformat(),
            'threats': self.threats or [],
            'details': self.details or {}
        }

