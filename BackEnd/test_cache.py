import requests
import time

BASE_URL = "http://localhost:5000/api"
# Use a test URL that won't trigger internal network blocks if possible, or a real one
TEST_URL = "http://example.com/login" 

def login():
    # Login to get JWT
    print("Logging in...")
    # Assumes a user exists, or create one
    # Attempting to create one just in case
    requests.post(f"{BASE_URL}/auth/signup", json={
        "username": "cache_tester",
        "email": "cache@test.com",
        "password": "password123"
    })
    
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "cache@test.com",
        "password": "password123"
    })
    
    if resp.status_code == 200:
        return resp.json()['token']
    else:
        print(f"Login failed: {resp.text}")
        return None

def test_scan(token):
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. First Scan (Expect Cache Miss)
    print(f"\nScanning {TEST_URL} (1st time)...")
    start = time.time()
    resp1 = requests.post(f"{BASE_URL}/scan/quick", json={"url": TEST_URL}, headers=headers)
    dur1 = time.time() - start
    
    if resp1.status_code != 200:
        print(f"Scan failed: {resp1.text}")
        return
        
    data1 = resp1.json()
    print(f"Result: {data1.get('verdict')}")
    print(f"Cached: {data1.get('cached')} (Expected: False)")
    print(f"Time: {dur1:.2f}s")
    
    # 2. Second Scan (Expect Cache Hit)
    print(f"\nScanning {TEST_URL} (2nd time)...")
    start = time.time()
    resp2 = requests.post(f"{BASE_URL}/scan/quick", json={"url": TEST_URL}, headers=headers)
    dur2 = time.time() - start
    
    data2 = resp2.json()
    print(f"Result: {data2.get('verdict')}")
    print(f"Cached: {data2.get('cached')} (Expected: True)")
    print(f"Time: {dur2:.2f}s")
    
    if data2.get('cached'):
        print("\n✅ CACHE WORKING!")
        print(f"Speedup: {dur1/dur2:.1f}x faster")
    else:
        print("\n❌ CACHE FAILED")

if __name__ == "__main__":
    token = login()
    if token:
        test_scan(token)
