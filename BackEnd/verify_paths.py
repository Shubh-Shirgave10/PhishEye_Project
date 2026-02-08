import os
from flask import Flask

app = Flask(__name__)
print(f"app.root_path: {app.root_path}")
frontend_dir = os.path.abspath(os.path.join(app.root_path, '../../FrontEnd'))
print(f"Computed FrontEnd path: {frontend_dir}")
print(f"Exists? {os.path.exists(frontend_dir)}")

test_file = os.path.join(frontend_dir, 'Main_Dash', 'mainDash.html')
print(f"Target file: {test_file}")
print(f"Target file exists? {os.path.exists(test_file)}")
