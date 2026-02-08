import os
from dotenv import load_dotenv
from app import create_app, db
from sqlalchemy import text, inspect

load_dotenv()
app = create_app()

with app.app_context():
    # 1. Check current database
    res = db.session.execute(text("SELECT DB_NAME()")).fetchone()
    print(f"Connected to Database: {res[0]}")
    
    # 2. Check if table 'users' exists and its columns
    inspector = inspect(db.engine)
    if 'users' in inspector.get_table_names():
        print("Table 'users' exists.")
        columns = [c['name'] for c in inspector.get_columns('users')]
        print(f"Columns in 'users': {columns}")
        if 'full_name' in columns:
            print("✅ 'full_name' found in columns list.")
        else:
            print("❌ 'full_name' NOT found in columns list!")
    else:
        print("❌ Table 'users' does NOT exist.")
