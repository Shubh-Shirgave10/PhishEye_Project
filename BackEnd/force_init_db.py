import os
from dotenv import load_dotenv
from app import create_app, db
from sqlalchemy import text

load_dotenv()
app = create_app()

with app.app_context():
    print("Forcefully dropping tables...")
    tables = ['scans', 'settings', 'otps', 'password_reset_tokens', 'users']
    for table in tables:
        try:
            db.session.execute(text(f"DROP TABLE IF EXISTS {table}"))
            print(f"Dropped {table}")
        except Exception as e:
            print(f"Error dropping {table}: {e}")
    
    db.session.commit()
    print("Creating new tables...")
    db.create_all()
    db.session.commit()
    print("Done! Database re-initialized.")
