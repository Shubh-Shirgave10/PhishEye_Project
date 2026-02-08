import os
from dotenv import load_dotenv
from app import create_app, db
from sqlalchemy import text

load_dotenv()
app = create_app()

with app.app_context():
    print("Dropping existing tables...")
    # SQL Server specific drop (cascading not natively supported in same way as PG)
    # We can just use db.drop_all() which SQLAlchemy handles
    db.drop_all()
    print("Creating new tables...")
    db.create_all()
    print("Done! Database re-initialized.")
