from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.settings import Settings

user_bp = Blueprint('user', __name__)

@user_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict()), 200

@user_bp.route('/settings', methods=['GET', 'PUT'])
@jwt_required()
def user_settings():
    user_id = get_jwt_identity()
    settings = Settings.query.filter_by(user_id=user_id).first()
    
    if not settings:
        settings = Settings(user_id=user_id)
        db.session.add(settings)
        db.session.commit()
        
    if request.method == 'PUT':
        data = request.get_json()
        if 'theme' in data: settings.theme = data['theme']
        if 'notifications' in data: settings.notifications_enabled = data['notifications']
        if 'autoScan' in data: settings.auto_scan = data['autoScan']
        db.session.commit()
        
    return jsonify(settings.to_dict()), 200
