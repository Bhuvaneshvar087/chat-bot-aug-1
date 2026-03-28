import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + '/..')

from app import app
from vercel_wsgi import make_handler

handler = make_handler(app)