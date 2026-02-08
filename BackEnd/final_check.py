import os
from dotenv import load_dotenv
import pyodbc

# Force load from current directory
dotenv_path = os.path.join(os.getcwd(), '.env')
print(f"Loading .env from: {dotenv_path}")
load_dotenv(dotenv_path)

db_url = os.environ.get('DATABASE_URL')
print(f"DATABASE_URL found: {'Yes' if db_url else 'No'}")
if db_url:
    print(f"URL: {db_url[:50]}...")

try:
    # Try direct pyodbc connection
    # Extract params from URL mssql+pyodbc://@SERVER/DB?driver=...&trusted_connection=yes
    # This is a bit complex to parse manually here, so I'll just hardcode a test based on the .env content
    server = 'DESKTOP-S765QMR\\SQLEXPRESS'
    database = 'PhishEyeDB'
    driver = 'ODBC Driver 17 for SQL Server'
    conn_str = f'DRIVER={{{driver}}};SERVER={server};DATABASE={database};Trusted_Connection=yes;'
    
    print(f"Connecting to {server} / {database}...")
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    
    print("Listing columns for 'users' table:")
    cursor.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users'")
    rows = cursor.fetchall()
    if not rows:
        print("❌ Table 'users' not found in INFORMATION_SCHEMA!")
    for row in rows:
        print(f"  - {row[0]}")
    
    conn.close()
except Exception as e:
    print(f"❌ Connection Error: {e}")
