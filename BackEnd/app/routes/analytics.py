from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.scan import Scan
from sqlalchemy import func

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/dashboard', methods=['GET'])
# @jwt_required()
def dashboard_stats():
    # user_id = get_jwt_identity()
    user_id = 1 # Bypass for testing
    
    total_scans = Scan.query.filter_by(user_id=user_id).count()
    malicious = Scan.query.filter_by(user_id=user_id, status='malicious').count()
    suspicious = Scan.query.filter_by(user_id=user_id, status='suspicious').count()
    safe = Scan.query.filter_by(user_id=user_id, status='safe').count()
    
    return jsonify({
        'success': True,
        'stats': {
            'totalScans': total_scans,
            'safeCount': safe,
            'suspiciousCount': suspicious,
            'maliciousCount': malicious,
            'trendData': [
                {'label': 'Safe', 'value': safe},
                {'label': 'Suspicious', 'value': suspicious},
                {'label': 'Malware', 'value': malicious}
            ]
        }
    }), 200

@analytics_bp.route('/distribution', methods=['GET'])
# @jwt_required()
def threat_distribution():
    # user_id = get_jwt_identity()
    user_id = 1
    # Simple distribution logic
    malicious = Scan.query.filter_by(user_id=user_id, status='malicious').count()
    suspicious = Scan.query.filter_by(user_id=user_id, status='suspicious').count()
    safe = Scan.query.filter_by(user_id=user_id, status='safe').count()
    
    return jsonify({
        'success': True,
        'data': {
            'Phishing': malicious,
            'Malware': suspicious,
            'Safe': safe
        }
    }), 200
