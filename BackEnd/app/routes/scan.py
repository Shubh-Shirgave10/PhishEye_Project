from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.services.scan_service import URLScanner
from marshmallow import ValidationError
from app.schemas import URLScanSchema

scan_bp = Blueprint('scan', __name__)
scanner = URLScanner()
url_scan_schema = URLScanSchema()

@scan_bp.route('/quick', methods=['POST'])
@jwt_required()
def quick_scan():
    user_id = get_jwt_identity()
    
    # Get JSON data
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Request body is required'}), 400
    
    try:
        validated_data = url_scan_schema.load(data)
    except ValidationError as err:
        return jsonify({
            'success': False, 
            'message': 'Invalid URL format', 
            'errors': err.messages
        }), 422
    
    url = validated_data.get('url', '').strip()
    if not url:
        return jsonify({'success': False, 'message': 'URL is required'}), 422
    
    try:
        # Production scanner returns: {url, status, confidenceScore, explanation, threats, cached, details}
        result = scanner.quick_scan(url, user_id=user_id)
        return jsonify({
            'success': True,
            'result': result
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@scan_bp.route('/deep', methods=['POST'])
@jwt_required()
def deep_scan():
    user_id = get_jwt_identity()
    
    # Get JSON data
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Request body is required'}), 400
    
    try:
        validated_data = url_scan_schema.load(data)
    except ValidationError as err:
        return jsonify({
            'success': False, 
            'message': 'Invalid URL format', 
            'errors': err.messages
        }), 422
    
    url = validated_data.get('url', '').strip()
    if not url:
        return jsonify({'success': False, 'message': 'URL is required'}), 422
    
    try:
        result = scanner.deep_scan(url, user_id=user_id)
        return jsonify({
            'success': True,
            'result': result
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
