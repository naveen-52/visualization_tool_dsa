import sys
import os

# Resolve path to backend folder
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from run import app

# Export the WSGI application for Vercel Serverless Functions
app = app
