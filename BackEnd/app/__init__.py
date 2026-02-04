from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_marshmallow import Marshmallow
from app.config import config

db = SQLAlchemy()
jwt = JWTManager()
ma = Marshmallow()

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    ma.init_app(app)
    ma.init_app(app)
    # Enable CORS for everything (permissive for local file testing)
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Register Blueprints
    from app.routes.auth import auth_bp
    from app.routes.scan import scan_bp
    from app.routes.history import history_bp
    from app.routes.user import user_bp
    from app.routes.analytics import analytics_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(scan_bp, url_prefix='/api/scan')
    app.register_blueprint(history_bp, url_prefix='/api/history')
    app.register_blueprint(user_bp, url_prefix='/api/user')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    
    # Create DB Tables
    # with app.app_context():
    #     db.create_all()

    return app
