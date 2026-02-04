from flask import Blueprint, request, jsonify
from app import db, jwt
from app.models.user import User
from app.models.scan import OTP
from werkzeug.security import check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from datetime import datetime, timedelta
import random

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': 'Username already exists'}), 400
        
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already exists'}), 400
        
    new_user = User(username=data['username'], email=data['email'], phone_number=data.get('phone'))
    new_user.set_password(data['password'])
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'message': 'User created successfully'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    
    if user and user.check_password(data['password']):
        access_token = create_access_token(identity=user.id)
        return jsonify({
            'token': access_token,
            'user': user.to_dict()
        }), 200
        
    return jsonify({'message': 'Invalid credentials'}), 401

@auth_bp.route('/send-otp', methods=['POST'])
def send_otp():
    data = request.get_json()
    phone = data.get('phone')
    
    if not phone:
         return jsonify({'message': 'Phone number is required'}), 400
    
    # Generate 6 digit OTP
    otp_code = str(random.randint(100000, 999999))
    expiry = datetime.utcnow() + timedelta(minutes=5)
    
    # Here you would integrate SMS service
    print(f"DEBUG: OTP for {phone} is {otp_code}")
    
    otp_entry = OTP(phone_number=phone, otp_code=otp_code, expiry=expiry)
    db.session.add(otp_entry)
    db.session.commit()
    
    return jsonify({'message': 'OTP sent successfully'}), 200

@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    data = request.get_json()
    phone = data.get('phone')
    code = data.get('otp')
    
    otp_entry = OTP.query.filter_by(phone_number=phone, otp_code=code, verified=False).first()
    
    if otp_entry and otp_entry.expiry > datetime.utcnow():
        otp_entry.verified = True
        db.session.commit()
        return jsonify({'message': 'OTP verified'}), 200
        
    return jsonify({'message': 'Invalid or expired OTP'}), 400

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    # In a real app with token blacklist, you'd add jti to blacklist here
    return jsonify({'message': 'Logged out successfully'}), 200
