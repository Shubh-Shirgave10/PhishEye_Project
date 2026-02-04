from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.scan import Scan

history_bp = Blueprint('history', __name__)

@history_bp.route('/scans', methods=['GET'])
@jwt_required()
def get_history():
    user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 10, type=int)
    
    scans = Scan.query.filter_by(user_id=user_id).order_by(Scan.created_at.desc()).paginate(page=page, per_page=per_page)
    
    return jsonify({
        'scans': [scan.to_dict() for scan in scans.items],
        'total': scans.total,
        'pages': scans.pages,
        'current_page': scans.page
    }), 200

@history_bp.route('/scans/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_scan(id):
    user_id = get_jwt_identity()
    scan = Scan.query.filter_by(id=id, user_id=user_id).first_or_404()
    
    db.session.delete(scan)
    db.session.commit()
    return jsonify({'message': 'Scan deleted'}), 200

@history_bp.route('/clear', methods=['DELETE'])
@jwt_required()
def clear_history():
    user_id = get_jwt_identity()
    Scan.query.filter_by(user_id=user_id).delete()
    db.session.commit()
    return jsonify({'message': 'History cleared'}), 200
