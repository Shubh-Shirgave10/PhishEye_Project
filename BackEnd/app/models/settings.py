from app import db

class Settings(db.Model):
    __tablename__ = 'settings'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    theme = db.Column(db.String(20), default='dark')
    notifications_enabled = db.Column(db.Boolean, default=True)
    auto_scan = db.Column(db.Boolean, default=True)
    
    def to_dict(self):
        return {
            'theme': self.theme,
            'notifications': self.notifications_enabled,
            'autoScan': self.auto_scan
        }
