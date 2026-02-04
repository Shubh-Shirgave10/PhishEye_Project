import pyodbc
import os

# Try different connection strings
drivers = [x for x in pyodbc.drivers() if 'SQL Server' in x]
print(f"Installed Drivers: {drivers}")

servers = ['localhost', '(local)', '.', os.environ.get('COMPUTERNAME', 'DESKTOP-S765QMR')]
database = 'PhishEyeDB'

def test_connection(server, db=None):
    driver = 'ODBC Driver 17 for SQL Server'
    if driver not in drivers:
        # Fallback to whatever is available
        if drivers:
            driver = drivers[0]
        else:
            print("No SQL Server ODBC drivers found!")
            return False

    conn_str = f'DRIVER={{{driver}}};SERVER={server};Trusted_Connection=yes;'
    if db:
        conn_str += f'DATABASE={db};'
    
    print(f"Testing connection to {server} (DB: {db or 'default'})...")
    try:
        conn = pyodbc.connect(conn_str, timeout=5)
        print("✅ SUCCESS!")
        cursor = conn.cursor()
        cursor.execute("SELECT @@VERSION")
        row = cursor.fetchone()
        print(f"Server Version: {row[0].splitlines()[0]}")
        
        if not db:
            # List databases
            cursor.execute("SELECT name FROM sys.databases WHERE name='PhishEyeDB'")
            if cursor.fetchone():
                print("✅ PhishEyeDB exists on this server.")
            else:
                print("❌ PhishEyeDB NOT found on this server.")
                
        conn.close()
        return True
    except Exception as e:
        print(f"❌ FAILED: {str(e)}")
        return False

print("--- Starting Diagnostics ---")
success = False
for server in servers:
    if test_connection(server):
        print(f"\nCan we connect to {database} on {server}?")
        if test_connection(server, database):
            print(f"\n🎉 FOUND WORKING CONFIGURATION: Server={server}")
            success = True
            break

if not success:
    print("\nCould not connect to PhishEyeDB on any common server name.")
