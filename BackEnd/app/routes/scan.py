from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.scan import Scan
from app.services.scan_service import URLScanner

scan_bp = Blueprint('scan', __name__)
scanner = URLScanner()

@scan_bp.route('/quick', methods=['POST'])
# @jwt_required()  <-- Disabled for testing
def quick_scan():
    # user_id = get_jwt_identity()
    user_id = 1 # Mock user ID for bypass mode
    data = request.get_json()
    url = data.get('url')
    
    if not url:
        return jsonify({'message': 'URL is required'}), 400
    
    # helper handles DB saving internally now
    scan_result = scanner.scan(url, user_id=user_id)
    
    # Wrap for frontend expectations in mainDash.js
    response_data = {
        'success': True,
        'result': {
            'status': scan_result['verdict'],
            'confidenceScore': scan_result['risk_score'],
            'threats': scan_result['threats'],
            'url': scan_result['url'],
            'cached': scan_result['cached']
        }
    }
    
    return jsonify(response_data), 200

@scan_bp.route('/deep', methods=['POST'])
@jwt_required()
def deep_scan():
    user_id = get_jwt_identity()
    data = request.get_json()
    url = data['url']
    
    result = scanner.deep_scan(url)
    
    # Save to history
    new_scan = Scan(
        user_id=user_id,
        url=url,
        status=result['status'],
        confidence_score=result['confidenceScore'],
        scan_type='deep',
        threats=result['threats'],
        details=result['details']
    )
    db.session.add(new_scan)
    db.session.commit()
    
    return jsonify(result), 200
