import os
from flask import Flask, send_from_directory, redirect
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_marshmallow import Marshmallow
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_mail import Mail
from app.config import config

db = SQLAlchemy()
jwt = JWTManager()
ma = Marshmallow()
mail = Mail()
# Default limit: 100 per hour for entire API
limiter = Limiter(key_func=get_remote_address, default_limits=["100 per hour"])

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    ma.init_app(app)
    mail.init_app(app)
    limiter.init_app(app)
    # Enable CORS for everything (permissive for local file testing)
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Register Blueprints
    from app.routes.auth import auth_bp
    from app.routes.scan import scan_bp
    from app.routes.history import history_bp
    from app.routes.user import user_bp
    from app.routes.analytics import analytics_bp
    
    # Import models to ensure they are registered with SQLAlchemy
    from app.models.user import User
    from app.models.scan import Scan
    from app.models.auth import OTP, PasswordResetToken

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(scan_bp, url_prefix='/api/scan')
    app.register_blueprint(history_bp, url_prefix='/api/history')
    app.register_blueprint(user_bp, url_prefix='/api/user')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    
    # Serve Frontend Static Files
    @app.route('/FrontEnd/<path:path>')
    def serve_frontend(path):
        # Go up two levels from BackEnd/app to ProjectRoot, then into FrontEnd
        frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../FrontEnd'))
        return send_from_directory(frontend_dir, path)

    @app.route('/')
    def index():
        return redirect('/FrontEnd/login-page/login.html')
    
    # Create DB Tables
    with app.app_context():
        db.create_all()

    return app
