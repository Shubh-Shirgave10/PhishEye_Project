from flask import Blueprint, request, jsonify
from app import db, jwt
from app.models.user import User
from app.models.auth import OTP, PasswordResetToken
from app.services.email_service import EmailService
from werkzeug.security import check_password_hash, generate_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from datetime import datetime, timedelta
import random
import string
import secrets
from marshmallow import ValidationError
from app.schemas import SignupSchema, LoginSchema, OTPSendSchema, OTPVerifySchema, PasswordResetSchema, SocialLoginSchema

auth_bp = Blueprint('auth', __name__)

signup_schema = SignupSchema()
login_schema = LoginSchema()
otp_send_schema = OTPSendSchema()
otp_verify_schema = OTPVerifySchema()
password_reset_schema = PasswordResetSchema()
social_login_schema = SocialLoginSchema()

@auth_bp.route('/signup', methods=['POST'])
def signup():
    try:
        # Handle camelCase from frontend if necessary, or just expect snake_case
        data = request.get_json()
        if 'fullName' in data and 'full_name' not in data:
            data['full_name'] = data.pop('fullName')
            
        validated_data = signup_schema.load(data)
    except ValidationError as err:
        return jsonify({'success': False, 'message': 'Validation failed', 'errors': err.messages}), 400
    
    email = validated_data['email']
    password = validated_data['password']
    full_name = validated_data['full_name']

    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': 'Email already exists'}), 400
    
    # Check if OTP is verified for this email
    otp_entry = OTP.query.filter_by(email=email, purpose='signup', verified=True).first()
    if not otp_entry:
        return jsonify({'success': False, 'message': 'Please verify your email with OTP first'}), 400
        
    new_user = User(
        full_name=full_name, 
        email=email
    )
    new_user.set_password(password)
    
    db.session.add(new_user)
    db.session.delete(otp_entry) # Consume OTP
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'User created successfully'
    }), 201

@auth_bp.route('/social-login', methods=['POST'])
def social_login():
    try:
        validated_data = social_login_schema.load(request.get_json())
    except ValidationError as err:
        return jsonify({'success': False, 'message': 'Validation failed', 'errors': err.messages}), 400

    email = validated_data['email']
    full_name = validated_data['fullName']
    provider = validated_data['provider']

    user = User.query.filter_by(email=email).first()
    if not user:
        new_user = User(
            full_name=full_name,
            email=email
        )
        # Set a random password for social signups
        new_user.set_password(secrets.token_urlsafe(32))
        db.session.add(new_user)
        db.session.commit()
        user = new_user

    access_token = create_access_token(identity=user.id)
    return jsonify({
        'success': True,
        'token': access_token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        validated_data = login_schema.load(request.get_json())
    except ValidationError as err:
        return jsonify({'success': False, 'message': 'Validation failed', 'errors': err.messages}), 400

    user = User.query.filter_by(email=validated_data['email']).first()
    
    if user and user.check_password(validated_data['password']):
        access_token = create_access_token(identity=user.id)
        return jsonify({
            'success': True,
            'token': access_token,
            'user': user.to_dict()
        }), 200
        
    return jsonify({
        'success': False,
        'message': 'Invalid credentials'
    }), 401

@auth_bp.route('/send-otp', methods=['POST'])
def send_otp():
    try:
        validated_data = otp_send_schema.load(request.get_json())
    except ValidationError as err:
        return jsonify({'success': False, 'message': 'Validation failed', 'errors': err.messages}), 400

    email = validated_data['email']
    purpose = validated_data['purpose'] # Defaults to signup in schema
    
    if purpose == 'reset_password':
        if not User.query.filter_by(email=email).first():
            return jsonify({'success': False, 'message': 'No user found with this email'}), 404

    # Generate 6 digit OTP
    otp_code = ''.join(random.choices(string.digits, k=6))
    expiry = datetime.utcnow() + timedelta(minutes=10)
    
    # Remove existing OTPS for this email/purpose
    OTP.query.filter_by(email=email, purpose=purpose).delete()
    
    otp_entry = OTP(email=email, otp_code=otp_code, purpose=purpose, expiry=expiry)
    db.session.add(otp_entry)
    db.session.commit()
    
    # Send via Email Service
    EmailService.send_otp(email, otp_code, purpose)
    
    # In development, also return OTP in response if email is not configured
    # This helps with testing when email is not set up
    response_data = {'success': True, 'message': f'OTP sent to {email}'}
    
    # Only include OTP in response if email is not configured (for development)
    from flask import current_app
    if not (current_app.config.get('MAIL_USERNAME') and current_app.config.get('MAIL_PASSWORD')):
        response_data['otp'] = otp_code  # Include OTP in response for development
        response_data['message'] = f'OTP sent to {email} (Check console or this response for OTP code)'
    
    return jsonify(response_data), 200

@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    try:
        validated_data = otp_verify_schema.load(request.get_json())
    except ValidationError as err:
        return jsonify({'success': False, 'message': 'Validation failed', 'errors': err.messages}), 400

    email = validated_data['email']
    code = validated_data['otp']
    purpose = validated_data['purpose']
    
    otp_entry = OTP.query.filter_by(email=email, otp_code=code, purpose=purpose).first()
    
    if otp_entry and otp_entry.expiry > datetime.utcnow():
        otp_entry.verified = True
        db.session.commit()
        return jsonify({'success': True, 'message': 'OTP verified successfully'}), 200
        
    return jsonify({'success': False, 'message': 'Invalid or expired OTP'}), 400

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    try:
        validated_data = password_reset_schema.load(request.get_json())
    except ValidationError as err:
        return jsonify({'success': False, 'message': 'Validation failed', 'errors': err.messages}), 400

    email = validated_data['email']
    new_password = validated_data['password']
    
    # Must have verified OTP for reset_password
    otp_entry = OTP.query.filter_by(email=email, purpose='reset_password', verified=True).first()
    if not otp_entry:
        return jsonify({'success': False, 'message': 'Please verify OTP first'}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
        
    user.set_password(new_password)
    db.session.delete(otp_entry)
    db.session.commit()
    
    EmailService.send_reset_success(email)
    
    return jsonify({'success': True, 'message': 'Password has been reset successfully'}), 200

@auth_bp.route('/verify', methods=['GET'])
@jwt_required()
def verify_token():
    """Verify if the current token is valid"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if user:
        return jsonify({
            'success': True,
            'user': user.to_dict()
        }), 200
    return jsonify({'success': False, 'message': 'Invalid token'}), 401

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    # In a real system with blocklisting, we'd add the token to a blocklist here
    return jsonify({'success': True, 'message': 'Logged out successfully'}), 200
