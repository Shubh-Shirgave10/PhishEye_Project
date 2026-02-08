import os
from dotenv import load_dotenv
import pyodbc

load_dotenv()
server = 'DESKTOP-S765QMR\\SQLEXPRESS'
database = 'PhishEyeDB'
driver = 'ODBC Driver 17 for SQL Server'
conn_str = f'DRIVER={{{driver}}};SERVER={server};DATABASE={database};Trusted_Connection=yes;'

try:
    print(f"Connecting to {server} / {database}...")
    conn = pyodbc.connect(conn_str, autocommit=True)
    cursor = conn.cursor()

    print("Dropping existing tables...")
    tables = ['scans', 'settings', 'otps', 'password_reset_tokens', 'users']
    for table in tables:
        try:
            cursor.execute(f"DROP TABLE IF EXISTS {table}")
            print(f"  Dropped {table}")
        except Exception as e:
            print(f"  Error dropping {table}: {e}")

    print("Creating 'users' table...")
    cursor.execute("""
    CREATE TABLE users (
        id INT PRIMARY KEY IDENTITY(1,1),
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(120) NOT NULL UNIQUE,
        password_hash VARCHAR(255),
        phone_number VARCHAR(20),
        created_at DATETIME DEFAULT GETDATE()
    )
    """)

    print("Creating 'scans' table...")
    cursor.execute("""
    CREATE TABLE scans (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT NOT NULL,
        url VARCHAR(2048) NOT NULL,
        status VARCHAR(20),
        confidence_score FLOAT,
        scan_type VARCHAR(10),
        threats NVARCHAR(MAX),
        details NVARCHAR(MAX),
        normalized_url VARCHAR(2048),
        feature_hash VARCHAR(64),
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)

    print("Creating 'settings' table...")
    cursor.execute("""
    CREATE TABLE settings (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT NOT NULL UNIQUE,
        theme VARCHAR(20) DEFAULT 'dark',
        notifications_enabled BIT DEFAULT 1,
        auto_scan BIT DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)

    print("Creating 'otps' table...")
    cursor.execute("""
    CREATE TABLE otps (
        id INT PRIMARY KEY IDENTITY(1,1),
        email VARCHAR(120) NOT NULL,
        otp_code VARCHAR(6) NOT NULL,
        purpose VARCHAR(20) DEFAULT 'signup',
        expiry DATETIME NOT NULL,
        verified BIT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE()
    )
    """)

    print("Creating 'password_reset_tokens' table...")
    cursor.execute("""
    CREATE TABLE password_reset_tokens (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT NOT NULL,
        token VARCHAR(100) NOT NULL UNIQUE,
        expiry DATETIME NOT NULL,
        used BIT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)

    print("Done! Database successfully recreated with correct schema.")
    conn.close()

except Exception as e:
    print(f"❌ ERROR: {e}")
