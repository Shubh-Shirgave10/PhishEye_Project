from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.scan import Scan
from sqlalchemy import func

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard_stats():
    user_id = get_jwt_identity()
    
    total_scans = Scan.query.filter_by(user_id=user_id).count()
    malicious = Scan.query.filter_by(user_id=user_id, status='malicious').count()
    suspicious = Scan.query.filter_by(user_id=user_id, status='suspicious').count()
    # Handle both 'safe' and 'SAFE' cases just in case
    safe = Scan.query.filter(Scan.user_id == user_id, Scan.status.in_(['safe', 'SAFE'])).count()
    
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
@jwt_required()
def threat_distribution():
    user_id = get_jwt_identity()
    # Simple distribution logic
    malicious = Scan.query.filter_by(user_id=user_id, status='malicious').count()
    suspicious = Scan.query.filter_by(user_id=user_id, status='suspicious').count()
    safe = Scan.query.filter(Scan.user_id == user_id, Scan.status.in_(['safe', 'SAFE'])).count()
    
    return jsonify({
        'success': True,
        'data': {
            'Phishing': malicious,
            'Malware': suspicious,
            'Safe': safe
        }
    }), 200

@analytics_bp.route('/latest-scan', methods=['GET'])
@jwt_required()
def latest_scan():
    user_id = get_jwt_identity()
    
    # Get the most recent scan for this user
    latest = Scan.query.filter_by(user_id=user_id).order_by(Scan.created_at.desc()).first()
    
    if latest:
        return jsonify({
            'success': True,
            'scan': latest.to_dict()
        }), 200
    else:
        return jsonify({
            'success': False,
            'message': 'No scans found'
        }), 404