import pyodbc
import os

# Use the connection string from .env or hardcoded based on previous success
SERVER = r'DESKTOP-S765QMR\SQLEXPRESS'
DATABASE = 'PhishEyeDB'

conn_str = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={SERVER};DATABASE={DATABASE};Trusted_Connection=yes;'

print(f"Connecting to {SERVER}/{DATABASE} to fix schema...")
try:
    conn = pyodbc.connect(conn_str, timeout=10)
    cursor = conn.cursor()
    
    # Drop dependent tables first
    print("Dropping 'scans', 'settings'...")
    cursor.execute("IF OBJECT_ID('scans', 'U') IS NOT NULL DROP TABLE scans;")
    cursor.execute("IF OBJECT_ID('settings', 'U') IS NOT NULL DROP TABLE settings;")
    
    # Now drop users
    print("Dropping 'users' table...")
    cursor.execute("IF OBJECT_ID('users', 'U') IS NOT NULL DROP TABLE users;")
    
    # Also drop scans if normalized_url missing (just to be safe for a fresh start)
    # cursor.execute("IF OBJECT_ID('scans', 'U') IS NOT NULL DROP TABLE scans;")
    
    conn.commit()
    print("✅ Tables dropped. Restart the server to recreate them with correct schema.")
    conn.close()
    
except Exception as e:
    print(f"❌ Failed: {str(e)}")
